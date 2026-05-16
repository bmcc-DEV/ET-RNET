#!/usr/bin/env bash
# VØID ETRNET — Setup
# Um comando para configurar tudo.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "VØID ETRNET — Setup"
echo ""

# ─── Verificar dependências ──────────────────────────────────────────────────

check() {
    if ! command -v "$1" &>/dev/null; then
        echo "✗ $1 não encontrado"
        echo "  Instale: $2"
        exit 1
    fi
    echo "✓ $1"
}

echo "Verificando dependências..."
check node "https://nodejs.org"
check npm "vem com node"
check python3 "sudo pacman -S python"
check lua "sudo pacman -S lua"  # opcional, para plugins

# ─── Frontend ────────────────────────────────────────────────────────────────

echo ""
echo "Instalando dependências do frontend..."
npm install

# ─── Backend quântico (local) ───────────────────────────────────────────────

echo ""
echo "Configurando serviço quântico local..."
cd quantum

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt
cd ..

# ─── Plugins Lua ─────────────────────────────────────────────────────────────

echo ""
echo "Plugins Lua disponíveis:"
ls -1 quantum/plugins/*.lua 2>/dev/null | while read f; do
    echo "  → $(basename "$f" .lua)"
done

# ─── Pronto ──────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Setup completo!"
echo ""
echo "  Frontend:    npm run dev"
echo "  Quantum:     cd quantum && source .venv/bin/activate && python server.py"
echo "  Android:     npx cap open android"
echo "═══════════════════════════════════════════════════"
