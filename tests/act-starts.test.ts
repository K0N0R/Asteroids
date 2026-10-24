import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct, DEVELOPMENT_STARTS } from '../frontend/game/state/development';
import { beginRun, parseCampaign } from '../frontend/game/state/campaign';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { storyTaskAvailable, STORY_TASKS, storyAct } from '../frontend/game/state/story';

before(async () => RAPIER.init());
test('all act starts can launch a real mission and preserve a valid save with initial objectives', () => {
    for (const start of DEVELOPMENT_STARTS) {
        const c = createDevelopmentAct(start.id);
        assert.ok(beginRun(c, 123), start.id);
        const sim = new MissionSimulation(c, c.activeRun!.seed);
        try {
            for (let i = 0; i < 3; i++)
                sim.step({
                    target: { x: 400, y: 0 },
                    thrust: false,
                    brake: false,
                    fire: false,
                    interact: false,
                });
            assert.equal(sim.ended, null, start.id);
            assert.equal(c.activeRun!.sector, start.sector);
            assert.ok(parseCampaign(JSON.stringify(c)), start.id);
            assert.ok(
                STORY_TASKS.some(
                    (t) =>
                        t.sector === start.sector &&
                        t.act === start.act &&
                        !c.story!.claimed.includes(t.id) &&
                        storyTaskAvailable(c.story!, t),
                ),
                start.id,
            );
            if (start.id === 'act-2') assert.ok(sim.marsAct);
            if (start.id === 'act-5') {
                assert.equal(sim.marsAct, null);
                assert.equal(storyAct(c.story!), 'AKT V');
                assert.equal(c.station.extraction, false);
            }
        } finally {
            sim.dispose();
        }
    }
});
