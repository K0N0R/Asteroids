import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
    CUES,
    cuePath,
    eventVolume,
    MissionAudio,
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
