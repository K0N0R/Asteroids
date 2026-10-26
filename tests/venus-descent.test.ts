import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { beginRun } from '../frontend/game/state/campaign';
import { completeVenusTask, venusStationAction } from '../frontend/game/state/venusActions';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { VenusProbe } from '../frontend/game/systems/venusProbe';
import { V, venusLanes } from '../frontend/game/worlds/venusLayout';
before(async () => RAPIER.init());
const idle: FlightInput = {
    target: V.atmosphereApproach,
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
test('atmospheric descent is a protected vertical transition, not a hyperlane, and ascent restores orbit', () => {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, 'venus-toxic-orbit');
    completeVenusTask(c, 'venus-dead-laboratory');
    assert.ok(venusStationAction(c, 'venus-probe-build'));
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(
            venusLanes(c.story!).some((l) => l.a === V.atmosphereApproach),
            false,
        );
        const e = s.escort as VenusProbe;
        e.launch();
        e.state = 'complete';
        e.body.setTranslation(
            { x: V.atmosphereApproach.x / 100, y: V.atmosphereApproach.y / 100 },
            true,
        );
        s.ship.setTranslation(
            { x: (V.atmosphereApproach.x + 90) / 100, y: V.atmosphereApproach.y / 100 },
            true,
        );
        for (let i = 0; i < 70; i++) s.step({ ...idle, interact: true });
        assert.ok(s.transferActive);
        assert.equal(s.hyperdrive.active, false);
        assert.equal(s.venusAct!.area, 'atmosphere');
        const landed = { ...s.position };
        const hp = s.hull;
        for (let i = 0; i < 160; i++) s.step({ ...idle, thrust: true, fire: true });
        assert.equal(s.venusAct!.area, 'atmosphere');
        assert.ok(s.transferActive);
        assert.equal(s.hull, hp);
        assert.deepEqual(
            s.position,
            landed,
            'physics handoff happens before the camera approach, just as on the Moon',
        );
        assert.equal(e.sampleProgress, 0);
        for (let i = 0; i < 160; i++) s.step(idle);
        assert.equal(s.transferActive, false);
        assert.equal(e.stage, 'atmosphere');
        // F must be released, then held again at the atmospheric ascent marker.
        for (let i = 0; i < 70; i++)
            s.step({ ...idle, target: V.atmosphereAscent, interact: true });
        assert.ok(s.transferActive);
        assert.equal(s.venusAct!.transfer!.descending, false);
        for (let i = 0; i < 310; i++) s.step(idle);
        assert.equal(s.venusAct!.area, 'orbit');
        assert.equal(s.transferActive, false);
        assert.ok(
            Math.hypot(
                s.position.x - V.atmosphereApproach.x,
                s.position.y - V.atmosphereApproach.y,
            ) < 1,
        );
    } finally {
        s.dispose();
    }
});
