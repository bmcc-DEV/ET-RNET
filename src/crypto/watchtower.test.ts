import { describe, it, expect } from 'vitest';
import { Watchtower, createWatchtowerRegistration, type WatchtowerRegistration } from './watchtower';

describe('watchtower', () => {
  describe('Watchtower', () => {
    it('cria watchtower com config padrão', () => {
      const wt = new Watchtower();
      expect(wt.getRegistrationCount()).toBe(0);
    });

    it('registra canal', () => {
      const wt = new Watchtower();
      wt.register({
        id: 'wt_test_1',
        channelId: 'aabbccdd',
        clientPubkey: '11223344',
        encryptedState: new Uint8Array(32),
        justiceTx: new Uint8Array(64),
        commitmentTxid: 'deadbeef',
        fundingOutpoint: 'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344:0',
        breachPenaltySat: 1000,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      });

      expect(wt.getRegistrationCount()).toBe(1);
    });

    it('rejeita quando cheio', () => {
      const wt = new Watchtower({ maxRegistrations: 2 });
      wt.register({ id: '1', channelId: 'a', clientPubkey: '', encryptedState: new Uint8Array(0), justiceTx: new Uint8Array(0), commitmentTxid: '', fundingOutpoint: 'aa:0', breachPenaltySat: 0, createdAt: 0, expiresAt: Date.now() + 86400000 });
      wt.register({ id: '2', channelId: 'b', clientPubkey: '', encryptedState: new Uint8Array(0), justiceTx: new Uint8Array(0), commitmentTxid: '', fundingOutpoint: 'bb:0', breachPenaltySat: 0, createdAt: 0, expiresAt: Date.now() + 86400000 });
      expect(() => wt.register({ id: '3', channelId: 'c', clientPubkey: '', encryptedState: new Uint8Array(0), justiceTx: new Uint8Array(0), commitmentTxid: '', fundingOutpoint: 'cc:0', breachPenaltySat: 0, createdAt: 0, expiresAt: Date.now() + 86400000 }))
        .toThrow('at capacity');
    });

    it('start e stop sem erro', () => {
      const wt = new Watchtower({ pollIntervalMs: 100 });
      wt.start();
      wt.stop();
    });

    it('notifica listener em caso de breach', async () => {
      const wt = new Watchtower();
      const alerts: any[] = [];
      wt.onBreach(alert => alerts.push(alert));

      const reg: WatchtowerRegistration = {
        id: 'wt_breach_test',
        channelId: 'aabbccdd',
        clientPubkey: '11223344',
        encryptedState: new Uint8Array(32),
        justiceTx: new Uint8Array(64),
        commitmentTxid: 'old_txid',
        fundingOutpoint: 'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344:0',
        breachPenaltySat: 1000,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      };

      const alert = await wt.handleBreach(reg, 'new_txid');
      expect(alert.breachTxid).toBe('new_txid');
      expect(alert.channelId).toBe('aabbccdd');
      expect(alerts).toHaveLength(1);
    });
  });

  describe('createWatchtowerRegistration', () => {
    it('cria registro com state criptografado', () => {
      const reg = createWatchtowerRegistration(
        'aabbccdd',
        'deadbeef',
        'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344:0',
        '11223344',
        new Uint8Array(32).fill(0x42),
        new Uint8Array(64).fill(0x43),
        1000,
        'watchtower_pubkey',
      );

      expect(reg.channelId).toBe('aabbccdd');
      expect(reg.commitmentTxid).toBe('deadbeef');
      expect(reg.encryptedState.length).toBeGreaterThan(0);
      expect(reg.justiceTx).toHaveLength(64);
      expect(reg.breachPenaltySat).toBe(1000);
    });

    it('criptografa o state (diferente do original)', () => {
      const original = new Uint8Array(32).fill(0x42);
      const reg = createWatchtowerRegistration(
        'aabbccdd',
        'deadbeef',
        'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344:0',
        '11223344',
        original,
        new Uint8Array(64),
        1000,
        'watchtower_pubkey',
      );

      expect(reg.encryptedState).not.toEqual(original);
    });
  });
});
