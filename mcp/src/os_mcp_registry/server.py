"""Read-only MCP adapter for the OS integration registry; no execution tools."""
from __future__ import annotations
import json
from . import core


def build_server():
    # MCP Python SDK 2.x: public, official API.
    from mcp.server import MCPServer
    app = MCPServer("ShivanshOS Registry")

    @app.tool()
    def list_os_integrations(query: str = "", status: str = "") -> list[dict]:
        """Discover registered adapters; 'planned' is NOT connected or deployable."""
        return core.list_integrations(term=query, status=status)

    @app.tool()
    def get_os_integration(integration_id: str) -> dict:
        """Inspect an integration's host, type, capabilities, state, and evidence timestamp."""
        return core.inspect(integration_id)

    @app.tool()
    def list_os_collections() -> list[dict]:
        """List named collections and their registered member IDs."""
        return core.collections()

    @app.tool()
    def get_os_collection(collection_id: str) -> dict:
        """Inspect collection members; planned adapters are not live MCP tools."""
        return core.collection(collection_id)

    @app.tool()
    def get_os_registry_summary() -> dict:
        """Get observed registry states, not inferred network health."""
        entries = core.list_integrations()
        return {"total":len(entries),"by_status":{s:sum(x["status"]==s for x in entries)
                for s in sorted(core.STATUSES)},"collections":len(core.collections()),
                "message":"Registry membership does not imply connector authentication or service health."}

    @app.resource("os://registry/collections")
    def os_collections_resource() -> str:
        """Read-only collection manifest."""
        return json.dumps(core.collections(),sort_keys=True)

    return app


def main() -> None:
    build_server().run(transport="stdio")


if __name__ == "__main__":
    main()
