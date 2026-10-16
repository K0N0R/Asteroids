import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, recordLunarDefense } from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function foundationCampaign() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const id of [
        'earth-supply',
        'earth-relay',
        'earth-workshop',
        'earth-route',
        'lunar-survey',
        'lunar-foundation',
    ]) {
        const t = STORY_TASKS.find((t) => t.id === id)!;
        c.story!.progress[id] = t.target;
        c.story!.claimed.push(id);
    }
    c.story!.sector = 'lunar';
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    s.ship.setAngvel(0, true);
}
function enter(s: MissionSimulation) {
    at(s, MOON.entrance);
    s.step(idle);
    for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
    assert.equal(s.area, 'surface');
    while (s.transferActive) s.step(idle);
    at(s, MOON.construction);
    s.step(idle);
}
function start(s: MissionSimulation) {
    for (let i = 0; i < 125; i++) s.step({ ...idle, sabotage: true });
    assert.ok(s.lunarDefense.active);
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const distance = Math.hypot(dx, dy),
        stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}

test('unopposed waves damage the construction and failure can be retried without consuming deliveries', () => {
    const c = foundationCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        for (let i = 0; i < 60 * 90 && s.lunarDefense.active; i++) {
            s.step({ ...idle, sabotage: true });
            s.events.length = 0;
        }
        assert.equal(s.lunarDefense.state, 'failed');
        assert.equal(s.lunarDefense.health, 0);
        assert.equal(s.lunarDefense.impacts, 4);
        assert.equal(s.lunarDefense.threats.size, 0);
        assert.equal([...s.rocks.values()].filter((r) => r.defense).length, 0);
        assert.equal(s.loot.size, 0);
        assert.equal(c.story!.progress['lunar-foundation'], 160);
        assert.equal(c.story!.progress['lunar-defense'], 0);
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
        for (let i = 0; i < 125; i++) s.step({ ...idle, sabotage: true });
        assert.equal(s.lunarDefense.state, 'failed');
        // A new key press, rather than a held start, is required after a failed attempt.
        s.step(idle);
        at(s, MOON.construction);
        start(s);
        assert.equal(s.lunarDefense.health, 100);
        assert.equal(s.lunarDefense.wave, 1);
    } finally {
        s.dispose();
    }
});

test('the stock Prospector can defend all three waves using actual flight and weapons, with a one-time persistent reward', () => {
    const c = foundationCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        for (let frame = 0; frame < 60 * 180 && s.lunarDefense.active && !s.ended; frame++) {
            const incoming = [...s.lunarDefense.threats.keys()]
                .map((id) => s.rocks.get(id))
                .filter((r) => r !== undefined)
                .sort((a, b) => {
                    const ap = a.body.translation(),
                        bp = b.body.translation();
                    return (
                        Math.hypot(
                            ap.x * 100 - MOON.construction.x,
                            ap.y * 100 - MOON.construction.y,
                        ) -
                        Math.hypot(
                            bp.x * 100 - MOON.construction.x,
                            bp.y * 100 - MOON.construction.y,
                        )
                    );
                })[0];
            if (incoming) {
                const rp = incoming.body.translation();
                s.step({
                    ...steer(s, { x: rp.x * 100, y: rp.y * 100 }, 110),
                    fire: true,
                    mine: true,
                });
            } else s.step(steer(s, MOON.construction, 190));
            s.events.length = 0;
        }
        assert.equal(s.ended, null);
        assert.equal(s.lunarDefense.state, 'complete', `${s.lunarDefense.summary}, ship ${s.hull}`);
        assert.ok(s.lunarDefense.health > 0);
        assert.ok(s.lunarDefense.destroyed >= 6);
        assert.equal(c.story!.progress['lunar-defense'], 1);
        assert.deepEqual(c.bank, { ore: 20, parts: 4 });
        assert.equal(recordLunarDefense(c), null);
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.ok(s.deliveryRevision > 1);
        finishRun(c, false, s.cargo, s.elapsed, 'lost', 0, { lossPosition: s.position });
        assert.equal(c.story!.progress['lunar-defense'], 1);
        assert.deepEqual(c.bank, { ore: 20, parts: 4 });
    } finally {
        s.dispose();
    }
});

test('leaving the surface aborts the attempt and removes only its own threats', () => {
    const c = foundationCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        for (let i = 0; i < 360; i++) s.step(idle);
        assert.ok(s.lunarDefense.threats.size > 0);
        const ordinary = [...s.rocks.values()].filter((r) => !r.defense).length;
        at(s, MOON.exit);
        s.step(idle);
        for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
        assert.equal(s.area, 'orbit');
        assert.equal(s.lunarDefense.state, 'failed');
        assert.equal(s.lunarDefense.threats.size, 0);
        assert.equal([...s.rocks.values()].filter((r) => !r.defense).length, ordinary);
        assert.equal(c.story!.progress['lunar-defense'], 0);
        assert.equal(c.story!.progress['lunar-foundation'], 160);
    } finally {
        s.dispose();
    }
});

test('defense requires foundations, a deliberate quiet start and cannot be started again after completion', () => {
    const c = foundationCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        for (let i = 0; i < 150; i++) s.step({ ...idle, sabotage: true, mine: true });
        assert.equal(s.lunarDefense.state, 'idle');
        c.story!.claimed = c.story!.claimed.filter((id) => id !== 'lunar-foundation');
        c.story!.progress['lunar-foundation'] = 0;
        for (let i = 0; i < 150; i++) s.step({ ...idle, sabotage: true });
        assert.equal(s.lunarDefense.state, 'idle');
        c.story!.progress['lunar-foundation'] = 160;
        c.story!.claimed.push('lunar-foundation');
        recordLunarDefense(c);
        for (let i = 0; i < 150; i++) s.step({ ...idle, sabotage: true });
        assert.equal(s.lunarDefense.state, 'idle');
        assert.equal(s.defenseAvailable, false);
    } finally {
        s.dispose();
    }
});

test('refresh during a wave keeps construction deliveries but does not grant a defense victory', () => {
    const c = foundationCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        for (let i = 0; i < 360; i++) s.step(idle);
        const restored = parseCampaign(JSON.stringify(c))!;
        assert.ok(restored);
        finishRun(restored, false, { ore: 0, parts: 0 }, 0, 'refresh');
        assert.equal(restored.story!.progress['lunar-defense'], 0);
        assert.equal(restored.story!.progress['lunar-foundation'], 160);
        assert.deepEqual(restored.bank, { ore: 0, parts: 0 });
        assert.ok(parseCampaign(JSON.stringify(restored)));
    } finally {
        s.dispose();
    }
});
