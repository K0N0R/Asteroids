import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const entries = readdirSync('tests').filter((name) => name.endsWith('.test.ts'));

await build({
    entryPoints: entries.map((name) => `tests/${name}`),
    bundle: true,
    platform: 'node',
    packages: 'external',
    outdir: 'dist/tests',
    outExtension: { '.js': '.cjs' },
});
const result = spawnSync(
    process.execPath,
    ['--test', ...entries.map((name) => `dist/tests/${name.replace(/\.ts$/, '.cjs')}`)],
    {
        stdio: 'inherit',
    },
);
process.exitCode = result.status ?? 1;
