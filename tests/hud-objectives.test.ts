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

before(async () => RAPIER.init());

test('HUD reconciles objectives revealed by lunar construction during an active flight', () => {
    const c = newStoryCampaign();
    c.story!.sector = 'lunar';
    c.story!.claimed.push('lunar-survey');
    beginRun(c, 1);
    const sim = new MissionSimulation(c, 1);
    const goals = () => storyObjectives(c);
    const hud = new MissionHud(sim, c.contract, () => {}, goals);
    const rows = () =>
        hud.children.filter((v): v is Typography => v instanceof Typography && v.x === 1343);
    try {
        const initial = goals().length;
        assert.equal(rows().length, initial);
        c.story!.progress['lunar-foundation'] = 48;
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
