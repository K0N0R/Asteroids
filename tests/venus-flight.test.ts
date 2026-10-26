import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { beginRun, finishRun, parseCampaign } from '../frontend/game/state/campaign';
import { venusStationAction } from '../frontend/game/state/venusActions';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { VenusFlightPilot } from './venus-flight-pilot';
before(async () => RAPIER.init());
test('fly the whole Venus act with ordinary flight, real shots, gates, docking and circuits', () => {
    const c = createDevelopmentAct('act-3'),
        pilot = new VenusFlightPilot();
    for (let sortie = 0; sortie < 3; sortie++) {
        if (sortie === 1) assert.ok(venusStationAction(c, 'venus-probe-build'));
        if (sortie === 2) assert.ok(venusStationAction(c, 'venus-analyse'));
        assert.ok(beginRun(c, 42));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            for (let frame = 0; frame < 60 * 1200 && !s.ended; frame++) s.step(pilot.next(s));
            assert.equal(
                s.ended,
                'returned',
                JSON.stringify({
                    sortie,
                    phase: pilot.phase,
                    p: s.position,
                    area: s.venusAct!.area,
                    probe: s.escort?.state,
                    probeHP: s.escort?.health,
                    status: s.venusAct!.status,
                    enemies: [...s.enemies.enemies.values()]
                        .filter((e) => e.body.isEnabled())
                        .map((e) => [e.id, e.health]),
                    history: pilot.history,
                }),
            );
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.ok(c.story!.claimed.includes('venus-mercury-signal'));
    assert.ok(pilot.shots > 0);
    assert.ok(pilot.minHull > 0);
});
