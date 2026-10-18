import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { driftingField } from '../frontend/game/worlds/asteroidFields';
import { segmentDistance } from '../frontend/game/systems/hyperdrive';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const lanes = [{ name: 'Test', a: { x: 0, y: -500 }, b: { x: 0, y: -4100 } }];
const center = { x: 0, y: -4500 };
const idle = {
    target: { x: 1000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function campaign() {
    const c = newStoryCampaign();
    c.story!.claimed.push('earth-supply', 'earth-relay', 'earth-workshop');
    c.station.workshop = 1;
    return c;
}

test('cluster generation keeps its ore budget and drift clearance across 100 seeds', () => {
    for (let seed = 1; seed <= 100; seed++) {
        const rocks = driftingField(seed, center, lanes);
        assert.deepEqual(rocks, driftingField(seed, center, lanes));
        assert.equal(rocks.length, 12);
        assert.equal(rocks.filter((r) => r.copper).length, 4);
        assert.equal(rocks.filter((r) => r.rich).length, 12);
        for (const r of rocks) {
            assert.ok(Math.hypot(r.x - center.x, r.y - center.y) < 410);
            assert.ok(
                segmentDistance(r, lanes[0].a, lanes[0].b) > r.radius + r.drift!.radius + 150,
            );
            for (const other of rocks.filter((o) => o !== r)) {
                assert.ok(Math.hypot(r.x - other.x, r.y - other.y) > r.radius + other.radius + 25);
            }
        }
        assert.equal(new Set(rocks.map((r) => Math.round(r.x))).size >= 10, true);
        assert.equal(new Set(rocks.map((r) => Math.round(r.y))).size >= 10, true);
    }
    assert.notDeepEqual(driftingField(1, center, lanes), driftingField(2, center, lanes));
});

test('story starter rocks lose grid rows while fixed objectives and surface outcrops stay separate', () => {
    const fresh = newStoryCampaign();
    const a = generateStorySector(fresh.story!);
    assert.deepEqual(a, generateStorySector(fresh.story!));
    const starter = a.rocks.filter((r) => r.x > 1000 && r.x < 1300 && Math.abs(r.y) < 190);
    assert.ok(starter.length >= 6);
    assert.ok(new Set(starter.map((r) => Math.round(r.y))).size >= 6);
    assert.ok(a.rocks.every((r) => !r.drift));
    const expanded = generateStorySector(campaign().story!);
    assert.equal(expanded.rocks.filter((r) => r.drift).length, 12);
    assert.ok(
        expanded.rocks
            .filter((r) => r.drift)
            .every((r) => !r.anchored && !r.mercuryVein && !r.beltBarrier),
    );
    const lunar = newStoryCampaign();
    lunar.story!.sector = 'lunar';
    lunar.story!.claimed.push('lunar-survey');
    const moon = generateStorySector(lunar.story!);
    assert.ok(moon.rocks.some((r) => r.anchored));
    assert.ok(moon.rocks.every((r) => !r.drift));
});

test('actual Rapier drift stays local for three minutes without closing either hyperlane', () => {
    const c = campaign();
    beginRun(c, 1);
    const sim = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const moving = [...sim.rocks.values()].filter((r) => r.drift);
        assert.equal(moving.length, 12);
        const starts = moving.map((r) => ({ ...r.previous }));
        let maxMovement = 0;
        for (let frame = 0; frame < 180 * 60; frame++) {
            sim.step(idle);
            sim.events.length = 0;
            if (frame % 60) continue;
            moving.forEach((r, i) => {
                const p = r.body.translation(),
                    pos = { x: p.x * 100, y: p.y * 100 };
                maxMovement = Math.max(
                    maxMovement,
                    Math.hypot(pos.x - starts[i].x, pos.y - starts[i].y),
                );
                assert.ok(
                    Math.hypot(pos.x - r.drift!.x, pos.y - r.drift!.y) < r.drift!.radius + 50,
                );
                for (const lane of sim.sector.hyperlanes) {
                    assert.ok(segmentDistance(pos, lane.a, lane.b) > r.radius + 110);
                }
                assert.ok(Math.hypot(r.body.linvel().x, r.body.linvel().y) * 100 < 8);
            });
        }
        assert.ok(maxMovement > 20, 'drift must remain visible, not decay to a stationary field');
        assert.equal(sim.ended, null);
    } finally {
        sim.dispose();
    }
});

test('a collision impulse displaces a drifting asteroid and the flow recovers without teleporting it', () => {
    const c = campaign();
    beginRun(c, 1);
    const sim = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const rock = [...sim.rocks.values()].find((r) => r.drift)!;
        for (const other of [...sim.rocks.values()])
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.asteroidColliders.delete(other.collider.handle);
                sim.rocks.delete(other.id);
            }
        rock.body.applyImpulse({ x: rock.body.mass() * 0.3, y: 0 }, true);
        const start = rock.body.translation().x * 100;
        sim.step(idle);
        assert.ok(rock.body.translation().x * 100 > start);
        assert.ok(Math.hypot(rock.body.linvel().x, rock.body.linvel().y) * 100 > 20);
        for (let i = 0; i < 120 * 60; i++) {
            sim.step(idle);
            sim.events.length = 0;
        }
        const p = rock.body.translation();
        assert.ok(
            Math.hypot(p.x * 100 - rock.drift!.x, p.y * 100 - rock.drift!.y) <
                rock.drift!.radius + 30,
        );
    } finally {
        sim.dispose();
    }
});
