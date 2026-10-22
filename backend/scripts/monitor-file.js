#!/usr/bin/env node
/**
 * scripts/monitor-file.js
 * Reads a static JSON file of API responses and submits it to POST /monitor.
 * Usage: node scripts/monitor-file.js <path/to/input.json> [--url=http://localhost:3000]
 */
const { readFile } = require('node:fs/promises');
const path = require('node:path');

/** Returns the CLI argument value for a given --flag=value. */
function flagValue(args, name) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

/** Reads, parses, and posts the file; prints the batch summary. */
async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Usage: node scripts/monitor-file.js <input.json> [--url=http://localhost:3000]');
    process.exit(1);
  }
  const baseUrl = flagValue(args, 'url') || process.env.MONITOR_URL || 'http://localhost:3000';

  const raw = await readFile(path.resolve(file), 'utf8');
  const payload = JSON.parse(raw);
  if (!Array.isArray(payload)) {
    console.error('Input file must contain a JSON array of API response objects');
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  console.log(JSON.stringify(body, null, 2));
  process.exit(res.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(`monitor-file failed: ${err.message}`);
  process.exit(1);
});
