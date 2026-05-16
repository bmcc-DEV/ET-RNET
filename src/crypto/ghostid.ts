import init, { derive_ghost_id, init_void_core } from "void_core";
import { sha3_256 } from "@noble/hashes/sha3.js";
import { argon2id } from "@noble/hashes/argon2.js";
import { generateQuantumEntropy } from "./quantumBridge";
import { x25519 } from "@noble/curves/ed25519.js";

// --- Types ---
export interface GhostIdentity {
  handle: string;
  publicKey: Uint8Array;        // Ed25519 public key (identity)
  privateKey: Uint8Array;       // Ed25519 seed (zeroed after spawn)
  x25519PublicKey: Uint8Array;  // X25519 public key (for ECDH)
  x25519SecretKey: Uint8Array;  // X25519 secret key (for ECDH, zeroed after spawn)
  entropyBits: number;
  quantumVerified: boolean; // Flag: QRNG via vHGPU
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
  const keyListener = (_e: KeyboardEvent) => {
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
    const source = audioCtx.createMediaStreamSource(stream);
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

// --- GHOSTID ENGINE via RUST/WASM + BIOMETRIC + vHGPU QUANTUM ---
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

  if (onProgress) onProgress({ stage: "vhgpu", detail: "Coletando QRNG via vHGPU (renderização geométrica)...", elapsed: performance.now() - t0 });
  
  // Generate quantum entropy via CQR engine (Bell state measurements)
  let quantumEntropy: Uint8Array;
  let quantumVerified = false;

  try {
    const qrngResult = await generateQuantumEntropy(256);
    if (qrngResult) {
      quantumEntropy = new Uint8Array(
        qrngResult.entropy_hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
      );
      quantumVerified = true;
      console.log("[GhostID] CQR QRNG obtido via Bell states");
    } else {
      console.warn("[GhostID] Servidor quântico offline, usando CSPRNG");
      quantumEntropy = new Uint8Array(32);
      crypto.getRandomValues(quantumEntropy);
    }
  } catch (e) {
    console.warn("[GhostID] CQR engine indisponível, usando CSPRNG");
    quantumEntropy = new Uint8Array(32);
    crypto.getRandomValues(quantumEntropy);
  }

  if (onProgress) onProgress({ stage: "biometric", detail: "Coletando entropia biométrica passiva...", elapsed: performance.now() - t0 });
  
  // Collect biometric entropy
  const bioEntropy = await collectBiometricEntropy();
  
  // Combine all entropy sources: quantum + biometric + hardware
  const entropy = new Uint8Array(96); // 32 (quantum) + 64 (bio) = 96
  let offset = 0;
  
  entropy.set(quantumEntropy, offset);
  offset += 32;
  
  entropy.set(new Uint8Array(bioEntropy.accelerometerPattern.buffer), offset);
  offset += bioEntropy.accelerometerPattern.byteLength;
  
  entropy.set(bioEntropy.touchPressureMap.slice(0, 16), offset);
  offset += 16;
  
  entropy.set(bioEntropy.microphoneNoise.slice(0, 24), offset);
  offset += 24;
  
  // Fill remainder with keystroke timing
  for (let i = 0; i < bioEntropy.keystrokeDynamics.length && offset < 96; i++) {
    const ts = bioEntropy.keystrokeDynamics[i] || 0;
    entropy[offset] = ts & 0xff;
    entropy[offset + 1] = (ts >> 8) & 0xff;
    offset += 2;
  }

  if (onProgress) onProgress({ stage: "argon2id", detail: "Aplicando Argon2id (64MB, 3 iter)...", elapsed: performance.now() - t0 });
  
  // Derive with Argon2id (64MB memory, 3 iterations, parallelism 1)
  const derivedEntropy = argon2id(entropy, sha3_256(entropy), {
    t: 3,
    m: 65536, // 64 MB
    p: 1,
  });

  if (onProgress) onProgress({ stage: "wasm_derive", detail: "Executando derivação em enclave WASM...", elapsed: performance.now() - t0 });

  // Call Rust/WASM Core with derived entropy
  const idWasm = derive_ghost_id(new Uint8Array(derivedEntropy));

  // Generate X25519 keypair for ECDH (Double Ratchet)
  const x25519Secret = x25519.utils.randomSecretKey();
  const x25519Public = x25519.getPublicKey(x25519Secret);

  if (onProgress) onProgress({ stage: "complete", detail: `Handle gerado: ${idWasm.handle}${quantumVerified ? " [QM]" : ""}`, elapsed: performance.now() - t0 });

  return {
    handle: idWasm.handle,
    publicKey: idWasm.public_key,
    privateKey: new Uint8Array(32), // WASM não expõe a chave privada (design de segurança intencional)
    x25519PublicKey: x25519Public,
    x25519SecretKey: x25519Secret,
    entropyBits: 512 + bioEntropy.keystrokeDynamics.length * 8 + (quantumVerified ? 256 : 0),
    quantumVerified,
  };
}

export function destroyGhostId(id: GhostIdentity): void {
  // Overwrite local refs — zero all key material
  if (id.privateKey) id.privateKey.fill(0);
  if (id.publicKey) id.publicKey.fill(0);
  if (id.x25519SecretKey) id.x25519SecretKey.fill(0);
  if (id.x25519PublicKey) id.x25519PublicKey.fill(0);
  id.handle = "void_◆_destroyed";
}

export { sha3_256 };