/**
 * Speed Money - Unified All-in-One Launcher
 * Runs Backend (Port 5000), Customer App (Port 8081), Admin Portal (Port 8082), and Agent App (Port 8083).
 */

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const SERVICES = [
  {
    name: "Backend API",
    port: 5000,
    cwd: path.resolve(__dirname, "backend"),
    cmd: "node",
    args: ["server.js"],
    color: "\x1b[36m", // Cyan
  },
  {
    name: "Customer App",
    port: 8081,
    cwd: "C:\\Users\\mohan\\speedmoeny\\user-app",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
    color: "\x1b[32m", // Green
  },
  {
    name: "Admin Portal",
    port: 8082,
    cwd: "C:\\Users\\mohan\\speedmoeny\\admin-app",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
    color: "\x1b[34m", // Blue
  },
  {
    name: "Agent App",
    port: 8083,
    cwd: "C:\\Users\\mohan\\speedmoeny\\agent-app",
    cmd: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev"],
    color: "\x1b[33m", // Yellow
  },
];

console.log("\x1b[1m\x1b[35m%s\x1b[0m", "============================================================");
console.log("\x1b[1m\x1b[35m%s\x1b[0m", "       SPEED MONEY - UNIFIED MULTI-PORTAL LAUNCHER          ");
console.log("\x1b[1m\x1b[35m%s\x1b[0m", "============================================================");

SERVICES.forEach((svc) => {
  console.log(`Starting ${svc.color}${svc.name}\x1b[0m in ${svc.cwd}...`);
  const proc = spawn(svc.cmd, svc.args, {
    cwd: svc.cwd,
    stdio: "inherit",
    shell: true,
  });

  proc.on("error", (err) => {
    console.error(`[${svc.name}] Failed to start:`, err.message);
  });

  proc.on("exit", (code) => {
    console.log(`[${svc.name}] Exited with code ${code}`);
  });
});

console.log("\n\x1b[32m%s\x1b[0m", "All 4 services launched!");
console.log("  • Customer App:  \x1b[4mhttp://localhost:8081\x1b[0m");
console.log("  • Admin Portal:  \x1b[4mhttp://localhost:8082\x1b[0m");
console.log("  • Agent App:     \x1b[4mhttp://localhost:8083\x1b[0m");
console.log("  • Backend API:   \x1b[4mhttp://localhost:5000/api\x1b[0m\n");
