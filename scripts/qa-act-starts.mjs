import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'dist/development/public';
await mkdir(out, { recursive: true });
await build({
    entryPoints: ['tests/browser/actStarts.ts'],
    bundle: true,
    format: 'esm',
    define: { DEBUG: 'true' },
    outfile: `${out}/qa-act-starts.js`,
});
await writeFile(
    `${out}/qa-act-starts.html`,
    `<!doctype html><meta charset="utf-8"><title>Act starts QA</title><style>body{margin:0;background:#10152b;color:white;font:12px monospace}#qa-controls{position:fixed;top:0;z-index:200000}#qa-state{position:fixed;top:30px;left:0;right:0;z-index:200000;background:#10152bee;pointer-events:none;white-space:pre-wrap}button{padding:5px;margin-right:4px}</style><div id="qa-controls"></div><div id="qa-state">Start...</div><script type="module" src="qa-act-starts.js?v=${Date.now()}"></script>`,
);
console.log('Isolated act reset QA: http://localhost:3002/qa-act-starts.html');
