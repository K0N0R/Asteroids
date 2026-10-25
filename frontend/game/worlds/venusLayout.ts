import type { Point, Landmark } from './sector';
import type { StoryProgress } from '../state/story';
import type { Hyperlane } from '../systems/hyperdrive';
export const VENUS_MAPS = {
    orbit: { id: 'orbit', name: 'Orbita Wenus', center: { x: 0, y: 3600 }, radius: 6800 },
    station: {
        id: 'station',
        name: 'Martwe laboratorium',
        center: { x: 20000, y: 0 },
        radius: 1500,
    },
    atmosphere: {
        id: 'atmosphere',
        name: 'Górna atmosfera Wenus',
        center: { x: 40000, y: 0 },
        radius: 2600,
    },
    installation: {
        id: 'installation',
        name: 'Instalacja SI',
        center: { x: 60000, y: 0 },
        radius: 2100,
    },
} as const;
export type VenusArea = keyof typeof VENUS_MAPS;
export const V = {
    relay: { x: 5200, y: 2900 },
    wreck: { x: -5000, y: 4200 },
    stationGate: { x: -3800, y: 1400 },
    stationEntry: { x: 19000, y: 0 },
    power: { x: 20000, y: -550 },
    archive: { x: 20700, y: 300 },
    atmosphereGate: { x: -2600, y: 7600 },
    atmosphereEntry: { x: 38300, y: 0 },
    scan: { x: 40000, y: -350 },
    probe: { x: 380, y: 0 },
    aiGate: { x: 3100, y: -500 },
    aiEntry: { x: 58400, y: 0 },
    terminal: { x: 60800, y: 400 },
    guardian: { x: 60300, y: -200 },
    anchors: [
        { x: 60000, y: -700 },
        { x: 60700, y: -650 },
    ],
} as const;
export function venusMapAt(p: Point) {
    return Object.values(VENUS_MAPS).find(
        (m) => Math.hypot(p.x - m.center.x, p.y - m.center.y) <= m.radius + 100,
    );
}
export function nearestVenusMap(p: Point) {
    return Object.values(VENUS_MAPS).reduce((a, b) =>
        Math.hypot(p.x - a.center.x, p.y - a.center.y) <
        Math.hypot(p.x - b.center.x, p.y - b.center.y)
            ? a
            : b,
    );
}
export function venusLanes(p: StoryProgress): Hyperlane[] {
    const has = (id: string) => p.claimed.includes(id),
        lanes: Hyperlane[] = [];
    if (has('venus-toxic-orbit'))
        lanes.push({ name: 'Śluza stacji badawczej', a: V.stationGate, b: V.stationEntry });
    if (p.venus?.probeBuilt)
        lanes.push({ name: 'Górna atmosfera', a: V.atmosphereGate, b: V.atmosphereEntry });
    if (has('venus-horizon-project'))
        lanes.push({ name: 'Śluza instalacji SI', a: V.aiGate, b: V.aiEntry });
    return lanes;
}
export function venusLandmarks(p: StoryProgress): Landmark[] {
    return [
        { ...V.relay, name: 'Przekaźnik orbity Wenus', key: 7, kind: 'relay', radius: 150 },
        { ...V.wreck, name: 'Wrak badawczy', key: 4, kind: 'wreck', radius: 110 },
        { x: 1900, y: 400, name: 'Złoże orbitalne', key: 2, kind: 'field', radius: 300 },
        ...venusLanes(p).flatMap((l, i) =>
            [l.a, l.b].map((q) => ({
                ...q,
                name: l.name,
                key: 30 + i,
                kind: 'passage' as const,
                radius: 110,
            })),
        ),
    ];
}
/** The probe uses this clear corridor; storms live away from the flight/transmission path. */
export function venusStorms(time: number) {
    return [
        { x: 39800 + Math.sin(time * 0.04) * 180, y: 1250, radius: 500 },
        { x: 40850, y: -1450 + Math.sin(time * 0.05) * 120, radius: 450 },
    ];
}
