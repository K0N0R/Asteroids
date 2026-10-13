import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    buyUpgrade,
    emergencyKit,
    finishRun,
    hirePilot,
    newCampaign,
    parseCampaign,
    SaveRepository,
    buyShip,
    selectShip,
    ownedShips,
    capacity,
    shipHealth,
    scrapRefund,
    scrapShip,
} from '../frontend/game/state/campaign';
import { generateSector } from '../frontend/game/worlds/sector';
import { FlightInput, MissionSimulation } from '../frontend/game/systems/mission';
import { GAME, HULLS, HullId } from '../frontend/game/config';
import { advanceCrew, cancelJob, hireMechanic, queueJob } from '../frontend/game/state/crew';
import { storageUsed } from '../frontend/game/state/campaign';

before(async () => {
    await RAPIER.init();
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};

test('sector seeds reproduce layouts; spawn is safe and rocks do not overlap', () => {
    assert.deepEqual(generateSector(731), generateSector(731));
    assert.notDeepEqual(generateSector(731), generateSector(732));
    for (let seed = 0; seed < 30; seed++) {
        const sector = generateSector(seed);
        assert.ok(sector.rocks.length > 100);
        for (const [i, rock] of sector.rocks.entries()) {
            assert.ok(Math.hypot(rock.x, rock.y) >= 450);
            assert.ok(Math.hypot(rock.x, rock.y) + rock.radius < GAME.sectorRadius);
            for (const other of sector.rocks.slice(i + 1))
                assert.ok(
                    Math.hypot(rock.x - other.x, rock.y - other.y) >=
                        rock.radius + other.radius + 11,
                );
        }
    }
});
test('successful extraction credits loot and reward exactly once', () => {
    const c = newCampaign();
    assert.ok(beginRun(c, 42));
    const result = finishRun(c, true, { ore: 12, parts: 2 }, 60, 'dock');
    assert.deepEqual(result?.reward, { ore: 10, parts: 1 });
    assert.deepEqual(c.bank, { ore: 22, parts: 3 });
    assert.equal(finishRun(c, true, { ore: 100, parts: 100 }, 60, 'dock'), null);
    assert.deepEqual(c.bank, { ore: 22, parts: 3 });
    assert.equal(c.recovered, 1);
});
test('death loses the active pilot and equipment but preserves the station, reserves and bank', () => {
    const c = newCampaign();
    c.bank = { ore: 50, parts: 10 };
    assert.ok(hirePilot(c, 1));
    const active = c.selectedPilot;
    assert.ok(buyUpgrade(c, 'engine'));
    c.station.storage = 1;
    const bank = { ...c.bank };
    assert.ok(beginRun(c, 9));
    finishRun(c, false, { ore: 35, parts: 3 }, 12, 'collision');
    assert.equal(c.ship, null);
    assert.ok(!c.pilots.some((p) => p.id === active));
    assert.equal(c.pilots.length, 1);
    assert.deepEqual(c.bank, bank);
    assert.equal(c.station.storage, 1);
});
test('refresh restores an active marker so the interrupted mission can be resolved as a loss', () => {
    const c = newCampaign();
    beginRun(c, 0xffffffff);
    const loaded = parseCampaign(JSON.stringify(c));
    assert.ok(loaded?.activeRun);
    assert.ok(finishRun(loaded!, false, { ore: 0, parts: 0 }, 0, 'reload'));
    assert.equal(loaded!.pilots.length, 0);
    assert.equal(loaded!.ship, null);
    assert.ok(emergencyKit(loaded!));
    assert.ok(beginRun(loaded!, 100));
});
test('upgrade costs and workshop limits are enforced without partial charges', () => {
    const c = newCampaign();
    c.bank = { ore: 200, parts: 30 };
    assert.ok(buyUpgrade(c, 'engine'));
    const bank = { ...c.bank };
    assert.equal(buyUpgrade(c, 'engine'), false);
    assert.deepEqual(c.bank, bank);
    assert.ok(buyUpgrade(c, 'workshop'));
    assert.ok(buyUpgrade(c, 'engine'));
    beginRun(c, 2);
    assert.equal(buyUpgrade(c, 'armor'), false);
});
test('full station storage accepts valuable parts first and reports overflow', () => {
    const c = newCampaign();
    c.bank.ore = 147;
    beginRun(c, 5);
    const result = finishRun(c, true, { ore: 5, parts: 2 }, 1, 'dock');
    assert.deepEqual(c.bank, { ore: 148, parts: 2 });
    assert.equal(result!.overflow, 4);
});
test('invalid saves and unavailable storage fail safely', () => {
    assert.equal(parseCampaign('{'), null);
    const c = newCampaign();
    c.ship!.engine = -1;
    assert.equal(parseCampaign(JSON.stringify(c)), null);
    const storage = {
        getItem: () => {
            throw Error('blocked');
        },
        setItem: () => {
            throw Error('quota');
        },
    };
    const repository = new SaveRepository(storage);
    assert.equal(repository.load().version, 6);
    assert.equal(repository.save(newCampaign()), false);
});
test('arcade flight accelerates quickly, stops on release and prioritizes the brake', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 0, y: -10 }, true);
        for (let i = 0; i < 60; i++)
            sim.step({ ...idle, target: { x: 10000, y: -1000 }, thrust: true });
        const speed = sim.speed;
        assert.ok(speed > 460 && speed <= GAME.maxSpeed + 1);
        for (let i = 0; i < 60; i++) sim.step({ ...idle, target: { x: 10000, y: -1000 } });
        assert.ok(sim.speed < 5, 'release should eliminate long drift within one second');
        for (let i = 0; i < 40; i++)
            sim.step({ ...idle, target: { x: 10000, y: -1000 }, thrust: true });
        sim.step({ ...idle, thrust: true, brake: true });
        assert.ok(sim.speed > 0 && sim.speed < 460);
        assert.equal(sim.thrusting, false);
        for (let i = 0; i < 20; i++) sim.step({ ...idle, thrust: true, brake: true });
        assert.ok(sim.speed < 1);
    } finally {
        sim.dispose();
    }
});

test('arcade steering redirects momentum through a 90 degree turn without prolonged sideways drift', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        for (let i = 0; i < 40; i++) sim.step({ ...idle, thrust: true });
        const p = sim.position;
        for (let i = 0; i < 42; i++)
            sim.step({ ...idle, target: { x: p.x, y: p.y + 10000 }, thrust: true });
        assert.ok(Math.abs(sim.velocity.x) < 70);
        assert.ok(sim.velocity.y > 400);
        assert.ok(Math.abs(sim.ship.rotation() - Math.PI / 2) < 0.04);
    } finally {
        sim.dispose();
    }
});

test('cursor crossing the angle boundary takes the short turn and remains stable near the ship', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        sim.ship.setRotation(Math.PI - 0.02, true);
        const p = sim.position;
        sim.step({ ...idle, target: { x: p.x - 10000, y: p.y - 100 } });
        const turned = sim.ship.rotation() - (Math.PI - 0.02);
        assert.ok(turned > 0 && turned < 0.03);
        const angle = sim.ship.rotation();
        for (let i = 0; i < 20; i++) sim.step({ ...idle, target: sim.position });
        assert.ok(Math.abs(sim.ship.rotation() - angle) < 0.001);
    } finally {
        sim.dispose();
    }
});
test('mining uses swept shots, breaks rocks and collects cargo without exceeding capacity', () => {
    const sim = new MissionSimulation(newCampaign(), 91);
    try {
        const rock = [...sim.rocks.values()].find((r) => r.radius < 44)!;
        const p = rock.body.translation();
        sim.ship.setTranslation({ x: p.x - 3, y: p.y }, true);
        sim.ship.setRotation(0, true);
        for (let i = 0; i < 240; i++)
            sim.step({ ...idle, target: { x: p.x * 100, y: p.y * 100 }, fire: true });
        assert.ok(sim.events.some((event) => event.kind === 'break'));
        assert.ok(sim.loot.size > 0);
        const item = [...sim.loot.values()][0];
        sim.ship.setTranslation({ x: item.x / 100, y: item.y / 100 }, true);
        sim.cargo.ore = sim.cargoCapacity - 1;
        for (let i = 0; i < 10; i++) sim.step(idle);
        assert.ok(sim.cargoUsed <= sim.cargoCapacity);
        assert.equal(sim.cargoUsed, sim.cargoCapacity);
    } finally {
        sim.dispose();
    }
});
test('docking requires proximity, low speed and holding interact; disposal is idempotent', () => {
    const sim = new MissionSimulation(newCampaign(), 3);
    sim.ship.setTranslation({ x: 0, y: 0 }, true);
    sim.ship.setLinvel({ x: 2, y: 0 }, true);
    sim.step({ ...idle, interact: true });
    assert.equal(sim.dockProgress, 0);
    sim.ship.setLinvel({ x: 0, y: 0 }, true);
    for (let i = 0; i < 80; i++) sim.step({ ...idle, interact: true });
    assert.equal(sim.ended, 'returned');
    sim.dispose();
    sim.dispose();
    assert.equal(sim.rocks.size, 0);
});

test('fast impacts damage the hull while slow contact is harmless', () => {
    const collide = (speed: number) => {
        const sim = new MissionSimulation(newCampaign(), 72);
        try {
            const rock = [...sim.rocks.values()][0];
            rock.body.setTranslation({ x: 20, y: 0 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            sim.ship.setTranslation({ x: 20 - (rock.radius * 0.89) / 100 - 0.45, y: 0 }, true);
            sim.ship.setRotation(0, true);
            sim.ship.setLinvel({ x: speed / 100, y: 0 }, true);
            for (let i = 0; i < 120; i++) sim.step(idle);
            return sim.hull;
        } finally {
            sim.dispose();
        }
    };
    assert.equal(collide(25), GAME.hull);
    assert.ok(collide(500) < GAME.hull);
});

test('legacy campaigns migrate without losing pilots, bank, upgrades or the interrupted marker', () => {
    const c = newCampaign();
    c.bank = { ore: 30, parts: 3 };
    c.ship!.engine = 1;
    beginRun(c, 79);
    const legacy = JSON.parse(JSON.stringify(c));
    legacy.version = 1;
    delete legacy.crew;
    delete legacy.repairKits;
    delete legacy.activeRun.repairKits;
    const loaded = parseCampaign(JSON.stringify(legacy))!;
    assert.equal(loaded.version, 6);
    assert.deepEqual(loaded.bank, c.bank);
    assert.deepEqual(loaded.pilots, c.pilots);
    assert.equal(loaded.ship!.engine, 1);
    assert.equal(loaded.activeRun!.seed, 79);
    assert.equal(loaded.activeRun!.repairKits, 0);
    assert.equal(loaded.crew.mechanic, false);
    assert.ok(finishRun(loaded, false, { ore: 0, parts: 0 }, 0, 'refresh'));
});

test('crew inputs are reserved and refunded once, and queue limits prevent extra charges', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 5 };
    assert.ok(hireMechanic(c));
    assert.equal(hireMechanic(c), false);
    const used = storageUsed(c),
        bank = { ...c.bank };
    assert.ok(queueJob(c, 'refine'));
    assert.equal(storageUsed(c), used);
    const id = c.crew.jobs[0].id;
    assert.ok(cancelJob(c, id));
    assert.equal(cancelJob(c, id), false);
    assert.deepEqual(c.bank, bank);
    for (let i = 0; i < 3; i++) assert.ok(queueJob(c, 'refine'));
    const after = { ...c.bank };
    assert.equal(queueJob(c, 'kit'), false);
    assert.deepEqual(c.bank, after);
});

test('crew works only during a run and carries excess time into the next queued task', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 5 };
    hireMechanic(c);
    queueJob(c, 'refine');
    queueJob(c, 'kit');
    assert.equal(advanceCrew(c, 90), 0);
    assert.equal(c.crew.jobs[0].remaining, 45);
    beginRun(c, 13);
    const parts = c.bank.parts;
    assert.equal(advanceCrew(c, 50), 1);
    assert.equal(c.bank.parts, parts + 1);
    assert.equal(c.crew.jobs[0].remaining, 25);
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.ok(loaded);
    assert.equal(advanceCrew(loaded, 25), 1);
    assert.equal(loaded.repairKits, 1);
    assert.equal(loaded.crew.completed, 2);
    assert.equal(advanceCrew(loaded, 500), 0);
    assert.equal(loaded.crew.completed, 2);
    finishRun(loaded, false, { ore: 0, parts: 0 }, 75, 'loss');
    assert.equal(loaded.crew.mechanic, true);
    assert.equal(loaded.repairKits, 1);
});

test('reserved inputs keep cancellation safe after a full extraction', () => {
    const c = newCampaign();
    c.bank = { ore: 147, parts: 0 };
    c.crew.mechanic = true;
    queueJob(c, 'refine');
    beginRun(c, 3);
    finishRun(c, true, { ore: 10, parts: 2 }, 0, 'dock');
    assert.equal(storageUsed(c), 150);
    assert.ok(cancelJob(c, c.crew.jobs[0].id));
    assert.equal(storageUsed(c), 150);
});

test('repair kits embark once, return only when unused, and are lost on interrupted missions', () => {
    const c = newCampaign();
    c.repairKits = 5;
    beginRun(c, 1);
    assert.equal(c.repairKits, 3);
    assert.equal(c.activeRun!.repairKits, 2);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 1);
    assert.equal(c.repairKits, 4);
    assert.equal(finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 2), null);
    beginRun(c, 2);
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'refresh', 2);
    assert.equal(c.repairKits, 2);
});

test('malformed crew saves are rejected without silently corrupting the campaign', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 5 };
    hireMechanic(c);
    queueJob(c, 'refine');
    const valid = JSON.parse(JSON.stringify(c));
    for (const bad of [0, -1, Infinity, '45', 100]) {
        valid.crew.jobs[0].remaining = bad;
        assert.equal(parseCampaign(JSON.stringify(valid)), null);
    }
    valid.crew.jobs[0].remaining = 10;
    valid.crew.jobs[0].kind = '__proto__';
    assert.equal(parseCampaign(JSON.stringify(valid)), null);
});

test('field repair requires uninterrupted calm flight, consumes one kit and restores the engine', () => {
    const c = newCampaign();
    beginRun(c, 7);
    const sim = new MissionSimulation(c, 7);
    try {
        sim.hull = 60;
        sim.engineFault = true;
        for (let i = 0; i < 120; i++) sim.step({ ...idle, repair: true });
        assert.equal(sim.repairKits, 1);
        assert.ok(sim.repairProgress > 1);
        sim.step({ ...idle, repair: true, fire: true });
        assert.equal(sim.repairProgress, 0);
        for (let i = 0; i < 300; i++) sim.step({ ...idle, repair: true });
        assert.equal(sim.engineFault, false);
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.hull, 85);
        for (let i = 0; i < 360; i++) sim.step({ ...idle, repair: true });
        assert.equal(sim.hull, 85);
    } finally {
        sim.dispose();
    }
});

test('engine fault reduces acceleration and fast flight prevents repair progress', () => {
    const speedAfterThrust = (fault: boolean) => {
        const c = newCampaign();
        beginRun(c, 7);
        const sim = new MissionSimulation(c, 7);
        try {
            sim.ship.setTranslation({ x: 0, y: -10 }, true);
            sim.engineFault = fault;
            for (let i = 0; i < 60; i++)
                sim.step({ ...idle, target: { x: 10000, y: -1000 }, thrust: true });
            const speed = sim.speed;
            sim.ship.setLinvel({ x: 2, y: 0 }, true);
            sim.step({ ...idle, repair: true });
            assert.equal(sim.repairProgress, 0);
            return speed;
        } finally {
            sim.dispose();
        }
    };
    assert.ok(speedAfterThrust(true) < speedAfterThrust(false) * 0.5);
});

test('wreck salvage is awarded once and an ended mission cannot keep updating', () => {
    const sim = new MissionSimulation(newCampaign(), 18);
    try {
        const wreck = sim.sector.landmarks[2];
        sim.ship.setTranslation({ x: wreck.x / 100, y: wreck.y / 100 }, true);
        for (let i = 0; i < 20; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.wreckVisited, true);
        assert.equal(
            sim.cargo.parts +
                [...sim.loot.values()]
                    .filter((l) => l.kind === 'parts')
                    .reduce((sum, l) => sum + l.amount, 0),
            4,
        );
        sim.hull = 0;
        sim.step(idle);
        assert.equal(sim.ended, 'destroyed');
        const elapsed = sim.elapsed;
        sim.step({ ...idle, thrust: true });
        assert.equal(sim.elapsed, elapsed);
    } finally {
        sim.dispose();
    }
});

test('buying and selecting hulls keeps each ship loadout and charges exactly once', () => {
    const c = newCampaign();
    c.bank = { ore: 140, parts: 9 };
    c.station.workshop = 1;
    c.ship!.cargo = 1;
    const original = c.ship!.id;
    assert.ok(buyShip(c, 'swift'));
    assert.equal(c.ship!.hull, 'swift');
    assert.deepEqual(c.bank, { ore: 75, parts: 5 });
    const swift = c.ship!.id;
    assert.equal(c.ship!.cargo, 0);
    assert.ok(selectShip(c, original));
    assert.equal(c.ship!.cargo, 1);
    assert.equal(capacity(c), 55);
    assert.ok(selectShip(c, swift));
    assert.equal(c.ship!.cargo, 0);
    assert.equal(capacity(c), 35);
    assert.equal(ownedShips(c).length, 2);
    assert.equal(selectShip(c, swift), false);
    assert.equal(selectShip(c, 999), false);
});

test('ship purchases enforce workshop, bank, fleet capacity and active-run locks', () => {
    const c = newCampaign();
    c.bank = { ore: 140, parts: 9 };
    assert.equal(buyShip(c, 'swift'), false);
    assert.equal(c.bank.ore, 140);
    c.station.workshop = 1;
    assert.ok(buyShip(c, 'swift'));
    assert.ok(buyShip(c, 'prospector'));
    const bank = { ...c.bank };
    assert.equal(buyShip(c), false);
    assert.deepEqual(c.bank, bank);
    beginRun(c, 1);
    assert.equal(selectShip(c, c.reserveShips[0].id), false);
    assert.equal(buyShip(c, 'mule'), false);
    assert.deepEqual(c.bank, bank);
});

test('death removes the selected ship but leaves upgraded reserves and the mechanic', () => {
    const c = newCampaign();
    c.bank = { ore: 120, parts: 8 };
    c.station.workshop = 1;
    c.ship!.engine = 1;
    const reserve = c.ship!.id;
    c.crew.mechanic = true;
    buyShip(c, 'swift');
    beginRun(c, 9);
    finishRun(c, false, { ore: 20, parts: 3 }, 12, 'collision');
    assert.equal(c.ship, null);
    assert.equal(c.reserveShips.length, 1);
    assert.equal(c.reserveShips[0].id, reserve);
    assert.equal(c.reserveShips[0].engine, 1);
    assert.equal(c.crew.mechanic, true);
    assert.ok(selectShip(c, reserve));
    assert.equal(c.ship!.hull, 'prospector');
});

test('emergency recovery uses a reserve ship before granting a new free hull', () => {
    const c = newCampaign();
    c.bank.ore = 15;
    const original = c.ship!.id;
    assert.ok(buyShip(c));
    beginRun(c, 1);
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'loss');
    const nextId = c.nextShipId;
    assert.ok(emergencyKit(c));
    assert.equal(c.ship!.id, original);
    assert.equal(c.nextShipId, nextId);
    assert.equal(c.reserveShips.length, 0);
});

test('v2 migration preserves modules, crew and resources, assigning the current hull a stable ID', () => {
    const c = newCampaign();
    c.ship!.drill = 2;
    c.crew.mechanic = true;
    c.bank = { ore: 40, parts: 5 };
    queueJob(c, 'kit');
    const old = JSON.parse(JSON.stringify(c));
    old.version = 2;
    delete old.reserveShips;
    delete old.nextShipId;
    delete old.ship.id;
    delete old.ship.hull;
    const migrated = parseCampaign(JSON.stringify(old))!;
    assert.ok(migrated);
    assert.equal(migrated.ship!.hull, 'prospector');
    assert.equal(migrated.ship!.drill, 2);
    assert.equal(migrated.ship!.id, 1);
    assert.deepEqual(migrated.bank, c.bank);
    assert.deepEqual(migrated.crew, c.crew);
    assert.equal(migrated.nextShipId, 2);
    assert.equal(migrated.reserveShips.length, 0);
});

test('fleet saves roundtrip and reject unknown hulls or duplicate ship identities', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 8 };
    c.station.workshop = 1;
    buyShip(c, 'swift');
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    const bad = JSON.parse(JSON.stringify(c));
    bad.reserveShips[0].id = bad.ship.id;
    assert.equal(parseCampaign(JSON.stringify(bad)), null);
    bad.reserveShips[0].id = 1;
    bad.ship.hull = '__proto__';
    assert.equal(parseCampaign(JSON.stringify(bad)), null);
});

test('hull profiles affect live physics and capacities while the starting hull keeps its arcade baseline', () => {
    const measure = (hull: HullId) => {
        const c = newCampaign();
        c.ship!.hull = hull;
        const sim = new MissionSimulation(c, 7);
        try {
            for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
            sim.rocks.clear();
            for (let i = 0; i < 90; i++) sim.step({ ...idle, thrust: true });
            assert.ok(Math.abs(sim.speed - HULLS[hull].maxSpeed) < 1);
            assert.equal(sim.maxHull, shipHealth(c.ship!));
            assert.equal(sim.cargoCapacity, capacity(c));
            return sim.speed;
        } finally {
            sim.dispose();
        }
    };
    assert.equal(HULLS.prospector.thrust, GAME.thrust);
    assert.equal(HULLS.prospector.turnSpeed, GAME.turnSpeed);
    assert.equal(HULLS.prospector.maxSpeed, GAME.maxSpeed);
    assert.ok(measure('swift') > measure('prospector'));
    assert.ok(measure('mule') < GAME.maxSpeed);
});

test('scrapping only a reserve returns half the invested materials once and frees a fleet slot', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 8 };
    c.ship!.engine = 1;
    const old = c.ship!.id;
    assert.ok(buyShip(c));
    assert.deepEqual(scrapRefund(c.reserveShips[0]), { ore: 16, parts: 0 });
    assert.equal(scrapShip(c, c.ship!.id), false);
    assert.ok(scrapShip(c, old));
    assert.deepEqual(c.bank, { ore: 101, parts: 8 });
    assert.equal(scrapShip(c, old), false);
    assert.equal(ownedShips(c).length, 1);
});

test('scrapping rejects full storage and active missions without removing ships or materials', () => {
    const c = newCampaign();
    c.bank.ore = 15;
    buyShip(c);
    const id = c.reserveShips[0].id;
    c.bank.ore = 150;
    assert.equal(scrapShip(c, id), false);
    assert.equal(c.reserveShips.length, 1);
    c.bank.ore = 10;
    beginRun(c, 9);
    assert.equal(scrapShip(c, id), false);
    assert.equal(c.bank.ore, 10);
});

test('the mining hull applies its weapon bonus to actual asteroid hits', () => {
    const damage = (hull: HullId) => {
        const c = newCampaign();
        c.ship!.hull = hull;
        const sim = new MissionSimulation(c, 7);
        try {
            const rock = [...sim.rocks.values()][0];
            for (const other of sim.rocks.values())
                if (other !== rock) {
                    sim.world.removeRigidBody(other.body);
                    sim.rocks.delete(other.id);
                }
            rock.body.setTranslation({ x: 10, y: 0 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            rock.health = 1000;
            sim.ship.setTranslation({ x: 8, y: 0 }, true);
            sim.ship.setRotation(0, true);
            for (let i = 0; i < 20; i++) sim.step({ ...idle, fire: i === 0 });
            return 1000 - rock.health;
        } finally {
            sim.dispose();
        }
    };
    assert.ok(Math.abs(damage('prospector') - GAME.shotDamage) < 1e-6);
    assert.ok(Math.abs(damage('mule') - GAME.shotDamage * 1.3) < 1e-6);
});
