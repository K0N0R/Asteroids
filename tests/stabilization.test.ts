import { fundEquipment } from './fleet-fixtures';
import { RESOURCE_IDS, type ResourceStore } from '../frontend/game/state/resources';
import { fundHull } from './fleet-fixtures';
import { HULL_CONSTRUCTION } from '../frontend/game/state/fleetConstruction';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { REPAIR_KITS, GAME, HULLS, type HullId } from '../frontend/game/config';
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
        c.station = {
            storage: 3,
            workshop: 2,
            shield: true,
            shieldLevel: 0,
            reinforcedBays: 0,
            sentries: null,
        };
        c.bank = { ore: 250, parts: 100, crystals: 50 };
        const original = c.ship!.id;
        fundHull(c, hull);
        assert.ok(buyShip(c, hull), hull);
        const purchased = c.ship!.id;
        const spent: ResourceStore = { ore: 0, ...HULL_CONSTRUCTION[hull] };
        for (const key of ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'] as const) {
            for (let level = 0; level < 3; level++) {
                c.bank = { ore: 250, parts: 100, crystals: 50 };
                const price = upgradePrice(c, key);
                fundEquipment(c, price);
                assert.ok(buyUpgrade(c, key), `${hull}: ${key} ${level + 1}`);
                for (const id of RESOURCE_IDS) spent[id] = (spent[id] ?? 0) + (price[id] ?? 0);
            }
            const snapshot = JSON.stringify(c);
            assert.equal(buyUpgrade(c, key), false);
            assert.equal(JSON.stringify(c), snapshot);
        }
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c, hull);
        const refund = scrapRefund(c.ship!);
        for (const id of RESOURCE_IDS)
            assert.equal(refund[id] ?? 0, Math.floor((spent[id] ?? 0) / 2), `${hull}: ${id}`);
        assert.ok(selectShip(c, original));
        c.bank = { ore: 0, parts: 0 };
        assert.ok(scrapShip(c, purchased));
        assert.deepEqual(c.bank, refund);
        assert.equal(scrapShip(c, purchased), false);
    }
});

test('scrapping preserves every refunded material beyond the former warehouse boundary', () => {
    const c = newCampaign();
    c.bank.ore = 15;
    fundHull(c);
    assert.ok(buyShip(c));
    const reserve = c.reserveShips[0];
    reserve.engine = 3;
    const refund = scrapRefund(reserve);
    c.bank.ore = 2_000_000;
    assert.ok(canScrapShip(c, reserve.id));
    assert.ok(scrapShip(c, reserve.id));
    assert.equal(c.bank.ore, 2_000_000 + refund.ore);
    assert.equal(c.bank.parts, refund.parts);
    assert.equal(c.bank.crystals, refund.crystals);
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
