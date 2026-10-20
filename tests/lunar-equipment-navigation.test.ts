import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Container } from 'pixi.js';
import { newStoryCampaign, beginRun, parseCampaign } from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    storyDiscoveredTasks,
    storyObjectives,
    deliverLunarCargo,
} from '../frontend/game/state/story';
import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import { lunarDeliveryTasks } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { earthGuideGoal } from '../frontend/game/systems/earthGuide';
import { constructionCosts } from '../frontend/game/ui/constructionCosts';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { Button } from '../frontend/core/containers/components/button';
import { RECIPES, type RecipeId } from '../frontend/game/state/chemistry';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { mineralDeposit } from '../frontend/game/worlds/mineralDeposits';

before(async () => RAPIER.init());
function ready(probe = true) {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    const claim = (id: string) => {
        const task = STORY_TASKS.find((task) => task.id === id)!;
        for (const dependency of task.dependencies)
            if (!c.story!.claimed.includes(dependency)) claim(dependency);
        c.story!.progress[id] = task.target;
        if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
    };
    claim('earth-workshop');
    if (probe) claim('lunar-survey');
    return c;
}

test('instructor waiting beside the gate or inside its route cannot block or destroy a hyperjump', () => {
    const c = ready(false);
    const goal = earthGuideGoal(c, { ore: 0, parts: 0 });
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const lane = s.sector.hyperlanes[0];
        assert.ok(Math.hypot(goal.x - lane.a.x, goal.y - lane.a.y) > 200);
        for (const rock of s.rocks.values()) {
            s.world.removeRigidBody(rock.body);
            s.asteroidColliders.delete(rock.collider.handle);
        }
        s.rocks.clear();
        s.ship.setTranslation({ x: lane.a.x / 100, y: lane.a.y / 100 }, true);
        s.guide!.body.setTranslation({ x: lane.a.x / 100, y: (lane.a.y - 180) / 100 }, true);
        const idle = { target: lane.b, thrust: false, brake: false, fire: false, interact: false };
        s.step(idle);
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.state, 'charging');
        for (let i = 0; i < 180; i++) {
            s.step(idle);
            s.events.length = 0;
        }
        assert.equal(s.ended, null);
        assert.equal(s.hyperdrive.state, 'idle');
        assert.ok(Math.hypot(s.position.x - lane.b.x, s.position.y - lane.b.y) < 1);
    } finally {
        s.dispose();
    }
});

test('one equipment quest tracks partial deliveries of all five components and completes once', () => {
    const c = ready();
    const visible = storyDiscoveredTasks(c.story!);
    assert.equal(visible.filter((task) => task.deliveryItems).length, 1);
    assert.ok(!visible.some((task) => LUNAR_PROCESSING.some((item) => item.id === task.id)));
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    const first = { ore: 0, parts: 4, electronics: 1 };
    const partial = deliverLunarCargo(c, first)!;
    assert.deepEqual(partial.change.titles, []);
    assert.equal(
        storyObjectives(c).find((task) => task.id === 'lunar-equipment')!.progress,
        '5/19',
    );
    assert.equal(c.story!.claimed.includes('lunar-equipment'), false);
    const parts = lunarDeliveryTasks(c).find((task) => task.resource === 'parts')!;
    assert.equal(parts.target - c.story!.progress[parts.id], 4);
    const rest = {
        ore: 0,
        parts: 4,
        storageFrames: 4,
        electronics: 2,
        powerModules: 2,
        lifeSupport: 2,
    };
    const completed = deliverLunarCargo(c, rest)!;
    assert.deepEqual(completed.change.titles, ['Wyposażenie stacji']);
    assert.ok(c.story!.claimed.includes('lunar-equipment'));
    assert.ok(storyObjectives(c).find((task) => task.id === 'lunar-equipment')!.complete);
    assert.equal(deliverLunarCargo(c, rest), null);
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('station component buttons route every required manufactured part to its own recipe', () => {
    const ui = new Container();
    const opened: RecipeId[] = [];
    const bill = WORKSHOP_CONSTRUCTION[1];
    try {
        constructionCosts(ui, {}, bill, 570, (id) => opened.push(id));
        const buttons = ui.children.filter((view): view is Button => view instanceof Button);
        assert.equal(buttons.length, 5);
        for (const button of buttons) button.config.onClick();
        assert.deepEqual(
            new Set(opened.map((id) => RECIPES[id].output)),
            new Set(Object.keys(bill)),
        );
    } finally {
        destroyDisplayTree(ui);
    }
});

test('Tab cargo actions eject exactly one item and supply objectives include cargo already collected', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.cargo.copperOre = 5;
        const used = s.cargoUsed;
        assert.ok(s.jettisonCargo('copperOre'));
        assert.equal(s.cargo.copperOre, 4);
        assert.equal(s.cargoUsed, used - 1);
        assert.equal([...s.loot.values()].filter((item) => item.kind === 'copperOre').length, 1);
        assert.equal(s.grippers.enabled, false);
        s.toggleCollection();
        assert.equal(s.grippers.enabled, true);
        const goal = storyObjectives(
            c,
            [],
            false,
            0,
            false,
            false,
            [],
            0,
            false,
            false,
            s.cargo,
        ).find((goal) => goal.id === 'earth-supply')!;
        assert.equal(goal.requirements!.find((row) => row.resource === 'copperOre')!.have, 4);
        assert.equal(goal.requirements!.length, 5);
    } finally {
        s.dispose();
    }
});

test('the initial mining area contains ample copper and silicon in multiple deposits', () => {
    const world = generateStorySector(newStoryCampaign().story!);
    const deposits = world.rocks
        .filter((rock) => Math.hypot(rock.x, rock.y) < 1500)
        .map(mineralDeposit);
    assert.ok(deposits.filter((deposit) => (deposit.total.copperOre ?? 0) > 0).length >= 4);
    assert.ok(deposits.filter((deposit) => (deposit.total.crystals ?? 0) > 0).length >= 4);
    assert.ok(deposits.reduce((sum, deposit) => sum + (deposit.total.copperOre ?? 0), 0) >= 16);
    assert.ok(deposits.reduce((sum, deposit) => sum + (deposit.total.crystals ?? 0), 0) >= 12);
});
