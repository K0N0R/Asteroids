import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { beginRun } from '../frontend/game/state/campaign';
import { constructionManifest, constructionDeliveryTasks } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
before(async () => RAPIER.init());
test('refactored Venus exposes no outpost construction, material manifest or defense trigger', () => {
    const c = createDevelopmentAct('act-3');
    assert.deepEqual(constructionDeliveryTasks(c), []);
    assert.deepEqual(constructionManifest(c), { ore: 0, parts: 0 });
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.orbitalBaseSector, false);
        assert.equal(s.venusOutpostStage, -1);
        for (let i = 0; i < 120; i++)
            s.step({
                target: { x: 2700, y: -1100 },
                thrust: false,
                brake: false,
                fire: false,
                interact: false,
                sabotage: true,
            });
        assert.equal(s.venusAssault.state, 'idle');
        assert.ok(!s.landmarks.some((l) => l.kind === 'construction'));
    } finally {
        s.dispose();
    }
});
