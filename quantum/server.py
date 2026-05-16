"""
VØID Quantum Server — Serviço Local

Rodlocalmente (localhost:8472). Sem auth, sem banco, sem rate limit.
O frontend consome via quantumBridge.ts. Cada nó roda seu próprio servidor.

Filosofia: "Sem entidade, sem copyright, sem permissão necessária."
"""
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Adiciona o diretório quantum ao path para imports diretos
sys.path.insert(0, str(Path(__file__).parent))

from cqr_engine import CQREngine
from bb84 import BB84Protocol

app = FastAPI(title="VØID Quantum", version="2.0.0")

# CORS aberto — é local, não há rede externa
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engines — uma instância por nó
engine = CQREngine(n_qubits=4)
bb84 = BB84Protocol(key_length=256)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "engine": engine.health()}


# ─── Entropia Quântica ──────────────────────────────────────────────────────

@app.get("/quantum/entropy")
async def entropy(bits: int = 256):
    return engine.generate_quantum_entropy(bits)


# ─── Bell States ─────────────────────────────────────────────────────────────

@app.get("/quantum/bell/{bell_type}")
async def bell(bell_type: str = "phi_plus"):
    return engine.create_entangled_pair(bell_type)


@app.get("/quantum/bell/all")
async def bell_all():
    return engine.measure_all_bell_states()


# ─── Pachner ─────────────────────────────────────────────────────────────────

@app.get("/quantum/pachner")
async def pachner(network_id: str = "initial", move_type: str = "2-3"):
    return engine.pachner_move(network_id, move_type)


# ─── BB84 ────────────────────────────────────────────────────────────────────

@app.get("/quantum/bb84")
async def bb84_run(key_length: int = 256, intercept: bool = False):
    return BB84Protocol(key_length=key_length).run_full_protocol(intercept=intercept)


@app.get("/quantum/bb84/compare")
async def bb84_compare(key_length: int = 256):
    clean = BB84Protocol(key_length=key_length).run_full_protocol(intercept=False)
    eve = BB84Protocol(key_length=key_length).run_full_protocol(intercept=True)
    return {"without_eve": clean, "with_eve": eve}


# ─── Spin Networks ───────────────────────────────────────────────────────────

@app.get("/quantum/spin")
async def spin(n_qubits: int = 3):
    from spin_networks import create_spin_network
    j_values = [0.5] * n_qubits
    network = create_spin_network(j_values)
    return {
        "nodes": len(network.nodes),
        "edges": len(network.edges),
        "spins": [n.spin for n in network.nodes],
    }


# ─── Plugins Lua (execução local) ───────────────────────────────────────────

_plugins: dict = {}

@app.post("/plugins/load")
async def load_plugin(name: str, path: str):
    from lua_runtime import LuaRuntime
    runtime = LuaRuntime()
    plugin = runtime.load_plugin(name, path)
    _plugins[name] = {"runtime": runtime, "plugin": plugin}
    return {"status": "loaded", "name": name}

@app.post("/plugins/exec")
async def exec_plugin(name: str, function: str, args: dict = {}):
    if name not in _plugins:
        return {"error": f"Plugin '{name}' não carregado"}
    runtime = _plugins[name]["runtime"]
    return runtime.execute_plugin(name, function, args)

@app.get("/plugins/list")
async def list_plugins():
    return {"plugins": list(_plugins.keys())}


# ─── Collapse (cálculo local) ────────────────────────────────────────────────

@app.post("/collapse/accumulate")
async def collapse_accumulate(phi: list[float], amount: float = 0.1):
    """Operador â — acumula estresse."""
    import math
    n = len(phi)
    result = list(phi)
    for i in range(n):
        perturbation = math.sqrt(amount + 1) * (hash(f"{i}{amount}") % 1000 / 1000 - 0.5) * 0.1
        result[i] += perturbation
    return {"phi": result, "amount": amount}

@app.post("/collapse/kl-divergence")
async def collapse_kl(p: list[float], q: list[float]):
    """Divergência KL entre distribuições forward/backward."""
    eps = 1e-15
    kl = 0.0
    for pi, qi in zip(p, q):
        pi = max(abs(pi), eps)
        qi = max(abs(qi), eps)
        kl += pi * (math.log(pi) - math.log(qi))
    return {"kl_divergence": max(0.0, kl)}


# ─── LSC (cálculo local) ────────────────────────────────────────────────────

@app.post("/lsc/saturation")
async def lsc_saturation(c_epsilon: float, mu: float = 0.1, beta: float = 3.0):
    """G(C_ε) = 1/((1-C_ε) + μe^{βC_ε})"""
    import math
    g = 1.0 / ((1.0 - c_epsilon) + mu * math.exp(beta * c_epsilon))
    return {"C_epsilon": c_epsilon, "G": g}

@app.post("/lsc/rigidity")
async def lsc_rigidity(c_epsilon: float, k0: float = 1.0, r_thermal: float = 0.01):
    """K_eff = K_0(1-C_ε) + R_thermal"""
    k_eff = k0 * (1.0 - c_epsilon) + r_thermal
    return {"C_epsilon": c_epsilon, "K_eff": k_eff}


# ─── Iniciar ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("VØID Quantum — http://localhost:8472")
    uvicorn.run(app, host="127.0.0.1", port=8472)
