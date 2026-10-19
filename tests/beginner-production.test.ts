import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newStoryCampaign, beginRun, finishRun, buyUpgrade } from '../frontend/game/state/campaign';
import { receiveEarthCargo } from '../frontend/game/state/earthLogistics';
import { recordStoryReturn, syncStory } from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { mineralDeposit } from '../frontend/game/worlds/mineralDeposits';
import { RESOURCE_IDS, resourceTotal, type ResourceStore } from '../frontend/game/state/resources';
import { RECIPES } from '../frontend/game/state/chemistry';
import { productionPreview, manufacture } from '../frontend/game/state/production';

test('one initial field supplies the first delivery and first workshop without regenerating rocks', () => {
    const c = newStoryCampaign();
    const available: ResourceStore = {};
    for (const rock of generateStorySector(c.story!).rocks) {
        if (Math.hypot(rock.x, rock.y) > 1450) continue;
        const total = mineralDeposit(rock).total;
        for (const id of RESOURCE_IDS) available[id] = (available[id] ?? 0) + (total[id] ?? 0);
    }
    const cargo = { ore: 24, parts: 0, carbon: 1, copperOre: 4, crystals: 3, oxygen: 2 };
    assert.ok(resourceTotal(cargo) <= 40);
    for (const [id, count] of Object.entries(cargo))
        assert.ok(
            (available[id as keyof ResourceStore] ?? 0) >= count,
            `${id}: available ${available[id as keyof ResourceStore]}, need ${count}`,
        );
    beginRun(c, 1);
    assert.ok(receiveEarthCargo(c, cargo));
    recordStoryReturn(c, 'earth', ['relay']);
    finishRun(c, true, cargo, 1, 'dock');
    for (const [recipe, count] of [
        ['steel', 1],
        ['copper', 2],
        ['conductors', 2],
        ['silicon', 1],
        ['silica', 1],
        ['machinery', 1],
        ['electronics', 1],
    ] as const)
        assert.ok(manufacture(c, recipe, count), recipe);
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    assert.ok(c.story!.claimed.includes('earth-workshop'));
});

test('production preview matches selected batch costs, output and the actual committed inventory', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 0, parts: 0, hydrogen: 10, oxygen: 6, water: 3 };
    const before = productionPreview(c, 'water', 3);
    assert.deepEqual(
        before.ingredients.map((r) => [r.resource, r.have, r.need]),
        [
            ['hydrogen', 10, 6],
            ['oxygen', 6, 3],
        ],
    );
    assert.equal(before.gain, 3);
    assert.equal(before.outputAfter, 6);
    assert.ok(manufacture(c, 'water', 3));
    assert.equal(c.bank.water, before.outputAfter);
    for (const row of before.ingredients) assert.equal(c.bank[row.resource], row.have - row.need);
    const local = productionPreview(c, 'water', 1, { site: 'lunar' });
    assert.equal(local.outputHave, 0);
    assert.ok(local.ingredients.every((r) => r.have === 0));
    assert.equal(RECIPES.water.equation, '2 H + O → H₂O');
    assert.equal(RECIPES.water.amount, 1);
});
