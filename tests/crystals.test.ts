import { fundEquipment } from './fleet-fixtures';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
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

test('station expansion and ship modules require manufactured parts instead of raw silicon', () => {
    const c = newCampaign();
    c.bank = { ore: 500, parts: 80, propulsion: 6, storageFrames: 3 };
    c.station.workshop = 1;
    assert.ok(buyUpgrade(c, 'engine'));
    assert.deepEqual(upgradePrice(c, 'engine'), {
        ore: 0,
        parts: 0,
        propulsion: 4,
        storageFrames: 2,
    });
    assert.ok(buyUpgrade(c, 'engine'));
    const before = { ...c.bank };
    assert.equal(buyUpgrade(c, 'workshop'), false);
    assert.deepEqual(c.bank, before);
    c.bank.crystals = 1000;
    assert.equal(buyUpgrade(c, 'workshop'), false);
    fundEquipment(c, WORKSHOP_CONSTRUCTION[1]);
    assert.ok(buyUpgrade(c, 'workshop'));
    assert.equal(c.bank.crystals, 1000);
    assert.equal(scrapRefund(c.ship!).crystals, undefined);
});

test('docking preserves all silicon, parts and iron; death still loses carried silicon', () => {
    const c = newCampaign();
    c.bank.ore = 147;
    beginRun(c, 7);
    const result = finishRun(c, true, { ore: 3, parts: 2, crystals: 2 }, 1, 'dock')!;
    assert.equal(c.bank.crystals, 2);
    assert.equal(c.bank.parts, 2);
    assert.equal(c.bank.ore, 150);
    assert.equal(result.overflow, 0);
    assert.equal(storageUsed(c), 154);
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
