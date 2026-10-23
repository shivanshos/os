import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const sourcePath = resolve(repositoryRoot, "mcp/catalog/seed.json");
const outputDirectory = resolve(scriptDirectory, "../public");
const outputPath = resolve(outputDirectory, "catalog.json");
const integrationFields = ["id", "name", "category", "status"];
const collectionFields = ["id", "name"];
const allowedStatuses = new Set(["planned", "verified", "needs-review", "retired"]);

function projectFields(source, fields) {
  return Object.fromEntries(fields.map((field) => [field, source[field]]));
}

export function projectCatalog(seed) {
  if (!Array.isArray(seed.integrations) || !Array.isArray(seed.collections)) {
    throw new TypeError("The source catalog must include integrations and collections arrays.");
  }

  const ids = new Set();
  const integrations = seed.integrations.map((entry) => {
    if (
      typeof entry.id !== "string"
      || typeof entry.name !== "string"
      || typeof entry.category !== "string"
      || !allowedStatuses.has(entry.status)
    ) {
      throw new TypeError("Each integration must have a valid id, name, category and status.");
    }
    if (ids.has(entry.id)) {
      throw new TypeError(`Duplicate integration id: ${entry.id}`);
    }
    ids.add(entry.id);
    return projectFields(entry, integrationFields);
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const collections = seed.collections.map((entry) => {
    if (
      typeof entry.id !== "string"
      || typeof entry.name !== "string"
    ) {
      throw new TypeError("Each collection must have a valid id and name.");
    }
    return projectFields(entry, collectionFields);
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    schemaVersion: seed.schema_version,
    integrations,
    collections,
  };
}

async function buildCatalog() {
  const seed = JSON.parse(await readFile(sourcePath, "utf8"));
  const catalog = projectCatalog(seed);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildCatalog();
}
