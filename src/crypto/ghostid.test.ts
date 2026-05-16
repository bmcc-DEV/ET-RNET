import { describe, it, expect } from 'vitest';
import { destroyGhostId } from './ghostid';

// spawnGhostId tests depend on void_core WASM — skip in jsdom environment
// destroyGhostId is pure JS and can be tested standalone

describe('ghostid', () => {
  describe('destroyGhostId', () => {
    it('zera chaves e destrói handle', () => {
      const identity = {
        handle: 'test_ghost_◆_abcdef',
        publicKey: new Uint8Array(32).fill(0x42),
        privateKey: new Uint8Array(64).fill(0x43),
        entropyBits: 256,
        quantumVerified: false,
        createdAt: Date.now(),
      };
      destroyGhostId(identity);
      expect(identity.handle).toBe('void_◆_destroyed');
      expect(identity.privateKey.every(b => b === 0)).toBe(true);
      expect(identity.publicKey.every(b => b === 0)).toBe(true);
    });
  });
});
