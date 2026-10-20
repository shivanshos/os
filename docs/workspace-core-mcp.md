# OS Workspace Core and MCP

Status: proposed design; no service is deployed by this document.

## Purpose

Provide consistent operations across AI clients: retrieve authorized context, register and tag files, save verified outputs and preserve handoffs. Enforce the file standard in code rather than relying only on platform prompts.

Build one service with multiple interfaces. The CLI, HTTP API and MCP adapter call the same authorization, registry and persistence operations. Do not create a separate memory implementation per interface.

## Components

| Component | Responsibility |
|---|---|
| Canonical sources | Drive documents, Git code and native editable designs |
| Registry | Assets, instances, revisions, tags, relationships and events |
| Curated memory | Validated decisions, preferences and facts with scope and evidence |
| Workspace service | Authorization, registration, retrieval, verification and reconciliation |
| MCP adapter | Structured tools, context resources and reusable prompts for compatible clients |
| HTTP API / CLI | Equivalent operations for workflows and applications |
| Derived indexes | Rebuildable full-text and, later if needed, vector search |

## First tool surface

| Tool | Inputs | Required outcome |
|---|---|---|
| `get_project_context` | Project, caller, requested scope | Authorized records with IDs, revisions and freshness |
| `search_files` | Query, filters, project scope | Permission-filtered results |
| `register_file` | Source reference, project context, metadata | Stable asset/instance identity and provenance |
| `propose_classification` | Asset, explicit context | Proposed controlled tags and route; no move |
| `save_output` | Destination, content, expected revision, operation ID | Verified save receipt or explicit failure |
| `append_handoff` | Project, session, records read, outcome | New session record without overwriting other sessions |
| `propose_memory` | Candidate, scope, evidence | Reviewable candidate, not automatic trusted memory |

Do not expose arbitrary shell commands, unrestricted filesystem paths, raw credentials or automatic deletion. Validate structured inputs independently of the model.

## MCP resources and prompts

Resources may expose authorized project summaries, vocabulary/schema versions and adapter capability information. Prompts can provide consistent start-session and end-session templates. Neither replaces access checks or canonical source retrieval.

MCP does not make every consumer AI app compatible, merge all personal chat histories or capture disconnected application files. Record actual client capabilities. Native connectors and manual exports remain supported paths into the intake process.

## Deployment sequence

1. Local service and SQLite registry on Spectre; one writer; synthetic data.
2. Read-only Drive inventory and explicit local registration.
3. Verified output saving with durable queue state and conflict checks.
4. Local MCP connection for compatible agents.
5. Authenticated remote interface only when cloud clients need access and the host's availability is suitable.
6. Scheduled ingestion/reconciliation through n8n or a small worker.

Keep the live database outside cloud synchronization. Export portable records and event history. A sleeping Spectre cannot provide an always-available endpoint; migrate deliberately to a suitable host when necessary.

## Authorization

Bind every operation to an identity, project, resource and permitted action. Apply access control before exposing titles, snippets or embeddings. Keep provider credentials separate from client authentication, validate intended token audience and do not pass incoming client tokens through to downstream providers.

Source content cannot change operating rules or grant privileges. Memory promotion requires policy-defined validation or user confirmation. Tagging confidence and factual verification are separate fields.

## Acceptance

A task completed in one platform produces a verified saved output and handoff. A fresh session on another platform retrieves that result and identifies the correct next action without receiving the old chat. Repeat with unavailable sources, stale snapshots, conflicting edits and revoked access.

## Primary protocol references

- [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP security guidance](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)

Client transports and authorization support must be checked against the selected client and current protocol revision during implementation.
