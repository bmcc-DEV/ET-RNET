"""
V0ID QUANTUM -- Quantum Switch (Capitulo 7)

Implementacao de um Quantum Switch: dispositivo que coloca
operacoes em superposicao de ordens causais.

Em vez de executar operacoes A e B em ordem fixa (AB ou BA),
o Quantum Switch permite que AB e BA ocorram simultaneamente,
criando uma superposicao de ordens causais.

Componentes:
1. QuantumSwitch  -- Gerencia operacoes e ordem causal
2. Criacao/Agendamento -- Insere e ordena operacoes
3. Superposicao   -- Calcula superposicao de ordens
4. Medicao        -- Colapsa para ordem classica
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from itertools import permutations


# ─── Dataclasses ──────────────────────────────────────────────────────────────

@dataclass
class QuantumSwitch:
    """
    Quantum Switch: mantem operacoes em superposicao de ordens.

    Attributes:
        operations: Lista de operacoes a serem executadas.
        causal_order: Matriz de superposicao de ordens causais.
            causal_order[i, j] = amplitude de i vir antes de j.
    """
    operations: List[Dict]
    causal_order: np.ndarray  # superposicao de ordens


# ─── 1. Criacao do Quantum Switch ────────────────────────────────────────────

def create_switch() -> QuantumSwitch:
    """
    Cria um Quantum Switch vazio.

    Returns:
        Quantum Switch inicializado.
    """
    return QuantumSwitch(
        operations=[],
        causal_order=np.array([]),
    )


# ─── 2. Insercao de Operacoes ────────────────────────────────────────────────

def add_operation(switch: QuantumSwitch, op: Dict) -> None:
    """
    Adiciona uma operacao ao Quantum Switch.

    A operacao e representada como um dicionario com:
    - "name": nome da operacao
    - "gate": matriz unitaria (np.ndarray) ou identificador
    - "qubits": qubits afetados
    - "param": parametro opcional

    A insercao atualiza a matriz de superposicao de ordens.

    Args:
        switch: Quantum Switch.
        op: Operacao a adicionar.
    """
    switch.operations.append(op)
    n = len(switch.operations)

    # Atualiza matriz de superposicao
    if n == 1:
        # Primeira operacao: ordem trivial
        switch.causal_order = np.array([[1.0 + 0j]])
    else:
        # Para n operacoes, cria superposicao uniforme
        # de todas as permutacoes possiveis
        new_order = np.zeros((n, n), dtype=complex)

        # Amplitude uniforme para todas as ordens
        n_perms = 1
        for k in range(1, n + 1):
            n_perms *= k  # n! permutacoes

        amplitude = 1.0 / np.sqrt(n_perms)

        # Preenche com superposicao uniforme
        for perm in permutations(range(n)):
            for i, j in enumerate(perm):
                if i != j:
                    new_order[i, j] += amplitude

        # Normaliza linhas
        for i in range(n):
            row_norm = np.linalg.norm(new_order[i])
            if row_norm > 0:
                new_order[i] /= row_norm

        switch.causal_order = new_order


# ─── 3. Agendamento de Operacoes ─────────────────────────────────────────────

def schedule(switch: QuantumSwitch) -> List[Dict]:
    """
    Agenda operacoes respeitando restricoes causais.

    Analisa a superposicao de ordens e retorna uma
    ordem classica consistente com as restricoes.

    Algoritmo:
    1. Analisa a matriz de superposicao
    2. Encontra ordem topologica mais provavel
    3. Retorna operacoes nessa ordem

    Args:
        switch: Quantum Switch.

    Returns:
        Lista de operacoes ordenadas.
    """
    if not switch.operations:
        return []

    n = len(switch.operations)

    if n == 1:
        return list(switch.operations)

    # Calcula probabilidades de cada operacao vir primeiro
    # baseado na matriz de superposicao
    first_probs = np.abs(switch.causal_order[:, 0]) ** 2 if switch.causal_order.shape[1] > 0 else np.ones(n) / n

    # Ordena por probabilidade de ser primeiro (decrescente)
    sorted_indices = np.argsort(-first_probs)

    ordered_ops = []
    for idx in sorted_indices:
        if idx < len(switch.operations):
            ordered_ops.append(switch.operations[idx])

    return ordered_ops


# ─── 4. Superposicao de Ordens ───────────────────────────────────────────────

def get_superposition(switch: QuantumSwitch) -> Dict:
    """
    Retorna a superposicao de ordens causais.

    Calcula as amplitudes e probabilidades de cada
    permutacao possivel das operacoes.

    Args:
        switch: Quantum Switch.

    Returns:
        Dicionario com superposicao de ordens.
    """
    n = len(switch.operations)

    if n == 0:
        return {"orders": [], "amplitudes": [], "probabilities": []}

    if n == 1:
        return {
            "orders": [[switch.operations[0]["name"]]],
            "amplitudes": [1.0 + 0j],
            "probabilities": [1.0],
        }

    # Gera todas as permutacoes
    orders = []
    amplitudes = []
    probabilities = []

    for perm in permutations(range(n)):
        order = [switch.operations[i]["name"] for i in perm]
        orders.append(order)

        # Amplitude da permutacao baseada na superposicao
        amp = 1.0 + 0j
        for i in range(n):
            for j in range(i + 1, n):
                amp *= switch.causal_order[perm[i], perm[j]]

        prob = float(np.abs(amp) ** 2)
        amplitudes.append(amp)
        probabilities.append(prob)

    # Normaliza probabilidades
    total_prob = sum(probabilities)
    if total_prob > 0:
        probabilities = [p / total_prob for p in probabilities]

    return {
        "orders": orders,
        "amplitudes": amplitudes,
        "probabilities": probabilities,
        "num_orders": len(orders),
    }


# ─── 5. Medicao (Colapso) ────────────────────────────────────────────────────

def measure(switch: QuantumSwitch) -> Dict:
    """
    Colapsa o Quantum Switch para uma ordem causal classica.

    Simula a medicao da superposicao, colapsando para
    uma ordem deterministica com probabilidade proporcional
    a amplitudes da superposicao.

    Args:
        switch: Quantum Switch.

    Returns:
        Dicionario com a ordem colapsada.
    """
    n = len(switch.operations)

    if n == 0:
        return {"collapsed_order": [], "measurement_basis": "computational"}

    if n == 1:
        return {
            "collapsed_order": [switch.operations[0]["name"]],
            "measurement_basis": "computational",
        }

    # Gera todas as permutacoes e suas probabilidades
    perms = list(permutations(range(n)))
    probs = np.zeros(len(perms))

    for idx, perm in enumerate(perms):
        prob = 1.0
        for i in range(n):
            for j in range(i + 1, n):
                prob *= float(np.abs(switch.causal_order[perm[i], perm[j]]))
        probs[idx] = prob

    # Normaliza
    total = probs.sum()
    if total > 0:
        probs /= total
    else:
        probs = np.ones(len(perms)) / len(perms)

    # Medicao: amostra de acordo com probabilidades
    chosen_idx = np.random.choice(len(perms), p=probs)
    collapsed_perm = perms[chosen_idx]

    collapsed_order = [switch.operations[i]["name"] for i in collapsed_perm]

    # Atualiza o switch para ordem colapsada
    new_order = np.zeros((n, n), dtype=complex)
    for i in range(n):
        for j in range(n):
            if i == j:
                new_order[i, j] = 1.0
            elif collapsed_perm.index(i) < collapsed_perm.index(j):
                new_order[i, j] = 1.0  # i vem antes de j

    switch.causal_order = new_order

    return {
        "collapsed_order": collapsed_order,
        "measurement_basis": "computational",
        "probability": float(probs[chosen_idx]),
        "remaining_superposition": False,
    }


# ─── Funcoes Auxiliares ──────────────────────────────────────────────────────

def switch_stats(switch: QuantumSwitch) -> Dict:
    """
    Retorna estatisticas do Quantum Switch.
    """
    n = len(switch.operations)
    superposition = get_superposition(switch)

    return {
        "num_operations": n,
        "num_possible_orders": superposition["num_orders"],
        "entropy": float(-sum(
            p * np.log(p + 1e-10)
            for p in superposition["probabilities"]
        )),
        "is_superposed": n > 1 and np.any(switch.causal_order != np.eye(n)),
    }


def verify_causality(switch: QuantumSwitch) -> Dict[str, bool]:
    """
    Verifica propriedades de causalidade do switch.

    Returns:
        Dicionario com verificacoes de causalidade.
    """
    n = len(switch.operations)

    return {
        "unitary": np.allclose(
            switch.causal_order @ switch.causal_order.conj().T,
            np.eye(n),
        ) if n > 0 and switch.causal_order.shape[0] == n else False,
        "hermitian": np.allclose(
            switch.causal_order,
            switch.causal_order.conj().T,
        ) if n > 0 and switch.causal_order.shape[0] == n else False,
        "non_degenerate": n <= 1 or np.linalg.matrix_rank(switch.causal_order) == n,
    }
