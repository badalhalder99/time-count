/**
 * Builds the React app into client/dist.
 * Spawns node directly for the same reason as scripts/dev.js — no shell,
 * so it works even when cmd.exe cannot be resolved from PATH.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const clientDir = path.join(root, "client");

// Yarn workspaces hoist to the root node_modules, so look upwards for the file.
// require.resolve() can't be used: vite's "exports" map doesn't expose bin/vite.js.
function findUp(startDir, relPath) {
  let dir = startDir;
  for (;;) {
    const candidate = path.join(dir, "node_modules", relPath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const viteBin = findUp(clientDir, path.join("vite", "bin", "vite.js"));
if (!viteBin) {
  console.error("\n  Client dependencies are missing. Run:  yarn install\n");
  process.exit(1);
}

const child = spawn(process.execPath, [viteBin, "build"], {
  cwd: clientDir,
  env: process.env,
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error("  build failed to start:", err.message);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
