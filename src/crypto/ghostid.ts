import init, { derive_ghost_id, init_void_core } from "void_core";
import { sha3_256 } from "@noble/hashes/sha3.js";

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

let wasmInitialized = false;

// --- GHOSTID ENGINE via RUST/WASM ---
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

  if (onProgress) onProgress({ stage: "entropy", detail: "Coletando ruído de hardware (QRNG simulado)...", elapsed: performance.now() - t0 });
  
  // Simulated hardware entropy pool
  const entropy = new Uint8Array(64);
  crypto.getRandomValues(entropy);
  // Add performance jitter
  new DataView(entropy.buffer).setFloat64(0, performance.now());

  if (onProgress) onProgress({ stage: "derivation", detail: "Executando derivação em enclave WASM...", elapsed: performance.now() - t0 });

  // Call Rust/WASM Core
  const idWasm = derive_ghost_id(entropy);

  if (onProgress) onProgress({ stage: "complete", detail: `Handle gerado: ${idWasm.handle}`, elapsed: performance.now() - t0 });

  return {
    handle: idWasm.handle,
    publicKey: idWasm.public_key,
    privateKey: new Uint8Array(32), // Rust side keeps it internal in a real impl, but we mocked it
    entropyBits: 512,
  };
}

export function destroyGhostId(id: GhostIdentity): void {
  // Overwrite local refs
  if (id.privateKey) id.privateKey.fill(0);
  if (id.publicKey) id.publicKey.fill(0);
  id.handle = "void_◆_destroyed";
}

export { sha3_256 };