import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
    CUES,
    cuePath,
    eventVolume,
    MissionAudio,
    voiceAdmission,
    type SoundCue,
} from '../frontend/game/systems/audioPolicy';

test('every selected cue has a real Ogg asset with a bounded volume', () => {
    for (const key of Object.keys(CUES) as SoundCue[]) {
        const path = `frontend/assets/${cuePath(key)}`;
        assert.ok(existsSync(path), path);
        assert.equal(readFileSync(path).subarray(0, 4).toString(), 'OggS');
        assert.ok(CUES[key].volume > 0 && CUES[key].volume <= 0.6);
    }
});

test('production imports match the source manifest, encoded files, loop boundaries and preload budget', () => {
    const recipe = JSON.parse(readFileSync('scripts/audio-assets.json', 'utf8'));
    const report = JSON.parse(readFileSync('docs/audio-assets.json', 'utf8'));
    assert.equal(recipe.sampleRate, 48000);
    assert.deepEqual(
        recipe.assets.map((a: { cue: string }) => a.cue).sort(),
        Object.keys(CUES).sort(),
    );
    let bytes = 0;
    for (const asset of report.assets) {
        const data = readFileSync(`frontend/assets/${cuePath(asset.cue)}`);
        assert.equal(createHash('sha256').update(data).digest('hex'), asset.outputSha256);
        assert.equal(data.length, asset.bytes);
        assert.ok(asset.peak > 0 && asset.peak <= 0.9);
        assert.ok(asset.rms > 0 && asset.rms < 0.18);
        assert.ok(asset.seconds > 0 && asset.seconds < 6);
        assert.equal(asset.loop ?? false, CUES[asset.cue as SoundCue].loop);
        if (asset.loop) assert.ok(asset.seam < 0.03, asset.cue);
        bytes += data.length;
    }
    assert.equal(report.assets.length, Object.keys(CUES).length);
    assert.ok(bytes < 300000);
});

test('voice budget reserves room for important signals and can evict the oldest ordinary effect without cutting a loop', () => {
    const normal = ['engine', 'mining', 'repair', ...Array(11).fill(null)] as (SoundCue | null)[];
    assert.equal(voiceAdmission('standard', normal).allow, false);
    assert.equal(voiceAdmission('complete', normal).allow, true);
    assert.equal(voiceAdmission('alarm', normal).allow, true);
    const full = [...normal, 'destroy', 'launch', 'hyperJump', 'hyperCharge'] as SoundCue[];
    const admission = voiceAdmission('alarm', full);
    assert.equal(admission.allow, true);
    assert.equal(admission.replace, 3);
    assert.deepEqual(voiceAdmission('engine', ['engine']), { allow: false });
    assert.deepEqual(voiceAdmission('complete', Array(18).fill('alarm')), { allow: false });
    assert.equal(voiceAdmission('click', Array(6).fill(null), true).allow, false);
    assert.equal(voiceAdmission('error', Array(6).fill(null), true).allow, true);
});
function rig() {
    const played: { cue: SoundCue; volume: number; loop: boolean; id: number }[] = [],
        stopped: number[] = [],
        volumes: { id: number; volume: number }[] = [];
    let enabled = true;
    const audio = new MissionAudio<number>(
        {
            play: (cue, volume, loop) => {
                const id = played.length + 1;
                played.push({ cue, volume, loop, id });
                return id;
            },
            stop: (id) => stopped.push(id),
            volume: (id, volume) => volumes.push({ id, volume }),
        },
        () => enabled,
    );
    return {
        audio,
        played,
        stopped,
        volumes,
        mute: () => {
            enabled = false;
        },
        unmute: () => {
            enabled = true;
        },
    };
}
const state = {
    ended: null,
    pendingChoice: null,
    thrusting: false,
    boosting: false,
    engineFault: false,
    laserBeams: [] as unknown[],
    repairProgress: 0,
};

test('engine, mining and welding use one loop each, update drive volume and stop on release', () => {
    const r = rig();
    const active = { ...state, thrusting: true, laserBeams: [{}], repairProgress: 1 };
    r.audio.update(active);
    for (let i = 0; i < 100; i++) r.audio.update(active);
    assert.equal(r.played.length, 3);
    assert.ok(r.played.every((p) => p.loop));
    r.audio.update({ ...active, boosting: true });
    assert.ok(r.volumes.some((v) => v.volume > CUES.engine.volume));
    r.audio.update(state);
    assert.deepEqual(r.stopped, [1, 2, 3]);
    r.audio.update(state);
    assert.equal(r.stopped.length, 3);
});

test('pause, mute, prototype selection and end stop loops; returning to flight starts fresh handles', () => {
    const r = rig();
    const active = { ...state, thrusting: true };
    r.audio.update(active);
    r.audio.pause();
    r.audio.pause();
    assert.deepEqual(r.stopped, [1]);
    r.audio.update(active);
    r.mute();
    r.audio.update(active);
    assert.deepEqual(r.stopped, [1, 2]);
    r.audio.event({ kind: 'hit', x: 0, y: 0 }, { x: 0, y: 0 }, 1);
    assert.equal(r.played.length, 2);
    r.unmute();
    r.audio.update(active);
    r.audio.update({ ...active, pendingChoice: {} });
    assert.equal(r.stopped.length, 3);
    r.audio.update(active);
    r.audio.update({ ...active, ended: 'destroyed' });
    assert.equal(r.stopped.length, 4);
});

test('simultaneous impacts and pickups are rate limited while the weapons retain distinct cues', () => {
    const r = rig();
    for (let i = 0; i < 50; i++)
        r.audio.event({ kind: 'hit', x: 0, y: 0, strength: 18 }, { x: 0, y: 0 }, 0);
    assert.equal(r.played.length, 1);
    r.audio.event({ kind: 'hit', x: 0, y: 0 }, { x: 0, y: 0 }, 0.2);
    assert.equal(r.played.length, 2);
    for (const sound of ['standard', 'pulse', 'rail', 'enemy', 'lancer'] as const)
        r.audio.event({ kind: 'shot', sound, x: 0, y: 0 }, { x: 0, y: 0 }, 1);
    assert.deepEqual(
        r.played.slice(2).map((p) => p.cue),
        ['standard', 'pulse', 'rail', 'enemy', 'lancer'],
    );
    r.audio.event({ kind: 'weld', x: 0, y: 0 }, { x: 0, y: 0 }, 3);
    assert.equal(r.played.length, 7);
    for (let i = 0; i < 50; i++) r.audio.event({ kind: 'collect', x: 0, y: 0 }, { x: 0, y: 0 }, 3);
    assert.equal(r.played.length, 8);
});

test('distant events are quiet or culled and harder hits sound stronger within the mix cap', () => {
    const event = { kind: 'hit', x: 0, y: 0, strength: 12 };
    const close = eventVolume(event, { x: 0, y: 0 }, 'hit');
    assert.ok(eventVolume({ ...event, strength: 48 }, { x: 0, y: 0 }, 'hit') > close);
    assert.ok(eventVolume(event, { x: 650, y: 0 }, 'hit') < close);
    assert.equal(eventVolume(event, { x: 1400, y: 0 }, 'hit'), 0);
    const r = rig();
    r.audio.event(event, { x: 1500, y: 0 }, 0);
    assert.equal(r.played.length, 0);
    r.audio.event(event, { x: 0, y: 0 }, 0);
    assert.equal(r.played.length, 1);
});

test('anomaly alarm owns one loop, ducks machinery and stops on exit, pause, mute or death', () => {
    const r = rig();
    const unsafe = {
        ...state,
        thrusting: true,
        anomalyMission: true,
        anomalyExposure: { contaminated: true },
    };
    r.audio.update(unsafe);
    for (let i = 0; i < 100; i++) r.audio.update(unsafe);
    assert.deepEqual(
        r.played.map((p) => p.cue),
        ['engine', 'alarm'],
    );
    assert.ok(r.played[0].volume < CUES.engine.volume);
    r.audio.update({ ...unsafe, anomalyExposure: { contaminated: false } });
    assert.deepEqual(r.stopped, [2]);
    assert.ok(r.volumes.some((v) => v.id === 1 && v.volume === CUES.engine.volume));
    r.audio.update(unsafe);
    r.audio.pause();
    assert.ok(r.stopped.includes(3));
    r.audio.update(unsafe);
    r.mute();
    r.audio.update(unsafe);
    assert.equal(r.stopped.length, r.played.length);
    r.unmute();
    r.audio.update(unsafe);
    r.audio.update({ ...unsafe, ended: 'destroyed' });
    assert.equal(r.stopped.length, r.played.length);
});

test('hyperdrive charge stops on cancellation or entry and transition cues never repeat per frame or after pause', () => {
    const r = rig();
    const charge = { ...state, thrusting: true, hyperdrive: { state: 'charging' } };
    r.audio.update(charge);
    for (let i = 0; i < 60; i++) r.audio.update(charge);
    assert.deepEqual(
        r.played.map((p) => p.cue),
        ['hyperCharge'],
    );
    r.audio.update({ ...charge, hyperdrive: { state: 'idle' } });
    assert.deepEqual(r.stopped, [1]);
    r.audio.update(charge);
    r.audio.update({ ...charge, hyperdrive: { state: 'transit' } });
    assert.equal(r.played.filter((p) => p.cue === 'hyperJump').length, 1);
    for (let i = 0; i < 60; i++) r.audio.update({ ...charge, hyperdrive: { state: 'transit' } });
    assert.equal(r.played.filter((p) => p.cue === 'hyperJump').length, 1);
    r.audio.pause();
    r.audio.update({ ...charge, hyperdrive: { state: 'transit' } });
    assert.equal(r.played.filter((p) => p.cue === 'hyperJump').length, 1);
});

test('muted hyperdrive changes do not play a late jump when sound is enabled', () => {
    const r = rig();
    r.mute();
    r.audio.update({ ...state, hyperdrive: { state: 'transit' } });
    r.unmute();
    r.audio.update({ ...state, hyperdrive: { state: 'transit' } });
    assert.equal(r.played.length, 0);
});

test('near combat ducks continuous machinery briefly and then restores its normal level', () => {
    const r = rig();
    r.audio.update({ ...state, thrusting: true, elapsed: 1 });
    r.audio.event({ kind: 'shot', sound: 'enemy', x: 10, y: 0 }, { x: 0, y: 0 }, 1);
    r.audio.update({ ...state, thrusting: true, elapsed: 1.1 });
    assert.ok(r.volumes.at(-1)!.volume < CUES.engine.volume);
    r.audio.update({ ...state, thrusting: true, elapsed: 1.3 });
    assert.equal(r.volumes.at(-1)!.volume, CUES.engine.volume);
});
