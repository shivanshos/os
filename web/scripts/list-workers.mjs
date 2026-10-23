import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

export function workerNamesFromResponse(payload) {
  if (payload?.success !== true || !Array.isArray(payload.result)) {
    throw new TypeError("Cloudflare returned an invalid Worker list response.");
  }

  return [...new Set(payload.result
    .map((worker) => worker && typeof worker === "object" ? worker.id : undefined)
    .filter((name) => typeof name === "string" && name.length > 0))]
    .sort((a, b) => a.localeCompare(b));
}

async function listWorkers() {
  if (!accountId || !apiToken) {
    console.error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .cloudflare-cli.env.");
    process.exit(1);
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
    },
  );

  if (!response.ok) {
    console.error(`Cloudflare Worker discovery failed with HTTP ${response.status}.`);
    process.exit(response.status >= 400 && response.status < 500 ? 1 : 2);
  }

  const names = workerNamesFromResponse(await response.json());
  console.log(names.length ? names.join("\n") : "No Workers were returned for the selected account.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await listWorkers();
}
