import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newCampaign,
    newStoryCampaign,
    parseCampaign,
    beginRun,
    finishRun,
    storageUsed,
    buyUpgrade,
} from '../frontend/game/state/campaign';
import { manufacture, maxProduction, productionLock } from '../frontend/game/state/production';
import {
    RECIPES,
    MATERIAL_COMPOSITION,
    type ProcessRecipe,
    type RecipeId,
} from '../frontend/game/state/chemistry';
import {
    RESOURCE_IDS,
    ELEMENT_IDS,
    RESOURCES,
    STORAGE_PRIORITY,
    resourceSummary,
} from '../frontend/game/state/resources';
import { receiveEarthCargo } from '../frontend/game/state/earthLogistics';
import { MissionSimulation } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, fire: false, brake: false, interact: false };

test('all item identifiers have one storage route; element names always include their symbol', () => {
    assert.equal(new Set(STORAGE_PRIORITY).size, RESOURCE_IDS.length);
    assert.deepEqual([...STORAGE_PRIORITY].sort(), [...RESOURCE_IDS].sort());
    assert.equal(RESOURCE_IDS.includes('hyperFuel' as never), false);
    for (const id of ELEMENT_IDS)
        assert.ok(RESOURCES[id].name.includes(`(${RESOURCES[id].short})`));
    assert.match(resourceSummary({ hydrogen: 2, ore: 1 }), /Wodór \(H\)/);
    assert.match(resourceSummary({ hydrogen: 2, ore: 1 }), /Żelazo \(Fe\)/);
});
test('material processes preserve element composition per portion', () => {
    for (const [id, recipe] of Object.entries(RECIPES).filter(
        ([, r]) => r.category === 'laboratory' && r.output in MATERIAL_COMPOSITION,
    )) {
        const r: ProcessRecipe = recipe;
        assert.notEqual(r.output, 'kit');
        const composition = MATERIAL_COMPOSITION[r.output as keyof typeof MATERIAL_COMPOSITION]!;
        assert.ok(composition, id);
        for (const element of ELEMENT_IDS)
            assert.equal(
                r.inputs[element] ?? 0,
                (composition[element] ?? 0) * r.amount,
                `${id}/${element}`,
            );
    }
});
test('water batches commit inputs and outputs once and survive saving without workers', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 0, parts: 0, hydrogen: 20, oxygen: 10 };
    assert.equal(Object.hasOwn(c, 'crew'), false);
    assert.equal(maxProduction(c, 'water'), 5);
    assert.ok(manufacture(c, 'water', 2));
    assert.equal(c.bank.water, 4);
    assert.equal(c.bank.hydrogen, 12);
    assert.equal(c.bank.oxygen, 6);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.ok(manufacture(c, 'water', 3));
    const snapshot = structuredClone(c);
    assert.equal(manufacture(c, 'water'), false);
    assert.deepEqual(c, snapshot);
});
test('invalid batches and unknown recipes cannot mutate inventory', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 0, parts: 0, hydrogen: 100, oxygen: 100 };
    for (const count of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        const before = structuredClone(c);
        assert.equal(manufacture(c, 'water', count), false);
        assert.deepEqual(c, before);
    }
    assert.equal(manufacture(c, '__proto__' as RecipeId), false);
    assert.equal(maxProduction(c, 'toString' as RecipeId), 0);
    c.bank.water = Number.MAX_SAFE_INTEGER;
    const before = structuredClone(c);
    assert.equal(manufacture(c, 'water'), false);
    assert.equal(maxProduction(c, 'water'), 0);
    assert.deepEqual(c, before);
});
test('a missing ingredient never partially consumes the others', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 999, parts: 0, hydrogen: 12, oxygen: 2 };
    const before = structuredClone(c);
    assert.equal(manufacture(c, 'water', 3), false);
    assert.deepEqual(c, before);
    assert.equal(maxProduction(c, 'water'), 1);
});
test('production is manual at the station and flight cannot start a batch or generate delayed outputs', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 0, parts: 0, hydrogen: 20, oxygen: 10 };
    assert.ok(beginRun(c, 8));
    const before = structuredClone(c.bank);
    assert.equal(manufacture(c, 'water'), false);
    const s = new MissionSimulation(c, 8);
    try {
        for (let i = 0; i < 600; i++) s.step(idle);
        assert.deepEqual(c.bank, before);
    } finally {
        s.dispose();
    }
    finishRun(c, false, { ore: 0, parts: 0 }, 10, 'test');
    assert.ok(manufacture(c, 'water'));
});
test('six basic part families can be manually produced from elemental stock', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    c.bank = {
        ore: 5000,
        parts: 0,
        carbon: 100,
        copperOre: 100,
        crystals: 100,
        oxygen: 100,
        hydrogen: 100,
        aluminium: 100,
        magnesium: 100,
    };
    for (const [recipe, count] of [
        ['steel', 20],
        ['silica', 5],
        ['water', 5],
        ['plating', 5],
        ['electronics', 4],
        ['machinery', 2],
        ['lifeSupport', 1],
        ['propulsion', 1],
        ['power', 1],
    ] as [RecipeId, number][]) {
        assert.ok(manufacture(c, recipe, count), `${recipe}: ${productionLock(c, recipe, count)}`);
    }
    for (const id of [
        'parts',
        'electronics',
        'storageFrames',
        'lifeSupport',
        'propulsion',
        'powerModules',
    ] as const)
        assert.ok((c.bank[id] ?? 0) > 0, id);
    assert.ok(manufacture(c, 'alloy'));
    assert.ok(manufacture(c, 'lightPlating'));
    assert.equal(c.bank.lightPlating, 1);
});
test('workshop and story unlocks remain independent of stock and cannot be bypassed', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 0, parts: 0, steel: 10, mercuryOre: 10 };
    const before = structuredClone(c);
    assert.equal(manufacture(c, 'kineticPlate'), false);
    assert.deepEqual(c, before);
    c.station.workshopLevel = 3;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    assert.equal(manufacture(c, 'kineticPlate'), false);
});
test('unlimited storage accepts all new materials and parts without overflow', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank.ore = 2_000_000;
    beginRun(c, 5);
    const cargo = { ore: 0, parts: 2, water: 3, electronics: 4, nitrogen: 5 };
    const result = finishRun(c, true, cargo, 1, 'dock');
    assert.equal(result?.overflow, 0);
    assert.equal(storageUsed(c), 2_000_014);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    const before = structuredClone(c);
    assert.equal(buyUpgrade(c, 'storage'), false);
    assert.deepEqual(c, before);
});
test('direct station transfer accepts each catalog item once, even with a large bank', () => {
    const c = newStoryCampaign();
    c.bank.ore = 2_000_000;
    beginRun(c, 1);
    const cargo = { ore: 0, parts: 1, water: 3, oxygen: 2, lightPlating: 1 };
    const accepted = receiveEarthCargo(c, cargo)!;
    assert.equal(accepted.accepted.water, 3);
    assert.equal(c.bank.water, 3);
    assert.equal(cargo.water, 0);
    assert.equal(receiveEarthCargo(c, cargo), null);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('pre-refactor saves are rejected and invalid item quantities are not normalized', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 49 })), null);
    for (const value of [-1, 0.1, '2', Number.MAX_SAFE_INTEGER + 1]) {
        assert.equal(
            parseCampaign(JSON.stringify({ ...c, bank: { ore: 0, parts: 0, water: value } })),
            null,
        );
    }
    assert.equal(
        parseCampaign(JSON.stringify({ ...c, bank: { ore: 0, parts: 0, hyperFuel: 2 } })),
        null,
    );
});
test('repair kit production respects whole-batch limits, including max selection', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 0, parts: 0, steel: 100, copperOre: 100 };
    assert.equal(maxProduction(c, 'kit'), 9);
    const before = structuredClone(c);
    assert.equal(manufacture(c, 'kit', 10), false);
    assert.deepEqual(c, before);
    assert.ok(manufacture(c, 'kit', 9));
    assert.equal(c.repairKits, 10);
    assert.equal(maxProduction(c, 'kit'), 0);
});

test('manufactured parts remain in the station warehouse during an ordinary departure and return', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.bank = { ore: 99, parts: 0, carbon: 1 };
    assert.ok(manufacture(c, 'steel'));
    assert.ok(manufacture(c, 'plating'));
    assert.ok(beginRun(c, 1));
    assert.equal(c.bank.parts, 1);
    assert.equal(c.activeRun!.freight, undefined);
    assert.ok(parseCampaign(JSON.stringify(c)));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.cargo.parts, 0);
    } finally {
        s.dispose();
    }
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 0, 'dock', 0)!;
    assert.equal(c.bank.parts, 1);
    assert.equal(result.pilotProgress!.gainedXp, 0);
});

test('Mule self-repair leaves prepared repair kits untouched', () => {
    const c = newCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    c.ship!.hull = 'mule';
    c.repairKits = 5;
    assert.ok(beginRun(c, 8));
    assert.equal(c.repairKits, 5);
    const simulation = new MissionSimulation(c, c.activeRun!.seed);
    try {
        simulation.hull = simulation.maxHull - 20;
        const damaged = simulation.hull;
        for (let i = 0; i <= Math.ceil(simulation.repairSeconds * 60); i++)
            simulation.step({ ...idle, repair: true });
        assert.ok(simulation.hull > damaged);
        assert.equal(simulation.repairKits, 5);
    } finally {
        simulation.dispose();
    }
    assert.ok(parseCampaign(JSON.stringify(c)));
});
