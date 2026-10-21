"""Controlled local writer; MCP tools and HTTP export remain read-only."""
import argparse
import json
import sqlite3
import sys
from pathlib import Path
from . import core


def main() -> None:
    p = argparse.ArgumentParser(prog="os-mcp-registry")
    p.add_argument("--db", type=Path, default=None, help="Local SQLite path, never a Drive-synced directory")
    sub = p.add_subparsers(dest="action", required=True)
    init = sub.add_parser("init", help="Create tables, optionally seed catalog without overwriting")
    init.add_argument("--seed", type=Path)
    sub.add_parser("list", help="List the registry")
    one = sub.add_parser("inspect"); one.add_argument("id")
    sub.add_parser("collections")
    group = sub.add_parser("collection"); group.add_argument("id")
    attach = sub.add_parser("attach", help="Add an existing integration to a collection")
    attach.add_argument("collection_id"); attach.add_argument("integration_id")
    add = sub.add_parser("register", help="Register integration from validated JSON")
    add.add_argument("file", type=Path)
    change = sub.add_parser("set-status", help="Optimistic revision-checked state change")
    change.add_argument("id"); change.add_argument("status", choices=sorted(core.STATUSES))
    change.add_argument("--expect-revision", type=int, required=True)
    change.add_argument("--evidence", default="")
    out = sub.add_parser("export-index"); out.add_argument("--output", type=Path)
    args = p.parse_args()
    try:
        if args.action == "init":
            core.init(args.db)
            result = core.seed(args.seed,args.db) if args.seed else {"initialized":True}
        elif args.action == "list": result = core.list_integrations(args.db)
        elif args.action == "inspect": result = core.inspect(args.id,args.db)
        elif args.action == "collections": result = core.collections(args.db)
        elif args.action == "collection": result = core.collection(args.id,args.db)
        elif args.action == "register": result = core.register(json.loads(args.file.read_text()),args.db)
        elif args.action == "attach": result = core.attach(args.collection_id,args.integration_id,args.db)
        elif args.action == "set-status": result = core.set_status(args.id,args.status,args.expect_revision,args.db,evidence=args.evidence)
        else:
            result = core.export_index(args.db)
            if args.output:
                # Exports can contain local metadata; explicitly choose output destination.
                if args.output.exists():
                    raise FileExistsError(f"Refusing overwrite: {args.output}")
                args.output.write_text(json.dumps(result,indent=2)+"\n")
                print(str(args.output))
                return
        print(json.dumps(result,indent=2))
    except (ValueError,KeyError,FileNotFoundError,sqlite3.Error) as exc:
        print(f"error: {exc}",file=sys.stderr); sys.exit(2)


if __name__ == "__main__":
    main()
