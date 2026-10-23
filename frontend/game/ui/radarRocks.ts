import type { MissionSimulation } from '../systems/mission';
import { GAME } from '../config';

/** A radar scan only includes deposits on its physical layer and inside the visible maps. */
export function* radarRocks(s: MissionSimulation) {
    for (const rock of s.rocks.values()) {
        if (!!rock.surface !== (s.area === 'surface')) continue;
        const raw = rock.body.translation(),
            point = { x: raw.x * GAME.pixelsPerMeter, y: raw.y * GAME.pixelsPerMeter };
        if (!s.inVisibleMap(point, -rock.radius)) continue;
        yield { ...point, radius: rock.radius };
    }
}
