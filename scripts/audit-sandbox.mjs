import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

await build({
    entryPoints: ['scripts/audit-sandbox.ts'],
    bundle: true,
    platform: 'node',
    packages: 'external',
    outfile: 'dist/audit-sandbox.cjs',
});
const result = spawnSync(process.execPath, ['dist/audit-sandbox.cjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
