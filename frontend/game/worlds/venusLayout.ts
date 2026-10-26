import type { Point, Landmark } from './sector';
import type { StoryProgress } from '../state/story';
import type { Hyperlane } from '../systems/hyperdrive';
export const VENUS_MAPS = {
    orbit: { id: 'orbit', name: 'Orbita Wenus', center: { x: 0, y: 3600 }, radius: 6800 },
    station: {
        id: 'station',
        name: 'Martwe laboratorium',
        center: { x: -14000, y: -10500 },
        radius: 1750,
    },
    atmosphere: {
        id: 'atmosphere',
        name: 'Górna atmosfera Wenus',
        center: { x: -14500, y: 22000 },
        radius: 2600,
    },
    installation: {
        id: 'installation',
        name: 'Instalacja SI',
        center: { x: 15000, y: -10500 },
        radius: 2100,
    },
} as const;
export type VenusArea = keyof typeof VENUS_MAPS;
/** Facing ports keep a gate flight outside both playable discs. */
function facingPort(from: VenusArea, to: VenusArea) {
    const a = VENUS_MAPS[from],
        b = VENUS_MAPS[to];
    const dx = b.center.x - a.center.x,
        dy = b.center.y - a.center.y;
    const scale = (a.radius - 120) / Math.hypot(dx, dy);
    return { x: a.center.x + dx * scale, y: a.center.y + dy * scale };
}
const at = (area: VenusArea, x: number, y: number) => ({
    x: VENUS_MAPS[area].center.x + x,
    y: VENUS_MAPS[area].center.y + y,
});
export const V = {
    relay: { x: 5200, y: 2900 },
    wreck: { x: -5000, y: 4200 },
    stationGate: facingPort('orbit', 'station'),
    stationEntry: facingPort('station', 'orbit'),
    power: at('station', -440, -650),
    archive: at('station', 750, 300),
    atmosphereGate: facingPort('orbit', 'atmosphere'),
    atmosphereEntry: facingPort('atmosphere', 'orbit'),
    scan: at('atmosphere', 700, -300),
    probe: { x: 380, y: 0 },
    aiGate: facingPort('orbit', 'installation'),
    aiEntry: facingPort('installation', 'orbit'),
    terminal: at('installation', 800, 400),
    guardian: at('installation', 300, -200),
    anchors: [at('installation', 0, -700), at('installation', 700, -650)],
} as const;
export const VENUS_SAMPLES = [
    { ...V.scan, name: 'Skład chmur', detail: 'Pobieranie próbki aerozoli' },
    { ...at('atmosphere', 0, 100), name: 'Ciśnienie i wiatr', detail: 'Pomiar ruchu atmosfery' },
    { ...at('atmosphere', -700, 500), name: 'Ślad anomalii', detail: 'Analiza widma zakłóceń' },
] as const;
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
        { ...at('atmosphere', 1150 + Math.sin(time * 0.04) * 180, 1250), radius: 500 },
        { ...at('atmosphere', -1050, -1300 + Math.sin(time * 0.05) * 120), radius: 450 },
    ];
}
