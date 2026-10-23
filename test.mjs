import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const entries = readdirSync('tests').filter(
    (name) =>
        name.endsWith('.test.ts') &&
        (!process.env.TEST_FILES || new RegExp(process.env.TEST_FILES).test(name)),
);

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
    [
        '--test',
        '--test-concurrency=4',
        ...(process.env.TEST_TIMEOUT ? [`--test-timeout=${Number(process.env.TEST_TIMEOUT)}`] : []),
        ...(process.env.TEST_REPORTER ? [`--test-reporter=${process.env.TEST_REPORTER}`] : []),
        ...entries.map((name) => `dist/tests/${name.replace(/\.ts$/, '.cjs')}`),
    ],
    {
        stdio: 'inherit',
    },
);
process.exitCode = result.status ?? 1;
