import type { StoryProgress } from './story';
import type { Point } from '../worlds/sector';

export interface MarsProgress {
    announcements: string[];
    landingBlocked: boolean;
    ambushEntered: boolean;
    baseNeutralized: boolean;
    baseDiscovered: boolean;
    baseAlarm: boolean;
    baseHealth: number;
    yardHealth: number;
    memoryDelivered: boolean;
    memoryPosition: Point | null;
    aiIdentified: boolean;
    yardDestroyed: boolean;
    kills: number[];
    reinforcements: { id: number; x: number; y: number; kind: string }[];
    researchSites: number;
    researchWaves: number;
    quietHack: boolean;
    probeDelivered: boolean;
}
export const newMarsProgress = (): MarsProgress => ({
    announcements: [],
    landingBlocked: false,
    ambushEntered: false,
    baseNeutralized: false,
    baseDiscovered: false,
    baseAlarm: false,
    baseHealth: 900,
    yardHealth: 900,
    memoryDelivered: false,
    memoryPosition: null,
    aiIdentified: false,
    yardDestroyed: false,
    kills: [],
    reinforcements: [],
    researchSites: 0,
    researchWaves: 0,
    quietHack: false,
    probeDelivered: false,
});
export function validMarsProgress(value: unknown): value is MarsProgress {
    if (!value || typeof value !== 'object') return false;
    const p = value as MarsProgress;
    return (
        Array.isArray(p.announcements) &&
        new Set(p.announcements).size === p.announcements.length &&
        p.announcements.every((id) =>
            [
                'intro',
                'barrier',
                'route',
                'ambush',
                'secured',
                'discovery',
                'base',
                'yard',
                'hack',
                'memory-delivery',
                'anomaly',
                'measure-1',
                'measure-2',
                'measure-3',
                'wave-0',
                'wave-1',
                'wave-2',
                'old-ship-delivery',
            ].includes(id),
        ) &&
        [
            'landingBlocked',
            'ambushEntered',
            'baseNeutralized',
            'baseDiscovered',
            'baseAlarm',
            'memoryDelivered',
            'aiIdentified',
            'yardDestroyed',
            'quietHack',
            'probeDelivered',
        ].every((key) => typeof p[key as keyof MarsProgress] === 'boolean') &&
        (p.memoryPosition === null ||
            (typeof p.memoryPosition === 'object' &&
                !!p.memoryPosition &&
                Number.isFinite(p.memoryPosition.x) &&
                Number.isFinite(p.memoryPosition.y) &&
                Math.hypot(p.memoryPosition.x, p.memoryPosition.y) <= 1000000)) &&
        [p.baseHealth, p.yardHealth].every((n) => Number.isFinite(n) && n >= 0 && n <= 900) &&
        Array.isArray(p.reinforcements) &&
        p.reinforcements.length <= 1000 &&
        new Set(p.reinforcements.map((e) => e.id)).size === p.reinforcements.length &&
        p.reinforcements.every(
            (e) =>
                Number.isInteger(e.id) &&
                e.id >= 73001 &&
                e.id <= 74000 &&
                Number.isFinite(e.x) &&
                Number.isFinite(e.y) &&
                ['interceptor', 'support', 'lancer', 'heavy', 'minelayer', 'patrol'].includes(
                    e.kind,
                ),
        ) &&
        Array.isArray(p.kills) &&
        new Set(p.kills).size === p.kills.length &&
        p.kills.every((id) => Number.isInteger(id) && id >= 71000 && id < 75000) &&
        Number.isInteger(p.researchSites) &&
        p.researchSites >= 0 &&
        p.researchSites <= 3 &&
        Number.isInteger(p.researchWaves) &&
        p.researchWaves >= p.researchSites &&
        p.researchWaves <= 3 &&
        (!p.memoryDelivered || p.baseNeutralized) &&
        (!p.aiIdentified || p.memoryDelivered) &&
        (!p.yardDestroyed || p.aiIdentified)
    );
}
export const MARS_ACT = {
    landing: { x: 4000, y: -4000 },
    deimosGate: { x: -2200, y: -10000 },
    phobos: { x: 31000, y: -100 },
    surface: { x: 6500, y: 6000 },
    asteroid: { x: 60000, y: 0 },
    base: { x: 6900, y: 6300 },
    terminal: { x: 7140, y: 6300 },
    yard: { x: 60650, y: 100 },
    memory: { x: 6600, y: 6220 },
    probe: { x: 29100, y: -900 },
    oldShip: { x: 30700, y: 1000 },
    oldShipId: -73003,
    research: [
        { x: 1550, y: -1200 },
        { x: -1650, y: -1700 },
        { x: -950, y: 1650 },
    ],
    memoryId: -73001,
    probeId: -73002,
} as const;
export const MARS_AMBUSH = [71000, 71001, 71002];
export const MARS_SURFACE_PATROLS = [71500, 71501, 71502, 71503];
export const MARS_YARD_PATROLS = Array.from({ length: 12 }, (_, i) => 72000 + i);
export function phobosRouteOpen(p: StoryProgress) {
    return p.claimed.includes('mars-shields') && p.mars.landingBlocked;
}
export function phobosOrbitSecured(p: StoryProgress) {
    return p.mars.ambushEntered && MARS_AMBUSH.every((id) => p.mars.kills.includes(id));
}
export function marsThreatsCleared(p: StoryProgress) {
    return (
        p.mars.baseNeutralized &&
        p.mars.yardDestroyed &&
        [
            ...MARS_AMBUSH,
            ...MARS_SURFACE_PATROLS,
            ...MARS_YARD_PATROLS,
            ...p.mars.reinforcements.map((e) => e.id),
        ].every((id) => p.mars.kills.includes(id))
    );
}
export function marsSecurityObjective(p: StoryProgress) {
    if (!p.mars.landingBlocked) return 'Rozpoznaj barierę lądowania na Marsie';
    if (!phobosRouteOpen(p)) return 'Zbuduj tarcze Satuk 15';
    if (!phobosOrbitSecured(p)) return 'Zbadaj korytarz i zabezpiecz orbitę Fobosa';
    if (!p.mars.baseNeutralized) return 'Zneutralizuj ukrytą instalację na Fobosie';
    if (!p.mars.memoryDelivered)
        return 'Odholuj moduł pamięci do Satuk 15 · wraki statków są opcjonalne';
    if (!p.mars.aiIdentified) return 'Wróć do Satuk 15 na analizę danych';
    if (!p.mars.yardDestroyed) return 'Zniszcz zakład przy dużej asteroidzie';
    return 'Wyeliminuj pozostałe wymagane jednostki';
}
export function marsArea(p: Point) {
    if (Math.hypot(p.x - MARS_ACT.surface.x, p.y - MARS_ACT.surface.y) < 1900) return 'surface';
    if (Math.hypot(p.x - MARS_ACT.asteroid.x, p.y - MARS_ACT.asteroid.y) < 2000) return 'asteroid';
    if (Math.hypot(p.x - 30000, p.y) < 3000) return 'phobos';
    return 'orbit';
}
