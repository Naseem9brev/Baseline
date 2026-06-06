#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const VERSION = '0.1.6';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'vendor', 'praatfan-wasm');
const url = `https://github.com/ucpresearch/praatfan-core-clean/releases/download/v${VERSION}/praatfan-wasm.tar.gz`;
const tarball = path.join(root, '.cache', 'praatfan-wasm.tar.gz');

await mkdir(path.dirname(tarball), { recursive: true });
await mkdir(dest, { recursive: true });

console.log(`Downloading praatfan WASM v${VERSION}…`);
execSync(`curl -sSL -o "${tarball}" "${url}"`, { stdio: 'inherit' });
execSync(`tar -xzf "${tarball}" -C "${dest}"`, { stdio: 'inherit' });

await writeFile(
  path.join(dest, 'README.md'),
  `# praatfan WASM v${VERSION}\n\nMIT OR Apache-2.0 — https://github.com/ucpresearch/praatfan-core-clean\n`,
);

console.log('Done → vendor/praatfan-wasm/');
