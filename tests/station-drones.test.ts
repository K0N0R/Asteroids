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
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    c.station.shield = true;
    c.crew.mechanic = true;
    c.bank = { ore: 80, parts: 24, powerModules: 6 };
    return c;
}

test('sentry hangar validates requirements atomically and installs exactly three drones once', () => {
    for (const mutate of [
        (c: ReturnType<typeof ready>) => (c.story = null),
        (c: ReturnType<typeof ready>) => c.story!.claimed.splice(0),
        (c: ReturnType<typeof ready>) => (c.station.workshop = 0),
        (c: ReturnType<typeof ready>) => (c.station.shield = false),
        (c: ReturnType<typeof ready>) => (c.crew.mechanic = false),
        (c: ReturnType<typeof ready>) => (c.crew.mechanicAboard = true),
        (c: ReturnType<typeof ready>) => (c.bank.ore = 39),
        (c: ReturnType<typeof ready>) => (c.bank.parts = 11),
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
    assert.ok(installStationDrones(c));
    assert.deepEqual(c.bank, { ore: 40, parts: 12, powerModules: 3 });
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

test('patrol acquires only local visible enemies, returns to station and repairs only with an available mechanic', () => {
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
        c.crew.mechanicAboard = true;
        tick(25);
        assert.equal(drone.state.hull, 15);
        assert.ok(Math.hypot(sentryPosition(drone).x, sentryPosition(drone).y) < 260);
        c.crew.mechanicAboard = false;
        tick(20);
        assert.equal(drone.state.hull, STATION_DRONES.hull);
    } finally {
        sentries.clear();
        fleet.dispose();
        world.free();
    }
});

test('replacement charges once, respects resources, mechanic and orbit, and resumes paid construction after a sortie', () => {
    const c = ready();
    installStationDrones(c);
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, []);
    let sentries = new StationSentries(world, c);
    const tick = (seconds: number, orbit = true) =>
        sentries.update(
            seconds,
            orbit,
            fleet,
            () => false,
            () => false,
        );
    try {
        tick(0);
        assert.ok(sentries.damage(0, 1000));
        c.bank.parts = 1;
        tick(60);
        assert.equal(sentries.drones.size, 2);
        assert.equal(c.bank.powerModules, 3);
        c.bank.parts = 5;
        c.crew.mechanicAboard = true;
        tick(60);
        assert.equal(c.bank.parts, 5);
        c.crew.mechanicAboard = false;
        tick(10);
        assert.equal(c.bank.parts, 3);
        assert.equal(c.bank.powerModules, 2);
        assert.equal(c.station.sentries![0].rebuildRemaining, 20);
        tick(60, false);
        assert.equal(sentries.drones.size, 0);
        assert.equal(c.station.sentries![0].rebuildRemaining, 20);
        sentries.clear();
        sentries = new StationSentries(world, c);
        tick(19);
        assert.equal(sentries.drones.size, 2);
        tick(1);
        assert.equal(sentries.drones.size, 3);
        assert.equal(c.bank.parts, 3);
        assert.equal(c.bank.powerModules, 2);
        assert.equal(c.station.sentries![0].hull, STATION_DRONES.hull);
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

test('station production pauses paid replacement and losing the player ship preserves garrison damage', () => {
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
        assert.equal(c.station.sentries![0].rebuildRemaining, 25);
        const bank = structuredClone(c.bank);
        c.crew.jobs.push({ id: 1, kind: 'kit', remaining: 10 });
        c.crew.nextJobId = 2;
        tick(20);
        assert.equal(c.station.sentries![0].rebuildRemaining, 25);
        assert.deepEqual(c.bank, bank);
        c.crew.jobs.length = 0;
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
