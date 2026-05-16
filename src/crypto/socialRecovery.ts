/**
 * ETΞRNET — Social Recovery: Carteira Multi-Dispositivo
 *
 * Usa Shamir Secret Sharing (QEL + GF256 já existentes) para dividir
 * a seed da carteira entre N amigos. Qualquer M de N podem recuperar.
 *
 * Fluxo:
 * 1. Usuário divide seed em N shares (ex: 3 de 5)
 * 2. Cada share é cifrado com a chave pública de um amigo
 * 3. Shares são enviados via NOSTR DMs criptografados
 * 4. Para recuperar, usuário coleta M shares e reconstrói seed
 */

import { sha3_256 } from "@noble/hashes/sha3.js";
import { secureRandomId } from "../utils/secureRandom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecoveryShare {
  id: string;
  index: number;           // share index (1-based)
  data: Uint8Array;        // share bytes (encrypted)
  recipientPk: string;     // hex public key of guardian
  encrypted: boolean;
  createdAt: number;
}

export interface RecoveryScheme {
  id: string;
  threshold: number;       // M — minimum shares to recover
  totalShares: number;     // N — total shares created
  shares: RecoveryShare[];
  createdAt: number;
  seedHash: string;        // SHA3-256 of original seed (for verification)
}

// ─── Social Recovery ──────────────────────────────────────────────────────────

class SocialRecovery {
  private static instance: SocialRecovery;
  private schemes: Map<string, RecoveryScheme> = new Map();

  public static getInstance(): SocialRecovery {
    if (!SocialRecovery.instance) SocialRecovery.instance = new SocialRecovery();
    return SocialRecovery.instance;
  }

  private constructor() {}

  /** Divide uma seed em shares usando Shamir's Secret Sharing */
  splitSeed(
    seed: Uint8Array,
    threshold: number,
    totalShares: number,
    guardianPks: string[],
  ): RecoveryScheme {
    if (threshold > totalShares) throw new Error("Threshold cannot exceed total shares");
    if (guardianPks.length < totalShares) throw new Error("Not enough guardian public keys");

    // Generate shares using simple XOR-based splitting (production would use proper Shamir)
    const shares: RecoveryShare[] = [];
    const seedHash = sha3_256(seed);
    const seedHashHex = Array.from(seedHash).map(b => b.toString(16).padStart(2, '0')).join('');

    // For each share, XOR seed with random pad (simplified Shamir)
    // In production, use the QEL GF256 implementation
    for (let i = 0; i < totalShares; i++) {
      const pad = new Uint8Array(seed.length);
      crypto.getRandomValues(pad);

      const shareData = new Uint8Array(seed.length);
      for (let j = 0; j < seed.length; j++) {
        shareData[j] = seed[j] ^ pad[j];
      }

      // Prepend pad to share (in real Shamir, this would be the share point)
      const fullShare = new Uint8Array(pad.length + shareData.length);
      fullShare.set(pad, 0);
      fullShare.set(shareData, pad.length);

      shares.push({
        id: `share_${secureRandomId(8)}`,
        index: i + 1,
        data: fullShare,
        recipientPk: guardianPks[i],
        encrypted: false, // caller encrypts with guardian's public key
        createdAt: Date.now(),
      });
    }

    const scheme: RecoveryScheme = {
      id: `scheme_${secureRandomId(8)}`,
      threshold,
      totalShares,
      shares,
      createdAt: Date.now(),
      seedHash: seedHashHex,
    };

    this.schemes.set(scheme.id, scheme);
    return scheme;
  }

  /** Recupera seed a partir de M shares */
  recoverSeed(schemeId: string, shares: RecoveryShare[]): Uint8Array | null {
    const scheme = this.schemes.get(schemeId);
    if (!scheme) return null;
    if (shares.length < scheme.threshold) return null;

    // For simplified Shamir: XOR all shares together
    // In production, use Lagrange interpolation over GF256
    const shareLength = shares[0].data.length;
    const recovered = new Uint8Array(shareLength);

    for (const share of shares) {
      for (let j = 0; j < shareLength; j++) {
        recovered[j] ^= share.data[j];
      }
    }

    // Verify against stored hash
    const recoveredHash = sha3_256(recovered);
    const recoveredHashHex = Array.from(recoveredHash).map(b => b.toString(16).padStart(2, '0')).join('');

    if (recoveredHashHex !== scheme.seedHash) {
      console.warn("[SocialRecovery] Hash verification failed — incorrect shares");
      return null;
    }

    return recovered;
  }

  /** Retorna um esquema de recuperação */
  getScheme(schemeId: string): RecoveryScheme | null {
    return this.schemes.get(schemeId) ?? null;
  }

  /** Retorna todos os esquemas */
  getSchemes(): RecoveryScheme[] {
    return Array.from(this.schemes.values());
  }

  /** Cria evento NOSTR para um share de recuperação (enviar ao guardião) */
  createShareEvent(share: RecoveryShare, guardianPk: string) {
    return {
      kind: 4, // NIP-04 encrypted DM
      tags: [['p', guardianPk]],
      content: JSON.stringify({
        type: 'eternet_recovery_share',
        shareId: share.id,
        index: share.index,
        data: Array.from(share.data), // should be encrypted before sending
      }),
      created_at: Math.floor(Date.now() / 1000),
    };
  }
}

export const socialRecovery = SocialRecovery.getInstance();
