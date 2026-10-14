import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newCampaign,
    parseCampaign,
    beginRun,
    finishRun,
    buyUpgrade,
    upgradePrice,
    storageUsed,
    scrapRefund,
} from '../frontend/game/state/campaign';
import { hireMechanic, queueJob, cancelJob, advanceCrew } from '../frontend/game/state/crew';
import { generateSector } from '../frontend/game/worlds/sector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
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

test('version 11 migrates with zero crystals, preserving resources, pilot and interrupted mission', () => {
    const c = newCampaign();
    c.bank = { ore: 30, parts: 12 };
    beginRun(c, 71);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 11;
    const loaded = parseCampaign(JSON.stringify(old))!;
    assert.equal(loaded.version, 15);
    assert.equal(loaded.bank.crystals ?? 0, 0);
    assert.equal(loaded.bank.parts, 12);
    assert.equal(loaded.activeRun!.seed, 71);
    assert.equal(loaded.pilots[0].id, 1);
    for (const value of [-1, 0.5, null, 1000001]) {
        const bad = newCampaign();
        bad.bank.crystals = value as number;
        assert.equal(parseCampaign(JSON.stringify(bad)), null);
    }
});

test('crystal smelting requires workshop I and reserves inputs, refunds once and produces in flight only', () => {
    const c = newCampaign();
    c.bank = { ore: 30, parts: 10 };
    hireMechanic(c);
    const before = { ...c.bank };
    assert.equal(queueJob(c, 'crystallize'), false);
    assert.deepEqual(c.bank, before);
    c.station.workshop = 1;
    const used = storageUsed(c);
    assert.ok(queueJob(c, 'crystallize'));
    assert.equal(c.bank.parts, 5);
    assert.equal(storageUsed(c), used);
    const id = c.crew.jobs[0].id;
    assert.ok(cancelJob(c, id));
    assert.equal(cancelJob(c, id), false);
    assert.equal(c.bank.parts, 10);
    assert.ok(queueJob(c, 'crystallize'));
    assert.equal(advanceCrew(c, 100), 0);
    beginRun(c, 7);
    assert.equal(advanceCrew(c, 89), 0);
    assert.equal(c.bank.crystals ?? 0, 0);
    assert.equal(advanceCrew(c, 1), 1);
    assert.equal(c.bank.crystals, 1);
    assert.equal(storageUsed(c), used - 4);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('stronger ship and station upgrades require crystals with no partial payment', () => {
    const c = newCampaign();
    c.bank = { ore: 500, parts: 80 };
    c.station.workshop = 1;
    assert.ok(buyUpgrade(c, 'engine'));
    assert.equal(upgradePrice(c, 'engine').crystals, 1);
    const before = { ...c.bank };
    assert.equal(buyUpgrade(c, 'engine'), false);
    assert.deepEqual(c.bank, before);
    c.bank.crystals = 3;
    assert.ok(buyUpgrade(c, 'engine'));
    assert.equal(c.bank.crystals, 2);
    assert.ok(buyUpgrade(c, 'workshop'));
    assert.equal(c.bank.crystals, 0);
    assert.equal(c.station.workshop, 2);
    c.bank.crystals = 2;
    assert.ok(buyUpgrade(c, 'engine'));
    assert.equal(c.ship!.engine, 3);
    assert.equal(c.bank.crystals, 0);
    assert.equal(scrapRefund(c.ship!).crystals, 1);
});

test('docking prioritizes crystals before parts and ore; death loses carried crystals', () => {
    const c = newCampaign();
    c.bank.ore = 147;
    beginRun(c, 7);
    const result = finishRun(c, true, { ore: 3, parts: 2, crystals: 2 }, 1, 'dock')!;
    assert.equal(c.bank.crystals, 2);
    assert.equal(c.bank.parts, 1);
    assert.equal(c.bank.ore, 147);
    assert.equal(result.overflow, 4);
    assert.equal(storageUsed(c), 150);
    const lost = newCampaign();
    beginRun(lost, 7);
    finishRun(lost, false, { ore: 0, parts: 0, crystals: 2 }, 1, 'death');
    assert.equal(lost.bank.crystals ?? 0, 0);
});

test('rare crystal rocks are deterministic, remote and bounded without changing existing world locations', () => {
    for (let seed = 0; seed < 100; seed++) {
        const s = generateSector(seed),
            rare = s.rocks.filter((r) => r.crystal);
        assert.equal(rare.length, 12);
        assert.ok(rare.every((r) => r.rich && Math.hypot(r.x, r.y) > 2000));
        assert.deepEqual(s, generateSector(seed));
    }
});

test('laser mining and grippers collect crystals into actual cargo and deliver them to the station', () => {
    let seed = 1;
    while (!generateSector(seed).rocks.some((r) => r.crystal && r.radius < 44)) seed++;
    const c = newCampaign();
    beginRun(c, seed);
    const sim = new MissionSimulation(c, seed);
    try {
        const rock = [...sim.rocks.values()].find((r) => r.crystal && r.radius < 44)!;
        for (const r of sim.rocks.values())
            if (r !== rock) {
                sim.world.removeRigidBody(r.body);
                sim.rocks.delete(r.id);
            }
        sim.enemies.dispose();
        rock.body.setTranslation({ x: 30, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        sim.ship.setTranslation({ x: 28.7, y: 0 }, true);
        sim.ship.setRotation(0, true);
        for (let i = 0; i < 200 && sim.rocks.has(rock.id); i++)
            sim.step({ ...idle, target: { x: 3000, y: 0 }, mine: true });
        assert.equal(sim.rocks.has(rock.id), false);
        assert.ok([...sim.loot.values()].some((l) => l.kind === 'crystals'));
        for (let i = 0; i < 240; i++) sim.step(idle);
        assert.equal(sim.cargo.crystals, 1);
        assert.ok(sim.cargoUsed <= sim.cargoCapacity);
        finishRun(c, true, sim.cargo, sim.elapsed, 'dock');
        assert.equal(c.bank.crystals, 1);
    } finally {
        sim.dispose();
    }
});
