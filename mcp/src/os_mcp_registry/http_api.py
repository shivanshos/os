"""Optional loopback-only, read-only JSON index for the local dashboard."""
from __future__ import annotations
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from . import core

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path=urlsplit(self.path).path
        try:
            if path == "/health":
                data={"service":"os-mcp-registry","status":"ok","registry":"available"}
                core.list_integrations()
            elif path == "/v1/integrations": data=core.list_integrations()
            elif path == "/v1/collections": data=core.collections()
            elif path == "/v1/index": data=core.export_index()
            else:
                self.send_error(404);return
        except (OSError,ValueError) as exc:
            self.send_error(503,"registry unavailable");return
        payload=json.dumps(data,sort_keys=True).encode()
        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.send_header("Cache-Control","no-store")
        self.send_header("Content-Length",str(len(payload)))
        self.send_header("X-Content-Type-Options","nosniff")
        self.end_headers();self.wfile.write(payload)
    def do_POST(self): self.send_error(405)
    def do_PUT(self): self.send_error(405)
    def do_DELETE(self): self.send_error(405)


def main():
    # Intentionally no option to bind arbitrary host: this is private metadata.
    host="127.0.0.1"
    port=int(os.environ.get("OS_MCP_HTTP_PORT","8766"))
    if not 1024 <= port <= 65535:
        raise ValueError("invalid OS_MCP_HTTP_PORT")
    ThreadingHTTPServer((host,port),Handler).serve_forever()

if __name__=="__main__": main()
