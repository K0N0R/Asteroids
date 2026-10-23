import { grantStoryTasks } from './fleet-fixtures';
import { fundEquipment } from './fleet-fixtures';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { StationSentries, sentryPosition } from '../frontend/game/systems/stationSentries';
import { EnemyFleet } from '../frontend/game/systems/enemies';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import {
    newStoryCampaign,
    parseCampaign,
    beginRun,
    finishRun,
    buyUpgrade,
} from '../frontend/game/state/campaign';
import { contributeStory, syncStory } from '../frontend/game/state/story';
import {
    installStationDrones,
    stationDronesLock,
    STATION_DRONES,
} from '../frontend/game/state/stationDrones';

before(async () => RAPIER.init());

function ready() {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['earth-workshop']);
    c.station.shield = true;
    c.bank = {
        ore: 80,
        parts: 24,
        powerModules: 6,
        electronics: 6,
        storageFrames: 3,
        propulsion: 6,
    };
    return c;
}

test('sentry hangar validates requirements atomically and installs exactly three drones once', () => {
    for (const mutate of [
        (c: ReturnType<typeof ready>) => (c.story = null),
        (c: ReturnType<typeof ready>) => c.story!.claimed.splice(0),
        (c: ReturnType<typeof ready>) => (c.station.workshopLevel = 0),
        (c: ReturnType<typeof ready>) => (c.bank.electronics = 2),
        (c: ReturnType<typeof ready>) => (c.bank.parts = 8),
        (c: ReturnType<typeof ready>) => (c.bank.powerModules = 2),
        (c: ReturnType<typeof ready>) => beginRun(c, 1),
    ]) {
        const c = ready();
        mutate(c);
        const snapshot = structuredClone(c);
        assert.ok(stationDronesLock(c));
        assert.equal(installStationDrones(c), false);
        assert.deepEqual(c, snapshot);
    }
    const c = ready();
    c.station.shield = false; // Hangar is independent of the station shield.
    assert.ok(installStationDrones(c));
    assert.deepEqual(c.bank, {
        ore: 80,
        parts: 15,
        powerModules: 3,
        electronics: 3,
        storageFrames: 0,
        propulsion: 3,
    });
    assert.equal(c.station.sentries?.length, STATION_DRONES.count);
    assert.ok(c.station.sentries?.every((drone) => drone.hull === STATION_DRONES.hull));
    const snapshot = structuredClone(c);
    assert.equal(installStationDrones(c), false);
    assert.deepEqual(c, snapshot);
});

test('save preserves damaged and rebuilding sentries and rejects invalid garrisons and old formats', () => {
    const c = ready();
    installStationDrones(c);
    c.station.sentries![0].hull = 21.5;
    c.station.sentries![1] = { hull: 0, rebuildRemaining: 17.25 };
    assert.deepEqual(parseCampaign(JSON.stringify(c))?.station.sentries, c.station.sentries);
    for (const sentries of [
        undefined,
        [],
        [{ hull: 80, rebuildRemaining: 0 }],
        [{ hull: -1, rebuildRemaining: 0 }, ...c.station.sentries!.slice(1)],
        [{ hull: 81, rebuildRemaining: 0 }, ...c.station.sentries!.slice(1)],
        [{ hull: 0, rebuildRemaining: 31 }, ...c.station.sentries!.slice(1)],
        [{ hull: 1, rebuildRemaining: 1 }, ...c.station.sentries!.slice(1)],
    ]) {
        const saved = structuredClone(c);
        saved.station.sentries = sentries as typeof saved.station.sentries;
        assert.equal(parseCampaign(JSON.stringify(saved)), null);
    }
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 40 })), null);
    assert.equal(parseCampaign(JSON.stringify(newStoryCampaign()))?.station.sentries, null);
});

test('patrol acquires only local visible enemies, returns to station and repairs automatically without station workers', () => {
    const c = ready();
    installStationDrones(c);
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, []),
        sentries = new StationSentries(world, c);
    let shots = 0;
    const tick = (seconds: number, blocked = false) => {
        for (let index = 0; index < seconds * 60; index++) {
            sentries.update(
                1 / 60,
                true,
                fleet,
                () => blocked,
                () => {
                    shots++;
                    return true;
                },
            );
            world.step();
        }
    };
    try {
        tick(12);
        assert.equal(sentries.drones.size, 3);
        assert.ok(
            [...sentries.drones.values()].every(
                (drone) =>
                    Math.hypot(sentryPosition(drone).x, sentryPosition(drone).y) <=
                    STATION_DRONES.leash + 4,
            ),
        );
        const drone = sentries.drones.get(0)!,
            p = sentryPosition(drone);
        fleet.add([{ id: 1, x: p.x + 60, y: p.y, home: p, phase: 0 }]);
        tick(1);
        assert.ok(shots > 0);
        fleet.enemies.get(1)!.body.setTranslation({ x: 40, y: 0 }, true);
        shots = 0;
        tick(10);
        assert.equal(shots, 0);
        assert.ok([...sentries.drones.values()].every((drone) => drone.target === null));
        sentries.damage(0, 65);
        tick(10);
        assert.ok(drone.state.hull > 15 && drone.state.hull < STATION_DRONES.hull);
        assert.ok(Math.hypot(sentryPosition(drone).x, sentryPosition(drone).y) < 260);
        tick(15);
        assert.equal(drone.state.hull, STATION_DRONES.hull);
    } finally {
        sentries.clear();
        fleet.dispose();
        world.free();
    }
});

test('replacement is manual at the base, charges each lost drone once and never builds during flight', () => {
    const c = ready();
    assert.ok(installStationDrones(c));
    c.station.sentries![0].hull = 0;
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, []),
        sentries = new StationSentries(world, c);
    try {
        const bank = structuredClone(c.bank);
        sentries.update(
            120,
            true,
            fleet,
            () => false,
            () => false,
        );
        assert.deepEqual(c.bank, bank);
        assert.equal(c.station.sentries![0].hull, 0);
        assert.ok(beginRun(c, 1));
        assert.equal(installStationDrones(c), false);
        finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
        c.bank.parts = 1;
        const before = structuredClone(c);
        assert.equal(installStationDrones(c), false);
        assert.deepEqual(c, before);
        c.bank.parts = 5;
        assert.ok(installStationDrones(c));
        assert.equal(c.bank.parts, 3);
        assert.equal(c.bank.powerModules, 2);
        assert.equal(c.station.sentries![0].hull, STATION_DRONES.hull);
        const done = structuredClone(c);
        assert.equal(installStationDrones(c), false);
        assert.deepEqual(c, done);
    } finally {
        sentries.clear();
        fleet.dispose();
        world.free();
    }
});

test('mission sentries fight while the player stays under the shield, take hostile shots but ignore friendly fire, and disappear on the surface', () => {
    const c = ready();
    installStationDrones(c);
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const idle: FlightInput = {
        target: { x: 0, y: 0 },
        thrust: false,
        brake: false,
        fire: false,
        interact: false,
    };
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        for (const enemy of sim.enemies.enemies.values()) sim.world.removeRigidBody(enemy.body);
        sim.enemies.enemies.clear();
        sim.enemies.colliders.clear();
        const drone = sim.sentries.drones.get(0)!;
        drone.body.setTranslation({ x: 10.8, y: 0 }, true);
        drone.previous = { x: 1080, y: 0 };
        sim.enemies.add([{ id: 9999, x: 1400, y: 0, home: { x: 1400, y: 0 }, phase: Math.PI }]);
        for (let frame = 0; frame < 240; frame++) sim.step(idle);
        const enemy = sim.enemies.enemies.get(9999);
        assert.ok(enemy === undefined || enemy.health < enemy.config.hull);
        if (enemy) assert.ok(enemy.target.startsWith('sentry:'));
        assert.ok(sim.statistics.enemyDamage > 0);
        assert.equal(sim.hull, sim.maxHull);
        for (const hostile of sim.enemies.enemies.values()) sim.world.removeRigidBody(hostile.body);
        sim.enemies.enemies.clear();
        sim.enemies.colliders.clear();
        sim.bullets.clear();
        const survivor = [...sim.sentries.drones.values()][0];
        survivor.body.setTranslation({ x: 11, y: 0 }, true);
        survivor.state.hull = STATION_DRONES.hull;
        const shot = (team: 'player' | 'enemy') => {
            sim.bullets.set(900000, {
                id: 900000,
                x: 1200,
                y: 0,
                vx: -12000,
                vy: 0,
                life: 1,
                team,
                damage: 20,
            });
            sim.step(idle);
        };
        shot('player');
        assert.equal(survivor.state.hull, STATION_DRONES.hull);
        shot('enemy');
        assert.equal(survivor.state.hull, STATION_DRONES.hull - 20);
        const states = structuredClone(c.station.sentries);
        sim.area = 'surface';
        sim.step(idle);
        assert.equal(sim.sentries.drones.size, 0);
        assert.deepEqual(c.station.sentries, states);
        sim.area = 'orbit';
        sim.step(idle);
        assert.equal(sim.sentries.drones.size, 3);
        assert.equal(c.station.sentries![survivor.id].hull, STATION_DRONES.hull - 20);
    } finally {
        sim.dispose();
    }
});

test('a physical obstacle blocks sentry detection and fire until the line of sight opens', () => {
    const c = ready();
    installStationDrones(c);
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, [
        { id: 1, x: 1400, y: 0, home: { x: 1400, y: 0 }, phase: 0 },
    ]);
    const sentries = new StationSentries(world, c);
    let shots = 0;
    try {
        sentries.update(
            0,
            true,
            fleet,
            () => false,
            () => false,
        );
        for (const drone of sentries.drones.values())
            drone.body.setTranslation({ x: 10.8, y: 0 }, true);
        const obstacle = world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.2, 6).setTranslation(12.4, 0),
        );
        world.step();
        const tick = () =>
            sentries.update(
                0.1,
                true,
                fleet,
                (collider) => collider.handle === obstacle.handle,
                () => {
                    shots++;
                    return true;
                },
            );
        tick();
        assert.equal(shots, 0);
        assert.ok([...sentries.drones.values()].every((drone) => drone.target === null));
        world.removeCollider(obstacle, true);
        world.step();
        tick();
        assert.equal(shots, STATION_DRONES.count);
    } finally {
        sentries.clear();
        fleet.dispose();
        world.free();
    }
});

test('lost drones remain unrepaired during flight and a player loss preserves garrison damage', () => {
    const c = ready();
    installStationDrones(c);
    beginRun(c, 1);
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, []);
    const sentries = new StationSentries(world, c);
    const tick = (seconds: number) =>
        sentries.update(
            seconds,
            true,
            fleet,
            () => false,
            () => false,
        );
    try {
        tick(0);
        sentries.damage(0, 1000);
        sentries.damage(1, 20);
        tick(5);
        assert.equal(c.station.sentries![0].rebuildRemaining, 0);
        const bank = structuredClone(c.bank);
        tick(20);
        assert.equal(c.station.sentries![0].rebuildRemaining, 0);
        assert.deepEqual(c.bank, bank);
        const states = structuredClone(c.station.sentries);
        finishRun(c, false, { ore: 0, parts: 0 }, 30, 'loss');
        assert.deepEqual(c.station.sentries, states);
        assert.deepEqual(parseCampaign(JSON.stringify(c))?.station.sentries, states);
    } finally {
        sentries.clear();
        fleet.dispose();
        world.free();
    }
});
