import fs from 'node:fs/promises';

// Original procedural effects, generated as PCM WAV. No external media needed.
const sampleRate = 22050;
let noiseState = 719;
const noise = () => {
    noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
    return (noiseState / 0x100000000) * 2 - 1;
};
const effects = {
    shot: {
        duration: 0.13,
        sample: (t, u) => Math.sin(2 * Math.PI * (900 * t - 1800 * t * t)) * Math.exp(-u * 6) * 0.4,
    },
    hit: { duration: 0.13, sample: (_t, u) => noise() * Math.exp(-u * 8) * 0.4 },
    break: {
        duration: 0.3,
        sample: (t, u) => (noise() * 0.7 + Math.sin(t * 420) * 0.3) * Math.exp(-u * 7) * 0.6,
    },
    collect: {
        duration: 0.2,
        sample: (t, u) =>
            (Math.sin(t * 2 * Math.PI * 1046) + Math.sin(t * 2 * Math.PI * 1568) * 0.3) *
            Math.sin(Math.PI * u) *
            Math.exp(-u * 4) *
            0.3,
    },
};
await fs.mkdir('frontend/assets/sounds', { recursive: true });
for (const [name, effect] of Object.entries(effects)) {
    const samples = Math.ceil(sampleRate * effect.duration),
        wav = Buffer.alloc(44 + samples * 2);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(samples * 2, 40);
    for (let i = 0; i < samples; i++) {
        const fadeIn = Math.min(1, i / 100);
        wav.writeInt16LE(
            Math.round(
                Math.max(-1, Math.min(1, effect.sample(i / sampleRate, i / samples) * fadeIn)) *
                    32767,
            ),
            44 + i * 2,
        );
    }
    await fs.writeFile(`frontend/assets/sounds/${name}.wav`, wav);
}
