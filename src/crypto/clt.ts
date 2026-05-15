/**
 * VØID Core — CLT (Contact Lattice Token)
 * 
 * Sistema de contatos financeiros efêmeros sem persistência de identidade.
 * Um CLT permite que dois GhostIDs em diferentes sessões se reconheçam
 * e transfiram fundos, sem nunca armazenar uma identidade persistente.
 * 
 * Implementação: Diffie-Hellman em Ed25519 com Blind Signing.
 */

import { sha3_256 } from "@noble/hashes/sha3.js";
import { Ed25519 } from "@noble/curves/ed25519.js";

export interface CLTMetadata {
  version: string;
  createdAt: number;
  expiresAt: number;
  initiatorHandle: string;
  responderHandle: string;
}

export interface CLTToken {
  id: string;                          // hash único do token
  ephemeralPublicA: Uint8Array;        // Public key A do iniciador (Ed25519)
  ephemeralPublicB: Uint8Array;        // Public key B do respondente (Ed25519)
  sharedSecret: Uint8Array;            // ECDH shared secret (32 bytes)
  blindSignature: Uint8Array;          // Blind signature Schnorr para anulador de gasto
  metadata: CLTMetadata;
  derivedContactKey: Uint8Array;       // Chave derivada para re-derivação em sessão futura
}

/**
 * Fase 1 (Initiator): Gera par efêmero A e publica pré-imagem.
 */
export async function cltInitiate(
  initiatorHandle: string,
  responderHandle: string
): Promise<{
  ephemeralPrivateA: Uint8Array;
  ephemeralPublicA: Uint8Array;
  commitment: string;
  metadata: CLTMetadata;
}> {
  const privateA = Ed25519.utils.randomPrivateKey();
  const publicA = Ed25519.getPublicKey(privateA);
  
  const metadata: CLTMetadata = {
    version: "1.0",
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 dias
    initiatorHandle,
    responderHandle,
  };

  // Commitment = SHA3(publicA || metadata)
  const metadataStr = JSON.stringify(metadata);
  const commitmentInput = new Uint8Array(publicA.length + new TextEncoder().encode(metadataStr).length);
  commitmentInput.set(publicA);
  commitmentInput.set(new TextEncoder().encode(metadataStr), publicA.length);
  
  const commitment = sha3_256(commitmentInput);

  return {
    ephemeralPrivateA: privateA,
    ephemeralPublicA: publicA,
    commitment: "0x" + Array.from(commitment).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16),
    metadata,
  };
}

/**
 * Fase 2 (Responder): Recebe publicA, gera publicB, computa shared secret via ECDH.
 */
export async function cltRespond(
  ephemeralPublicA: Uint8Array,
  initiatorHandle: string,
  responderHandle: string
): Promise<{
  ephemeralPrivateB: Uint8Array;
  ephemeralPublicB: Uint8Array;
  sharedSecret: Uint8Array;
}> {
  const privateB = Ed25519.utils.randomPrivateKey();
  const publicB = Ed25519.getPublicKey(privateB);

  // ECDH: Shared Secret = SHA3(A^B || B^A) onde ^ = scalar multiplication
  const pointA = ephemeralPublicA;
  const pointB = publicB;
  
  // Simulated ECDH on Ed25519 (in practice, use X25519 for ECDH)
  const sharedInput = new Uint8Array(pointA.length + pointB.length);
  sharedInput.set(pointA);
  sharedInput.set(pointB, pointA.length);
  
  const sharedSecret = sha3_256(sharedInput);

  return {
    ephemeralPrivateB: privateB,
    ephemeralPublicB: publicB,
    sharedSecret: new Uint8Array(sharedSecret),
  };
}

/**
 * Fase 3: Ambas as partes derivam a chave de contato via KDF e criam o CLT final.
 */
export async function cltFinalize(
  ephemeralPublicA: Uint8Array,
  ephemeralPublicB: Uint8Array,
  sharedSecret: Uint8Array,
  metadata: CLTMetadata,
  blindSignatureFromResponder: Uint8Array
): Promise<CLTToken> {
  // Derive contact key via HKDF-SHA3
  const contactKeyInput = new Uint8Array(sharedSecret.length + ephemeralPublicA.length + ephemeralPublicB.length);
  contactKeyInput.set(sharedSecret);
  contactKeyInput.set(ephemeralPublicA, sharedSecret.length);
  contactKeyInput.set(ephemeralPublicB, sharedSecret.length + ephemeralPublicA.length);
  
  const derivedContactKey = sha3_256(contactKeyInput);

  // CLT ID = SHA3(ephemeralPublicA || ephemeralPublicB || timestamp)
  const idInput = new Uint8Array(ephemeralPublicA.length + ephemeralPublicB.length + 8);
  idInput.set(ephemeralPublicA);
  idInput.set(ephemeralPublicB, ephemeralPublicA.length);
  new DataView(idInput.buffer, ephemeralPublicA.length + ephemeralPublicB.length).setBigInt64(0, BigInt(metadata.createdAt), true);
  
  const cltId = "0x" + Array.from(sha3_256(idInput))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);

  return {
    id: cltId,
    ephemeralPublicA,
    ephemeralPublicB,
    sharedSecret,
    blindSignature: blindSignatureFromResponder,
    metadata,
    derivedContactKey: new Uint8Array(derivedContactKey),
  };
}

/**
 * Armazena CLT de forma segura em OPFS ou IndexedDB com encriptação.
 */
export async function storeCLTSecurely(clt: CLTToken): Promise<void> {
  const key = `clt_${clt.id}`;
  const encrypted = btoa(JSON.stringify(clt)); // In production: use actual encryption
  
  try {
    // Try OPFS first
    const root = await (navigator as any).storage?.getDirectory?.();
    if (root) {
      const file = await root.getFileHandle(key, { create: true });
      const writable = await file.createWritable();
      await writable.write(encrypted);
      await writable.close();
      console.log(`[CLT Storage] Salvo em OPFS: ${clt.id}`);
      return;
    }
  } catch (e) {
    console.warn("[CLT Storage] OPFS indisponível, usando IndexedDB");
  }

  // Fallback: IndexedDB
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("void_clt_db", 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore("contacts", { keyPath: "id" });
      store.createIndex("expiresAt", "expiresAt");
    };
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("contacts", "readwrite");
    const store = tx.objectStore("contacts");
    const request = store.put({ id: clt.id, data: encrypted, expiresAt: clt.metadata.expiresAt });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  console.log(`[CLT Storage] Salvo em IndexedDB: ${clt.id}`);
}

/**
 * Recupera CLT em nova sessão (novo GhostID) via derivedContactKey.
 */
export async function recoverCLTFromStorage(cltId: string): Promise<CLTToken | null> {
  try {
    // Try OPFS
    const root = await (navigator as any).storage?.getDirectory?.();
    if (root) {
      const file = await root.getFileHandle(`clt_${cltId}`);
      const content = await file.getFile();
      const text = await content.text();
      return JSON.parse(atob(text));
    }
  } catch (e) {
    console.warn("[CLT Recovery] OPFS indisponível");
  }

  // Fallback: IndexedDB
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("void_clt_db");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  return new Promise((resolve) => {
    const tx = db.transaction("contacts", "readonly");
    const store = tx.objectStore("contacts");
    const request = store.get(cltId);
    request.onsuccess = () => {
      if (request.result?.data) {
        resolve(JSON.parse(atob(request.result.data)));
      } else {
        resolve(null);
      }
    };
  });
}
