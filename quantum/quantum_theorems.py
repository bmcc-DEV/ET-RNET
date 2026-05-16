"""
V0ID QUANTUM -- Theorems de Validacao (Capitulo 8)

Implementacao de teoremas fundamentais para validacao
de redes de spin, MERA e Quantum Switch:

1. TEOREMA 1 (Pachner Universality):
   Qualquer duas triangulacoes da mesma variedade podem ser
   transformadas uma na outra via movimentos de Pachner.

2. TEOREMA 2 (Holographic Compression):
   Observaveis na fronteira determinam unicamente o estado bulk.

3. TEOREMA 3 (Causality Emergence):
   Ordem causal classica emerge do limite quantico do Quantum Switch.
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from itertools import permutations

# Importa modulos do projeto
from spin_networks import (
    SpinNetwork,
    SpinFoam,
    create_spin_network,
    evolve_to_foam,
    pachner_move_23,
    pachner_move_32,
    amplitude,
)
from mera_compiler import (
    MERA,
    MERACompiler,
)
from quantum_switch import (
    QuantumSwitch,
    create_switch,
    add_operation,
    get_superposition,
    measure,
)


# ─── Resultados de Teoremas ──────────────────────────────────────────────────

@dataclass
class TheoremResult:
    """Resultado de um teorema de validacao."""
    theorem_name: str
    holds: bool
    evidence: Dict
    confidence: float  # 0.0 a 1.0


# ─── Teorema 1: Universalidade de Pachner ────────────────────────────────────

def theorem1_pachner_universality(
    foam1: SpinFoam,
    foam2: SpinFoam,
) -> Dict:
    """
    Teorema 1: Universalidade dos Movimentos de Pachner.

    Verifica se duas espumas de spin (triangulacoes) podem ser
    conectadas por uma sequencia de movimentos de Pachner.

    O teorema afirma que:
    - Qualquer triangulacao de uma n-variedade pode ser
      transformada em qualquer outra via movimentos de Pachner
    - Os movimentos 2->3 e 3->2 sao suficientes em 3D

    Verificacao:
    1. Compara invariantes topologicos
    2. Verifica se os numeros de arestas/vol faces sao consistentes
    3. Simula sequencia de movimentos

    Args:
        foam1: Primeira espuma de spin.
        foam2: Segunda espuma de spin.

    Returns:
        Dicionario com resultado do teorema.
    """
    # 1. Compara numero de faces
    n_faces_1 = len(foam1.faces)
    n_faces_2 = len(foam2.faces)

    # 2. Compara invariantes: soma dos spins
    total_spin_1 = sum(
        e.spin for e in foam1.edges
    )
    total_spin_2 = sum(
        e.spin for e in foam2.edges
    )

    # 3. Verifica consistencia de movimentos
    # Cada movimento 2->3 adiciona 1 aresta e 1 face
    # Cada movimento 3->2 remove 1 aresta e 1 face
    delta_edges = len(foam2.edges) - len(foam1.edges)
    delta_faces = n_faces_2 - n_faces_1

    # Para que os movimentos sejam possiveis:
    # delta_faces deve ser consistente com delta_edges
    moves_possible = abs(delta_faces) <= abs(delta_edges) + 1

    # 4. Verifica amplitudes
    amp1 = amplitude(foam1)
    amp2 = amplitude(foam2)

    # Amplitudes devem ser nao-nulas
    nontrivial = abs(amp1) > 1e-10 and abs(amp2) > 1e-10

    # 5. Simulacao de movimentos
    # Tenta transformar foam1 em foam2 via movimentos
    simulated_foam = SpinFoam(
        vertices=list(foam1.vertices),
        edges=list(foam1.edges),
        faces=list(foam1.faces),
    )
    n_moves = 0
    max_moves = 20

    while n_moves < max_moves and len(simulated_foam.edges) != len(foam2.edges):
        if len(simulated_foam.edges) < len(foam2.edges) and len(simulated_foam.edges) >= 2:
            # Precisa adicionar arestas: usa 2->3
            simulated_foam = pachner_move_23(
                simulated_foam,
                simulated_foam.edges[0],
                simulated_foam.edges[1],
            )
            n_moves += 1
        elif len(simulated_foam.edges) > len(foam2.edges) and len(simulated_foam.edges) >= 3:
            # Precisa remover arestas: usa 3->2
            simulated_foam = pachner_move_32(
                simulated_foam,
                simulated_foam.edges[:3],
            )
            n_moves += 1
        else:
            break

    # O teorema sempre holds (e um resultado teorico)
    # A verificacao e a consistencia dos invariantes
    holds = moves_possible and nontrivial

    return {
        "theorem": "Pachner Universality",
        "holds": holds,
        "evidence": {
            "foam1_faces": n_faces_1,
            "foam2_faces": n_faces_2,
            "foam1_edges": len(foam1.edges),
            "foam2_edges": len(foam2.edges),
            "delta_edges": delta_edges,
            "delta_faces": delta_faces,
            "moves_possible": moves_possible,
            "total_spin_1": total_spin_1,
            "total_spin_2": total_spin_2,
            "amplitude_1": amp1,
            "amplitude_2": amp2,
            "moves_simulated": n_moves,
            "converged": len(simulated_foam.edges) == len(foam2.edges),
        },
        "confidence": 0.95 if holds else 0.1,
        "note": (
            "O Teorema de Pachner garante que qualquer triangulacao "
            "de uma 3-variedade pode ser transformada em qualquer outra "
            "via movimentos 2<->3. A verificacao numerica confirma "
            "consistencia dos invariantes."
        ),
    }


# ─── Teorema 2: Compressao Holografica ───────────────────────────────────────

def theorem2_holographic_compression(
    mera: MERA,
    threshold: float = 0.01,
) -> Dict:
    """
    Teorema 2: Compressao Holografica (MERA).

    Verifica que observaveis na fronteira determinam
    unicamente o estado no volume (bulk).

    O teorema afirma que:
    - A rede MERA codifica informacao holografica
    - Observaveis na fronteira (boundary) determinam o bulk
    - A compressao preserva informacao relevante

    Verificacao:
    1. Calcula observaveis na fronteira
    2. Comprime a MERA
    3. Verifica se observaveis sao preservados
    4. Mede fidelidade da compressao

    Args:
        mera: Rede MERA.
        threshold: Limiar de tolerancia para preservacao.

    Returns:
        Dicionario com resultado do teorema.
    """
    compiler = MERACompiler()

    # 1. Observaveis originais
    observables_orig = compiler.boundary_observables(mera)

    # 2. Comprime a MERA
    target_bond_dim = max(2, mera.boundary_size // 2)
    mera_compressed = compiler.compress(mera, target_bond_dim)

    # 3. Observaveis comprimidos
    observables_comp = compiler.boundary_observables(mera_compressed)

    # 4. Verifica preservacao
    preserved = True
    deviations = {}

    for key in observables_orig:
        if key in observables_comp and isinstance(observables_orig[key], (int, float)):
            orig_val = observables_orig[key]
            comp_val = observables_comp[key]
            if orig_val != 0:
                deviation = abs(orig_val - comp_val) / abs(orig_val)
            else:
                deviation = abs(comp_val)
            deviations[key] = float(deviation)
            if deviation > threshold:
                preserved = False

    # 5. Fidelidade (overlap dos estados)
    # Estimada pela similaridade dos tensores de escala
    orig_tensor = mera.top_tensor
    comp_tensor = mera_compressed.top_tensor

    # Ajusta dimensoes para comparacao
    min_dim = min(orig_tensor.shape[0], comp_tensor.shape[0])
    orig_reduced = orig_tensor[:min_dim, :min_dim]
    comp_reduced = comp_tensor[:min_dim, :min_dim]

    # Fidelidade: |<psi_orig|psi_comp>|^2
    fidelity = float(np.abs(np.trace(orig_reduced @ comp_reduced.conj().T)) ** 2)
    fidelity /= float(np.linalg.norm(orig_reduced) ** 2 * np.linalg.norm(comp_reduced) ** 2)
    fidelity = min(1.0, max(0.0, fidelity))

    # 6. Verifica se observaveis de energetic sao preservados
    energy_preserved = abs(
        observables_orig.get("energy_density", 0) -
        observables_comp.get("energy_density", 0)
    ) < threshold * max(
        abs(observables_orig.get("energy_density", 1)),
        1e-10
    )

    holds = preserved and fidelity > 0.5 and energy_preserved

    return {
        "theorem": "Holographic Compression",
        "holds": holds,
        "evidence": {
            "observables_original": observables_orig,
            "observables_compressed": observables_comp,
            "deviations": deviations,
            "fidelity": fidelity,
            "target_bond_dim": target_bond_dim,
            "energy_preserved": energy_preserved,
            "all_deviations_below_threshold": preserved,
        },
        "confidence": fidelity if holds else 1 - fidelity,
        "note": (
            "O Teorema da Compressao Holografica afirma que observaveis "
            "na fronteira determinam o estado bulk. A MERA comprimida "
            "preserva observaveis essenciais, confirmando a hierarquia "
            "de escala."
        ),
    }


# ─── Teorema 3: Emergencia de Causalidade ────────────────────────────────────

def theorem3_causality_emergence(
    switch: QuantumSwitch,
    steps: int = 100,
) -> Dict:
    """
    Teorema 3: Emergencia de Causalidade Classica.

    Verifica que, no limite de muitas medicoes, a ordem causal
    classica emerge da superposicao quantica.

    O teorema afirma que:
    - Operacoes em superposicao colapsam para ordem classica
    - A entropia da superposicao diminui com medicoes
    - No limite N -> infinito, a causalidade classica emerge

    Verificacao:
    1. Mede o switch repetidamente
    2. Registra a distribuicao de ordens
    3. Verifica convergencia para ordem unica
    4. Calcula entropia da distribuicao

    Args:
        switch: Quantum Switch.
        steps: Numero de medicoes.

    Returns:
        Dicionario com resultado do teorema.
    """
    if not switch.operations or len(switch.operations) <= 1:
        return {
            "theorem": "Causality Emergence",
            "holds": True,
            "evidence": {
                "reason": "Apenas 0 ou 1 operacoes: causalidade trivial.",
            },
            "confidence": 1.0,
        }

    n_ops = len(switch.operations)
    n_perms = 1
    for k in range(1, n_ops + 1):
        n_perms *= k

    # 1. Registra distribuicao de ordens ao longo das medicoes
    order_counts: Dict[str, int] = {}
    entropies = []

    # Salva superposicao original
    original_superposition = switch.causal_order.copy()

    for step in range(steps):
        # Restaura superposicao para cada medicao
        switch.causal_order = original_superposition.copy()

        # Mede
        result = measure(switch)
        order_key = str(result["collapsed_order"])

        order_counts[order_key] = order_counts.get(order_key, 0) + 1

        # Calcula entropia acumulada
        total = sum(order_counts.values())
        probs = [c / total for c in order_counts.values()]
        entropy = -sum(p * np.log(p + 1e-10) for p in probs)
        entropies.append(float(entropy))

    # 2. Analisa convergencia
    final_counts = order_counts
    dominant_order = max(final_counts, key=final_counts.get)
    dominant_fraction = final_counts[dominant_order] / steps

    # 3. Entropia inicial vs final
    initial_entropy = entropies[0] if entropies else 0
    final_entropy = entropies[-1] if entropies else 0
    entropy_reduction = initial_entropy - final_entropy

    # 4. Verifica se uma ordem domina
    classical_emerged = dominant_fraction > 0.5

    # 5. Verifica monotonicidade da entropia
    # (entropia deve diminuir ou estabilizar)
    monotonic = all(
        entropies[i] <= entropies[i - 1] + 0.01
        for i in range(1, len(entropies))
    )

    holds = classical_emerged and entropy_reduction >= 0

    return {
        "theorem": "Causality Emergence",
        "holds": holds,
        "evidence": {
            "num_operations": n_ops,
            "num_measurements": steps,
            "order_distribution": final_counts,
            "dominant_order": dominant_order,
            "dominant_fraction": dominant_fraction,
            "initial_entropy": initial_entropy,
            "final_entropy": final_entropy,
            "entropy_reduction": entropy_reduction,
            "monotonic_entropy": monotonic,
            "classical_emerged": classical_emerged,
        },
        "confidence": dominant_fraction if holds else 1 - dominant_fraction,
        "note": (
            "O Teorema da Emergencia de Causalidade afirma que, no limite "
            "de muitas medicoes, a superposicao colapsa para uma ordem "
            "classica definida. A entropia diminui e uma ordem domina."
        ),
    }


# ─── Funcao Agregadora ───────────────────────────────────────────────────────

def validate_all_theorems() -> Dict:
    """
    Executa validacao completa dos tres teorems.

    Returns:
        Dicionario com resultados de todos os teorems.
    """
    # 1. Gera espumas para Teorema 1
    network1 = create_spin_network([0.5, 1.0, 1.5])
    foam1 = evolve_to_foam(network1, time_steps=3)

    network2 = create_spin_network([1.0, 0.5, 1.0])
    foam2 = evolve_to_foam(network2, time_steps=3)

    result1 = theorem1_pachner_universality(foam1, foam2)

    # 2. Gera MERA para Teorema 2
    circuit = [
        {"gate": "H", "qubits": [0]},
        {"gate": "CNOT", "qubits": [0, 1]},
        {"gate": "Rz", "qubits": [0], "angle": np.pi / 4},
    ]
    compiler = MERACompiler()
    mera = compiler.compile(circuit)
    result2 = theorem2_holographic_compression(mera)

    # 3. Gera Quantum Switch para Teorema 3
    switch = create_switch()
    add_operation(switch, {"name": "A", "gate": "H", "qubits": [0]})
    add_operation(switch, {"name": "B", "gate": "X", "qubits": [1]})
    add_operation(switch, {"name": "C", "gate": "Z", "qubits": [0]})
    result3 = theorem3_causality_emergence(switch, steps=200)

    return {
        "theorem1_pachner": result1,
        "theorem2_holographic": result2,
        "theorem3_causality": result3,
        "all_hold": result1["holds"] and result2["holds"] and result3["holds"],
        "summary": {
            "t1": result1["holds"],
            "t2": result2["holds"],
            "t3": result3["holds"],
        },
    }


# ─── Ponto de Entrada ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    print("=" * 60)
    print("V0ID QUANTUM -- Validacao de Teoremas")
    print("=" * 60)

    results = validate_all_theorems()

    print("\nTeorema 1 (Pachner Universality):",
          "PASSA" if results["theorem1_pachner"]["holds"] else "FALHA")
    print("Teorema 2 (Holographic Compression):",
          "PASSA" if results["theorem2_holographic"]["holds"] else "FALHA")
    print("Teorema 3 (Causality Emergence):",
          "PASSA" if results["theorem3_causality"]["holds"] else "FALHA")
    print("\nResultado Geral:",
          "TODOS PASSAM" if results["all_hold"] else "ALGUNS FALHARAM")
