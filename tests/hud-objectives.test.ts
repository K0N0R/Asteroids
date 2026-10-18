import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Text } from 'pixi.js';
import { newStoryCampaign, beginRun } from '../frontend/game/state/campaign';
import { storyObjectives } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MissionHud } from '../frontend/game/ui/hud';
import { Typography } from '../frontend/core/containers/components/typography';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { C } from '../frontend/game/graphics/shapes';

before(async () => RAPIER.init());

test('surface wreck navigation retains the selected physical wreck position', () => {
    const c = newStoryCampaign();
    c.story!.sector = 'lunar';
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const hud = new MissionHud(sim, c.contract);
    try {
        sim.area = 'surface';
        sim.salvage.add(1001, 'patrol', { x: 24000, y: 24100 }, { x: 0, y: 0 });
        hud.trackWreck();
        assert.equal(hud.waypoint.name, 'Wrak #1001');
        assert.equal(hud.waypoint.x, 24000);
        assert.equal(hud.waypoint.y, 24100);
        assert.equal(hud.availableTargets.includes(16), false);
    } finally {
        destroyDisplayTree(hud);
        sim.dispose();
    }
});

test('navigation cycles available targets in both directions and wraps without dead entries', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const hud = new MissionHud(sim, c.contract);
    try {
        const targets = hud.availableTargets;
        assert.ok(targets.length > 1);
        assert.equal(new Set(targets).size, targets.length);
        hud.target = targets[0];
        for (const target of targets.slice(1)) {
            hud.cycleTarget(1);
            assert.equal(hud.target, target);
        }
        hud.cycleTarget(1);
        assert.equal(hud.target, targets[0]);
        hud.cycleTarget(-1);
        assert.equal(hud.target, targets[targets.length - 1]);
        hud.target = 999;
        hud.cycleTarget(1);
        assert.equal(hud.target, targets[0]);
    } finally {
        destroyDisplayTree(hud);
        sim.dispose();
    }
});

test('HUD reconciles objectives revealed by lunar construction during an active flight', () => {
    const c = newStoryCampaign();
    c.story!.sector = 'lunar';
    c.story!.claimed.push('lunar-survey');
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const goals = () => storyObjectives(c);
    const hud = new MissionHud(sim, c.contract, () => {}, goals);
    const rows = () =>
        hud.children.filter(
            (v): v is Typography =>
                v instanceof Typography && v.x === 1343 && v.label !== 'selected-navigation-goal',
        );
    try {
        const initial = goals().length;
        assert.equal(rows().length, initial);
        c.story!.progress['lunar-foundation'] = 160;
        c.story!.claimed.push('lunar-foundation');
        assert.ok(goals().length > initial);
        assert.doesNotThrow(() => hud.update(101));
        assert.equal(rows().length, goals().length);
        c.story!.progress['lunar-installations'] = 12;
        c.story!.claimed.push('lunar-installations');
        hud.update(101);
        assert.equal(rows().length, goals().length);
        const oldRows = rows();
        c.story!.sector = 'earth';
        hud.update(101);
        assert.equal(rows().length, goals().length);
        assert.ok(oldRows.slice(goals().length).every((v) => v.destroyed));
        const count = hud.children.length;
        for (let i = 0; i < 20; i++) hud.update(101);
        assert.equal(hud.children.length, count);
        assert.deepEqual(
            rows().map((v) => (v.children[0] as Text).text),
            goals().map((g) => `${g.title}${g.progress ? `  ${g.progress}` : ''}`),
        );
    } finally {
        destroyDisplayTree(hud);
        sim.dispose();
    }
});

test('a story scan destination highlights its matching campaign quest', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const goals = () => storyObjectives(c);
    const hud = new MissionHud(sim, c.contract, () => {}, goals);
    try {
        hud.target = 6;
        hud.update(101);
        const rows = hud.children.filter(
            (view): view is Typography =>
                view instanceof Typography &&
                view.x === 1343 &&
                view.label !== 'selected-navigation-goal',
        );
        const index = goals().findIndex((goal) => goal.id === 'earth-relay');
        assert.ok(index >= 0);
        assert.equal((rows[index].children[0] as Text).style.fill, C.cyan);
        assert.equal(hud.getChildByLabel('selected-navigation-goal')!.visible, false);
        hud.target = -1;
        hud.update(101);
        assert.notEqual((rows[index].children[0] as Text).style.fill, C.cyan);
        assert.equal(hud.getChildByLabel('selected-navigation-goal')!.visible, true);
    } finally {
        destroyDisplayTree(hud);
        sim.dispose();
    }
});

test('selected quest target is highlighted and unrelated targets add one temporary final row', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const hud = new MissionHud(
        sim,
        c.contract,
        () => {},
        () => [{ id: 'return', title: 'Powrót do bazy', progress: '', complete: false }],
    );
    try {
        const selected = hud.getChildByLabel('selected-navigation-goal') as Typography;
        hud.target = 0;
        hud.update(101);
        assert.equal(selected.visible, false);
        const quest = hud.children.find(
            (view) => view instanceof Typography && view.x === 1343 && view !== selected,
        ) as Typography;
        assert.equal((quest.children[0] as Text).style.fill, C.cyan);
        hud.target = -1;
        hud.update(101);
        assert.equal(selected.visible, true);
        assert.equal((selected.children[0] as Text).text, `Wybrany cel: ${hud.waypoint.name}`);
        assert.equal(selected.y, quest.y + 40);
        const count = hud.children.length;
        hud.target = 1;
        hud.update(101);
        assert.equal(hud.children.length, count);
        assert.equal((selected.children[0] as Text).text, `Wybrany cel: ${hud.waypoint.name}`);
        hud.target = 0;
        hud.update(101);
        assert.equal(selected.visible, false);
        assert.equal((selected.children[0] as Text).text, '');
    } finally {
        destroyDisplayTree(hud);
        sim.dispose();
    }
});
