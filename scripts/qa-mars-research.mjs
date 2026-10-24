import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'dist/development/public';
await mkdir(out, { recursive: true });
await build({
    entryPoints: ['tests/browser/marsResearch.ts'],
    bundle: true,
    format: 'esm',
    outfile: `${out}/qa-mars-research.js`,
});
await writeFile(
    `${out}/qa-mars-research.html`,
    `<!doctype html><meta charset="utf-8"><title>Kepler expedition QA</title><style>body{margin:0;background:#10152b;color:white;font:14px monospace}#controls{position:relative;z-index:100001;background:#10152b}button{margin:3px;padding:8px}#stats{white-space:pre-wrap;position:relative;z-index:100001;background:#10152b;max-width:100vw}#stage{transform-origin:top left}</style><div id="controls"></div><div id="stats">Start...</div><div id="stage"></div><script type="module" src="qa-mars-research.js?v=${Date.now()}"></script>`,
);
console.log('Isolated Kepler QA: http://localhost:3002/qa-mars-research.html');
