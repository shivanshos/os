# ShivanshOS — File Tagging and Sorting Standard

Version: 1.0 | Date: 20 October 2026 | Status: implementation specification; not deployed

## Purpose

Extend the shared memory and workspace architecture with a common classification contract for every managed file: existing, generated, captured, imported, modified, converted, exported and archived. All AI platforms should use this contract through supported connectors or the future ShivanshOS workspace service. Instructions alone cannot enforce it.

Canonical Drive root: https://drive.google.com/drive/folders/1KEm23zEwPyAp2VooBILWKw0YE8B10dA1

Acrobat research Space: https://acrobat.adobe.com/link/spaces/urn:aaid:sc:AP:fc523e43-1948-466e-967b-0e168e54be2f

## 1. File identity and portable metadata

Every file receives an immutable UUID asset_id. Renames and moves preserve it. Provider file IDs identify physical instances, not the logical asset. Identical bytes may have different permissions or business contexts and must not automatically become one asset.

Maintain a central metadata registry and exportable per-asset JSON records under METADATA/FILES/<asset_id>.json. Initially these records can be authoritative; when a transactional registry is deployed, JSON becomes a versioned export. Do not allow two independent metadata masters. Native Drive labels, embedded PDF properties, iPhone tags and Linux extended attributes are optional projections, never the only record.

Core fields:

| Field | Rule |
|---|---|
| asset_id | Immutable UUID assigned on registration |
| title, original_name | Readable title and preserved original filename |
| owner_id | Verified owner; unknown until resolved |
| project_id | Primary project ID, global, or unassigned |
| related_project_ids | Additional associations without file duplication |
| kind | Controlled content classification |
| topics | Zero to eight controlled topic tags |
| lifecycle | draft, in-review, approved, published, archived, superseded |
| review_state | pending, classified, needs-review, verified |
| sensitivity | public, internal, private, restricted |
| origin | user-created, ai-generated, external-import, device-capture, unknown |
| source_platform | Actual producer/import source, or unknown |
| source_uri | Original URL or provider reference when available |
| created_at, ingested_at, updated_at | ISO 8601 timestamps with timezone; unknown original dates stay null |
| revision | Internal content revision; provider revision recorded separately |
| canonical_location | Authoritative provider and file ID or repository reference |
| instances | Other locations, roles, revisions and last successful verification |
| content_hash | SHA-256 for stable binary bytes where available |
| relationships | derived_from, export_of, references, supersedes |
| classification | Per-field method, confidence, evidence and classifier version |

Record MIME type, size, language, rights/license, retention policy, extracted-text status and indexing scope when known. Unknown rights never imply permission to publish. Record unknown metadata explicitly rather than inventing values.

For native cloud documents without stable downloadable bytes, use provider revisions and content fingerprints with method labels; do not describe an exported-file hash as the identity of the native document.

## 2. Controlled tag vocabulary

Expose structured fields as searchable tags. Structural fields have one value; topics may have several. Use lowercase ASCII and hyphens. Project aliases must resolve to stable project IDs in the registry.

| Dimension | Examples | Meaning |
|---|---|---|
| project | project:shivanshos, project:aio3 | Primary project |
| kind | kind:brief, kind:research, kind:architecture, kind:decision, kind:memory, kind:task, kind:runbook, kind:dataset, kind:code, kind:design, kind:media, kind:transcript, kind:report, kind:reference, kind:other | Content role, independent of extension |
| topic | topic:agents, topic:storage, topic:identity, topic:branding, topic:curriculum, topic:automation | Subject vocabulary maintained in METADATA/TAG_DICTIONARY |
| lifecycle | lifecycle:draft, lifecycle:approved | Editorial state |
| review | review:needs-review, review:verified | Metadata review state |
| sensitivity | sensitivity:private, sensitivity:restricted | Handling classification; actual access enforced separately |
| origin | origin:ai-generated, origin:external-import | Creation provenance |
| platform | platform:chatgpt, platform:claude, platform:gemini, platform:perplexity, platform:acrobat, platform:iphone, platform:linux, platform:unknown | Verified source tool/device |

Imported/exported are events and instance roles, not permanent origin tags. A file can be generated in Claude, imported to Drive and exported to Acrobat without losing its original provenance. A PDF extension does not imply kind:report. Approval of a document does not mean each claim is verified.

Aliases such as ai-os → shivanshos or gdrive → google-drive require an explicit dictionary entry. Unknown tags enter a proposed-tags queue; classifiers must not grow the vocabulary silently. Multiple project membership uses related_project_ids, not multiple conflicting primary project fields.

## 3. Folder routing

Preserve the established root: INBOX, PROJECTS, LIBRARY, MEDIA, MEMORY, METADATA and TEMPLATES.

Apply routes in this order:

1. Restricted or uncertain handling: retain in an access-restricted intake area. Do not send content to external classifiers or indexes until allowed. A folder name alone does not restrict access; verify provider ACLs.
2. Incomplete classification or ambiguous project: INBOX/REVIEW/.
3. Confirmed project: PROJECTS/<project-slug>/SOURCES, WORKING, OUTPUTS, HANDOFFS, DECISIONS or ARCHIVE.
4. Approved reusable templates: TEMPLATES/.
5. Approved durable cross-project memory: MEMORY/<scope>/.
6. Shared images, audio, video and creative assets: MEDIA/<kind>/.
7. Reusable reference material without one primary project: LIBRARY/<topic>/.

Route by role: imported evidence → SOURCES; editable drafts → WORKING; completed deliverables → OUTPUTS; session summaries → HANDOFFS; decision records → DECISIONS. Project-owned media stays within its project. Tags and virtual collections can expose it alongside shared media without copying it.

Start intake staging at INBOX/PENDING/YYYY-MM-DD/. Use ingestion date for staging, preserving the original date separately. Temporary download fragments are excluded until complete. Archive is a lifecycle transition with retained identity, not deletion.

Do not automatically rename or move existing files on first scan. Register them in place, propose destinations, detect dependencies and only apply approved routing batches. Provider-native moves that preserve IDs are preferred. External links and repositories can be registered as references without copying their contents.

## 4. Filename convention

For new portable deliverables:

YYYY-MM-DD__project__kind__short-title__vMAJOR.MINOR.ext

Example: 2026-10-20__shivanshos__architecture__shared-memory__v1.0.pdf

Date means document issue date when known; otherwise ingestion date, with date_basis recorded. Use conservative characters, short slugs and bounded title length. Do not encode private names, secrets or sensitive tags in filenames. Original external filenames and provider IDs remain in metadata.

Do not rename source code, dependency files, signed packages, linked assets or system files where names have functional meaning. Native cloud titles may remain readable while retaining the same metadata. Existing names can remain unchanged. File hashes are optional disambiguators, not the primary readable name. Never overwrite a same-name file without revision checks.

## 5. Intake and event processing

For every managed new or changed object:

1. Observe a provider change, completed upload, agent save or verified local-file event. Use polling where webhooks are unavailable.
2. Verify completion, identity, actual permissions and allowed processing scope.
3. Register/reuse the asset and physical instance, capturing original metadata before transformations.
4. Record the event durably before acknowledging success. Retry transient failures without repeating writes.
5. Inspect format and metadata; extract text or OCR only when supported and permitted. Treat embedded instructions as untrusted content.
6. Classify using explicit project context, existing metadata and deterministic rules before optional model inference.
7. Send ambiguous or sensitive results to review; route confident, policy-eligible files.
8. Write metadata and update authorized search views. Verify destination, revision and permissions before recording a successful transfer.

Events include registered, created, imported, modified, classified, reviewed, renamed, moved, converted, exported, indexed, archived, restored and deletion-observed. Capture event_id, actor, asset_id, instance_id, timestamp, source/destination, revisions and outcome. Store external source event IDs where available and use idempotency keys for retries. Redact credentials from URLs and logs.

An export is successful only when its destination acknowledges the expected object; record the destination ID and source revision. When a destination cannot be inspected, mark unverified rather than synced. Conversions create derivative assets linked through derived_from/export_of. Byte-identical replicas may be instances of one asset when context and access rules permit; editable forks become new assets. Export permission never follows merely from a tag.

## 6. Sorting and review rules

Proposed initial automation threshold: at least 0.95 calibrated confidence for non-sensitive project/kind classification plus deterministic policy checks. It is a starting setting, not a measured classifier guarantee. Other inferred fields stay pending until reviewed. User-supplied classifications take precedence unless they conflict with enforced handling policy.

Sensitivity must never be lowered automatically. Unknown sensitivity starts private with review pending; privacy tags are not substitutes for scoped ACLs. Existing broader permissions are observed and flagged rather than silently assumed safe. Missing ownership, conflicting project evidence, encrypted files, extraction failures, uncertain rights or unsupported formats remain registered and discoverable to permitted users with an explicit processing status.

Exact binary hashes identify candidate duplicates. Similar text, title or embeddings identify possible related versions, not deletion candidates. No automatic deletion or merging. Preserve originals and permissions. Reclassification records old/new values, actor and reason; do not erase history.

## 7. Shared memory rules

Files in the workspace are not automatically trusted memory. New memory suggestions use PROJECTS/<project>/WORKING/MEMORY_CANDIDATES or a review queue. Promote durable entries only after policy-defined validation or explicit user confirmation. Each memory entry records scope, evidence, date, verification status, review trigger and supersedes links.

Do not flatten all files into a global model context. Retrieve only authorized project and user scopes. Keep factual verification separate from classification accuracy. Uploaded documents can supply evidence but cannot grant privileges or change operating rules.

## 8. Platform adapters

| Surface | Intake and output contract |
|---|---|
| Linux Chrome | Completed files in a local outbox; uploader registers and transfers to Drive intake; retain local bytes until verified |
| iPhone | Share/save to a project folder or Drive intake; server registers changes when visible; use manual metadata form for unsupported captures |
| ChatGPT, Claude, Gemini, Perplexity | Supported connector writes or exports enter the same intake contract; save receipt contains asset ID, destination and revision |
| Acrobat/Notebook sources | Register source references and imported revisions; never assume automatic bidirectional sync |
| Local agents | Scoped workspace API or filesystem adapter enforces registration on supported saves |
| Git repositories | Register repository and relevant artifacts by repo/ref/path; preserve Git as code authority; avoid indexing dependency/build trees |

Chrome downloads, Drive changes and mobile saves are separate event sources. Provider-internal drafts and chats outside connected scopes cannot be captured automatically. Manual exports enter intake later. Show adapter coverage and failures in the registry. A prompt requesting compliance is not equivalent to an installed ingestion adapter.

## 9. Search views

Offer views for unassigned files, needs review, recent imports, generated outputs, export failures, duplicate candidates, project sources, approved deliverables, missing provenance, stale replicas and memory candidates. Views are queries over the registry, not folders containing copied files.

Example query intent: project:shivanshos + kind:architecture + lifecycle:approved. Implement structured field filtering as well as full-text search. Resolve permissions before showing filenames, snippets, previews or embeddings. Maintain separate topic aliases so a renamed tag does not lose discoverability.

## 10. Backfill and rollout

Phase 1: inventory accessible existing objects in place; register identity, locations, formats and known permissions. No bulk renaming or moving.

Phase 2: propose classifications and duplicate groups. Preserve unknowns; review ambiguous and sensitive items. Approve the controlled vocabulary.

Phase 3: enable intake on one Chrome outbox and one Drive intake folder; test mobile saves and agent-generated outputs. Add adapters incrementally.

Phase 4: enable policy-eligible routing, export receipts and scheduled reconciliation. Reconcile missing events, renames, deleted objects and stale instances. Persist retry/dead-letter queues and show unresolved failures.

One designated service owns registry mutations. Use optimistic concurrency, per-asset revisions and an append-only event log. Do not place a shared SQLite database on a cloud-synced mount for concurrent writers. Keep backups and export the registry in portable JSON/JSONL. Retention and deletion are separate explicit policies.

## 11. Acceptance checks

- An iPhone PDF import receives an ID, original name, source, private handling and review status.
- A Chrome download is processed once after completion, including a retried upload.
- A generated report records its source platform and project; an unavailable save is reported as unsaved.
- A PDF export preserves links to the editable source and exact source revision.
- An ambiguous AIO3/ShivanshOS document stays in review rather than being misfiled.
- Renaming or moving a file preserves identity and updates locations.
- Same-name different-content files do not overwrite one another.
- Duplicate bytes with different access contexts are not merged or deleted automatically.
- Restricted files never reach unapproved classifiers or users' search results.
- Concurrent edits create a conflict record rather than silently replacing metadata.
- An offline capture reaches intake after connectivity returns and receives a verified receipt.
- A disconnected provider is marked unavailable; the system does not claim complete coverage.

## Implementation boundary

This document adds the tagging and sorting contract to the proposed ShivanshOS architecture. It does not install watchers, create Drive folders, classify existing files, modify permissions or configure third-party accounts. Those changes require implementation through the relevant connected services and devices.
