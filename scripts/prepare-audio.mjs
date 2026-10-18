import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Rebuild imported effects without touching the user's original sound packs.
// node scripts/prepare-audio.mjs [source-directory] [ffmpeg-executable]
const sourceRoot = path.resolve(process.argv[2] ?? '../asteroids-sounds');
const ffmpeg = process.argv[3] ?? 'ffmpeg';
const config = JSON.parse(await fs.readFile('scripts/audio-assets.json', 'utf8'));
const output = path.resolve(config.output);
const expectedOutput = path.resolve('frontend/assets/sounds/cc0/production076');
if (output !== expectedOutput) throw new Error('Unexpected audio output directory');
await fs.mkdir(output, { recursive: true });
const rate = config.sampleRate;
const metrics = [];
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const decode = (input, extra = []) =>
    execFileSync(
        ffmpeg,
        ['-v', 'error', '-i', input, ...extra, '-ac', '1', '-ar', `${rate}`, '-f', 'f32le', '-'],
        { maxBuffer: 128 * 1024 * 1024 },
    );
function samples(bytes) {
    const a = new Float32Array(bytes.length / 4);
    for (let i = 0; i < a.length; i++) a[i] = bytes.readFloatLE(i * 4);
    return a;
}
function levels(a) {
    let peak = 0,
        square = 0;
    for (const x of a) {
        peak = Math.max(peak, Math.abs(x));
        square += x * x;
    }
    return { peak, rms: Math.sqrt(square / a.length) };
}
for (const asset of config.assets) {
    if (!/^[a-zA-Z]+$/.test(asset.cue)) throw new Error('Invalid cue name');
    const source = path.resolve(sourceRoot, asset.source);
    if (!source.startsWith(sourceRoot + path.sep)) throw new Error('Source outside supplied packs');
    const original = await fs.readFile(source);
    let a = samples(
        decode(source, [
            '-af',
            asset.cue === 'engine' ? 'highpass=f=55,lowpass=f=420' : 'highpass=f=45',
        ]),
    );
    if (!a.length || a.some((x) => !Number.isFinite(x)))
        throw new Error(`Invalid samples: ${asset.source}`);
    if (asset.loop) {
        // Blend end into start, then place the splice inside the loop. The outer
        // boundary joins two adjacent original samples instead of two unrelated ends.
        const overlap = Math.min(Math.round(rate * 0.04), Math.floor(a.length / 4));
        const joined = new Float32Array(a.length - overlap);
        joined.set(a.subarray(overlap, a.length - overlap));
        for (let i = 0; i < overlap; i++) {
            const t = (i + 1) / overlap;
            joined[joined.length - overlap + i] = a[a.length - overlap + i] * (1 - t) + a[i] * t;
        }
        a = joined;
        // A short boundary guard also absorbs lossy-codec ringing on bright alarms.
        const guard = Math.min(Math.round(rate * 0.003), Math.floor(a.length / 4));
        for (let i = 0; i < guard; i++) {
            a[i] *= i / guard;
            a[a.length - 1 - i] *= i / guard;
        }
    } else {
        const { peak } = levels(a);
        let first = 0,
            last = a.length;
        while (first < last && Math.abs(a[first]) < Math.max(0.0001, peak * 0.01)) first++;
        while (last > first && Math.abs(a[last - 1]) < Math.max(0.0001, peak * 0.003)) last--;
        first = Math.max(0, first - Math.round(rate * 0.003));
        last = Math.min(
            a.length,
            last + Math.round(rate * 0.02),
            first + Math.round(rate * asset.maxSeconds),
        );
        a = a.slice(first, last);
        const fade = Math.min(Math.round(rate * 0.01), Math.floor(a.length / 4));
        for (let i = 0; i < fade; i++) a[a.length - 1 - i] *= i / fade;
        for (let i = 0; i < Math.min(96, a.length); i++) a[i] *= i / 96;
    }
    const { peak, rms } = levels(a);
    const gain = Math.min(0.68 / peak, (asset.loop ? 0.12 : 0.14) / rms);
    for (let i = 0; i < a.length; i++) a[i] *= gain;
    const pcm = Buffer.alloc(a.length * 4);
    for (let i = 0; i < a.length; i++) pcm.writeFloatLE(a[i], i * 4);
    const target = path.join(output, `${asset.cue}.ogg`);
    execFileSync(
        ffmpeg,
        [
            '-y',
            '-v',
            'error',
            '-f',
            'f32le',
            '-ar',
            `${rate}`,
            '-ac',
            '1',
            '-i',
            '-',
            '-c:a',
            'libvorbis',
            '-q:a',
            '4',
            target,
        ],
        { input: pcm, maxBuffer: 8 * 1024 * 1024 },
    );
    const encoded = await fs.readFile(target),
        decoded = samples(decode(target));
    const result = levels(decoded);
    if (result.peak > 0.9) throw new Error(`Encoded peak too high: ${asset.cue}`);
    if (asset.loop && Math.abs(decoded[0] - decoded[decoded.length - 1]) > 0.03)
        throw new Error(`Encoded loop boundary too abrupt: ${asset.cue}`);
    metrics.push({
        ...asset,
        sourceSha256: digest(original),
        outputSha256: digest(encoded),
        bytes: encoded.length,
        seconds: decoded.length / rate,
        peak: result.peak,
        rms: result.rms,
        seam: asset.loop ? Math.abs(decoded[0] - decoded[decoded.length - 1]) : null,
    });
}
await fs.writeFile(
    'docs/audio-assets.json',
    JSON.stringify({ sampleRate: rate, assets: metrics }, null, 2) + '\n',
);
console.log(
    `Prepared ${metrics.length} effects, ${metrics.reduce((n, a) => n + a.bytes, 0)} bytes. Originals unchanged.`,
);
