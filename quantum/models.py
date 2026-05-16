"""Modelos Pydantic para todas as operacoes da API VOID Quantum."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Bell State
# ---------------------------------------------------------------------------

class BellRequest(BaseModel):
    """Requisicao para criar e medir um estado de Bell."""

    bell_type: str = Field(
        ...,
        description="Tipo do estado de Bell: PhiPlus, PhiMinus, PsiPlus, PsiMinus.",
        examples=["PhiPlus"],
    )
    num_shots: int = Field(
        default=1024,
        description="Numero de medições a serem realizadas.",
        examples=[1024],
    )

    model_config = {"json_schema_extra": {"examples": [{"bell_type": "PhiPlus", "num_shots": 1024}]}}


class BellResponse(BaseModel):
    """Resposta contendo os resultados das medicoes do estado de Bell."""

    bell_type: str = Field(..., description="Tipo de estado de Bell utilizado.")
    measurement_outcomes: dict[str, int] = Field(
        ...,
        description="Contagem de resultados para cada par de medicoes.",
        examples=[{"00": 512, "11": 512}],
    )
    probabilities: dict[str, float] = Field(
        ...,
        description="Probabilidades normalizadas de cada resultado.",
        examples=[{"00": 0.5, "11": 0.5}],
    )
    entanglement_verified: bool = Field(
        ..., description="Se a violacao da desigualdade de Bell foi verificada."
    )


# ---------------------------------------------------------------------------
# BB84
# ---------------------------------------------------------------------------

class BB84Request(BaseModel):
    """Requisicao para simulacao do protocolo QKD BB84."""

    key_length: int = Field(
        ...,
        description="Comprimento desejado da chave semeada.",
        examples=[256],
    )
    intercept: bool = Field(
        default=False,
        description="Se Eve esta interceptando o canal.",
        examples=[False],
    )
    error_rate: float = Field(
        default=0.0,
        description="Taxa de erro introduzida pelo interceptador (0.0 - 1.0).",
        examples=[0.11],
    )

    model_config = {
        "json_schema_extra": {"examples": [{"key_length": 256, "intercept": True, "error_rate": 0.11}]}
    }


class BB84Response(BaseModel):
    """Resposta da simulacao BB84 com estatisticas de seguranca."""

    key_length: int = Field(..., description="Comprimento da chave gerada antes do sifting.")
    sifted_key: str = Field(..., description="Chave semeada resultante em binario.")
    qber: float = Field(..., description="Quantum Bit Error Rate detectado.")
    eve_detected: bool = Field(..., description="Se a presenca de Eve foi detectada.")
    final_key_bits: int = Field(..., description="Numero de bits na chave final apos correcao de erros.")
    privacy_amplification: bool = Field(..., description="Se ampliacao de privacidade foi necessaria.")


# ---------------------------------------------------------------------------
# Pachner Move
# ---------------------------------------------------------------------------

class PachnerRequest(BaseModel):
    """Requisicao para executar um movimento de Pachner em uma rede spin."""

    network_id: str = Field(
        ...,
        description="Identificador da rede spin alvo.",
        examples=["network_001"],
    )
    move_type: int = Field(
        ...,
        description="Tipo do movimento de Pachner (2-3, 3-2, 1-3, 3-1).",
        examples=[23],
    )
    target_simplex: Optional[list[int]] = Field(
        default=None,
        description="Indices dos simplices alvo do movimento.",
        examples=[[0, 1, 2]],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"network_id": "network_001", "move_type": 23, "target_simplex": [0, 1, 2]}]
        }
    }


class PachnerResponse(BaseModel):
    """Resposta apos aplicacao do movimento de Pachner."""

    network_id: str = Field(..., description="ID da rede resultante.")
    move_type: int = Field(..., description="Tipo de movimento executado.")
    result_network: dict[str, Any] = Field(
        ..., description="Rede spin resultante apos o movimento."
    )
    nodes_added: int = Field(..., description="Numero de nos adicionados.")
    nodes_removed: int = Field(..., description="Numero de nos removidos.")
    valid: bool = Field(..., description="Se a rede resultante e topologicamente valida.")


# ---------------------------------------------------------------------------
# Spin Network
# ---------------------------------------------------------------------------

class SpinNetworkResponse(BaseModel):
    """Representacao de uma rede spin quântica."""

    nodes: list[dict[str, Any]] = Field(
        ..., description="Nos da rede com suas propriedades de spin."
    )
    edges: list[dict[str, Any]] = Field(
        ..., description="Arestas da rede com as interseccoes de spin."
    )
    amplitude: complex = Field(
        ..., description="Amplitude quântica total da configuracao da rede."
    )
    partition_function: float = Field(
        ..., description="Funcao de particao da rede spin."
    )
    topology: str = Field(
        default="graph",
        description="Tipo de topologia da rede (graph, surface, manifold).",
    )


# ---------------------------------------------------------------------------
# MERA
# ---------------------------------------------------------------------------

class MERARequest(BaseModel):
    """Requisicao para compilar um circuito MERA (Multi-scale Entanglement Renormalization Ansatz)."""

    circuit_size: int = Field(
        ...,
        description="Numero de qubits no circuito MERA.",
        examples=[8],
    )
    bond_dimension: int = Field(
        default=2,
        description="Dimensao de ligacao dos tensores.",
        examples=[2],
    )
    boundary_observables: list[str] = Field(
        default_factory=list,
        description="Observaveis de fronteira a serem calculados.",
        examples=[[" magnetization", "energy"]],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "circuit_size": 8,
                    "bond_dimension": 2,
                    "boundary_observables": ["magnetization", "energy"],
                }
            ]
        }
    }


class MERAResponse(BaseModel):
    """Resposta da compilacao MERA com tensores resultantes."""

    circuit_size: int = Field(..., description="Numero de qubits do circuito.")
    bond_dimension: int = Field(..., description="Dimensao de ligacao utilizada.")
    layers: int = Field(..., description="Numero de camadas de renormalizacao.")
    tensor_network: dict[str, Any] = Field(..., description="Tensores resultantes do MERA.")
    boundary_observables: dict[str, float] = Field(
        ..., description="Valores dos observaveis de fronteira calculados."
    )
    entanglement_entropy: float = Field(
        ..., description="Entropia de emaranhamento do estado resultante."
    )


# ---------------------------------------------------------------------------
# Quantum Switch
# ---------------------------------------------------------------------------

class QuantumSwitchRequest(BaseModel):
    """Requisicao para um interruptor quântico de ordem causal."""

    n_operations: int = Field(
        ...,
        description="Numero de operacoes a serem controladas.",
        examples=[2],
    )
    causal_order: Optional[list[list[int]]] = Field(
        default=None,
        description="Ordem causal classica para comparacao.",
        examples=[[[0, 1], [1, 0]]],
    )
    superposition_size: int = Field(
        default=2,
        description="Tamanho da superposicao de ordens.",
        examples=[2],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"n_operations": 2, "causal_order": [[0, 1], [1, 0]], "superposition_size": 2}]
        }
    }


class QuantumSwitchResponse(BaseModel):
    """Resposta do interruptor quântico."""

    n_operations: int = Field(..., description="Numero de operacoes controladas.")
    causal_order: list[list[int]] = Field(..., description="Ordens causais em superposicao.")
    superposition_size: int = Field(..., description="Tamanho da superposicao de ordens.")
    control_state: str = Field(..., description="Estado do qubit de controle.")
    interference_detected: bool = Field(
        ..., description="Se interferencia entre ordens causais foi detectada."
    )
    process_matrix: dict[str, Any] = Field(..., description="Matriz de processo resultante.")


# ---------------------------------------------------------------------------
# Collapse State
# ---------------------------------------------------------------------------

class CollapseStateRequest(BaseModel):
    """Requisicao para analise de colapso quântico."""

    phi: float = Field(
        ...,
        description="Angulo phi do estado quântico.",
        examples=[0.785],
    )
    lambda_: float = Field(
        ...,
        alias="lambda",
        description="Parametro lambda do modelo de colapso.",
        examples=[0.01],
    )
    chi_avg: float = Field(
        ...,
        description="Valor medio de chi (constante de descoerencia).",
        examples=[0.001],
    )
    memory_kernel: str = Field(
        default="exponential",
        description="Tipo do kernel de memoria (exponential, power_law, step).",
        examples=["exponential"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "phi": 0.785,
                    "lambda": 0.01,
                    "chi_avg": 0.001,
                    "memory_kernel": "exponential",
                }
            ]
        },
        "populate_by_name": True,
    }


class CollapseStateResponse(BaseModel):
    """Resposta da analise de colapso quântico."""

    phi: float = Field(..., description="Angulo phi utilizado.")
    collapse_probability: float = Field(..., description="Probabilidade de colapso calculada.")
    decoherence_time: float = Field(..., description="Tempo de decoerencia estimado.")
    memory_kernel: str = Field(..., description="Kernel de memoria utilizado.")
    irreversibility_index: float = Field(
        ..., description="Indice de irreversibilidade do processo de colapso."
    )


# ---------------------------------------------------------------------------
# Collapse Operator
# ---------------------------------------------------------------------------

class CollapseOperatorRequest(BaseModel):
    """Requisicao para aplicacao de um operador de colapso."""

    operator: str = Field(
        ...,
        description="Nome do operador de colapso (z_projection, phase_estimation, etc.).",
        examples=["z_projection"],
    )
    state_before: dict[str, Any] = Field(
        ...,
        description="Estado quântico antes da aplicacao do operador.",
        examples=[{"amplitudes": [0.707, 0, 0, 0.707], "n_qubits": 2}],
    )
    basis: str = Field(
        default="computational",
        description="Base de medicao utilizada.",
        examples=["computational"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "operator": "z_projection",
                    "state_before": {"amplitudes": [0.707, 0, 0, 0.707], "n_qubits": 2},
                    "basis": "computational",
                }
            ]
        }
    }


class CollapseOperatorResponse(BaseModel):
    """Resposta da aplicacao do operador de colapso."""

    operator: str = Field(..., description="Operador aplicado.")
    state_before: dict[str, Any] = Field(..., description="Estado antes da aplicacao.")
    state_after: dict[str, Any] = Field(..., description="Estado resultante apos o colapso.")
    irreversibility: float = Field(
        ..., description="Medida de irreversibilidade da operacao (0.0 reversivel, 1.0 totalmente irreversivel)."
    )
    measurement_probabilities: dict[str, float] = Field(
        ..., description="Probabilidades de medicao para cada resultado."
    )


# ---------------------------------------------------------------------------
# LSC (Landauer's Bound / State Compression)
# ---------------------------------------------------------------------------

class LSCRequest(BaseModel):
    """Requisicao para analise de limites de Landauer e compressao de estado."""

    C_epsilon: float = Field(
        ...,
        description="Capacidade de canal com tolerancia epsilon.",
        examples=[1.0],
    )
    P_max: float = Field(
        ...,
        description="Potencia maxima disponivel (unidades arbitrárias).",
        examples=[10.0],
    )
    K_eff: float = Field(
        ...,
        description="Eficiencia do protocolo de compressao.",
        examples=[0.85],
    )
    saturation: bool = Field(
        default=False,
        description="Se o sistema esta em regime de saturacao.",
        examples=[False],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"C_epsilon": 1.0, "P_max": 10.0, "K_eff": 0.85, "saturation": False}]
        }
    }


class LSCResponse(BaseModel):
    """Resposta da analise LSC."""

    C_epsilon: float = Field(..., description="Capacidade de canal utilizada.")
    P_max: float = Field(..., description="Potencia maxima considerada.")
    K_eff: float = Field(..., description="Eficiencia efetiva calculada.")
    landauer_bound: float = Field(..., description="Limite de Landauer para a dissipacao minima.")
    compression_ratio: float = Field(
        ..., description="Ratio de compressao do estado quântico."
    )
    saturation: bool = Field(..., description="Se o regime de saturacao foi alcancado.")
    energy_dissipated: float = Field(..., description="Energia dissipada no processo.")


# ---------------------------------------------------------------------------
# Finance (Quantum Finance)
# ---------------------------------------------------------------------------

class FinanceRequest(BaseModel):
    """Requisicao para simulacao financeira quântica."""

    instrument_type: str = Field(
        ...,
        description="Tipo de instrumento financeiro (european_call, portfolio, risk_analysis).",
        examples=["european_call"],
    )
    params: dict[str, Any] = Field(
        ...,
        description="Parametros especificos do instrumento.",
        examples=[{"spot": 100.0, "strike": 105.0, "volatility": 0.2, "risk_free_rate": 0.05, "expiry": 1.0}],
    )
    n_qubits: int = Field(
        default=4,
        description="Numero de qubits para a codificacao do preco.",
        examples=[4],
    )
    shots: int = Field(
        default=8192,
        description="Numero de shots para a simulacao.",
        examples=[8192],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "instrument_type": "european_call",
                    "params": {
                        "spot": 100.0,
                        "strike": 105.0,
                        "volatility": 0.2,
                        "risk_free_rate": 0.05,
                        "expiry": 1.0,
                    },
                    "n_qubits": 4,
                    "shots": 8192,
                }
            ]
        }
    }


class FinanceResponse(BaseModel):
    """Resposta da simulacao financeira quântica."""

    instrument_type: str = Field(..., description="Tipo de instrumento utilizado.")
    result: dict[str, Any] = Field(
        ..., description="Resultado da simulacao (preco, greeks, risco, etc.)."
    )
    quantum_advantage: float = Field(
        ..., description="Fator de vantagem quântica estimado."
    )
    circuit_depth: int = Field(..., description="Profundidade do circuito quântico utilizado.")
    execution_time_ms: float = Field(..., description="Tempo de execucao em milissegundos.")


# ---------------------------------------------------------------------------
# Plugin System
# ---------------------------------------------------------------------------

class PluginLoadRequest(BaseModel):
    """Requisicao para carregar um plugin Lua."""

    name: str = Field(
        ...,
        description="Nome do plugin a ser carregado.",
        examples=["quantum_filter"],
    )
    version: str = Field(
        default="latest",
        description="Versao do plugin.",
        examples=["1.0.0"],
    )
    sandbox: bool = Field(
        default=True,
        description="Se o plugin deve ser executado em sandbox.",
        examples=[True],
    )

    model_config = {"json_schema_extra": {"examples": [{"name": "quantum_filter", "version": "1.0.0", "sandbox": True}]}}


class PluginExecRequest(BaseModel):
    """Requisicao para executar uma funcao de um plugin."""

    name: str = Field(
        ...,
        description="Nome do plugin carregado.",
        examples=["quantum_filter"],
    )
    function_name: str = Field(
        ...,
        description="Nome da funcao Lua a ser executada.",
        examples=["apply_filter"],
    )
    args: dict[str, Any] = Field(
        default_factory=dict,
        description="Argumentos passados para a funcao.",
        examples=[{"input": "data", "params": {"threshold": 0.5}}],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"name": "quantum_filter", "function_name": "apply_filter", "args": {"input": "data"}}]
        }
    }


class PluginResponse(BaseModel):
    """Resposta generica de operacoes com plugins."""

    name: str = Field(..., description="Nome do plugin.")
    status: str = Field(..., description="Status da operacao (loaded, executed, error, unloaded).")
    output: Any = Field(default=None, description="Saida da funcao executada.")
    execution_time_ms: float = Field(default=0.0, description="Tempo de execucao em milissegundos.")
    error: Optional[str] = Field(default=None, description="Mensagem de erro, se houver.")


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------

class WebSocketMessage(BaseModel):
    """Mensagem generica para comunicacao via WebSocket."""

    type: str = Field(
        ...,
        description="Tipo da mensagem (heartbeat, quantum_state, plugin_event, error).",
        examples=["quantum_state"],
    )
    data: dict[str, Any] = Field(
        default_factory=dict,
        description="Dados da mensagem.",
        examples=[{"state": "|0+1>/sqrt(2)", "fidelity": 0.99}],
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Carimbo de tempo UTC da mensagem.",
    )

    model_config = {"json_schema_extra": {"examples": [{"type": "quantum_state", "data": {"state": "|0+1>/sqrt(2)"}}]}}


# ---------------------------------------------------------------------------
# Database / ORM Models (Pydantic representations)
# ---------------------------------------------------------------------------

class User(BaseModel):
    """Representacao de um usuario do sistema."""

    id: Optional[int] = Field(default=None, description="Identificador unico do usuario.")
    username: str = Field(..., description="Nome de usuario unico.", examples=["void_admin"])
    email: str = Field(..., description="Endereco de email do usuario.", examples=["admin@void.io"])
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Data de criacao.")
    is_active: bool = Field(default=True, description="Se a conta esta ativa.")

    model_config = {"from_attributes": True}


class APIKey(BaseModel):
    """Representacao de uma chave de API."""

    id: Optional[int] = Field(default=None, description="Identificador unico da chave.")
    user_id: int = Field(..., description="ID do usuario proprietario.")
    key_hash: str = Field(..., description="Hash SHA3-256 da chave.")
    name: str = Field(..., description="Nome descritivo da chave.", examples=["producao"])
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Data de criacao.")
    expires_at: Optional[datetime] = Field(default=None, description="Data de expiracao.")
    is_active: bool = Field(default=True, description="Se a chave esta ativa.")

    model_config = {"from_attributes": True}


class PluginLog(BaseModel):
    """Registro de execucao de um plugin."""

    id: Optional[int] = Field(default=None, description="Identificador unico do registro.")
    plugin_name: str = Field(..., description="Nome do plugin executado.")
    function_name: str = Field(..., description="Nome da funcao executada.")
    args_json: str = Field(..., description="Argumentos serializados em JSON.")
    result_json: str = Field(..., description="Resultado serializado em JSON.")
    execution_time: float = Field(..., description="Tempo de execucao em milissegundos.")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Data do registro.")
    success: bool = Field(..., description="Se a execucao foi bem-sucedida.")

    model_config = {"from_attributes": True}


class QuantumOperation(BaseModel):
    """Registro de uma operacao quântica realizada."""

    id: Optional[int] = Field(default=None, description="Identificador unico da operacao.")
    operation_type: str = Field(..., description="Tipo da operacao (bell, bb84, pachner, etc.).")
    params_json: str = Field(..., description="Parametros de entrada serializados em JSON.")
    result_json: str = Field(..., description="Resultado serializado em JSON.")
    execution_time: float = Field(..., description="Tempo de execucao em milissegundos.")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Data do registro.")

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Token
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    """Resposta de autenticacao contendo o token JWT."""

    access_token: str = Field(..., description="Token JWT de acesso.", examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    token_type: str = Field(default="bearer", description="Tipo do token.", examples=["bearer"])
    expires_in: int = Field(default=86400, description="Tempo de validade em segundos.", examples=[86400])

    model_config = {"json_schema_extra": {"examples": [{"access_token": "eyJ...", "token_type": "bearer", "expires_in": 86400}]}}
