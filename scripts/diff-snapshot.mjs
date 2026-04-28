/**
 * diff-snapshot.mjs — diff a captured snapshot against a stored baseline.
 *
 * Used as the Stage 1 regression gate. Run after refactoring DashboardPage.jsx
 * and confirm zero differences.
 *
 * Usage:
 *   node scripts/capture-snapshot.mjs > .context/snapshots/post-s1.json
 *   node scripts/diff-snapshot.mjs .context/snapshots/pre-s1.json .context/snapshots/post-s1.json
 *
 * Exit code: 0 = identical, 1 = differences found.
 */

import { readFileSync } from 'node:fs';

const [, , baselineFile, candidateFile] = process.argv;
if (!baselineFile || !candidateFile) {
  console.error('usage: diff-snapshot.mjs <baseline.json> <candidate.json>');
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselineFile, 'utf-8'));
const candidate = JSON.parse(readFileSync(candidateFile, 'utf-8'));

const diffs = [];

function walk(a, b, path = '') {
  if (a === b) return;
  if (typeof a !== typeof b) {
    diffs.push({ path, baseline: a, candidate: b });
    return;
  }
  if (a === null || b === null) {
    diffs.push({ path, baseline: a, candidate: b });
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      diffs.push({ path, baseline: `[len ${a.length}]`, candidate: Array.isArray(b) ? `[len ${b.length}]` : b });
      return;
    }
    for (let i = 0; i < a.length; i++) walk(a[i], b[i], `${path}[${i}]`);
    return;
  }
  if (typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) walk(a[k], b[k], path ? `${path}.${k}` : k);
    return;
  }
  diffs.push({ path, baseline: a, candidate: b });
}

walk(baseline, candidate);

if (diffs.length === 0) {
  console.log('✓ snapshots identical');
  process.exit(0);
}

console.log(`✗ ${diffs.length} difference(s):`);
for (const d of diffs.slice(0, 50)) {
  console.log(`  ${d.path}`);
  console.log(`    baseline:  ${JSON.stringify(d.baseline)}`);
  console.log(`    candidate: ${JSON.stringify(d.candidate)}`);
}
if (diffs.length > 50) console.log(`  ... and ${diffs.length - 50} more`);
process.exit(1);
