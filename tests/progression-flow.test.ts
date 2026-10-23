import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newCampaign,
    newShip,
    newStoryCampaign,
    parseCampaign,
    type Campaign,
} from '../frontend/game/state/campaign';
import { RECIPES, RECIPE_IDS, type ProcessRecipe } from '../frontend/game/state/chemistry';
import { manufacture, productionLock } from '../frontend/game/state/production';
import {
    installStationProject,
    stationProjectCost,
} from '../frontend/game/state/stationProgression';
import {
    ELEMENT_IDS,
    resourceTotal,
    type ResourceId,
    type ResourceStore,
} from '../frontend/game/state/resources';
import { STORY_TASKS, syncStory } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { grantStoryTasks } from './fleet-fixtures';

before(async () => RAPIER.init());

/** Acquire only terminal raw inputs. Every intermediate must pass the real production locks. */
function fabricator(c: Campaign) {
    const raw: ResourceStore = {};
    let operations = 0;
    const make = (id: ResourceId, target: number, path: ResourceId[] = []) => {
        const missing = target - (c.bank[id] ?? 0);
        if (missing <= 0) return;
        assert.equal(path.includes(id), false, `Cyclic recipe: ${[...path, id]}`);
        const recipeId = RECIPE_IDS.find((key) => RECIPES[key].output === id);
        if (!recipeId) {
            assert.ok(id === 'anomalyOre' || ELEMENT_IDS.includes(id as never), id);
            c.bank[id] = (c.bank[id] ?? 0) + missing;
            raw[id] = (raw[id] ?? 0) + missing;
            return;
        }
        const recipe: ProcessRecipe = RECIPES[recipeId];
        const batches = Math.ceil(missing / recipe.amount);
        const inputs = Object.entries(recipe.inputs).sort(
            ([a], [b]) =>
                Number(RECIPE_IDS.some((key) => RECIPES[key].output === b)) -
                Number(RECIPE_IDS.some((key) => RECIPES[key].output === a)),
        );
        for (const [input, amount] of inputs)
            make(input as ResourceId, amount! * batches, [...path, id]);
        assert.ok(
            manufacture(c, recipeId, batches),
            `${recipeId}: ${productionLock(c, recipeId, batches)}`,
        );
        operations += batches;
    };
    return {
        raw,
        get operations() {
            return operations;
        },
        bill: (bill: ResourceStore) => {
            for (const [id, target] of Object.entries(bill)) make(id as ResourceId, target!);
        },
    };
}

test('both facilities of a tier can be assembled without recipes that they unlock; budgets include batch surplus', () => {
    for (const [tier, expectedRaw, expectedOperations] of [
        [2, 146, 43],
        [3, 439, 85],
    ]) {
        const c = newCampaign();
        c.bank = { ore: 0, parts: 0 };
        c.station.laboratoryLevel = c.station.workshopLevel = tier - 1;
        c.station.extraction = c.station.anomalySampleDelivered = true;
        const factory = fabricator(c);
        for (const project of ['laboratory', 'workshop'] as const) {
            factory.bill(stationProjectCost(c, project));
            assert.ok(installStationProject(c, project));
        }
        assert.equal(resourceTotal(factory.raw), expectedRaw);
        assert.equal(factory.operations, expectedOperations);
        assert.equal(c.station.workshopLevel, tier);
    }
});

test('Mercury tier I industry builds the adapter, a real Swift extracts and returns ore, and the same campaign opens tier II', () => {
    const c = newStoryCampaign();
    grantStoryTasks(
        c,
        STORY_TASKS.filter((task) => task.required && task.act <= 4).map((task) => task.id),
    );
    c.story!.sector = 'mars';
    c.ship = newShip(c.ship!.id, 'swift');
    c.bank = { ore: 0, parts: 0 };
    const factory = fabricator(c);
    factory.bill(stationProjectCost(c, 'extraction'));
    assert.ok(installStationProject(c, 'extraction'));
    syncStory(c);
    assert.ok(c.story!.claimed.includes('mars-extraction-adapter'));
    assert.ok(beginRun(c, 1));
    const sim = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const node = sim.extraction.nodes[0];
        assert.ok(node);
        sim.ship.setTranslation({ x: (node.x - 100) / 100, y: node.y / 100 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        const input = {
            target: node,
            thrust: false,
            brake: false,
            fire: false,
            mine: true,
            interact: false,
        };
        for (let frame = 0; frame < 245 && !sim.ended; frame++) {
            sim.step(input);
            sim.events.length = 0;
        }
        assert.equal(sim.ended, null);
        assert.equal(sim.cargo.anomalyOre, 8);
        assert.equal(c.station.anomalySampleDelivered, false);
        assert.ok(finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits));
    } finally {
        sim.dispose();
    }
    assert.equal(c.station.anomalySampleDelivered, true);
    assert.ok(c.story!.claimed.includes('mars-anomaly-sample'));
    factory.bill(stationProjectCost(c, 'laboratory'));
    assert.ok(installStationProject(c, 'laboratory'));
    syncStory(c);
    assert.equal(manufacture(c, 'electronicsII'), false);
    factory.bill(stationProjectCost(c, 'workshop'));
    assert.ok(installStationProject(c, 'workshop'));
    syncStory(c);
    assert.ok(c.story!.claimed.includes('mars-workshop-ii'));
    assert.equal(c.bank.anomalyOre, 2);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
