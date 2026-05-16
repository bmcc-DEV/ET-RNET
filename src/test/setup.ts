// Test setup — mocks for native WASM modules

import { vi } from 'vitest';

// Mock void_core (Rust/WASM) since it can't run in jsdom
vi.mock('void_core', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  derive_ghost_id: vi.fn().mockReturnValue({
    handle: 'ghost_test_1234',
    public_key: new Uint8Array(32).fill(0x42),
  }),
  init_void_core: vi.fn(),
  create_pedersen_commitment: vi.fn().mockImplementation((value: bigint) => ({
    commitment: new Uint8Array(32).fill(Number(value & 0xFFn)),
    blinding_factor: new Uint8Array(32).fill(0xaa),
  })),
  create_balance_proof: vi.fn().mockReturnValue(new Uint8Array(32).fill(0x01)),
  create_range_proof: vi.fn().mockReturnValue({
    proof: new Uint8Array(64).fill(0xbb),
    commitment: new Uint8Array(32).fill(0xcc),
  }),
  verify_range_proof: vi.fn().mockReturnValue(true),
  create_hash_chronicle: vi.fn().mockReturnValue({
    event_hash: new Uint8Array(32).fill(0xdd),
  }),
  aggregate_zk_proofs: vi.fn().mockReturnValue({
    merkle_root: new Uint8Array(32).fill(0xee),
    proof_count: 2,
    compressed_size: 128,
  }),
}));

// Mock quantumBridge (needs Python server running)
vi.mock('../crypto/quantumBridge', () => ({
  generateQuantumEntropy: vi.fn().mockResolvedValue({
    entropy_hex: 'aabbccdd'.repeat(16),
    bell_fidelity: 0.95,
    quantum_verified: false,
  }),
}));
