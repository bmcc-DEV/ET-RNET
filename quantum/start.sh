#!/usr/bin/env bash
# VØID Quantum — Serviço local
# Roda o engine quântico em localhost:8472

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null

echo "VØID Quantum — http://localhost:8472"
python server.py
