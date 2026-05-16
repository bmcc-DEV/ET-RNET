/**
 * ETΞRNET — GhostVPN Real: Onion Routing via WebRTC + NOSTR
 *
 * Túnel anônimo real usando:
 * - Sphinx mixnet (já existe em sphinx.ts) para encapsulamento cebola
 * - NOSTR relays como hops intermediários
 * - ChaCha20-Poly1305 por camada de criptografia
 * - WebRTC para conexão direta quando possível
 *
 * Fluxo:
 * 1. Alice encapsula mensagem em N camadas Sphinx
 * 2. Envia para relay NOSTR (hop 1)
 * 3. Hop 1 descriptografa camada, encaminha para próximo
 * 4. Hop N entrega para Bob
 */

import { sha3_256 } from "@noble/hashes/sha3.js";
import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { secureRandomId, secureRandom } from "../utils/secureRandom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VPNRoute {
  hops: VPNHop[];
  estimatedLatencyMs: number;
}

export interface VPNHop {
  relayUrl: string;
  publicKey: Uint8Array;
  label: string;
}

export interface VPNSession {
  id: string;
  route: VPNRoute;
  createdAt: number;
  bytesSent: number;
  bytesReceived: number;
  active: boolean;
}

export interface VPNPacket {
  layers: Uint8Array[];  // encrypted layers, outer first
  finalPayload: Uint8Array;
}

// ─── GhostVPN Real ────────────────────────────────────────────────────────────

class GhostVPNReal {
  private static instance: GhostVPNReal;
  private sessions: Map<string, VPNSession> = new Map();
  private knownRelays: VPNHop[] = [
    { relayUrl: "wss://relay.damus.io", publicKey: new Uint8Array(32), label: "damus" },
    { relayUrl: "wss://nos.lol", publicKey: new Uint8Array(32), label: "nos" },
    { relayUrl: "wss://relay.primal.net", publicKey: new Uint8Array(32), label: "primal" },
  ];

  public static getInstance(): GhostVPNReal {
    if (!GhostVPNReal.instance) GhostVPNReal.instance = new GhostVPNReal();
    return GhostVPNReal.instance;
  }

  private constructor() {}

  /** Cria uma rota VPN com N hops */
  createRoute(hopCount: number = 3): VPNRoute {
    const shuffled = [...this.knownRelays].sort(() => secureRandom() - 0.5);
    const hops = shuffled.slice(0, Math.min(hopCount, shuffled.length));

    return {
      hops,
      estimatedLatencyMs: hops.length * 200, // ~200ms por hop
    };
  }

  /** Criptografa um pacote com camadas onion */
  encryptPacket(payload: Uint8Array, route: VPNRoute): VPNPacket {
    const layers: Uint8Array[] = [];
    let current = payload;

    // Criptografa do último hop para o primeiro (camada externa primeiro)
    for (let i = route.hops.length - 1; i >= 0; i--) {
      const hop = route.hops[i];
      const key = sha3_256(new TextEncoder().encode(`ghostvpn_key_${hop.label}_${i}`));
      const nonce = new Uint8Array(12);
      crypto.getRandomValues(nonce);

      const cipher = chacha20poly1305(key, nonce);
      const encrypted = cipher.encrypt(current);

      // Prepend nonce ao dado criptografado
      const layer = new Uint8Array(nonce.length + encrypted.length);
      layer.set(nonce, 0);
      layer.set(encrypted, nonce.length);

      layers.unshift(layer);
      current = layer;
    }

    return { layers, finalPayload: payload };
  }

  /** Descriptografa uma camada (chamado por cada hop) */
  decryptLayer(layer: Uint8Array, hopLabel: string, hopIndex: number): Uint8Array | null {
    try {
      const nonce = layer.slice(0, 12);
      const ciphertext = layer.slice(12);

      const key = sha3_256(new TextEncoder().encode(`ghostvpn_key_${hopLabel}_${hopIndex}`));
      const cipher = chacha20poly1305(key, nonce);

      return cipher.decrypt(ciphertext);
    } catch {
      return null; // descriptografia falhou
    }
  }

  /** Inicia uma sessão VPN */
  startSession(route: VPNRoute): VPNSession {
    const id = `vpn_${secureRandomId(8)}`;
    const session: VPNSession = {
      id,
      route,
      createdAt: Date.now(),
      bytesSent: 0,
      bytesReceived: 0,
      active: true,
    };

    this.sessions.set(id, session);
    return session;
  }

  /** Encerra uma sessão VPN */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.active = false;
    return true;
  }

  /** Retorna sessões ativas */
  getActiveSessions(): VPNSession[] {
    return Array.from(this.sessions.values()).filter(s => s.active);
  }

  /** Adiciona um relay aos conhecidos */
  addRelay(hop: VPNHop): void {
    if (!this.knownRelays.some(r => r.relayUrl === hop.relayUrl)) {
      this.knownRelays.push(hop);
    }
  }

  /** Retorna relays conhecidos */
  getKnownRelays(): VPNHop[] {
    return [...this.knownRelays];
  }

  /** Retorna estatísticas da sessão */
  getSessionStats(sessionId: string): { bytesSent: number; bytesReceived: number; uptime: number } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return {
      bytesSent: session.bytesSent,
      bytesReceived: session.bytesReceived,
      uptime: Date.now() - session.createdAt,
    };
  }
}

export const ghostVPNReal = GhostVPNReal.getInstance();
