import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const nextCliPath = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, "--no-deprecation"].filter(Boolean).join(" "),
};

const child = spawn(process.execPath, [nextCliPath, "dev", ...args], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
