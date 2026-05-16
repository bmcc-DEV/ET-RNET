import { describe, it, expect } from 'vitest';
import { parseNWCUri } from './nwcProtocol';

describe('nwcProtocol', () => {
  describe('parseNWCUri', () => {
    it('parseia URI válida', () => {
      const uri = 'nostr+walletconnect://aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344?relay=wss://relay.example.com&secret=1122334455667788112233445566778811223344556677881122334455667788';
      const result = parseNWCUri(uri);

      expect(result.walletPubKey).toBe('aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344');
      expect(result.relay).toBe('wss://relay.example.com');
      expect(result.secret).toHaveLength(32);
    });

    it('rejeita URI sem relay', () => {
      const uri = 'nostr+walletconnect://aabbccdd?secret=1122';
      expect(() => parseNWCUri(uri)).toThrow('missing relay');
    });

    it('rejeita URI sem secret', () => {
      const uri = 'nostr+walletconnect://aabbccdd?relay=wss://relay.example.com';
      expect(() => parseNWCUri(uri)).toThrow('missing secret');
    });

    it('rejeita URI com formato inválido', () => {
      expect(() => parseNWCUri('https://example.com')).toThrow('Invalid NWC URI');
    });

    it('rejeita URI sem protocolo nostr+walletconnect', () => {
      expect(() => parseNWCUri('bitcoin:aabbccdd?relay=wss://r.com&secret=1122')).toThrow('Invalid NWC URI');
    });
  });
});
