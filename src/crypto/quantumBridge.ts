/**
 * VØID Quantum Bridge — Conexão TypeScript ↔ Python CQR Engine
 *
 * Expõe operações quânticas reais (quimb + BB84) para o frontend.
 * O backend Python roda em localhost:8472.
 */

const QUANTUM_API = "http://localhost:8472";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface QuantumEntropy {
  entropy_hex: string;
  sha3_256: string;
  bits: number;
  source: string;
  n_measurements: number;
}

export interface BellPairResult {
  bell_type: string;
  measurements: Record<string, number>;
  chsh: {
    S_value: number;
    S_theoretical_max: number;
    chsh_violated: boolean;
    correlations: Record<string, number>;
  };
  fidelity: number;
  is_entangled: boolean;
}

export interface BB84Result {
  success: boolean;
  key_length?: number;
  final_key?: string;
  qber?: number;
  eve_detected?: boolean;
  reason?: string;
  steps?: {
    photons_sent: number;
    sifted_key_length: number;
    matching_bases: number;
    errors_corrected: number;
  };
}

export interface PachnerResult {
  original: string;
  result: string;
  move_type: string;
  triangulation_preserved: boolean;
  topology_invariant: number;
}

// ─── API Client ──────────────────────────────────────────────────────────────

async function quantumFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${QUANTUM_API}${path}`);
  if (!res.ok) {
    throw new Error(`Quantum API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Gera entropia quântica via medições de Bell states.
 * Fonte de entropia quântica real (não CSPRNG clássico).
 */
export async function generateQuantumEntropy(bits: number = 256): Promise<QuantumEntropy> {
  return quantumFetch<QuantumEntropy>(`/quantum/entropy?bits=${bits}`);
}

/**
 * Cria par entrelaçado e mede propriedades (CHSH test).
 * Retorna fidelidade, correlações e violação CHSH.
 */
export async function createBellPair(
  bellType: "phi_plus" | "phi_minus" | "psi_plus" | "psi_minus" = "phi_plus"
): Promise<BellPairResult> {
  return quantumFetch<BellPairResult>(`/quantum/bell/${bellType}`);
}

/**
 * Mede todos os 4 estados de Bell e compara fidelidades.
 */
export async function measureAllBellStates(): Promise<
  Record<string, { measurements: Record<string, number>; fidelity: number }>
> {
  return quantumFetch(`/quantum/bell/all`);
}

/**
 * Move de Pachner — transformação topológica da rede de spin.
 */
export async function pachnerMove(
  networkId: string = "initial",
  moveType: "2-3" | "3-2" = "2-3"
): Promise<PachnerResult> {
  return quantumFetch<PachnerResult>(
    `/quantum/pachner?network_id=${networkId}&move_type=${moveType}`
  );
}

/**
 * Executa protocolo BB84 completo (QKD).
 * Gera chave quântica segura via sifting + correção + amplificação.
 */
export async function runBB84(
  keyLength: number = 256,
  intercept: boolean = false
): Promise<BB84Result> {
  return quantumFetch<BB84Result>(
    `/quantum/bb84?key_length=${keyLength}&intercept=${intercept}`
  );
}

/**
 * Compara BB84 com e sem Eve — demonstra detecção de intrusão.
 */
export async function compareBB84(): Promise<{
  no_eve: BB84Result;
  with_eve: BB84Result;
}> {
  return quantumFetch(`/quantum/bb84/compare`);
}

/**
 * Verifica se o servidor quântico está disponível.
 */
export async function quantumHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${QUANTUM_API}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
