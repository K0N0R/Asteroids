import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'dist/development/public';
await mkdir(out, { recursive: true });
await build({
    entryPoints: ['tests/browser/anomalyVisibility.ts'],
    bundle: true,
    format: 'esm',
    outfile: `${out}/qa-anomaly-visibility.js`,
});
await writeFile(
    `${out}/qa-anomaly-visibility.html`,
    '<!doctype html><meta charset="utf-8"><title>Anomaly visibility</title><style>body{background:#11162b;color:white;font:18px monospace}canvas{display:none}</style><p id="result">Checking actual canvas, worker and GPU coverage…</p><script type="module" src="qa-anomaly-visibility.js"></script>',
);
console.log('Anomaly visibility QA: http://localhost:3002/qa-anomaly-visibility.html');
