# OS MCP Registry & Collections (phase 1)

A real, local catalog service for **ShivanshOS**, backed by SQLite and exposed to MCP-compatible desktop agents. This is intentionally narrower than the proposed OS Workspace Core: it inventories integration adapters and collections, but does not pretend to authorize a provider, launch a connector, control a device, or synchronize chat histories.

## What ships

- Versioned integration catalog: 16 entries across Spectre, HPC and cloud (all seeded as `planned`, not assumed to be connected).
- Six curated collections: `os-core`, `knowledge`, `development`, `automation`, `design`, `systems`.
- SQLite single-writer CLI (`os-mcp-registry`) with idempotent seed, integration registration, curated collection membership, revision-checked status updates and append-only events.
- Local read-only MCP **stdio** server (`os-mcp-server`), with five tools and one `os://registry/collections` resource, built on the official MCP Python SDK v2.
- Optional local-only read-only JSON API (`os-mcp-http`), port 8766, for a future local dashboard.

The registry separates `mcp`, `native_connector`, `http_service` and `planned_adapter`. Catalog membership is **not** evidence that a tool is running or that an account is connected. Registry is discovery, **not** a dynamic gateway, credential vault, execution engine or full Workspace Core.

## Install on Spectre

Prerequisite: Python 3.11+, `python3-venv` and package access for `pip`. **No Docker socket or root privileges** are required. Execute from the checked-out OS repository.

```bash
cd "$HOME/OS/mcp"  # adjust if repository is checked out elsewhere
bash scripts/bootstrap.sh
.venv/bin/os-mcp-registry inspect os.registry
.venv/bin/os-mcp-registry collections
```

Runtime DB: `$HOME/.local/share/shivanshos/mcp-registry/registry.sqlite3`, mode 0600. Do not store the database in Git or a Drive-synced directory. Seed is additive; it never overwrites an existing adapter's state.

For CLI examples:

```bash
.venv/bin/os-mcp-registry list
.venv/bin/os-mcp-registry inspect os.registry
.venv/bin/os-mcp-registry set-status os.registry configured --expect-revision 1
# After a real, logged MCP client tools/list check:
.venv/bin/os-mcp-registry set-status os.registry verified --expect-revision 2 --evidence 'MCP Inspector: tools/list succeeded on 2026-10-21'
.venv/bin/os-mcp-registry export-index --output /tmp/os-mcp-index.json
```

Do not mark anything verified without actual evidence. Commands above illustrate progression; the latter two **mutate** the registry and should only be run after verification.

## Use from an MCP client

Copy the adapter configuration from [`examples/client.example.json`](examples/client.example.json), replacing the username with the actual host path. Depending on the client's syntax this may need adaptation. The MCP process is started on demand by the client and reads the already-created database; it does not need the HTTP server.

Available tools: `list_os_integrations`, `get_os_integration`, `list_os_collections`, `get_os_collection`, `get_os_registry_summary`. No write or arbitrary shell-execution tools are exposed.

Optional dashboard reader (after install):

```bash
OS_MCP_HTTP_PORT=8766 .venv/bin/os-mcp-http
# In a second terminal:
curl -fsS http://127.0.0.1:8766/health
curl -fsS http://127.0.0.1:8766/v1/collections
```

**Keep on localhost.** HTTP is unauthenticated and exposes integration inventory. Do not configure a reverse proxy, public DNS route, port-forwarding, Tailscale Funnel or cloud exposure. An authenticated remote gateway is a separate security milestone.

## Verification

```bash
cd "$HOME/OS/mcp"
PYTHONPATH=src python3 -m unittest discover -s tests -v
python3 -m compileall -q src
.venv/bin/os-mcp-registry list
# Run a compatible MCP client/Inspector and confirm tools/list and tool call.
```

Tests validate idempotent seed, revision conflicts, denylisted credential fields, collection membership and read-only missing-DB behavior. These are not a replacement for a live Spectre health check and client handshake.

## Boundaries & next stage

1. Confirm registry's working local MCP tools on Spectre and mark `os.registry` verified.
2. Validate provider-side native connectors individually. Keep provider credentials in their own secret store; attach only scoped references and observed capabilities.
3. Add explicit, authenticated OS Workspace Core operations (registry assets, revisions, file tagging, verified save receipts and handoff records), sharing one authorization and persistence service.
4. Optionally bring up Docker MCP Gateway with curated OCI servers and controlled profiles **after** checking Docker socket privileges and current gateway flags. Docker's catalog and profiles are separate concepts from this OS metadata registry. No automatically enabled executable collection is included in this phase.
5. If a future dashboard needs the catalog, provide it via the loopback HTTP reader or an authenticated proxy instead of publishing registry contents.

This project does **not** modify existing HPC Docker stacks, GitHub OAuth app grants, Drive folders, OS services, DNS or the Framer dashboard.

## References

- https://py.sdk.modelcontextprotocol.io/run/
- https://docs.docker.com/ai/mcp-catalog-and-toolkit/mcp-gateway/
- https://github.com/modelcontextprotocol/registry
