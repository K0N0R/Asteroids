import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    finishRun,
    parseCampaign,
    storageCapacity,
    storageUsed,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, syncStory, storySectorComplete } from '../frontend/game/state/story';
import { queueJob, cancelJob, advanceCrew } from '../frontend/game/state/crew';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import {
    kineticInstallationLock,
    installKineticUpgrade,
} from '../frontend/game/state/kineticIndustry';
import { stationProtectionRadius } from '../frontend/game/state/stationShield';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { MERCURY_VEINS } from '../frontend/game/worlds/mercuryVeins';
import { MERCURY_SHELTERS } from '../frontend/game/systems/solarExposure';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { angleDifference } from '../frontend/game/systems/flight';
import type { HullId } from '../frontend/game/config';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(hull: HullId = 'harpoon') {
    const c = newStoryCampaign();
    c.station.workshop = 2;
    c.station.storage = 1;
    c.station.shield = true;
    c.crew.mechanic = true;
    c.ship = newShip(1, hull);
    c.bank = { ore: 100, parts: 30, powerModules: 6, storageFrames: 1 };
    for (const t of STORY_TASKS.filter(
        (t) => (t.act <= 3 && t.required) || t.id === 'mercury-survey',
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'mercury';
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function steering(s: MissionSimulation, target: { x: number; y: number }, radius = 35) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const distance = Math.hypot(dx, dy),
        error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 15 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function fly(s: MissionSimulation, target: { x: number; y: number }, radius = 35) {
    for (let f = 0; f < 60 * 90 && !s.ended; f++) {
        if (
            Math.hypot(s.position.x - target.x, s.position.y - target.y) < radius + 22 &&
            s.speed < 20
        )
            return;
        s.step(steering(s, target, radius));
        s.events.length = 0;
    }
    assert.fail(
        `cannot reach ${JSON.stringify(target)} from ${JSON.stringify(s.position)}, hull ${s.hull}`,
    );
}

test('Mercury has six anchored protected deposits on an optional shaded branch, after survey; Harpoon is already unlocked', () => {
    const c = ready();
    assert.ok(hullUnlocked(c, 'harpoon'));
    const sector = generateStorySector(c.story!);
    const veins = sector.rocks.filter((r) => r.mercuryVein);
    assert.equal(veins.length, 6);
    assert.ok(veins.every((r) => r.anchored && r.radius <= 44 && !r.rich));
    assert.ok(sector.landmarks.some((l) => l.key === 6 && l.name.includes('Harpun')));
    assert.ok(sector.rocks.some((r) => r.anchored && r.radius === 110 && r.y === MERCURY_VEINS.y));
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'mercury-survey');
    c.story!.progress['mercury-survey'] = 0;
    assert.equal(generateStorySector(c.story!).rocks.filter((r) => r.mercuryVein).length, 0);
});

test('real bullets, energy, mining and combat lasers, grenades and rockets do not damage protected material', () => {
    for (const hull of ['prospector', 'aegis', 'phoenix', 'atlas', 'stinger'] as const) {
        const c = ready(hull);
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            const node = [...s.rocks.values()].find((r) => r.mercuryVein)!;
            const p = node.body.translation();
            s.ship.setTranslation({ x: p.x - 1.8, y: p.y }, true);
            s.ship.setRotation(0, true);
            const target = { x: p.x * 100, y: p.y * 100 };
            let resisted = false;
            for (let f = 0; f < 240 && !s.ended; f++) {
                s.step({ ...idle, target, fire: true, mine: true });
                resisted ||= s.notice.includes('Spiek odporny');
                s.events.length = 0;
            }
            assert.equal(node.health, MERCURY_VEINS.health, hull);
            assert.ok(s.rocks.has(node.id));
            assert.ok(resisted, `${hull} must actually hit the deposit`);
        } finally {
            s.dispose();
        }
    }
});

test('stock Harpoon flies from Satuk, tears out real material, collects it, docks and supplies the entire shield production chain', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        fly(s, MERCURY_SHELTERS[0]);
        for (let index = 0; index < 2; index++) {
            const target = MERCURY_VEINS.nodes[index];
            fly(s, { x: target.x - 125, y: target.y }, 15);
            const node = [...s.rocks.values()].find(
                (r) =>
                    r.mercuryVein &&
                    Math.abs(r.previous.x - target.x) < 1 &&
                    Math.abs(r.previous.y - target.y) < 1,
            )!;
            assert.ok(node);
            for (let f = 0; f < 600 && s.rocks.has(node.id) && !s.ended; f++) {
                s.step({
                    ...idle,
                    target,
                    mine: true,
                    fire: f % 24 === 0,
                    turn: Math.max(
                        -1,
                        Math.min(
                            1,
                            angleDifference(
                                Math.atan2(target.y - s.position.y, target.x - s.position.x),
                                s.ship.rotation(),
                            ) * 2.5,
                        ),
                    ),
                });
                s.events.length = 0;
            }
            assert.ok(
                !s.rocks.has(node.id),
                `Harpoon must tear node ${index}; health ${node.health}`,
            );
            for (let f = 0; f < 180; f++) s.step({ ...idle, brake: true });
        }
        assert.ok((s.cargo.mercuryOre ?? 0) >= 4);
        fly(s, MERCURY_SHELTERS[0]);
        for (let f = 0; f < 60 * 90 && !s.ended; f++)
            s.step({ ...steering(s, { x: 0, y: 0 }, 80), interact: true });
        assert.equal(s.ended, 'returned', `hull ${s.hull}, heat ${s.solar.heat}`);
        const ore = s.cargo.mercuryOre!;
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
        assert.equal(c.bank.mercuryOre, ore);
    } finally {
        s.dispose();
    }
    assert.ok(queueJob(c, 'kineticPlate'));
    assert.ok(beginRun(c, 1));
    assert.equal(advanceCrew(c, 60), 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 60, 'production');
    assert.equal(c.bank.kineticPlates, 2);
    assert.ok(queueJob(c, 'kineticModule'));
    assert.ok(beginRun(c, 1));
    assert.equal(advanceCrew(c, 90), 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 90, 'production');
    assert.ok(installKineticUpgrade(c, 'shield'));
    syncStory(c);
    assert.equal(stationProtectionRadius(c), 1000);
    assert.ok(c.story!.claimed.includes('mercury-shield'));
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('kinetic production validates unlocks, workshop, costs and refunds without losing reserved materials', () => {
    const c = ready();
    c.bank.mercuryOre = 8;
    const before = structuredClone(c.bank);
    assert.ok(queueJob(c, 'kineticPlate'));
    assert.ok(storageUsed(c) <= storageCapacity(c));
    assert.equal(advanceCrew(c, 120), 0, 'no offline or lobby production');
    assert.ok(cancelJob(c, c.crew.jobs[0].id));
    assert.deepEqual(c.bank, before);
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'mercury-survey');
    c.story!.progress['mercury-survey'] = 0;
    const snapshot = structuredClone(c);
    assert.equal(queueJob(c, 'kineticPlate'), false);
    assert.deepEqual(c, snapshot);
});

test('two shield and warehouse levels consume their own costs exactly once, and saves preserve them while rejecting old formats', () => {
    const c = ready();
    c.bank.ore = 120;
    c.bank.kineticModules = 3;
    c.bank.kineticPlates = 4;
    c.bank.storageFrames = 2;
    const base = storageCapacity(c);
    for (let level = 1; level <= 2; level++) {
        assert.ok(installKineticUpgrade(c, 'shield'));
        assert.equal(stationProtectionRadius(c), 850 + level * 150);
        assert.ok(installKineticUpgrade(c, 'storage'));
        assert.equal(storageCapacity(c), base + level * 400);
    }
    const snapshot = structuredClone(c);
    assert.equal(installKineticUpgrade(c, 'shield'), false);
    assert.equal(installKineticUpgrade(c, 'storage'), false);
    assert.deepEqual(c, snapshot);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    for (const field of ['shieldLevel', 'reinforcedBays'] as const)
        for (const bad of [-1, 3, NaN, undefined]) {
            const invalid = structuredClone(c);
            invalid.station[field] = bad as number;
            assert.equal(parseCampaign(JSON.stringify(invalid)), null);
        }
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 41 })), null);
    assert.equal(parseCampaign(JSON.stringify({ ...c, story: { ...c.story, version: 19 } })), null);
});

test('locked and in-flight installs are atomic, and a lost sortie never delivers the special resource', () => {
    const c = ready();
    c.bank.kineticModules = 1;
    beginRun(c, 1);
    const snapshot = structuredClone(c);
    assert.ok(kineticInstallationLock(c, 'shield'));
    assert.equal(installKineticUpgrade(c, 'shield'), false);
    assert.deepEqual(c, snapshot);
    finishRun(c, false, { ore: 0, parts: 0, mercuryOre: 6 }, 5, 'loss');
    assert.equal(c.bank.mercuryOre, undefined);
    c.station.workshop = 1;
    assert.equal(installKineticUpgrade(c, 'shield'), false);
    assert.equal(c.bank.kineticModules, 1);
    assert.equal(storySectorComplete(c.story!, 'mercury'), false);
});

test('expanded station shielding catches a real incoming round before it reaches a ship beyond the old boundary', () => {
    for (const level of [0, 2]) {
        const c = ready();
        c.station.shieldLevel = level;
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            for (const rock of [...s.rocks.values()]) {
                s.world.removeRigidBody(rock.body);
                s.asteroidColliders.delete(rock.collider.handle);
            }
            s.rocks.clear();
            s.ship.setTranslation({ x: 10, y: 0 }, true);
            const charge = s.kineticShield.charge;
            s.bullets.set(900001, {
                id: 900001,
                x: 1350,
                y: 0,
                vx: -12000,
                vy: 0,
                life: 1,
                team: 'enemy',
                damage: 30,
            });
            for (let i = 0; i < 4; i++) s.step(idle);
            assert.equal(s.stationSafeRadius, 850 + level * 150);
            assert.equal(s.bullets.size, 0);
            assert.equal(s.kineticShield.charge, level ? charge : charge - 30);
        } finally {
            s.dispose();
        }
    }
});
