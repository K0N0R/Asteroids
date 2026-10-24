import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'dist/development/public';
await mkdir(out, { recursive: true });
await build({
    entryPoints: ['tests/browser/stability.ts'],
    bundle: true,
    format: 'esm',
    outfile: `${out}/qa-stability.js`,
});
await writeFile(
    `${out}/qa-stability.html`,
    `<!doctype html>
<meta charset="utf-8"><title>Stability route QA</title>
<style>
body{margin:0;background:#10152b;color:white;font:14px monospace}
#controls{position:relative;z-index:100001;background:#10152b}
button{margin:3px;padding:8px}
#stats{white-space:pre-wrap;position:relative;z-index:100001;background:#10152b;max-width:100vw}
#stage{transform-origin:top left}
</style>
<div id="controls"></div><div id="stats">Start...</div><div id="stage"></div>
<script type="module" src="qa-stability.js"></script>`,
);
console.log('Isolated QA: http://localhost:3002/qa-stability.html (development server required)');
