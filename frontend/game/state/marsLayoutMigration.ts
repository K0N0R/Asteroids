import type { Point } from '../worlds/sector';
import { MARS_SURFACE_PATROLS } from './marsAct';
/** Journal 30 used adjacent patches in one coordinate space. Keep saved physical items with their map. */
export function migrateMarsLayout(c: Record<string, any>) {
    const p = c.story;
    if (!p || p.version !== 30 || !p.mars) return;
    const relocate = (point: any) => {
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
        if (Math.hypot(point.x - 6500, point.y) < 2800) point.x += 23500;
        else if (Math.hypot(point.x + 500, point.y - 6500) < 2200) {
            point.x += 60500;
            point.y -= 6500;
        }
    };
    relocate(p.mars.memoryPosition);
    if (p.mars.baseNeutralized && Array.isArray(p.mars.kills))
        for (const id of MARS_SURFACE_PATROLS)
            if (!p.mars.kills.includes(id)) p.mars.kills.push(id);
    if (Array.isArray(p.mars.reinforcements)) p.mars.reinforcements.forEach(relocate);
    for (const group of [c.worldSalvage, c.recoverySignals])
        if (Array.isArray(group))
            for (const item of group) {
                if (item.seed !== 150073) continue;
                if (item.area === 'surface' && Math.hypot(item.x + 24000, item.y - 24000) < 2400) {
                    item.x = 0;
                    item.y = -1000;
                    delete item.area;
                } else if (item.area !== 'surface') relocate(item);
            }
    if (c.activeRun?.sector === 'mars') {
        const run = c.activeRun,
            point = run.lastPosition as Point | undefined;
        if (
            point &&
            run.area === 'surface' &&
            Math.hypot(point.x + 24000, point.y - 24000) < 2400
        ) {
            run.lastPosition = { x: 0, y: -1000 };
            delete run.area;
        } else if (run.area !== 'surface') relocate(point);
    }
    p.version = 31;
}
