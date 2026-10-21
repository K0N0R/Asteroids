import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HULLS, FLEET_LIMIT, type HullId } from '../frontend/game/config';
import {
    HULL_CONSTRUCTION,
    hullPartIds,
    hasHullParts,
} from '../frontend/game/state/fleetConstruction';
import {
    newCampaign,
    newStoryCampaign,
    newShip,
    buyShip,
    scrapRefund,
    scrapShip,
    emergencyKit,
    beginRun,
    deliverSalvage,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { manufacture, productionLock } from '../frontend/game/state/production';
import { RESOURCE_IDS, resourceTotal, type ResourceStore } from '../frontend/game/state/resources';
import { fundHull } from './fleet-fixtures';

test('each hull bill consists of six real part families, with no raw elements', () => {
    assert.deepEqual(Object.keys(HULL_CONSTRUCTION).sort(), Object.keys(HULLS).sort());
    for (const [hull, bill] of Object.entries(HULL_CONSTRUCTION)) {
        assert.deepEqual(Object.keys(bill).sort(), [...hullPartIds(hull as HullId)].sort());
        for (const amount of Object.values(bill))
            assert.ok(Number.isSafeInteger(amount) && amount > 0);
    }
});
test('building consumes the complete bill atomically and raw elements cannot replace a missing part', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 10000, parts: 0, crystals: 10000 };
    fundHull(c, 'swift');
    c.bank.powerModules = 0;
    const before = structuredClone(c);
    assert.equal(buyShip(c, 'swift'), false);
    assert.deepEqual(c, before);
    c.bank.powerModules = HULL_CONSTRUCTION.swift.powerModules;
    const oldShip = structuredClone(c.ship),
        stock = { ...c.bank };
    assert.ok(buyShip(c, 'swift'));
    assert.deepEqual(c.reserveShips, [oldShip]);
    assert.equal(c.ship!.hull, 'swift');
    assert.equal(Object.hasOwn(c.ship!, 'hyperdriveLevel'), false);
    for (const id of RESOURCE_IDS)
        assert.equal(
            c.bank[id] ?? 0,
            (stock[id] ?? 0) - ((HULL_CONSTRUCTION.swift as Readonly<ResourceStore>)[id] ?? 0),
            id,
        );
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('all first-ship parts can be made by hand from elements at starting facilities', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 16, parts: 0, carbon: 4, copperOre: 12, crystals: 9, hydrogen: 4, oxygen: 12 };
    for (const [recipe, count] of [
        ['steel', 4],
        ['copper', 6],
        ['conductors', 6],
        ['silicon', 3],
        ['silica', 3],
        ['water', 2],
        ['oxygen', 2],
        ['plating', 5],
        ['machinery', 3],
        ['electronics', 3],
        ['lifeSupport', 1],
        ['propulsion', 1],
        ['power', 1],
    ] as const)
        assert.ok(manufacture(c, recipe, count), `${recipe}: ${productionLock(c, recipe, count)}`);
    assert.equal(c.station.workshop, 0);
    assert.ok(hasHullParts(c.bank, 'prospector'));
    assert.ok(buyShip(c));
    assert.equal(c.reserveShips.length, 1);
});
test('building respects story, fleet and flight locks without changing inventories or identities', () => {
    for (const mode of ['story', 'fleet', 'flight'] as const) {
        const c = newStoryCampaign();
        c.station.workshop = 2;
        fundHull(c, 'aegis');
        fundHull(c, 'swift');
        if (mode === 'fleet') {
            c.reserveShips = Array.from({ length: FLEET_LIMIT - 1 }, (_, i) => newShip(i + 2));
            c.nextShipId = FLEET_LIMIT + 1;
        }
        if (mode === 'flight') assert.ok(beginRun(c, 1));
        const before = structuredClone(c);
        assert.equal(buyShip(c, mode === 'story' ? 'aegis' : 'swift'), false);
        assert.deepEqual(c, before);
    }
});
test('emergency equipment handles missing parts despite a large elemental stock and cannot be repeated', () => {
    const c = newCampaign();
    c.ship = null;
    c.bank = { ore: 100000, parts: 0, crystals: 100000 };
    const stock = { ...c.bank };
    assert.ok(emergencyKit(c));
    assert.deepEqual(c.bank, stock);
    const id = c.ship!.id,
        next = c.nextShipId;
    assert.equal(emergencyKit(c), false);
    assert.equal(c.ship!.id, id);
    assert.equal(c.nextShipId, next);
    const paid = newCampaign();
    paid.ship = null;
    fundHull(paid);
    const before = structuredClone(paid);
    assert.equal(emergencyKit(paid), false);
    assert.deepEqual(paid, before);
    assert.ok(buyShip(paid));
});
test('scrapping returns only purchased hull families once, without charging for the standard drive', () => {
    const c = newCampaign(),
        ship = newShip(2, 'swift');
    c.reserveShips = [ship];
    c.nextShipId = 3;
    const refund = scrapRefund(ship);
    assert.equal(refund.ore, 0);
    assert.equal(refund.parts, 1);
    assert.equal(refund.propulsion, 1);
    assert.equal(refund.powerModules ?? 0, 0);
    assert.ok(scrapShip(c, 2));
    assert.deepEqual(c.bank, refund);
    const before = structuredClone(c);
    assert.equal(scrapShip(c, 2), false);
    assert.deepEqual(c, before);
});
test('a rescued hull with a full hangar credits every family once and survives saving', () => {
    const c = newCampaign();
    c.reserveShips = Array.from({ length: 5 }, (_, i) => newShip(i + 2));
    c.nextShipId = 21;
    const ship = newShip(20, 'mule');
    c.recoverySignals = [{ id: 20, seed: 7, x: 800, y: 200, pilot: null, ship }];
    assert.ok(beginRun(c, 7, 20));
    const refund = scrapRefund(ship),
        delivery = deliverSalvage(c, -20, 'recovery');
    assert.ok(delivery);
    assert.deepEqual(delivery.materials, refund);
    assert.deepEqual(c.bank, refund);
    assert.ok((c.bank.storageFramesII ?? 0) > 0);
    assert.ok((c.bank.electronicsII ?? 0) > 0);
    const before = structuredClone(c);
    assert.equal(deliverSalvage(c, -20, 'recovery'), null);
    assert.deepEqual(c, before);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('an older economy save is rejected rather than revaluing its hull investments', () => {
    const c = newCampaign();
    const old = { ...c, version: 50 };
    assert.equal(parseCampaign(JSON.stringify(old)), null);
    assert.ok(resourceTotal(HULL_CONSTRUCTION.prospector) > 0);
});

test('emergency equipment reports partial assistance so it is saved before the remaining paid step', () => {
    const c = newCampaign();
    c.ship = null;
    c.pilots = [];
    c.bank = { ore: 100000, parts: 0 };
    assert.ok(emergencyKit(c));
    assert.ok(c.ship);
    assert.equal(c.pilots.length, 0);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    const paid = newCampaign();
    paid.ship = null;
    paid.pilots = [];
    fundHull(paid);
    assert.ok(emergencyKit(paid));
    assert.equal(paid.ship, null);
    assert.equal(paid.pilots.length, 1);
    assert.ok(buyShip(paid));
    assert.deepEqual(parseCampaign(JSON.stringify(paid)), paid);
});
