import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { CREW, GAME, HULLS, type HullId } from '../frontend/game/config';
import {
    beginRun,
    buyShip,
    buyUpgrade,
    canScrapShip,
    finishRun,
    newCampaign,
    parseCampaign,
    scrapRefund,
    scrapShip,
    selectShip,
    upgradePrice,
} from '../frontend/game/state/campaign';
import { advanceCrew, queueJob } from '../frontend/game/state/crew';
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

test('every hull can be bought, fully upgraded, saved and scrapped without creating materials', () => {
    for (const hull of (Object.keys(HULLS) as HullId[]).filter(
        (id) => !('salvageOnly' in HULLS[id]),
    )) {
        const c = newCampaign();
        c.station = { storage: 3, workshop: 2, shield: true, sentries: null };
        c.bank = { ore: 250, parts: 100, crystals: 50 };
        const original = c.ship!.id;
        assert.ok(buyShip(c, hull), hull);
        const purchased = c.ship!.id;
        const spent = { ore: HULLS[hull].ore, parts: HULLS[hull].parts, crystals: 0 };
        for (const key of ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const) {
            for (let level = 0; level < 3; level++) {
                c.bank = { ore: 250, parts: 100, crystals: 50 };
                const price = upgradePrice(c, key);
                assert.ok(buyUpgrade(c, key), `${hull}: ${key} ${level + 1}`);
                spent.ore += price.ore;
                spent.parts += price.parts;
                spent.crystals += price.crystals ?? 0;
            }
            const snapshot = JSON.stringify(c);
            assert.equal(buyUpgrade(c, key), false);
            assert.equal(JSON.stringify(c), snapshot);
        }
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c, hull);
        const refund = scrapRefund(c.ship!);
        assert.equal(refund.ore, Math.floor(spent.ore / 2), hull);
        assert.equal(refund.parts, Math.floor(spent.parts / 2), hull);
        assert.equal(refund.crystals, Math.floor(spent.crystals / 2), hull);
        assert.ok(selectShip(c, original));
        c.bank = { ore: 0, parts: 0 };
        if (refund.ore + refund.parts + (refund.crystals ?? 0) <= 450) {
            assert.ok(scrapShip(c, purchased));
            assert.deepEqual(c.bank, refund);
            assert.equal(scrapShip(c, purchased), false);
        } else {
            // Large investments cannot be recycled into a smaller warehouse.
            const snapshot = JSON.stringify(c);
            assert.equal(scrapShip(c, purchased), false);
            assert.equal(JSON.stringify(c), snapshot);
        }
    }
});

test('consuming a field kit releases its reserved stock slot for station production and saves', () => {
    const c = newCampaign();
    c.crew.mechanic = true;
    c.bank = { ore: 18, parts: 3 };
    c.repairKits = 7;
    for (let i = 0; i < 3; i++) assert.ok(queueJob(c, 'kit'));
    assert.ok(beginRun(c, 71));
    const sim = new MissionSimulation(c, 71);
    try {
        sim.hull = sim.maxHull - 30;
        for (let i = 0; i < 300; i++) sim.step({ ...idle, repair: true });
        assert.equal(sim.repairKits, 1);
        assert.equal(c.activeRun!.repairKits, 1);
        assert.equal(advanceCrew(c, 90), 3);
        assert.equal(c.repairKits + c.activeRun!.repairKits, CREW.kitLimit - 1);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits);
        assert.equal(c.repairKits, CREW.kitLimit - 1);
    } finally {
        sim.dispose();
    }
});

test('scrapping availability includes crystals at the warehouse boundary', () => {
    const c = newCampaign();
    c.bank.ore = 15;
    assert.ok(buyShip(c));
    const reserve = c.reserveShips[0];
    reserve.engine = 3;
    const refund = scrapRefund(reserve);
    assert.equal(refund.crystals, 1);
    c.bank.ore = 150 - refund.ore - refund.parts;
    const snapshot = JSON.stringify(c);
    assert.equal(canScrapShip(c, reserve.id), false);
    assert.equal(scrapShip(c, reserve.id), false);
    assert.equal(JSON.stringify(c), snapshot);
    c.bank.ore--;
    assert.equal(canScrapShip(c, reserve.id), true);
    assert.ok(scrapShip(c, reserve.id));
    assert.equal(c.bank.ore + c.bank.parts + c.bank.crystals!, 150);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('all purchasable and recovered hulls survive repeated control and weapon cycles or settle their loss cleanly', () => {
    for (const hull of Object.keys(HULLS) as HullId[]) {
        const c = newCampaign();
        c.ship!.hull = hull;
        assert.ok(beginRun(c, 731));
        const sim = new MissionSimulation(c, 731);
        try {
            for (let frame = 0; frame < 120 * 60 && !sim.ended; frame++) {
                const accelerate = frame % 600 < 120;
                sim.step({
                    ...idle,
                    thrust: accelerate,
                    boost: accelerate,
                    brake: !accelerate,
                    turn: accelerate ? 0 : 1,
                    fire: true,
                    mine: true,
                });
                sim.events.length = 0;
                if (frame % 60 !== 0) continue;
                assert.ok(sim.bullets.size <= 80, hull);
                assert.ok(sim.loot.size <= 400, hull);
                for (const value of [sim.position.x, sim.position.y, sim.speed, sim.hull])
                    assert.ok(Number.isFinite(value), hull);
            }
            if (!sim.ended) {
                sim.ship.setTranslation({ x: 0, y: 0 }, true);
                sim.ship.setLinvel({ x: 0, y: 0 }, true);
                sim.ship.setAngvel(0, true);
                for (let frame = 0; frame < 180 && !sim.ended; frame++)
                    sim.step({ ...idle, interact: true });
                assert.equal(sim.ended, 'returned', hull);
            }
            assert.ok(
                finishRun(
                    c,
                    sim.ended === 'returned',
                    sim.cargo,
                    sim.elapsed,
                    'soak',
                    sim.repairKits,
                ),
                hull,
            );
            assert.deepEqual(parseCampaign(JSON.stringify(c)), c, hull);
            assert.equal(finishRun(c, true, sim.cargo, sim.elapsed, 'duplicate'), null);
        } finally {
            sim.dispose();
        }
        assert.equal(sim.bullets.size + sim.rocks.size + sim.loot.size, 0, hull);
    }
});

test('a thirty-minute sector soak keeps physics and transient collections bounded', () => {
    const c = newCampaign();
    assert.ok(beginRun(c, 731));
    const sim = new MissionSimulation(c, 731);
    const initialBodies = sim.world.bodies.len();
    let maximumBodies = initialBodies;
    try {
        for (let frame = 0; frame < 30 * 60 * 60; frame++) {
            // Real sector, asteroid drift, AI patrols and continuous weapon use at Aurora.
            sim.step({ ...idle, fire: true, mine: true });
            // MissionWorld consumes these effects every rendered frame.
            sim.events.length = 0;
            if (frame % 60 !== 0) continue;
            maximumBodies = Math.max(maximumBodies, sim.world.bodies.len());
            assert.equal(sim.ended, null);
            for (const value of [sim.position.x, sim.position.y, sim.speed, sim.hull])
                assert.ok(Number.isFinite(value));
            assert.ok(sim.loot.size <= 400);
            assert.ok(sim.bullets.size < 100);
        }
        assert.ok(Math.abs(sim.elapsed - 1800) < GAME.step);
        assert.ok(maximumBodies <= initialBodies + 100);
    } finally {
        sim.dispose();
    }
    assert.equal(sim.rocks.size + sim.bullets.size + sim.loot.size + sim.events.length, 0);
    sim.dispose();
    const elapsed = sim.elapsed;
    sim.step(idle);
    assert.equal(sim.elapsed, elapsed);
});
