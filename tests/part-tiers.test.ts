import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newStoryCampaign,
    newCampaign,
    buyUpgrade,
    buyShip,
    parseCampaign,
    scrapRefund,
    beginRun,
} from '../frontend/game/state/campaign';
import { PART_FAMILIES, partInfo, tieredBill } from '../frontend/game/state/partTiers';
import {
    RECIPES,
    RECIPE_IDS,
    type ProcessRecipe,
    type RecipeId,
} from '../frontend/game/state/chemistry';
import { manufacture, productionLock } from '../frontend/game/state/production';
import {
    HULL_CONSTRUCTION,
    hasHullParts,
    hullPartIds,
} from '../frontend/game/state/fleetConstruction';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { moduleParts } from '../frontend/game/state/equipmentCosts';
import { RESOURCE_IDS, ELEMENT_IDS, type ResourceId } from '../frontend/game/state/resources';
import { HULLS, type HullId } from '../frontend/game/config';
import { fundEquipment } from './fleet-fixtures';

test('every tier II/III part has one recipe using its previous tier; missing input never charges partially', () => {
    for (const ids of Object.values(PART_FAMILIES))
        for (const index of [1, 2]) {
            const matching = RECIPE_IDS.filter((key) => RECIPES[key].output === ids[index]);
            assert.equal(matching.length, 1, ids[index]);
            const id = matching[0],
                recipe: ProcessRecipe = RECIPES[id];
            assert.equal(recipe.inputs[ids[index - 1]], 1);
            assert.equal(recipe.level, index);
            const c = newCampaign();
            c.station.workshop = index;
            fundEquipment(c, recipe.inputs);
            c.bank[ids[index - 1]] = 0;
            const before = structuredClone(c);
            assert.equal(manufacture(c, id), false);
            assert.deepEqual(c, before);
            c.bank[ids[index - 1]] = 1;
            assert.ok(manufacture(c, id));
            assert.equal(c.bank[ids[index]], 1);
            assert.equal(c.bank[ids[index - 1]], 0);
            assert.equal(c.bank.partsIII ?? 0, ids[index] === 'partsIII' ? 1 : 0);
        }
});

test('all higher parts are producible recursively from elements at their unlocked facility level without dependency cycles', () => {
    for (const ids of Object.values(PART_FAMILIES))
        for (const index of [1, 2]) {
            const c = newStoryCampaign();
            c.station.workshop = index;
            for (const element of ELEMENT_IDS) c.bank[element] = 100000;
            const make = (output: ResourceId, count: number, path: ResourceId[] = []) => {
                if ((c.bank[output] ?? 0) >= count) return;
                assert.equal(
                    path.includes(output),
                    false,
                    `cycle: ${path.join(' > ')} > ${output}`,
                );
                const id = RECIPE_IDS.find((key) => RECIPES[key].output === output)!;
                assert.ok(id, output);
                const recipe: ProcessRecipe = RECIPES[id];
                assert.ok(recipe.level <= index, `${output} requires facility ${recipe.level}`);
                const batches = Math.ceil((count - (c.bank[output] ?? 0)) / recipe.amount);
                for (const [input, amount] of Object.entries(recipe.inputs))
                    make(input as ResourceId, amount! * batches, [...path, output]);
                assert.ok(manufacture(c, id, batches), `${id}: ${productionLock(c, id, batches)}`);
            };
            make(ids[index], 1);
            assert.equal(c.bank[ids[index]], 1);
            assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        }
});

test('facility II is built with tier II parts available at facility I; the first facility still uses tier I', () => {
    for (let level = 0; level < 2; level++) {
        const c = newStoryCampaign();
        c.station.workshop = level;
        for (const id of Object.keys(WORKSHOP_CONSTRUCTION[level]) as ResourceId[]) {
            assert.equal(partInfo(id)?.tier, level + 1);
            const recipe = RECIPE_IDS.find((key) => RECIPES[key].output === id)!;
            assert.ok(RECIPES[recipe].level <= level);
        }
        fundEquipment(c, WORKSHOP_CONSTRUCTION[level]);
        assert.ok(buyUpgrade(c, 'workshop'));
        assert.equal(c.station.workshop, level + 1);
    }
});

test('module II and III need their exact tier and do not replace it with an abundant higher/lower tier', () => {
    for (const level of [1, 2]) {
        const c = newCampaign();
        c.station.workshop = 2;
        c.ship!.engine = level;
        c.bank = { ore: 0, parts: 0 };
        fundEquipment(c, tieredBill({ propulsion: 100, storageFrames: 100 }, level === 1 ? 3 : 1));
        const before = structuredClone(c);
        assert.equal(buyUpgrade(c, 'engine'), false);
        assert.deepEqual(c, before);
        fundEquipment(c, moduleParts('engine', level));
        assert.ok(buyUpgrade(c, 'engine'));
        assert.equal(c.ship!.engine, level + 1);
    }
});

test('hulls consume six families at the project tier and recycle those same tiers', () => {
    for (const hull of Object.keys(HULL_CONSTRUCTION) as HullId[]) {
        const tier = HULLS[hull].workshop + 1;
        assert.equal(hullPartIds(hull).length, 6);
        for (const id of hullPartIds(hull)) assert.equal(partInfo(id)?.tier, tier, hull);
        const c = newCampaign();
        c.station.workshop = 2;
        c.bank = { ore: 0, parts: 0 };
        fundEquipment(c, HULL_CONSTRUCTION[hull]);
        assert.ok(hasHullParts(c.bank, hull));
        if ('salvageOnly' in HULLS[hull]) continue;
        assert.ok(buyShip(c, hull));
        const refund = scrapRefund(c.ship!);
        for (const id of RESOURCE_IDS)
            assert.equal(
                refund[id] ?? 0,
                Math.floor((HULL_CONSTRUCTION[hull][id] ?? 0) / 2),
                `${hull}/${id}`,
            );
    }
});

test('tier production observes facility/flight locks; stock and malformed saves cannot bypass them', () => {
    const c = newStoryCampaign();
    fundEquipment(c, RECIPES.electronicsII.inputs);
    const before = structuredClone(c);
    assert.match(productionLock(c, 'electronicsII')!, /zaplecze/);
    assert.equal(manufacture(c, 'electronicsII'), false);
    assert.deepEqual(c, before);
    c.station.workshop = 2;
    beginRun(c, 1);
    assert.equal(manufacture(c, 'electronicsII'), false);
    const saved = newStoryCampaign();
    saved.bank.electronicsIII = 4;
    assert.ok(parseCampaign(JSON.stringify(saved)));
    saved.bank.electronicsIII = -1;
    assert.equal(parseCampaign(JSON.stringify(saved)), null);
    assert.equal(parseCampaign(JSON.stringify({ ...newStoryCampaign(), version: 65 })), null);
});
