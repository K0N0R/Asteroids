import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { EarthGuide, earthGuideGoal } from '../frontend/game/systems/earthGuide';
import {
    newStoryCampaign,
    newCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function grant(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const t = STORY_TASKS.find((t) => t.id === id)!;
    for (const d of t.dependencies) if (!c.story!.claimed.includes(d)) grant(c, d);
    if (!c.story!.claimed.includes(id)) {
        c.story!.claimed.push(id);
        c.story!.progress[id] = t.target;
    }
}
function run() {
    const c = newStoryCampaign();
    beginRun(c, 1);
    return { c, s: new MissionSimulation(c, c.activeRun!.seed) };
}

test('only unfinished Earth training has a second Prospector, without taking a roster slot', () => {
    const { c, s } = run();
    try {
        assert.ok(s.guide);
        assert.equal(s.guide.health, 65);
        assert.equal(c.pilots.length, 1);
        assert.equal(c.reserveShips.length, 0);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
    for (const profile of ['legacy', 'finished', 'moon']) {
        const c = profile === 'legacy' ? newCampaign() : newStoryCampaign();
        if (profile !== 'legacy') {
            grant(c, 'earth-route');
            grant(c, 'earth-workshop');
            c.station.workshopLevel = 1;
            c.station.laboratoryLevel = Math.max(
                c.station.laboratoryLevel,
                c.station.workshopLevel,
            );
            if (profile === 'moon') c.story!.sector = 'lunar';
        }
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            assert.equal(s.guide, null);
        } finally {
            s.dispose();
        }
    }
});

test('goals follow the real task, carried resources and selected mission without changing progress', () => {
    const c = newStoryCampaign(),
        empty = { ore: 0, parts: 0 };
    assert.equal(earthGuideGoal(c, empty).id, 'mining');
    assert.equal(earthGuideGoal(c, { ore: 24, parts: 0 }).id, 'delivery');
    grant(c, 'earth-supply');
    assert.equal(earthGuideGoal(c, empty).id, 'relay');
    grant(c, 'earth-relay');
    assert.equal(earthGuideGoal(c, empty).id, 'workshop');
    grant(c, 'earth-workshop');
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    assert.equal(earthGuideGoal(c, empty).id, 'moon-gate');
    grant(c, 'earth-route');
    assert.equal(earthGuideGoal(c, empty).id, 'return');
    const selected = newStoryCampaign();
    beginRun(selected, 1, null, false, 'earth-relay');
    assert.equal(earthGuideGoal(selected, empty).id, 'relay');
    assert.equal(selected.story!.progress['earth-relay'], 0);
});

test('real guidance reaches the mining field without granting tasks, cargo or repeated hints', () => {
    const { c, s } = run();
    try {
        const before = JSON.stringify(c.story),
            bank = structuredClone(c.bank);
        for (let i = 0; i < 60 * 30; i++) {
            s.step(idle);
            s.events.length = 0;
        }
        assert.equal(s.ended, null);
        assert.ok(['research', 'travel', 'waiting'].includes(s.guide!.state));
        assert.ok(Math.hypot(s.guide!.position.x - 880, s.guide!.position.y) < 1000);
        assert.equal(JSON.stringify(c.story), before);
        assert.deepEqual(c.bank, bank);
        assert.equal(s.cargo.ore, 0);
        assert.equal(new Set(s.guideMessages).size, s.guideMessages.length);
        assert.equal(
            s.guideMessages.filter((text) => text.includes('Celuj myszą w skały')).length,
            1,
        );
    } finally {
        s.dispose();
    }
});

test('instructor turns towards a real asteroid, fires from his laser and leaves ore for the player', () => {
    const { c, s } = run();
    try {
        const guide = s.guide!;
        const rock = [...s.rocks.values()][0];
        for (const other of [...s.rocks.values()]) {
            if (other === rock) continue;
            s.world.removeRigidBody(other.body);
            s.rocks.delete(other.id);
            s.asteroidColliders.delete(other.collider.handle);
        }
        rock.body.setTranslation({ x: 10.5, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        rock.health = 8;
        guide.body.setTranslation({ x: 8.8, y: 0 }, true);
        guide.body.setRotation(Math.PI, true);
        guide.state = 'research';
        let firing = false;
        for (let i = 0; i < 60 * 15 && s.rocks.has(rock.id); i++) {
            s.step(idle);
            firing ||= guide.beams.length === 1;
            s.events.length = 0;
        }
        assert.ok(firing, 'the visible beam must accompany actual asteroid damage');
        assert.equal(s.rocks.has(rock.id), false);
        assert.ok([...s.loot.values()].some((l) => l.source === 'asteroid'));
        assert.ok(guide.minedOre > 0 && guide.minedOre <= 2);
        assert.ok([...s.loot.values()].filter((l) => l.kind === 'ore').length <= 2);
        assert.equal(s.cargo.ore, 0);
        assert.equal(c.story!.progress['earth-supply'], 0);
        s.cargo.ore = 24;
        s.step(idle);
        assert.equal(guide.beams.length, 0, 'stop firing when guiding a delivery');
    } finally {
        s.dispose();
    }
});

test('physical route planning avoids a large asteroid, reaches the approach and leaves resources untouched', () => {
    const world = new RAPIER.World({ x: 0, y: 0 }),
        c = newStoryCampaign(),
        cargo = { ore: 0, parts: 0 };
    const g = new EarthGuide(world, c, cargo),
        messages: string[] = [];
    const obstacle = { x: 560, y: 0, radius: 105 };
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(5.6, 0));
    world.createCollider(RAPIER.ColliderDesc.ball(1.05), body);
    let clearance = Infinity;
    try {
        for (let i = 0; i < 60 * 35; i++) {
            g.guide(1 / 60, c, cargo, g.position, [obstacle], (t) => messages.push(t));
            world.step();
            clearance = Math.min(clearance, Math.hypot(g.position.x - 560, g.position.y) - 105);
        }
        assert.equal(g.state, 'research');
        assert.ok(clearance > 25);
        assert.equal(messages.length, 1);
        assert.equal(c.story!.progress['earth-supply'], 0);
    } finally {
        g.dispose();
        world.free();
    }
});

test('instructor silently ignores player range without teleporting', () => {
    const world = new RAPIER.World({ x: 0, y: 0 }),
        c = newStoryCampaign(),
        cargo = { ore: 0, parts: 0 };
    const g = new EarthGuide(world, c, cargo),
        messages: string[] = [];
    try {
        const start = { ...g.position };
        for (let i = 0; i < 300; i++) {
            g.guide(1 / 60, c, cargo, { x: 4000, y: 0 }, [], (t) => messages.push(t));
            world.step();
        }
        assert.notEqual(g.waitingReason, 'player');
        assert.ok(Math.hypot(g.position.x - start.x, g.position.y - start.y) > 100);
        assert.equal(messages.filter((t) => t.includes('Oddaliliśmy')).length, 0);
        for (let i = 0; i < 300; i++) {
            g.guide(1 / 60, c, cargo, g.position, [], (t) => messages.push(t));
            world.step();
        }
        assert.notEqual(g.waitingReason, 'player');
        assert.equal(messages.filter((t) => t.includes('Widzę')).length, 0);
        assert.ok(Math.hypot(g.position.x - start.x, g.position.y - start.y) > 100);
    } finally {
        g.dispose();
        world.free();
    }
});

test('a real hostile projectile can destroy the guide without losing the player or blocking radio reports', () => {
    const { c, s } = run();
    try {
        const g = s.guide!;
        g.body.setTranslation({ x: 9.5, y: 5 }, true);
        s.bullets.set(99999, {
            id: 99999,
            x: 1030,
            y: 500,
            vx: -6000,
            vy: 0,
            team: 'enemy',
            damage: 999,
            life: 1,
        });
        s.step(idle);
        assert.equal(g.state, 'destroyed');
        assert.equal(g.health, 0);
        assert.equal(s.ended, null);
        assert.equal(c.pilots.length, 1);
        assert.equal(c.story!.progress['earth-supply'], 0);
        const count = s.guideMessages.filter((t) => t.includes('Sygnał instruktora')).length;
        assert.equal(count, 1);
        s.surveyData.add('relay');
        for (let i = 0; i < 120; i++) {
            s.step(idle);
            s.events.length = 0;
        }
        assert.equal(c.story!.progress['earth-relay'], 1);
        assert.equal(s.guideMessages.filter((t) => t.includes('Sygnał instruktora')).length, 1);
        assert.ok(finishRun(c, true, s.cargo, s.elapsed, 'return', s.repairKits, s.missionReport));
        beginRun(c, 1);
        const next = new MissionSimulation(c, c.activeRun!.seed);
        try {
            assert.ok(next.guide);
            assert.equal(next.guide!.health, 65);
        } finally {
            next.dispose();
        }
    } finally {
        s.dispose();
    }
});

test('after route confirmation the instructor returns physically even when the player stays far away', () => {
    const world = new RAPIER.World({ x: 0, y: 0 }),
        c = newStoryCampaign(),
        cargo = { ore: 0, parts: 0 };
    const g = new EarthGuide(world, c, cargo);
    g.body.setTranslation({ x: -15.5, y: 7 }, true);
    grant(c, 'earth-route');
    try {
        const messages: string[] = [];
        for (let i = 0; i < 60 * 35; i++) {
            g.guide(1 / 60, c, cargo, { x: -4500, y: 0 }, [], (t) => messages.push(t));
            world.step();
        }
        assert.equal(g.state, 'complete');
        assert.ok(Math.hypot(g.position.x - 400, g.position.y + 140) < 100);
        assert.ok(g.departure > 2);
        assert.equal(messages.length, 1);
    } finally {
        g.dispose();
        world.free();
    }
});
