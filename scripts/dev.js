/**
 * Starts the Express API and the Vite dev server together.
 *
 * Deliberately spawns node directly (process.execPath, absolute script paths)
 * instead of going through npm or a shell. Tools like `concurrently` spawn via
 * cmd.exe, which fails with "spawn cmd.exe ENOENT" on Windows machines where
 * System32 is missing from PATH. No shell here means nothing to resolve.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const serverDir = path.join(root, "server");
const clientDir = path.join(root, "client");
const serverEntry = path.join(serverDir, "index.js");

// Yarn workspaces hoist packages to the root node_modules, so look upwards for
// the file. require.resolve() can't be used here: vite's "exports" map doesn't
// expose bin/vite.js, so resolving it throws even when vite is installed.
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

const COLORS = { server: "\x1b[36m", client: "\x1b[35m" };
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function bail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!findUp(serverDir, path.join("express", "package.json"))) {
  bail("Server dependencies are missing. Run:  yarn install");
}
if (!viteBin) {
  bail("Client dependencies are missing. Run:  yarn install");
}
if (!fs.existsSync(path.join(root, "server", ".env"))) {
  console.warn(
    `\n  ${DIM}server/.env not found — the API will report "Database not connected".` +
      `\n  Copy server/.env.example to server/.env and set MONGODB_URI.${RESET}\n`
  );
}

const children = [];
let shuttingDown = false;

function start(name, args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = `${COLORS[name]}[${name}]${RESET} `;
  const relay = (stream, out) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) out.write(prefix + line + "\n");
    });
  };
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);

  child.on("error", (err) => {
    console.error(`${prefix}failed to start: ${err.message}`);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (shuttingDown) return;
    console.error(`${prefix}exited with code ${code}`);
    shutdown(code ?? 1);
  });

  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`\n  ${DIM}starting api + client…${RESET}\n`);
start("server", ["--watch", serverEntry], path.join(root, "server"));
start("client", [viteBin], path.join(root, "client"));
