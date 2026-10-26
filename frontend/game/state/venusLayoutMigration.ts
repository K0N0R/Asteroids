import type { Campaign } from './campaign';
import { VENUS_MAPS, type VenusArea } from '../worlds/venusLayout';

const OLD_AREAS: { id: VenusArea; x: number; y: number; radius: number }[] = [
    { id: 'orbit', x: 0, y: 3600, radius: 6800 },
    { id: 'station', x: 20000, y: 0, radius: 1500 },
    { id: 'atmosphere', x: 40000, y: 0, radius: 2600 },
    { id: 'installation', x: 60000, y: 0, radius: 2100 },
];
/** Move saved objects with their map; never award tasks or reset completed measurements. */
export function migrateVenusLayout(c: Campaign) {
    const v = c.story?.venus;
    if (!v || v.layoutVersion === 2) return;
    const seed = 150074;
    const move = (p: { x: number; y: number }) => {
        const old = OLD_AREAS.find((m) => Math.hypot(p.x - m.x, p.y - m.y) <= m.radius + 200);
        if (!old || old.id === 'orbit') return;
        const next = VENUS_MAPS[old.id];
        p.x += next.center.x - old.x;
        p.y += next.center.y - old.y;
    };
    for (const item of [...c.worldSalvage, ...c.recoverySignals])
        if (item.seed === seed) move(item);
    if (c.activeRun?.sector === 'venus') move(c.activeRun.lastPosition);
    v.layoutVersion = 2;
}
