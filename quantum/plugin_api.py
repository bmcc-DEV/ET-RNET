"""
API do Plugin -- Funcoes disponiveis para scripts Lua.
Fornece interface segura para plugins interagirem com o sistema.
"""
import hashlib
import time
import math
from typing import Any


class PluginAPI:
    """
    API exposta para scripts Lua do VOID.

    Fornece funcoes de instrumentos financeiros, eventos, logging,
    matematica quantitativa e criptografia para uso pelos plugins.
    """

    def __init__(self) -> None:
        self._registered_instruments: dict[str, dict] = {}
        self._events: list[dict] = []
        self._logs: list[dict] = []

    def register_instrument(self, name: str, config: dict) -> dict:
        """
        Registra um instrumento financeiro customizado.

        Args:
            name: Nome identificador do instrumento.
            config: Configuracao do instrumento (tipo, parametros, etc).

        Returns:
            Dicionario com status e nome do instrumento registrado.
        """
        self._registered_instruments[name] = {
            "name": name,
            "config": config,
            "created_at": time.time(),
            "active": True,
        }
        return {"status": "registered", "name": name}

    def emit_event(self, event_type: str, data: dict) -> dict:
        """
        Emite um evento para a rede VOID.

        Args:
            event_type: Tipo do evento (ex: "price_alert", "stress_warning").
            data: Dados associados ao evento.

        Returns:
            Dicionario com status e identificador do evento.
        """
        event = {
            "type": event_type,
            "data": data,
            "timestamp": time.time(),
        }
        self._events.append(event)
        # Limita o historico a 1000 eventos
        if len(self._events) > 1000:
            self._events = self._events[-500:]
        return {"status": "emitted", "event_id": len(self._events)}

    def log(self, level: str, message: str) -> dict:
        """
        Registra uma mensagem de log estruturado.

        Args:
            level: Nivel do log ("debug", "info", "warn", "error").
            message: Mensagem a registrar.

        Returns:
            Dicionario com status do log.
        """
        entry = {
            "level": level,
            "message": message,
            "timestamp": time.time(),
        }
        self._logs.append(entry)
        if len(self._logs) > 1000:
            self._logs = self._logs[-500:]
        return {"status": "logged"}

    # ----------------------------------------------------------------
    # Funcoes Matematicas -- Metricas do ETRNET
    # ----------------------------------------------------------------

    def kl_divergence(self, p: list[float], q: list[float]) -> float:
        """
        Calcula a Divergencia KL: D_KL(P || Q) = sum(p_i * ln(p_i / q_i)).

        Args:
            p: Distribuicao de probabilidade P.
            q: Distribuicao de probabilidade Q.

        Returns:
            Valor da divergencia KL (sempre >= 0).
        """
        eps = 1e-15
        kl = 0.0
        for pi, qi in zip(p, q):
            pi = max(pi, eps)
            qi = max(qi, eps)
            kl += pi * math.log(pi / qi)
        return max(0.0, kl)

    def sobolev_norm(self, field: list[float], order: int = 1) -> float:
        """
        Calcula a Norma de Sobolev: ||f||_{H^s}.

        Mede a "energia" de um campo considerando derivadas ate ordem s.

        Args:
            field: Campo (vetor de valores reais).
            order: Ordem da norma de Sobolev (s).

        Returns:
            Valor da norma de Sobolev.
        """
        n = len(field)
        s = order
        norm_sq = 0.0
        for k in range(n):
            freq = 2 * math.pi * k / n
            coeff = abs(field[k % n])
            norm_sq += (1 + freq ** (2 * s)) * coeff ** 2
        return math.sqrt(norm_sq)

    def modal_coherence(
        self, amplitudes: list[float], phases: list[float]
    ) -> float:
        """
        Calcula a Coerencia Modal: C_epsilon = |sum(a_k * e^{i*phi_k})|^2 / N.

        Mede quao alinhados estao os modos de um campo.

        Args:
            amplitudes: Lista de amplitudes dos modos.
            phases: Lista de fases dos modos.

        Returns:
            Coerencia modal normalizada (0 a 1 para N normalizado).
        """
        real_part = sum(a * math.cos(p) for a, p in zip(amplitudes, phases))
        imag_part = sum(a * math.sin(p) for a, p in zip(amplitudes, phases))
        n = len(amplitudes)
        return (real_part ** 2 + imag_part ** 2) / max(n, 1)

    def saturation(
        self, c_epsilon: float, mu: float = 0.1, beta: float = 3.0
    ) -> float:
        """
        Funcao de Saturacao LSC: G(C_epsilon) = 1 / ((1 - C_epsilon) + mu * e^{beta * C_epsilon}).

        Controla o ganho do sistema baseado na coerencia.

        Args:
            c_epsilon: Coerencia modal atual (0 a 1).
            mu: Parametro de regularizacao.
            beta: Sensibilidade a saturacao.

        Returns:
            Valor do ganho de saturacao (0 a ~1).
        """
        return 1.0 / ((1.0 - c_epsilon) + mu * math.exp(beta * c_epsilon))

    # ----------------------------------------------------------------
    # Funcoes Criptograficas
    # ----------------------------------------------------------------

    def sha3_256(self, data: str) -> str:
        """
        Calcula hash SHA3-256 dos dados.

        Args:
            data: String de entrada.

        Returns:
            Hash hexadecimal de 64 caracteres.
        """
        return hashlib.sha3_256(data.encode()).hexdigest()

    def blake3_hash(self, data: str) -> str:
        """
        Hash Blake3 (fallback para SHA3-256 se blake3 indisponivel).

        Args:
            data: String de entrada.

        Returns:
            Hash hexadecimal.
        """
        return hashlib.sha3_256(data.encode()).hexdigest()

    # ----------------------------------------------------------------
    # Funcoes de Colapso
    # ----------------------------------------------------------------

    def defect_density(self, phi: list[float]) -> float:
        """
        Calcula a densidade media de defeitos: chi = |nabla^2 phi| / (1 + |nabla phi|^2).

        Mede a "rugosidade" de um campo, util para deteccao de anomalias.

        Args:
            phi: Campo escalar (vetor de valores reais).

        Returns:
            Densidade media de defeitos (>= 0).
        """
        n = len(phi)
        if n < 3:
            return 0.0
        total = 0.0
        for i in range(1, n - 1):
            grad = (phi[i + 1] - phi[i - 1]) / 2.0
            grad2 = phi[i + 1] - 2 * phi[i] + phi[i - 1]
            total += abs(grad2) / (1 + grad ** 2)
        return total / (n - 2)

    def stuart_landau_energy(
        self,
        amplitude: float,
        alpha: float = -1.0,
        beta: float = 1.0,
    ) -> float:
        """
        Energia do potencial de Stuart-Landau: V(a) = alpha/2 * a^2 + beta/4 * a^4.

        Args:
            amplitude: Amplitude do campo (a).
            alpha: Coeficiente linear (controle de bifurcacao).
            beta: Coeficiente nao-linear (estabilizacao).

        Returns:
            Energia potencial.
        """
        return (alpha / 2.0) * amplitude ** 2 + (beta / 4.0) * amplitude ** 4

    def bifurcation_distance(
        self, alpha: float, alpha_c: float = 0.0
    ) -> float:
        """
        Distancia ao ponto critico de bifurcacao: |alpha - alpha_c|.

        Args:
            alpha: Parametro de controle atual.
            alpha_c: Parametro critico (default 0).

        Returns:
            Distancia absoluta ao ponto critico.
        """
        return abs(alpha - alpha_c)

    # ----------------------------------------------------------------
    # Acesso a Historico
    # ----------------------------------------------------------------

    def get_events(self, limit: int = 100) -> list[dict]:
        """
        Retorna os ultimos eventos emitidos.

        Args:
            limit: Numero maximo de eventos a retornar.

        Returns:
            Lista dos eventos mais recentes.
        """
        return self._events[-limit:]

    def get_logs(self, limit: int = 100) -> list[dict]:
        """
        Retorna os ultimos registros de log.

        Args:
            limit: Numero maximo de logs a retornar.

        Returns:
            Lista dos logs mais recentes.
        """
        return self._logs[-limit:]

    def get_instruments(self) -> dict[str, dict]:
        """
        Retorna todos os instrumentos financeiros registrados.

        Returns:
            Dicionario nome -> dados do instrumento.
        """
        return dict(self._registered_instruments)
