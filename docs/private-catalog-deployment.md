# Private resource catalog deployment

## What this deploys

`web/` is a static, read-only catalog UI for the existing `mcp/catalog/seed.json`. Its build step allowlists only each integration's `id`, `name`, `category` and `status`, and each collection's `id` and `name`. It deliberately omits hosts, transports, permissions, capabilities, notes, collection descriptions, account state, provider URLs and credentials. The entries currently say `planned`; the catalog must not be read as evidence that an integration is connected.

The repository and generated catalog are public. Cloudflare Access protects the hosted UI, not the GitHub source. Do not put private records or secrets into this static app. This is not the Workspace Core, a provider connector, or an authenticated API.

## Before deployment

1. Keep `os.shivanshsethi.in` on the existing Framer landing page. This app targets only `studio.os.shivanshsethi.in`.
2. In Cloudflare Zero Trust, confirm Google is an enabled identity provider. Create a self-hosted Access application for the exact hostname `studio.os.shivanshsethi.in` and an **Allow** policy matching only `x@shivanshsethi.in`. Do not use an `Everyone` or domain-wide policy.
3. Verify the Access application and policy are active before attaching the Worker custom domain. Cloudflare documents that a hostname without an Access application is public.
4. Authenticate to the intended Cloudflare account with an account-scoped API token stored outside Git, with only the permissions needed to deploy the existing Worker and manage its custom domain. Never pass token values on a command line or commit them.
5. Identify the exact existing Worker name in that account. The deploy script refuses to run without it and checks that Wrangler can read its deployment list before it deploys.

## Local validation and deployment

From `web/`:

```sh
npm ci
npm test
npm run build
npm run check
npm run dev
```

After Access is set up and the existing Worker name is confirmed, deploy with the same account context:

```sh
OS_EXISTING_WORKER_NAME=<exact-existing-worker-name> \
OS_ACCESS_CONFIRMED=yes \
npm run deploy
```

`OS_ACCESS_CONFIRMED=yes` is an operator acknowledgement, not an automated Access-policy check. Do not set it until the Access application and exact-email policy have been checked in the Cloudflare dashboard. The Wrangler config disables `workers.dev` and preview URLs, and attaches only the approved custom hostname.

After deployment, verify in a browser that:

- an unauthenticated request is sent to Cloudflare Access and cannot read the app or catalog;
- signing in as `x@shivanshsethi.in` succeeds;
- another identity is denied;
- the existing Framer landing page at `os.shivanshsethi.in` is unchanged.

No DNS, Access or Worker change is considered complete until these checks pass.
