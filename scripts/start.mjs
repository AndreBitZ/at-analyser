import { spawn } from "node:child_process";

function run(cmd, args) {
  const p = spawn(cmd, args, { stdio: "inherit", shell: true });
  p.on("exit", (c) => process.exit(c ?? 0));
}
run("node", ["server/index.js"]);
run("npx", ["vite"]);
