"""
VØID Quantum Server — HTTP API para CQR Engine + BB84
FastAPI server que expõe operações quânticas reais
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cqr_engine import CQREngine
from bb84 import BB84Protocol
import time

app = FastAPI(title="VØID Quantum API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = CQREngine(n_qubits=4)
bb84 = BB84Protocol(key_length=256)


@app.get("/health")
async def health():
    """Status do servidor quântico."""
    return {
        "status": "operational",
        "engine": engine.health(),
        "timestamp": time.time()
    }


@app.get("/quantum/entropy")
async def generate_entropy(bits: int = 256):
    """Gera entropia quântica via medições de Bell states."""
    return engine.generate_quantum_entropy(bits)


@app.get("/quantum/bell/{bell_type}")
async def create_bell_pair(bell_type: str = "phi_plus"):
    """Cria par entrelaçado e mede propriedades."""
    return engine.create_entangled_pair(bell_type)


@app.get("/quantum/bell/all")
async def measure_all_bells():
    """Mede todos os 4 estados de Bell."""
    return engine.measure_all_bell_states()


@app.get("/quantum/pachner")
async def pachner_move(network_id: str = "initial", move_type: str = "2-3"):
    """Move de Pachner — transformação topológica."""
    return engine.pachner_move(network_id, move_type)


@app.get("/quantum/bb84")
async def run_bb84(key_length: int = 256, intercept: bool = False):
    """
    Executa protocolo BB84 completo.
    intercept=True simula ataque de Eve.
    """
    bb84_instance = BB84Protocol(key_length=key_length)
    return bb84_instance.run_full_protocol(intercept=intercept)


@app.get("/quantum/bb84/compare")
async def compare_bb84():
    """Compara BB84 com e sem Eve."""
    return {
        "no_eve": bb84.run_full_protocol(intercept=False),
        "with_eve": bb84.run_full_protocol(intercept=True)
    }


@app.get("/quantum/spin")
async def spin_network_operation(n_qubits: int = 4):
    """Executa operação na rede de spin."""
    net = engine.spin_network_operation(n_qubits)
    return net


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8472)
