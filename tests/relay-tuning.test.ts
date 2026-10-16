import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { RelayTuning } from '../frontend/game/systems/relayTuning';
import { MissionSimulation } from '../frontend/game/systems/mission';
import {
    newStoryCampaign,
    newCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { solveRelay } from './relay-helper';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function atRelay() {
    const c = newStoryCampaign();
    beginRun(c, 1, null, false, 'earth-relay');
    const s = new MissionSimulation(c, 1);
    const site = s.landmarks.find((l) => l.siteId === 'relay')!;
    s.ship.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    return { c, s, site };
}

test('phase tuning has deterministic unsolved channels, cyclic adjustment, failed confirmation and valid completion', () => {
    const t = new RelayTuning(1234),
        same = new RelayTuning(1234);
    assert.deepEqual(t.phases, same.phases);
    assert.ok(t.matched.every((v) => !v));
    assert.equal(t.act({ confirm: true }), false);
    assert.equal(t.attempts, 1);
    const before = [...t.phases];
    for (let i = 0; i < 8; i++) t.act({ channel: 0, delta: 1 });
    assert.deepEqual(t.phases, before);
    t.act({ channel: 99, delta: 1 });
    assert.deepEqual(t.phases, before);
    for (let channel = 0; channel < 3; channel++)
        for (let n = 0; n < 8 && t.phases[channel] !== t.targets[channel]; n++)
            t.act({ channel, delta: -1 });
    assert.equal(t.act({ confirm: true }), true);
});

test('holding E cannot complete relay; correct tuning supplies data only for the flight until safe return', () => {
    const { c, s } = atRelay();
    try {
        for (let i = 0; i < 240; i++) s.step({ ...idle, interact: true });
        assert.ok(s.relayTuning);
        assert.ok(s.elapsed >= 3.9);
        assert.equal(s.scanProgress, 0);
        assert.equal(s.surveyData.has('relay'), false);
        assert.ok(s.missionReturnBlocked);
        assert.equal(s.relayAction({ confirm: true }), false);
        assert.equal(s.surveyData.has('relay'), false);
        solveRelay(s);
        assert.equal(s.relayTuning, null);
        assert.ok(s.surveyData.has('relay'));
        assert.equal(c.story!.progress['earth-relay'], 0);
        assert.equal(s.missionReturnBlocked, false);
        assert.equal(s.relayAction({ confirm: true }), false);
        assert.equal(parseCampaign(JSON.stringify(c))!.story!.progress['earth-relay'], 0);
        s.ship.setTranslation({ x: 0, y: 0 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 100 && !s.ended; i++) s.step({ ...idle, interact: true });
        assert.equal(s.ended, 'returned');
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        assert.equal(c.story!.progress['earth-relay'], 1);
    } finally {
        s.dispose();
    }
});

test('cancel requires a fresh E press and retries do not consume resources or retain a solved channel', () => {
    const { c, s } = atRelay();
    try {
        const bank = structuredClone(c.bank);
        s.step({ ...idle, interact: true });
        const old = s.relayTuning!;
        s.relayAction({ channel: 0, delta: 1 });
        s.relayAction({ cancel: true });
        for (let i = 0; i < 60; i++) s.step({ ...idle, interact: true });
        assert.equal(s.relayTuning, null);
        s.step(idle);
        s.step({ ...idle, interact: true });
        assert.ok(s.relayTuning);
        assert.notEqual(s.relayTuning, old);
        assert.ok(s.relayTuning.matched.every((v) => !v));
        assert.deepEqual(c.bank, bank);
    } finally {
        s.dispose();
    }
});

test('leaving range or using weapons cancels without granting data and rejects late confirmation', () => {
    for (const reason of ['range', 'fire'] as const) {
        const { s } = atRelay();
        try {
            s.step({ ...idle, interact: true });
            assert.ok(s.relayTuning);
            if (reason === 'range') s.ship.setTranslation({ x: 0, y: 0 }, true);
            s.step({ ...idle, fire: reason === 'fire' });
            assert.equal(s.relayTuning, null);
            assert.equal(s.relayAction({ confirm: true }), false);
            assert.equal(s.surveyData.has('relay'), false);
        } finally {
            s.dispose();
        }
    }
});

test('a real enemy shot interrupts tuning while simulation time continues', () => {
    const { s } = atRelay();
    try {
        s.step({ ...idle, interact: true });
        assert.ok(s.relayTuning);
        const p = s.position;
        s.kineticShield.charge = 0;
        s.bullets.set(9999, {
            id: 9999,
            x: p.x + 90,
            y: p.y,
            vx: -6000,
            vy: 0,
            damage: 12,
            team: 'enemy',
            life: 1,
        });
        const elapsed = s.elapsed,
            hull = s.hull;
        s.step(idle);
        assert.ok(s.elapsed > elapsed);
        assert.ok(s.hull < hull);
        assert.equal(s.relayTuning, null);
        assert.equal(s.surveyData.has('relay'), false);
    } finally {
        s.dispose();
    }
});

test('test-mode relay retains ordinary scanning without opening the story minigame', () => {
    const c = newCampaign();
    const s = new MissionSimulation(c, 1);
    try {
        const site = s.landmarks.find((l) => l.siteId === 'relay')!;
        s.ship.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
        for (let i = 0; i < 190; i++) s.step({ ...idle, interact: true });
        assert.equal(s.relayTuning, null);
        assert.ok(s.surveyData.has('relay'));
    } finally {
        s.dispose();
    }
});
