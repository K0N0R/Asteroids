import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Text } from 'pixi.js';
import { beginRun, newStoryCampaign } from '../frontend/game/state/campaign';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MissionHud } from '../frontend/game/ui/hud';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

before(async () => RAPIER.init());
test('HUD removes finished goals immediately, retains active goals, and shadows their text', () => {
    const campaign = newStoryCampaign();
    beginRun(campaign, 1);
    const simulation = new MissionSimulation(campaign, campaign.activeRun!.seed);
    const goals = [
        { id: 'first', title: 'Finished', progress: '', complete: true },
        { id: 'second', title: 'Active', progress: '0/1', complete: false },
    ];
    const hud = new MissionHud(
        simulation,
        1,
        () => {},
        () => goals,
    );
    const views = () => (hud as unknown as { goals: { children: Text[] }[] }).goals;
    try {
        hud.update(101);
        assert.equal(views().length, 1);
        assert.match(views()[0].children[0].text, /Active/);
        assert.ok(views()[0].children[0].style.dropShadow);
        goals[1].complete = true;
        hud.update(101);
        assert.equal(views().length, 0);
        goals.push({ id: 'third', title: 'New task', progress: '0/2', complete: false });
        hud.update(101);
        assert.equal(views().length, 1);
        assert.match(views()[0].children[0].text, /New task/);
    } finally {
        destroyDisplayTree(hud);
        simulation.dispose();
    }
});
