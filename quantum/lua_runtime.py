"""
VØID Lua Runtime — Plugins locais

Executa scripts Lua via subprocess. Cada nó roda seus próprios plugins.
Sem servidor central. Sem autenticação.

Filosofia: "O VOID não existe. O Hydra não existe. Nós existimos."
"""
import subprocess
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any


class LuaRuntime:
    """Runtime Lua leve para plugins locais."""

    def __init__(self, plugins_dir: str | Path = "./plugins", timeout: float = 5.0):
        self.plugins_dir = Path(plugins_dir)
        self.timeout = timeout
        self._plugins: dict[str, dict] = {}
        self.plugins_dir.mkdir(parents=True, exist_ok=True)

    def load_plugin(self, name: str, path: str | None = None) -> dict:
        """Carrega um plugin Lua."""
        path = path or str(self.plugins_dir / f"{name}.lua")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Plugin não encontrado: {path}")

        self._plugins[name] = {
            "path": path,
            "loaded_at": time.time(),
            "executions": 0,
            "errors": 0,
        }
        return self._plugins[name]

    def execute(self, name: str, function: str, args: dict[str, Any] = None) -> dict:
        """Executa uma função Lua no plugin."""
        if name not in self._plugins:
            return {"error": f"Plugin '{name}' não carregado"}

        plugin = self._plugins[name]
        args = args or {}

        lua_code = f"""
-- VØID Lua Runtime
local args = {json.dumps(args)}

-- Carregar plugin
dofile("{plugin['path']}")

-- Executar
local ok, result = pcall({function}, args)
if ok then
    if type(result) == "table" then
        local parts = {{}}
        for k, v in pairs(result) do
            local val
            if type(v) == "string" then val = '"' .. v .. '"'
            elseif type(v) == "boolean" then val = v and "true" or "false"
            elseif type(v) == "table" then val = "null"
            else val = tostring(v) end
            table.insert(parts, '"' .. k .. '": ' .. val)
        end
        print("{{" .. table.concat(parts, ", ") .. "}}")
    else
        print(tostring(result))
    end
else
    io.stderr:write("ERRO: " .. tostring(result))
    os.exit(1)
end
"""
        start = time.time()
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".lua", delete=False) as f:
                f.write(lua_code)
                tmp = f.name

            result = subprocess.run(
                ["lua", tmp],
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )
            elapsed = time.time() - start
            plugin["executions"] += 1

            if result.returncode != 0:
                plugin["errors"] += 1
                return {"error": result.stderr.strip(), "time": elapsed}

            output = result.stdout.strip()
            try:
                return {"result": json.loads(output), "time": elapsed}
            except json.JSONDecodeError:
                return {"result": output, "time": elapsed}

        except subprocess.TimeoutExpired:
            return {"error": f"Timeout ({self.timeout}s)"}
        except FileNotFoundError:
            return {"error": "Lua não encontrado. Instale: sudo pacman -S lua"}
        finally:
            os.unlink(tmp)

    def list_plugins(self) -> list[dict]:
        return [
            {"name": k, "path": v["path"], "executions": v["executions"], "errors": v["errors"]}
            for k, v in self._plugins.items()
        ]

    def unload(self, name: str) -> bool:
        return self._plugins.pop(name, None) is not None
