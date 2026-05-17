/* tslint:disable */
/* eslint-disable */

export class GhostIdentityWasm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly handle: string;
    readonly public_key: Uint8Array;
}

export class HashChronicleWasm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly event_hash: Uint8Array;
}

export class PedersenCommitmentWasm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly blinding_factor: Uint8Array;
    readonly commitment: Uint8Array;
}

export class RangeProofResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly commitment: Uint8Array;
    readonly proof: Uint8Array;
}

export class StarkAggregateProofWasm {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly compressed_size: number;
    readonly merkle_root: Uint8Array;
    readonly proof_count: number;
}

export function aggregate_zk_proofs(proofs_concat: Uint8Array, single_proof_size: number): StarkAggregateProofWasm;

export function create_balance_proof(inputs_r: Uint8Array, outputs_r: Uint8Array): Uint8Array;

/**
 * Generate a BOLT11 invoice.
 *
 * Parameters:
 * - private_key: 32 bytes (serialized as hex string)
 * - amount_sat: amount in satoshis
 * - description: invoice description
 * - expiry_secs: expiry in seconds
 * - network: "bitcoin", "testnet", or "regtest"
 *
 * Returns: BOLT11 invoice string
 */
export function create_bolt11(_private_key: string, _amount_sat: bigint, _description: string, _expiry_secs: bigint, _network: string): string;

export function create_hash_chronicle(payload: Uint8Array, parent_hashes_concat: Uint8Array): HashChronicleWasm;

export function create_pedersen_commitment(value: bigint): PedersenCommitmentWasm;

export function create_range_proof(value: bigint, blinding_factor: Uint8Array): RangeProofResult;

export function derive_ghost_id(entropy: Uint8Array): GhostIdentityWasm;

/**
 * Extract the payment hash from a BOLT11 invoice.
 *
 * Returns: hex-encoded 32-byte payment hash
 */
export function extract_payment_hash(bolt11_str: string): string;

export function init_void_core(): void;

/**
 * Parse a BOLT11 invoice string and return a JSON summary.
 *
 * Returns: { amount_sat, description, payment_hash, timestamp, expiry, network }
 * Or: { error: "..." }
 */
export function parse_bolt11(bolt11_str: string): string;

/**
 * Validate a BOLT11 invoice string.
 *
 * Returns: true if valid, false otherwise
 */
export function validate_bolt11(bolt11_str: string): boolean;

export function verify_range_proof(proof_bytes: Uint8Array, commitment_bytes: Uint8Array): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_ghostidentitywasm_free: (a: number, b: number) => void;
    readonly __wbg_hashchroniclewasm_free: (a: number, b: number) => void;
    readonly __wbg_pedersencommitmentwasm_free: (a: number, b: number) => void;
    readonly __wbg_rangeproofresult_free: (a: number, b: number) => void;
    readonly __wbg_starkaggregateproofwasm_free: (a: number, b: number) => void;
    readonly aggregate_zk_proofs: (a: number, b: number, c: number) => number;
    readonly create_balance_proof: (a: number, b: number, c: number, d: number) => any;
    readonly create_hash_chronicle: (a: number, b: number, c: number, d: number) => number;
    readonly create_pedersen_commitment: (a: bigint) => number;
    readonly create_range_proof: (a: bigint, b: number, c: number) => number;
    readonly derive_ghost_id: (a: number, b: number) => number;
    readonly ghostidentitywasm_handle: (a: number) => [number, number];
    readonly ghostidentitywasm_public_key: (a: number) => any;
    readonly hashchroniclewasm_event_hash: (a: number) => any;
    readonly init_void_core: () => void;
    readonly pedersencommitmentwasm_blinding_factor: (a: number) => any;
    readonly pedersencommitmentwasm_commitment: (a: number) => any;
    readonly rangeproofresult_commitment: (a: number) => any;
    readonly rangeproofresult_proof: (a: number) => any;
    readonly starkaggregateproofwasm_compressed_size: (a: number) => number;
    readonly starkaggregateproofwasm_merkle_root: (a: number) => any;
    readonly starkaggregateproofwasm_proof_count: (a: number) => number;
    readonly verify_range_proof: (a: number, b: number, c: number, d: number) => number;
    readonly create_bolt11: (a: number, b: number, c: bigint, d: number, e: number, f: bigint, g: number, h: number) => [number, number, number, number];
    readonly extract_payment_hash: (a: number, b: number) => [number, number, number, number];
    readonly parse_bolt11: (a: number, b: number) => [number, number, number, number];
    readonly validate_bolt11: (a: number, b: number) => number;
    readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
    readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
    readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
    readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
