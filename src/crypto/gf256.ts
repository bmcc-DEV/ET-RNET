/**
 * VØID Core — GF(256) Galois Field Arithmetic
 *
 * Tabelas de logaritmo e exponenciação para operações em GF(2^8).
 * Usado por Shamir Secret Sharing (QEL, CryptoTestament, DoubleSpendDefense).
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function buildGFTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11b;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

/** Multiplicação em GF(256) */
export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

/** Inverso em GF(256) */
export function gfInv(a: number): number {
  if (a === 0) throw new Error("GF inverse of zero");
  return GF_EXP[255 - GF_LOG[a]];
}
