import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { projectCatalog } from "../scripts/build-catalog.mjs";

const seedUrl = new URL("../../mcp/catalog/seed.json", import.meta.url);
const seed = JSON.parse(await readFile(seedUrl, "utf8"));

test("public catalog includes only approved integration fields", () => {
  const catalog = projectCatalog(seed);
  assert.equal(catalog.integrations.length, 16);
  assert.deepEqual(
    Object.keys(catalog.integrations[0]).sort(),
    ["category", "id", "name", "status"],
  );
  assert.ok(catalog.integrations.every((item) => item.status === "planned"));
  assert.ok(catalog.integrations.every((item) => !("host" in item) && !("notes" in item)));
});

test("public collections exclude operational membership metadata", () => {
  const catalog = projectCatalog(seed);
  assert.equal(catalog.collections.length, 6);
  assert.deepEqual(
    Object.keys(catalog.collections[0]).sort(),
    ["id", "name"],
  );
  assert.ok(catalog.collections.every((item) => !("members" in item) && !("description" in item)));
});

test("catalog projection rejects duplicate integration IDs", () => {
  const duplicateSeed = {
    integrations: [seed.integrations[0], seed.integrations[0]],
    collections: [],
  };
  assert.throws(() => projectCatalog(duplicateSeed), /Duplicate integration id/);
});

test("catalog projection rejects invalid statuses", () => {
  const invalidSeed = {
    integrations: [{ ...seed.integrations[0], status: "connected" }],
    collections: [],
  };
  assert.throws(() => projectCatalog(invalidSeed), /valid id, name, category and status/);
});
