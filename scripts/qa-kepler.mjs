import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'dist/development/public';
await mkdir(out, { recursive: true });
await build({
    entryPoints: ['tests/browser/kepler.ts'],
    bundle: true,
    format: 'esm',
    outfile: `${out}/qa-kepler.js`,
});
await writeFile(
    `${out}/qa-kepler.html`,
    `<!doctype html><meta charset="utf-8"><title>Kepler QA</title>
<style>body{margin:0;background:#10152b;color:#b5f0dc;font:14px sans-serif}button{padding:8px;margin:4px}#stats{padding:8px}canvas{display:block}</style>
<div id="controls"></div><div id="stats">Start…</div><div id="stage"></div><script type="module" src="qa-kepler.js"></script>`,
);
console.log('http://localhost:3002/qa-kepler.html');
