import type { MissionSimulation } from '../frontend/game/systems/mission';
import { VENUS_POWER_TILES } from '../frontend/game/systems/venusPower';

/** Exercise the same actions exposed by the power panel, never assign completion flags. */
export function restoreVenusPower(s: MissionSimulation) {
    const mission = s.venusAct!;
    const puzzle = mission.powerPuzzle;
    if (!puzzle) throw new Error('Power panel was not opened');
    mission.powerAction({ isolate: true });
    for (let i = 0; i < VENUS_POWER_TILES.length; i++) {
        if (!VENUS_POWER_TILES[i] || VENUS_POWER_TILES[i] === 15) continue;
        for (let n = 0; puzzle.state.rotations[i] !== 0 && n < 4; n++)
            mission.powerAction({ rotate: i });
    }
    if (!mission.powerAction({ confirm: true }))
        throw new Error('Power routing did not restore the laboratory');
}
