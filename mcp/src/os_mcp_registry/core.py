"""Local, single-writer OS MCP integration registry. No secrets or remote operations."""
from __future__ import annotations

import json
import os
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

IDENTIFIER = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$")
STATUSES = {"planned", "configured", "verified", "disabled"}
ADAPTERS = {"mcp", "native_connector", "http_service", "planned_adapter"}
TRANSPORTS = {"stdio", "streamable-http", "sse", "http", "native", "undetermined"}
PERMISSIONS = {"read-only", "approval-required"}


def default_db() -> Path:
    return Path(os.environ.get("OS_MCP_DB", str(Path.home() / ".local/share/shivanshos/mcp-registry/registry.sqlite3"))).expanduser()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _check_id(value: str) -> None:
    if not isinstance(value, str) or not IDENTIFIER.fullmatch(value) or len(value) > 80:
        raise ValueError("invalid registry id")


def _check_entry(entry: dict) -> None:
    _check_id(entry.get("id"))
    if not isinstance(entry.get("name"), str) or not entry["name"].strip():
        raise ValueError("name required")
    if entry.get("status") not in STATUSES or entry.get("adapter") not in ADAPTERS:
        raise ValueError("invalid status or adapter")
    if entry.get("transport") not in TRANSPORTS or entry.get("permission") not in PERMISSIONS:
        raise ValueError("invalid transport or permission")
    if not isinstance(entry.get("capabilities"), list) or not all(isinstance(c, str) for c in entry["capabilities"]):
        raise ValueError("capabilities must be string array")
    # Credentials are never accepted as catalog fields. Auth refs are opaque external aliases.
    forbidden = {"token", "password", "secret", "api_key", "private_key", "credential"}
    if forbidden.intersection(entry):
        raise ValueError("secret-bearing field forbidden")
    if entry.get("endpoint") and ("@" in entry["endpoint"] or "?" in entry["endpoint"] or "#" in entry["endpoint"]):
        raise ValueError("endpoints must not embed credentials, query strings or fragments")


@contextmanager
def connect(db: Path | None = None, *, write: bool = False):
    p = Path(db or default_db())
    if write:
        p.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        con = sqlite3.connect(p, timeout=8)
        con.execute("PRAGMA busy_timeout=8000")
        con.execute("PRAGMA foreign_keys=ON")
    else:
        if not p.is_file():
            raise FileNotFoundError(f"Registry missing: {p}; run 'os-mcp-registry init'")
        con = sqlite3.connect(f"file:{p.resolve()}?mode=ro", uri=True, timeout=8)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()


def init(db: Path | None = None) -> None:
    with connect(db, write=True) as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
          adapter TEXT NOT NULL, host TEXT NOT NULL, transport TEXT NOT NULL,
          endpoint TEXT, auth_ref TEXT, status TEXT NOT NULL, permission TEXT NOT NULL,
          capabilities TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
          revision INTEGER NOT NULL DEFAULT 1, verified_at TEXT, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS collection_members (
          collection_id TEXT NOT NULL REFERENCES collections(id),
          integration_id TEXT NOT NULL REFERENCES integrations(id),
          PRIMARY KEY (collection_id, integration_id)
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
          kind TEXT NOT NULL, target TEXT NOT NULL, revision INTEGER,
          detail_json TEXT NOT NULL
        );
        """)
        c.commit()
    try:
        Path(db or default_db()).chmod(0o600)
    except OSError:
        pass


def _log(c: sqlite3.Connection, kind: str, target: str, revision: int | None, detail: dict) -> None:
    c.execute("INSERT INTO events(at,kind,target,revision,detail_json) VALUES(?,?,?,?,?)",
              (_now(), kind, target, revision, json.dumps(detail, sort_keys=True)))


def seed(path: Path, db: Path | None = None) -> dict:
    data = json.loads(Path(path).read_text())
    if data.get("schema_version") != "1.0":
        raise ValueError("unsupported seed schema")
    entries, groups = data["integrations"], data["collections"]
    if len({i["id"] for i in entries}) != len(entries):
        raise ValueError("duplicate integration IDs")
    for entry in entries:
        _check_entry(entry)
    for group in groups:
        _check_id(group["id"])
        if not set(group["members"]).issubset({i["id"] for i in entries}):
            raise ValueError("collection references missing integration")
    init(db)
    added = 0
    with connect(db, write=True) as c:
        c.execute("BEGIN IMMEDIATE")
        for entry in entries:
            row = c.execute("SELECT id FROM integrations WHERE id=?", (entry["id"],)).fetchone()
            if row:
                continue  # seed is deliberately non-destructive
            _insert(c, entry)
            _log(c, "seed", entry["id"], 1, {"source": "catalog/seed.json"})
            added += 1
        for group in groups:
            c.execute("INSERT OR IGNORE INTO collections(id,name,description) VALUES(?,?,?)",
                      (group["id"], group["name"], group["description"]))
            for member in group["members"]:
                c.execute("INSERT OR IGNORE INTO collection_members(collection_id,integration_id) VALUES(?,?)",
                          (group["id"], member))
        c.commit()
    return {"added": added, "total": len(entries), "collections": len(groups)}


def _insert(c: sqlite3.Connection, e: dict) -> None:
    c.execute("""INSERT INTO integrations
      (id,name,category,adapter,host,transport,endpoint,auth_ref,status,permission,capabilities,notes,revision,verified_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
      (e["id"],e["name"],e.get("category","other"),e["adapter"],e.get("host","undetermined"),
       e["transport"],e.get("endpoint"),e.get("auth_ref"),e["status"],e["permission"],
       json.dumps(e["capabilities"]),e.get("notes",""),1, e.get("verified_at"),_now()))


def register(entry: dict, db: Path | None = None) -> dict:
    _check_entry(entry)
    init(db)
    with connect(db, write=True) as c:
        c.execute("BEGIN IMMEDIATE")
        if c.execute("SELECT 1 FROM integrations WHERE id=?", (entry["id"],)).fetchone():
            raise ValueError("id exists; changes require update --expect-revision")
        _insert(c, entry)
        _log(c,"register",entry["id"],1,{"status":entry["status"]})
        c.commit()
    return inspect(entry["id"], db)


def set_status(id: str, status: str, expected_revision: int, db: Path | None = None, *, evidence: str = "") -> dict:
    _check_id(id)
    if status not in STATUSES:
        raise ValueError("invalid status")
    if status == "verified" and not evidence.strip():
        raise ValueError("verification evidence is required")
    with connect(db, write=True) as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute("SELECT revision FROM integrations WHERE id=?", (id,)).fetchone()
        if row is None:
            raise KeyError(id)
        if row["revision"] != expected_revision:
            raise ValueError(f"revision conflict: expected {expected_revision}, actual {row['revision']}")
        revision = expected_revision + 1
        c.execute("UPDATE integrations SET status=?,revision=?,verified_at=?,updated_at=? WHERE id=?",
                  (status,revision,_now() if status=="verified" else None,_now(),id))
        _log(c,"set_status",id,revision,{"status":status,"evidence":evidence[:1000]})
        c.commit()
    return inspect(id, db)


def attach(collection_id: str, integration_id: str, db: Path | None = None) -> dict:
    """Add one existing integration to a collection; never implicitly enables it."""
    _check_id(collection_id)
    _check_id(integration_id)
    with connect(db, write=True) as c:
        c.execute("BEGIN IMMEDIATE")
        if not c.execute("SELECT 1 FROM collections WHERE id=?", (collection_id,)).fetchone():
            raise KeyError(collection_id)
        if not c.execute("SELECT 1 FROM integrations WHERE id=?", (integration_id,)).fetchone():
            raise KeyError(integration_id)
        cur = c.execute("INSERT OR IGNORE INTO collection_members(collection_id,integration_id) VALUES(?,?)",
                        (collection_id, integration_id))
        if cur.rowcount:
            _log(c,"attach",integration_id,None,{"collection":collection_id})
        c.commit()
    return collection(collection_id, db)


def _decode(row: sqlite3.Row) -> dict:
    r = dict(row)
    r["capabilities"] = json.loads(r["capabilities"])
    return r


def inspect(id: str, db: Path | None = None) -> dict:
    _check_id(id)
    with connect(db) as c:
        row = c.execute("SELECT * FROM integrations WHERE id=?", (id,)).fetchone()
    if row is None:
        raise KeyError(id)
    return _decode(row)


def list_integrations(db: Path | None = None, *, term: str = "", status: str = "") -> list[dict]:
    if status and status not in STATUSES:
        raise ValueError("invalid status")
    with connect(db) as c:
        rows = c.execute("SELECT * FROM integrations ORDER BY id").fetchall()
    result = [_decode(r) for r in rows]
    if status:
        result = [r for r in result if r["status"] == status]
    if term:
        term = term.casefold()[:150]
        result = [r for r in result if term in (r["id"] + " " + r["name"] + " " +
                  r["category"] + " " + " ".join(r["capabilities"])).casefold()]
    return result


def collections(db: Path | None = None) -> list[dict]:
    with connect(db) as c:
        groups = c.execute("SELECT * FROM collections ORDER BY id").fetchall()
        entries = c.execute("SELECT collection_id,integration_id FROM collection_members ORDER BY integration_id").fetchall()
    return [{**dict(g), "members": [r["integration_id"] for r in entries if r["collection_id"]==g["id"]]}
            for g in groups]


def collection(id: str, db: Path | None = None) -> dict:
    _check_id(id)
    group = next((g for g in collections(db) if g["id"]==id),None)
    if group is None:
        raise KeyError(id)
    group["integrations"] = [inspect(i, db) for i in group["members"]]
    return group


def export_index(db: Path | None = None) -> dict:
    return {"schema_version":"1.0","workspace":"os","integrations":list_integrations(db),
            "collections":collections(db),"exported_at":_now(),
            "warning":"Snapshot only. Listed connectors/services are not verified as MCP endpoints."}
