#!/usr/bin/env node
/**
 * Downloads praatfan WASM into vendor/praatfan-wasm/ and copies to public/praatfan/
 * so chrome.runtime.getURL() works in dev and production (same pattern as MediaPipe).
 */
import { createWriteStream, existsSync } from 'node:fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const VERSION = '0.1.6';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'vendor', 'praatfan-wasm');
const wasmPath = path.join(dest, 'praatfan_rust_bg.wasm');
const publicDir = path.join(root, 'public', 'praatfan');
const publicWasm = path.join(publicDir, 'praatfan_rust_bg.wasm');
const url = `https://github.com/ucpresearch/praatfan-core-clean/releases/download/v${VERSION}/praatfan-wasm.tar.gz`;
const tarball = path.join(root, '.cache', 'praatfan-wasm.tar.gz');

async function syncPublicWasm() {
  if (!existsSync(wasmPath)) return;
  await mkdir(publicDir, { recursive: true });
  await copyFile(wasmPath, publicWasm);
}

if (existsSync(wasmPath) && process.env.FORCE_PRAATFAN !== '1') {
  await syncPublicWasm();
  console.log('praatfan WASM ready → vendor/ + public/praatfan/');
  process.exit(0);
}

await mkdir(path.dirname(tarball), { recursive: true });
await mkdir(dest, { recursive: true });

console.log(`Downloading praatfan WASM v${VERSION}…`);
const res = await fetch(url);
if (!res.ok) {
  console.error(`Failed to download praatfan WASM (${res.status} ${res.statusText})`);
  process.exit(1);
}
await pipeline(res.body, createWriteStream(tarball));
execSync(`tar -xzf "${tarball}" -C "${dest}"`, { stdio: 'inherit' });

await writeFile(
  path.join(dest, 'README.md'),
  `# praatfan WASM v${VERSION}\n\nMIT OR Apache-2.0 — https://github.com/ucpresearch/praatfan-core-clean\n`,
);

if (!existsSync(wasmPath)) {
  console.error('Download finished but praatfan_rust_bg.wasm is missing — check the tarball.');
  process.exit(1);
}

await syncPublicWasm();
console.log('Done → vendor/praatfan-wasm/ + public/praatfan/');
