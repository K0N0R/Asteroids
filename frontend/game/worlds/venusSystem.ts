import { generateSector, random, type RockSpec } from './sector';
import { VENUS_MAPS, V, venusLanes, venusLandmarks } from './venusLayout';
import type { StoryProgress } from '../state/story';
export function generateVenusSector(p: StoryProgress) {
    const sector = generateSector(150074),
        rng = random(150074);
    sector.landmarks = venusLandmarks(p);
    sector.hyperlanes = venusLanes(p);
    sector.regions = Object.values(VENUS_MAPS).map((m) => ({
        ...m.center,
        name: m.name,
        radius: m.radius,
    }));
    sector.researchSite = { x: 90000, y: 0, name: '' };
    sector.outpost = {
        x: 90000,
        y: 0,
        name: '',
        phase: 0,
        terminal: { x: 90000, y: 0 },
        guards: [],
    };
    sector.fortress = { ...sector.fortress, x: 92000, y: 0, walls: [], guards: [] };
    sector.caches = [];
    const rocks: RockSpec[] = [];
    for (let i = 0; i < 320; i++) {
        const angle = rng() * Math.PI * 2,
            d = 1400 + rng() * 4900,
            radius = 25 + rng() * 45;
        const q = { x: Math.cos(angle) * d, y: 3600 + Math.sin(angle) * d };
        if (
            Math.hypot(q.x, q.y) < 850 ||
            [V.relay, V.stationGate, V.atmosphereGate, V.aiGate, V.wreck].some(
                (p) => Math.hypot(p.x - q.x, p.y - q.y) < 500,
            )
        )
            continue;
        // Keep a broad escort corridor between the station and atmospheric entry clear.
        if (q.x < 600 && q.x > -3100 && q.y > -400 && q.y < 8100) continue;
        rocks.push({ ...q, radius, rich: i % 7 === 0, variant: i % 5, vx: 0, vy: 0 });
    }
    sector.rocks = rocks;
    sector.enemies = [
        { x: 3200, y: 3500, home: { x: 3200, y: 3500 }, id: 81001, kind: 'patrol', phase: 0 },
        { x: 4500, y: 4500, home: { x: 4500, y: 4500 }, id: 81002, kind: 'patrol', phase: 1 },
    ];
    return sector;
}
