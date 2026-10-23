import { spawnSync } from "node:child_process";

const workerName = process.env.OS_EXISTING_WORKER_NAME?.trim();
if (!workerName || !/^[a-z0-9][a-z0-9-]*$/.test(workerName)) {
  console.error("Deployment blocked: set OS_EXISTING_WORKER_NAME to the exact existing Worker name.");
  process.exit(1);
}

if (process.env.OS_ACCESS_CONFIRMED !== "yes") {
  console.error(
    "Deployment blocked: verify the Cloudflare Access application and exact-email policy first.",
  );
  process.exit(1);
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const runWrangler = (args) => spawnSync(npm, ["exec", "--", "wrangler", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

const existingWorker = runWrangler(["deployments", "list", "--name", workerName]);
if (existingWorker.error) {
  console.error(`Deployment blocked: ${existingWorker.error.message}`);
  process.exit(1);
}
if (existingWorker.status !== 0) {
  console.error(`Deployment blocked: could not verify existing Worker "${workerName}".`);
  process.exit(existingWorker.status ?? 1);
}

const deployment = runWrangler(["deploy", "--name", workerName]);
if (deployment.error) {
  console.error(`Deployment failed: ${deployment.error.message}`);
  process.exit(1);
}
if (deployment.status !== 0) {
  process.exitCode = deployment.status ?? 1;
}
