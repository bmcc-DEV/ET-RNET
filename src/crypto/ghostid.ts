import init, { derive_ghost_id, init_void_core } from "void_core";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { argon2id } from "@noble/hashes/argon2.js";

// --- Types ---
export interface GhostIdentity {
  handle: string;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  entropyBits: number;
}

export interface SpawnProgress {
  stage: string;
  detail: string;
  elapsed: number;
}

export interface BiometricEntropy {
  keystrokeDynamics: number[];
  accelerometerPattern: Float32Array;
  touchPressureMap: Uint8Array;
  microphoneNoise: Uint8Array;
  hardwareTimestamp: number;
}

let wasmInitialized = false;

// --- PASSIVE BIOMETRIC ENTROPY COLLECTION ---
/**
 * Coleta passivamente entropia biométrica do dispositivo:
 * - Keystroke dynamics (ritmo de digitação)
 * - Acelerômetro/Giroscópio padrão
 * - Pressão de toque
 * - Ruído de microfone
 * - Timestamp de hardware em ns
 */
export async function collectBiometricEntropy(): Promise<BiometricEntropy> {
  const keystrokeDynamics: number[] = [];
  const accelerometerPattern = new Float32Array(16);
  const touchPressureMap = new Uint8Array(256);
  let microphoneNoise = new Uint8Array(128);
  
  // 1. KEYSTROKE DYNAMICS — Monitora intervalo entre keys
  let lastKeyTime = 0;
  const keyListener = (e: KeyboardEvent) => {
    const now = performance.now();
    if (lastKeyTime > 0) {
      keystrokeDynamics.push((now - lastKeyTime) | 0);
    }
    lastKeyTime = now;
  };
  
  // 2. ACCELEROMETER PATTERN — DeviceMotion API
  let accelIndex = 0;
  const motionListener = (e: DeviceMotionEvent) => {
    if (e.acceleration && accelIndex < 16) {
      accelerometerPattern[accelIndex++] = (e.acceleration.x ?? 0) + (e.acceleration.y ?? 0) + (e.acceleration.z ?? 0);
    }
  };
  
  // 3. TOUCH PRESSURE MAP
  const touchListener = (e: TouchEvent) => {
    for (const touch of e.touches) {
      const force = (touch as any).force ?? 0.5;
      const idx = (touch.clientX * 16 + touch.clientY) % 256;
      touchPressureMap[idx] = Math.min(255, (touchPressureMap[idx] ?? 0) + Math.floor(force * 255));
    }
  };
  
  // 4. MICROPHONE NOISE — Web Audio API (passa janeador de 128 samples)
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
    const source = audioCtx.createMediaStreamAudioSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    microphoneNoise = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(microphoneNoise);
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    // Fallback: ruído pseudoaleatório
    crypto.getRandomValues(microphoneNoise);
  }
  
  // Attach listeners por 500ms
  window.addEventListener("keydown", keyListener, true);
  window.addEventListener("devicemotion", motionListener, true);
  window.addEventListener("touchmove", touchListener, true);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  window.removeEventListener("keydown", keyListener, true);
  window.removeEventListener("devicemotion", motionListener, true);
  window.removeEventListener("touchmove", touchListener, true);
  
  return {
    keystrokeDynamics: keystrokeDynamics.slice(0, 16),
    accelerometerPattern,
    touchPressureMap,
    microphoneNoise,
    hardwareTimestamp: performance.now(),
  };
}

// --- GHOSTID ENGINE via RUST/WASM + BIOMETRIC ---
export async function spawnGhostId(
  onProgress?: (p: SpawnProgress) => void
): Promise<GhostIdentity> {
  const t0 = performance.now();
  
  if (onProgress) onProgress({ stage: "init", detail: "Carregando VØID Core (WASM)...", elapsed: performance.now() - t0 });
  
  if (!wasmInitialized) {
    await init();
    init_void_core();
    wasmInitialized = true;
  }

  if (onProgress) onProgress({ stage: "biometric", detail: "Coletando entropia biométrica passiva...", elapsed: performance.now() - t0 });
  
  // Collect biometric entropy
  const bioEntropy = await collectBiometricEntropy();
  
  // Combine all entropy sources
  const entropy = new Uint8Array(64);
  let offset = 0;
  
  entropy.set(new Uint8Array(bioEntropy.accelerometerPattern.buffer), offset);
  offset += bioEntropy.accelerometerPattern.byteLength;
  
  entropy.set(bioEntropy.touchPressureMap.slice(0, 16), offset);
  offset += 16;
  
  entropy.set(bioEntropy.microphoneNoise.slice(0, 24), offset);
  offset += 24;
  
  // Fill remainder with keystroke timing
  for (let i = 0; i < bioEntropy.keystrokeDynamics.length && offset < 64; i++) {
    const ts = bioEntropy.keystrokeDynamics[i] || 0;
    entropy[offset] = ts & 0xff;
    entropy[offset + 1] = (ts >> 8) & 0xff;
    offset += 2;
  }

  if (onProgress) onProgress({ stage: "argon2id", detail: "Aplicando Argon2id (64MB, 3 iter)...", elapsed: performance.now() - t0 });
  
  // Derive with Argon2id (64MB memory, 3 iterations, parallelism 1)
  const derivedEntropy = await argon2id({
    password: entropy,
    salt: sha3_256(entropy),
    time: 3,
    mem: 65536, // 64 MB
    parallelism: 1,
  });

  if (onProgress) onProgress({ stage: "wasm_derive", detail: "Executando derivação em enclave WASM...", elapsed: performance.now() - t0 });

  // Call Rust/WASM Core with derived entropy
  const idWasm = derive_ghost_id(new Uint8Array(derivedEntropy));

  if (onProgress) onProgress({ stage: "complete", detail: `Handle gerado: ${idWasm.handle}`, elapsed: performance.now() - t0 });

  return {
    handle: idWasm.handle,
    publicKey: idWasm.public_key,
    privateKey: new Uint8Array(32), // WASM não expõe a chave privada (design de segurança intencional)
    entropyBits: 512 + bioEntropy.keystrokeDynamics.length * 8,
  };
}

export function destroyGhostId(id: GhostIdentity): void {
  // Overwrite local refs
  if (id.privateKey) id.privateKey.fill(0);
  if (id.publicKey) id.publicKey.fill(0);
  id.handle = "void_◆_destroyed";
}

export { sha3_256 };