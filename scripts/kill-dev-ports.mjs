#!/usr/bin/env node
/** Stop stale WXT/Vite dev servers so port 3000 matches manifest CSP. */
import { execSync } from 'node:child_process';

const PORTS = [3000, 3001];

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

const pids = new Set();
for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) pids.add(pid);
}

if (pids.size === 0) {
  console.log('[baseline] No stale dev servers on ports 3000/3001.');
  process.exit(0);
}

for (const pid of pids) {
  try {
    process.kill(Number(pid), 'SIGTERM');
    console.log(`[baseline] Stopped process ${pid} on dev port.`);
  } catch {
    // already gone
  }
}
