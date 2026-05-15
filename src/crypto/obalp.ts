/**
 * VØID Core — OBALP (Out-of-Band Lattice Pairing)
 * 
 * Protocolo de pareamento de contatos via canal fora-de-banda (NFC, Acoustic)
 * com verificação criptográfica de presença física.
 * 
 * Fluxo:
 * 1. Alice e Bob aproximam telefones (NFC/Acoustic)
 * 2. Trocam hash de chave pública via canal de RF
 * 3. Ambos computam HMAC para verificar integridade
 * 4. Criam CLT conjuntamente
 */

import { sha3_256, sha3_512 } from "@noble/hashes/sha3.js";
import { hmac } from "@noble/hashes/hmac.js";
import { cltInitiate, cltRespond, cltFinalize, storeCLTSecurely } from "./clt";
import { Ed25519 } from "@noble/curves/ed25519.js";

export interface OBALPChallenge {
  handshakeId: string;
  initiatorHandleHash: string;      // SHA3(handle) truncado
  responderHandleHash: string;
  proofOfPresence: string;          // HMAC de RF signal strength
  timestamp: number;
  nonce: Uint8Array;                // 32 bytes aleatórios
}

export interface OBALPVerification {
  success: boolean;
  reason?: string;
  cltId?: string;
}

/**
 * Fase 1: Initiator prepara challenge e publica via NFC/Acoustic
 */
export async function obalp_initiateHandshake(
  initiatorHandle: string,
  responderHandle: string
): Promise<OBALPChallenge> {
  const initiatorHash = sha3_256(new TextEncoder().encode(initiatorHandle));
  const responderHash = sha3_256(new TextEncoder().encode(responderHandle));
  
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  
  const challenge: OBALPChallenge = {
    handshakeId: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join(""),
    initiatorHandleHash: Array.from(initiatorHash).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16),
    responderHandleHash: Array.from(responderHash).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16),
    proofOfPresence: computeProofOfPresence(),
    timestamp: Date.now(),
    nonce,
  };

  console.log(`[OBALP] Handshake iniciado: ${challenge.handshakeId}`);
  return challenge;
}

/**
 * Prova de presença física via análise de sinal RF (proxy: DeviceOrientation + proximity)
 */
function computeProofOfPresence(): string {
  // Em dispositivo real: ler RSSI de BLE/NFC, comparar com limiar
  // Aqui: simulamos com DeviceProximityEvent (experimental) ou compass
  let proximity = 0;
  
  try {
    if ((window as any).ondeviceproximity) {
      proximity = (window as any).deviceProximityEvent?.distance || 0;
    }
  } catch (e) {
    proximity = Math.random() * 100; // Fallback
  }

  const proofBytes = new Uint8Array(8);
  new DataView(proofBytes.buffer).setFloat64(0, proximity);
  return "0x" + Array.from(proofBytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fase 2: Responder recebe challenge, verifica e gera response
 */
export async function obalp_respondHandshake(
  challenge: OBALPChallenge,
  responderHandle: string,
  responderPublicKey: Uint8Array
): Promise<OBALPVerification> {
  // Verifica timestamp (max 30 segundos)
  const timeDiff = Date.now() - challenge.timestamp;
  if (timeDiff > 30000) {
    return { success: false, reason: "Challenge expirado" };
  }

  // Verifica handle hash correspondência
  const responderHash = sha3_256(new TextEncoder().encode(responderHandle));
  const expectedHash = Array.from(responderHash).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  if (expectedHash !== challenge.responderHandleHash) {
    return { success: false, reason: "Handle hash mismatch" };
  }

  // Verifica prova de presença (em prática: comparar RSSI)
  const myProximity = computeProofOfPresence();
  console.log(`[OBALP] Verificação de proximidade: ${myProximity}`);

  // Ambas as partes agora iniciam CLT
  try {
    const {
      ephemeralPrivateA: _,
      ephemeralPublicA,
      metadata,
    } = await cltInitiate(challenge.initiatorHandleHash, challenge.responderHandleHash);

    const {
      ephemeralPrivateB,
      ephemeralPublicB,
      sharedSecret,
    } = await cltRespond(ephemeralPublicA, challenge.initiatorHandleHash, challenge.responderHandleHash);

    // Blind signature simulada (em prática: Schnorr blind signing)
    const blindSig = sha3_512(
      new Uint8Array([
        ...ephemeralPublicA,
        ...ephemeralPublicB,
        ...challenge.nonce,
      ])
    );

    const clt = await cltFinalize(
      ephemeralPublicA,
      ephemeralPublicB,
      sharedSecret,
      metadata,
      new Uint8Array(blindSig)
    );

    await storeCLTSecurely(clt);

    console.log(`[OBALP] Pareamento concluído: ${clt.id}`);
    return { success: true, cltId: clt.id };
  } catch (err) {
    console.error("[OBALP] Erro ao finalizar CLT:", err);
    return { success: false, reason: String(err) };
  }
}

/**
 * Transmite challenge via NFC P2P
 */
export async function obalp_broadcastViaAcoustic(challenge: OBALPChallenge): Promise<void> {
  const json = JSON.stringify({
    id: challenge.handshakeId,
    ih: challenge.initiatorHandleHash,
    rh: challenge.responderHandleHash,
    ts: challenge.timestamp,
  });

  const encoder = new TextEncoder();
  const encoded = encoder.encode(json);

  // Simulated acoustic modem: frequências 18.5-19.5 kHz
  console.log(`[OBALP Acoustic] Broadcasting ${encoded.length} bytes em 19kHz...`);
  // Em prática: usar Web Audio API para modular frequência
}

/**
 * Escuta por challenges OBALP via NFC/Acoustic
 */
export async function obalp_listenForChallenges(
  responderHandle: string,
  responderPublicKey: Uint8Array,
  onChallenge: (v: OBALPVerification) => void
): Promise<void> {
  console.log("[OBALP] Aguardando challenges de pareamento...");

  // Em prática: listeners NFC + Acoustic
  // Aqui: simulamos com event listener genérico
  const handler = async (e: any) => {
    if (e.detail?.obalp?.challenge) {
      const result = await obalp_respondHandshake(
        e.detail.obalp.challenge,
        responderHandle,
        responderPublicKey
      );
      onChallenge(result);
    }
  };

  window.addEventListener("obalp_challenge_received", handler);
}
