import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newStoryCampaign,
    buyUpgrade,
    upgradePrice,
    parseCampaign,
    beginRun,
} from '../frontend/game/state/campaign';
import {
    WORKSHOP_CONSTRUCTION,
    SHIELD_CONSTRUCTION,
    DRONE_HANGAR_CONSTRUCTION,
    DRONE_REPLACEMENT,
    KINETIC_CONSTRUCTION,
    droneReplacementBill,
} from '../frontend/game/state/stationConstruction';
import { manufacture } from '../frontend/game/state/production';
import { RESOURCE_IDS, RESOURCES, type ResourceStore } from '../frontend/game/state/resources';
import { STORY_TASKS } from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { mineralDeposit } from '../frontend/game/worlds/mineralDeposits';
import { installStationShield } from '../frontend/game/state/stationShield';
import { installStationDrones } from '../frontend/game/state/stationDrones';
import { installKineticUpgrade } from '../frontend/game/state/kineticIndustry';

function unlocked() {
    const c = newStoryCampaign();
    for (const task of STORY_TASKS.filter(
        (t) => t.sector === 'earth' && t.act === 1 && t.required,
    )) {
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    c.station.workshop = 1;
    return c;
}
test('station equipment uses named manufactured parts, never raw elements', () => {
    for (const bill of [
        ...WORKSHOP_CONSTRUCTION,
        SHIELD_CONSTRUCTION,
        DRONE_HANGAR_CONSTRUCTION,
        DRONE_REPLACEMENT,
        ...KINETIC_CONSTRUCTION,
    ])
        for (const [id, count] of Object.entries(bill)) {
            assert.equal(RESOURCES[id as keyof typeof RESOURCES].category, 'CZĘŚCI');
            assert.ok(Number.isSafeInteger(count) && count > 0);
        }
});
test('the first workshop can be manufactured from elements at level zero without circular unlocks', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 99, parts: 0, carbon: 1, copperOre: 10, crystals: 9, oxygen: 6 };
    for (const [recipe, count] of [
        ['steel', 1],
        ['copper', 5],
        ['conductors', 5],
        ['silicon', 3],
        ['silica', 3],
        ['plating', 5],
        ['machinery', 2],
        ['electronics', 3],
        ['power', 1],
    ] as const) {
        assert.equal(c.station.workshop, 0);
        assert.ok(manufacture(c, recipe, count), recipe);
    }
    assert.ok(buyUpgrade(c, 'workshop'));
    assert.equal(c.station.workshop, 1);
    for (const id of Object.keys(WORKSHOP_CONSTRUCTION[0]))
        assert.equal(c.bank[id as keyof typeof c.bank], 0);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 52 })), null);
});
test('Earth contains every bootstrap element before installing the first workshop', () => {
    const c = newStoryCampaign();
    const total: ResourceStore = {};
    for (const rock of generateStorySector(c.story!).rocks) {
        if (Math.hypot(rock.x, rock.y) > 1450) continue;
        const contents = mineralDeposit(rock).total;
        for (const id of RESOURCE_IDS) total[id] = (total[id] ?? 0) + (contents[id] ?? 0);
    }
    for (const id of ['ore', 'carbon', 'copperOre', 'crystals', 'oxygen'] as const)
        assert.ok((total[id] ?? 0) > 0, id);
    assert.equal(c.station.workshop, 0);
});
test('both workshop levels require each part atomically and enforce flight and maximum locks', () => {
    const c = newStoryCampaign();
    for (let level = 0; level < 2; level++) {
        const bill = WORKSHOP_CONSTRUCTION[level];
        for (const id of Object.keys(bill)) {
            c.bank = { ore: 1_000_000, parts: 0, crystals: 1_000_000, ...bill, [id]: 0 };
            const before = structuredClone(c);
            assert.equal(buyUpgrade(c, 'workshop'), false);
            assert.deepEqual(c, before);
        }
        c.bank = { ore: 0, parts: 0, ...bill };
        assert.ok(buyUpgrade(c, 'workshop'));
    }
    const before = structuredClone(c);
    assert.equal(buyUpgrade(c, 'workshop'), false);
    assert.deepEqual(c, before);
    assert.deepEqual(upgradePrice(c, 'workshop'), { ore: 0, parts: 0 });
    const flight = newStoryCampaign();
    flight.bank = { ore: 0, parts: 0, ...WORKSHOP_CONSTRUCTION[0] };
    beginRun(flight, 1);
    const flying = structuredClone(flight);
    assert.equal(buyUpgrade(flight, 'workshop'), false);
    assert.deepEqual(flight, flying);
});
test('shield and drone hangar need the full bill and charge installation only once', () => {
    for (const [bill, install] of [
        [SHIELD_CONSTRUCTION, installStationShield],
        [DRONE_HANGAR_CONSTRUCTION, installStationDrones],
    ] as const) {
        for (const id of Object.keys(bill)) {
            const c = unlocked();
            c.station.shield = install === installStationDrones;
            c.bank = { ore: 100000, parts: 0, ...bill, [id]: 0 };
            const before = structuredClone(c);
            assert.equal(install(c), false);
            assert.deepEqual(c, before);
        }
        const c = unlocked();
        c.station.shield = install === installStationDrones;
        c.bank = { ore: 100000, parts: 0, ...bill };
        assert.ok(install(c));
        assert.equal(c.bank.ore, 100000);
        for (const id of Object.keys(bill)) assert.equal(c.bank[id as keyof typeof c.bank], 0);
        const before = structuredClone(c);
        assert.equal(install(c), false);
        assert.deepEqual(c, before);
    }
});
test('rebuilding charges only lost drones, preserves damaged survivors and cannot be replayed', () => {
    const c = unlocked();
    c.station.shield = true;
    c.station.sentries = [
        { hull: 0, rebuildRemaining: 0 },
        { hull: 27, rebuildRemaining: 0 },
        { hull: 0, rebuildRemaining: 0 },
    ];
    c.bank = { ore: 0, parts: 0, ...droneReplacementBill(2) };
    assert.ok(installStationDrones(c));
    assert.deepEqual(
        c.station.sentries.map((s) => s.hull),
        [80, 27, 80],
    );
    for (const id of Object.keys(DRONE_REPLACEMENT))
        assert.equal(c.bank[id as keyof typeof c.bank], 0);
    const before = structuredClone(c);
    assert.equal(installStationDrones(c), false);
    assert.deepEqual(c, before);
});
test('both kinetic tiers require their whole parts bill and never consume raw silicon', () => {
    const c = unlocked();
    c.station.workshop = 2;
    c.station.shield = true;
    for (const task of STORY_TASKS.filter(
        (t) => (t.act <= 3 && t.required) || t.id === 'mercury-survey',
    )) {
        if (c.story!.claimed.includes(task.id)) continue;
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    for (const bill of KINETIC_CONSTRUCTION) {
        for (const id of Object.keys(bill)) {
            c.bank = { ore: 0, parts: 0, crystals: 1000, ...bill, [id]: 0 };
            const before = structuredClone(c);
            assert.equal(installKineticUpgrade(c, 'shield'), false);
            assert.deepEqual(c, before);
        }
        c.bank = { ore: 0, parts: 0, crystals: 1000, ...bill };
        assert.ok(installKineticUpgrade(c, 'shield'));
        assert.equal(c.bank.crystals, 1000);
    }
    const before = structuredClone(c);
    assert.equal(installKineticUpgrade(c, 'shield'), false);
    assert.deepEqual(c, before);
});
