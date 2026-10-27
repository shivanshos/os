# ShivanshOS Identity & Access Directory

Status: reusable **reference policy and tests**, NOT a running identity provider, production authorization service, or configured access policy. See [full integration design](../docs/identity-access-directory.md).

The directory lets only individually enlisted users access projects/resources and initiate permitted changes. A verified login alone is NOT an access grant. The stable key is the IdP tuple `(issuer, subject)`; email is a required verified address/contact field that must match the registered record. Persona describes the user's function and NEVER confers authority. A user needs a separate explicit role **and** permission list for each project (no project inheritance). The default is deny.

## Files

- `policy.py`: pure fail-closed decision function for **trusted backend** callers.
- `tests/test_policy.py`: permission-boundary tests using synthetic identities.
- `examples/directory.example.json`: sample schema, not the allowlist.
- `.gitignore`: guardrail against accidentally tracking live directory databases or records.

Run tests from repository root:

```bash
python3 -m unittest discover -s identity/tests -v
```

The canonical LIVE directory should be stored in a **private, access-controlled database**, e.g. `/srv/shivanshos/private/identity/directory.sqlite3` on HPC, protected by owner-only files and encrypted backups. Add a single writer, revisions, change history, approval records, revocation events, and audit log. Do not put emails, phone numbers, secrets, SSO tokens, or live ACLs into this public repository, its static web catalog, GitHub Actions logs, client bundles, or a vector index.

The code **does not validate bearer tokens**. A trusted Auth0/OIDC or Cloudflare Access adapter must first validate signature, issuer, exact audience, expiry, current account status and verified email; derive `VerifiedPrincipal` server-side; assess MFA assurance; then resolve the project and resource from trusted storage and call `authorize`. Caller-supplied user IDs, roles, project names, approval flags or resource classifications are untrusted. The server must validate approval records, bind them to the exact action/resource/revision, and log outcomes.

Local `sudo`, Unix, Docker, Postgres/Qdrant, Ollama, GitHub, Cloudflare, Drive, Bitwarden and provider API access all have their **own** access gates. Protect provider credentials and direct network paths; the policy library by itself cannot restrict those systems.

Do not deploy or switch on enforcement until the private directory contains at least one verified owner identity, tests and break-glass recovery are documented, and enforcement is installed at the API/MCP/worker boundary. No real identities are auto-enlisted by these files.
