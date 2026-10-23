# Private resource catalog deployment

## What this deploys

`web/` is a static, read-only catalog UI for the existing `mcp/catalog/seed.json`. Its build step allowlists only each integration's `id`, `name`, `category` and `status`, and each collection's `id` and `name`. It deliberately omits hosts, transports, permissions, capabilities, notes, collection descriptions, account state, provider URLs and credentials. The entries currently say `planned`; the catalog must not be read as evidence that an integration is connected.

The repository and generated catalog are public. Cloudflare Access protects the hosted UI, not the GitHub source. Do not put private records or secrets into this static app. This is not the Workspace Core, a provider connector, or an authenticated API.

## Before deployment

1. Keep `os.shivanshsethi.in` on the existing Framer landing page. This app targets only `studio.os.shivanshsethi.in`.
2. An unauthenticated request to `studio.os.shivanshsethi.in` returned an HTTP 302 to the Cloudflare Access login endpoint during this task. In Cloudflare Zero Trust, inspect the existing application rather than creating a duplicate. Confirm Google is enabled and the **Allow** policy matches only `x@shivanshsethi.in`; do not use an `Everyone` or domain-wide policy.
3. Verify that the Access application and policy are active before changing the Worker. Cloudflare documents that a hostname without an Access application is public.
4. Create an account-owned API token and store it locally in `web/.cloudflare-cli.env` (copy `.cloudflare-cli.env.example`, then restrict the file to your user). Never paste the token into chat, pass it on a command line, or commit the file. Follow [Cloudflare's Workers roles guidance](https://developers.cloudflare.com/workers/authorization/workers/): use Workers Metadata Read-Only to list Worker names, Editor scoped to the existing Worker to deploy, and Zone > Workers Routes > Write only if the custom domain needs to be added or changed.
5. Run `npm run list-workers` from `web/` to print Worker names only. Confirm in Cloudflare that the existing hostname belongs to the intended Worker before deploying; do not move it from another Worker without explicit confirmation.

## Local validation and deployment

From `web/`:

```sh
npm ci
npm test
npm run build
npm run check
npm run dev
```

For account discovery, copy `.cloudflare-cli.env.example` to `.cloudflare-cli.env`, enter the account ID and scoped API token in the local file, and set its permissions to owner-only. `npm run list-workers` uses Cloudflare's [List Worker Scripts API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/list/) and prints names only; it never prints the token.

After Access is verified and the existing Worker and current hostname binding are confirmed, set `OS_EXISTING_WORKER_NAME` and `OS_ACCESS_CONFIRMED=yes` in `.cloudflare-cli.env`, then deploy:

```sh
npm run deploy
```

`OS_ACCESS_CONFIRMED=yes` is an operator acknowledgement, not an automated Access-policy check. Do not set it until the Access application and exact-email policy have been checked in the Cloudflare dashboard. The deploy script checks the existing Worker name before deployment. The Wrangler config disables `workers.dev` and preview URLs, and attaches only the approved custom hostname.

After deployment, verify in a browser that:

- an unauthenticated request is sent to Cloudflare Access and cannot read the app or catalog;
- signing in as `x@shivanshsethi.in` succeeds;
- another identity is denied;
- the existing Framer landing page at `os.shivanshsethi.in` is unchanged.

No DNS, Access or Worker change is considered complete until these checks pass.
