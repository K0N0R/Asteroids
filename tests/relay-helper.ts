import assert from 'node:assert/strict';
import type { MissionSimulation } from '../frontend/game/systems/mission';

export function solveRelay(s: MissionSimulation) {
    const tuning = s.relayTuning;
    assert.ok(tuning, 'relay must be opened through flight interaction');
    for (let channel = 0; channel < 3; channel++) {
        for (let n = 0; n < 8 && tuning.phases[channel] !== tuning.targets[channel]; n++)
            s.relayAction({ channel, delta: 1 });
    }
    assert.ok(s.relayAction({ confirm: true }));
}
