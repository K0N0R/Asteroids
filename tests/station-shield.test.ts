import { fundEquipment } from './fleet-fixtures';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    buyUpgrade,
    finishRun,
    newCampaign,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    installStationShield,
    stationProtectionRadius,
    stationShieldLock,
} from '../frontend/game/state/stationShield';
import { contributeStory, syncStory } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: true, fire: false, interact: false };
function ready() {
    const c = newStoryCampaign();
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    fundEquipment(c, WORKSHOP_CONSTRUCTION[c.station.workshop]);
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    c.bank = { ore: 50, parts: 10, powerModules: 3, electronics: 3, storageFrames: 2 };
    return c;
}
function clear(sim: MissionSimulation) {
    for (const r of [...sim.rocks.values()]) {
        sim.world.removeRigidBody(r.body);
        sim.asteroidColliders.delete(r.collider.handle);
    }
    sim.rocks.clear();
    for (const e of [...sim.enemies.enemies.values()]) {
        sim.world.removeRigidBody(e.body);
    }
    sim.enemies.enemies.clear();
    sim.enemies.colliders.clear();
}

test('station shield enforces unlock, workshop, parts and one-time installation without partial spending', () => {
    for (const mutate of [
        (c: ReturnType<typeof ready>) => c.story!.claimed.splice(0),
        (c: ReturnType<typeof ready>) => (c.station.workshop = 0),
        (c: ReturnType<typeof ready>) => (c.bank.electronics = 2),
        (c: ReturnType<typeof ready>) => (c.bank.parts = 5),
        (c: ReturnType<typeof ready>) => (c.bank.powerModules = 2),
        (c: ReturnType<typeof ready>) => beginRun(c, 1),
    ]) {
        const c = ready();
        mutate(c);
        const before = structuredClone(c);
        assert.ok(stationShieldLock(c));
        assert.equal(installStationShield(c), false);
        assert.deepEqual(c, before);
    }
    const c = ready();
    assert.equal(stationProtectionRadius(c), 260);
    assert.ok(installStationShield(c));
    assert.equal(stationProtectionRadius(c), 850);
    assert.deepEqual(c.bank, {
        ore: 50,
        parts: 4,
        powerModules: 0,
        electronics: 0,
        storageFrames: 0,
    });
    const before = structuredClone(c);
    assert.equal(installStationShield(c), false);
    assert.deepEqual(c, before);
});

test('shield state is strictly validated and previous save formats are rejected', () => {
    for (const shield of [undefined, null, 1, 'true']) {
        const c = ready();
        (c.station as unknown as Record<string, unknown>).shield = shield;
        assert.equal(parseCampaign(JSON.stringify(c)), null);
    }
    assert.equal(parseCampaign(JSON.stringify({ ...newCampaign(), version: 37 })), null);
    const c = newStoryCampaign();
    assert.equal(parseCampaign(JSON.stringify(c))?.station.shield, false);
});

test('orbit protection follows station between sectors and does not create a phantom shield on lunar surface', () => {
    const c = ready();
    installStationShield(c);
    const sim = new MissionSimulation(c, 1);
    try {
        assert.equal(sim.stationSafeRadius, 850);
        assert.ok(sim.stationShieldActive);
        c.story!.sector = 'lunar';
        assert.equal(sim.stationSafeRadius, 850);
        sim.area = 'surface';
        assert.equal(sim.stationSafeRadius, 0);
        assert.equal(sim.stationShieldActive, false);
        sim.area = 'orbit';
        assert.equal(sim.stationSafeRadius, 850);
        c.station.shield = false;
        assert.equal(sim.stationSafeRadius, 260);
        assert.equal(sim.stationShieldActive, false);
        const testMode = newCampaign();
        assert.equal(stationProtectionRadius(testMode), 850);
        assert.equal(installStationShield(testMode), false);
    } finally {
        sim.dispose();
    }
});

test('installed shield stops a real incoming projectile at its boundary; without it the same shot hits a ship outside dock protection', () => {
    for (const installed of [false, true]) {
        const c = ready();
        if (installed) installStationShield(c);
        const sim = new MissionSimulation(c, 1);
        try {
            clear(sim);
            sim.ship.setTranslation({ x: 6, y: 0 }, true);
            sim.kineticShield.charge = 0;
            sim.bullets.set(9999, {
                id: 9999,
                x: 900,
                y: 0,
                vx: -18000,
                vy: 0,
                damage: 12,
                team: 'enemy',
                life: 1,
            });
            const hull = sim.hull;
            sim.step(idle);
            assert.equal(sim.bullets.has(9999), false);
            if (installed) {
                assert.equal(sim.hull, hull);
                assert.ok(sim.events.some((e) => e.kind === 'shield' && Math.abs(e.x - 850) < 1));
            } else assert.ok(sim.hull < hull);
        } finally {
            sim.dispose();
        }
    }
});

test('enemies and full asteroid silhouettes are repelled at the actual configured boundary', () => {
    for (const installed of [false, true]) {
        const c = ready();
        if (installed) installStationShield(c);
        const sim = new MissionSimulation(c, 1);
        try {
            const rock = [...sim.rocks.values()][0];
            rock.body.setTranslation({ x: 5, y: 0 }, true);
            rock.previous = { x: 500, y: 0 };
            rock.body.setLinvel({ x: -2, y: 0 }, true);
            sim.enemies.add([{ id: 9999, x: 500, y: 200, home: { x: 500, y: 200 }, phase: 0 }]);
            const enemy = sim.enemies.enemies.get(9999)!;
            for (let i = 0; i < 3; i++) sim.step(idle);
            const p = rock.body.translation(),
                e = enemy.body.translation();
            if (installed) {
                assert.ok(Math.hypot(p.x, p.y) * 100 >= 850 + rock.radius);
                assert.ok(Math.hypot(e.x, e.y) * 100 >= 850 + enemy.config.radius);
            } else {
                assert.ok(Math.hypot(p.x, p.y) * 100 < 850);
                assert.ok(Math.hypot(e.x, e.y) * 100 < 850);
            }
        } finally {
            sim.dispose();
        }
    }
});
