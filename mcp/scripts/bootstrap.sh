#!/usr/bin/env bash
# Explicit, non-destructive install on Spectre. Does not enable existing services or remote access.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
command -v python3 >/dev/null || { echo 'Python 3.11+ required' >&2; exit 2; }
python3 -c 'import sys; assert sys.version_info >= (3,11), "Python 3.11+ required"'
python3 -m venv .venv
.venv/bin/python -m pip install --disable-pip-version-check -e .
DB="${OS_MCP_DB:-$HOME/.local/share/shivanshos/mcp-registry/registry.sqlite3}"
export OS_MCP_DB="$DB"
.venv/bin/os-mcp-registry init --seed catalog/seed.json
.venv/bin/os-mcp-registry collections
cat <<MSG
Local OS MCP registry installed (no existing services changed).
Database: $DB
MCP stdio command: $(pwd)/.venv/bin/os-mcp-server
Optional local-only HTTP: $(pwd)/.venv/bin/os-mcp-http
Health (after starting HTTP): curl http://127.0.0.1:8766/health
MCP client JSON: see examples/client.example.json (replace paths)
Do not expose the HTTP endpoint to public networks or inject tokens into the catalog.
MSG
