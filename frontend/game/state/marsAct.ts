import type { StoryProgress } from './story';
import type { Point } from '../worlds/sector';
import { MARS_MAPS } from '../worlds/marsLayout';

export interface MarsProgress {
    layoutVersion?: 2 | 3;
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
    researchReturned?: boolean;
    quietHack: boolean;
    probeDelivered: boolean;
}
export const newMarsProgress = (): MarsProgress => ({
    layoutVersion: 3,
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
    researchReturned: false,
    quietHack: false,
    probeDelivered: false,
});
export function validMarsProgress(value: unknown): value is MarsProgress {
    if (!value || typeof value !== 'object') return false;
    const p = value as MarsProgress;
    return (
        (p.layoutVersion === undefined || p.layoutVersion === 2 || p.layoutVersion === 3) &&
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
                'wave-3',
                'research-home',
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
        p.researchWaves <= 4 &&
        (p.researchReturned === undefined || typeof p.researchReturned === 'boolean') &&
        (!p.researchReturned || p.researchSites === 3) &&
        (!p.memoryDelivered || p.baseNeutralized) &&
        (!p.aiIdentified || p.memoryDelivered) &&
        (!p.yardDestroyed || p.aiIdentified)
    );
}
export const MARS_ACT = {
    landing: { x: 4000, y: -4000 },
    deimosGate: { x: -2200, y: -10000 },
    phobos: MARS_MAPS.phobos.center,
    surface: { x: 6500, y: 6000 },
    asteroid: MARS_MAPS.asteroid.center,
    base: { x: 6900, y: 6300 },
    terminal: { x: 7140, y: 6300 },
    yard: { x: MARS_MAPS.asteroid.center.x + 650, y: MARS_MAPS.asteroid.center.y + 100 },
    memory: { x: 6600, y: 6220 },
    probe: { x: 29000, y: -200 },
    oldShip: { x: 29600, y: 1000 },
    oldShipId: -73003,
    research: [
        { x: 0, y: -2550 },
        { x: 2850, y: 1100 },
        { x: 5200, y: -200 },
    ],
    memoryId: -73001,
    probeId: -73002,
} as const;
export const MARS_AMBUSH = [71000, 71001, 71002];
export const MARS_SURFACE_PATROLS = [71500];
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
    if (p.claimed.includes('mars-sector-secure'))
        return p.mars.researchSites < 3
            ? 'Osłaniaj ekspedycję naukową Keplera'
            : marsResearchComplete(p)
              ? 'Ekspedycja wróciła · odbierz odprawę w Satuk 15'
              : 'Osłaniaj powrót Keplera do Satuk 15';
    if (!p.mars.landingBlocked) return 'Rozpoznaj barierę lądowania na Marsie';
    if (!phobosRouteOpen(p)) return 'Zbuduj tarcze Satuk 15';
    if (!phobosOrbitSecured(p))
        return p.mars.ambushEntered
            ? 'Odeprzyj atak dronów na orbicie Fobosa'
            : 'Przeleć korytarzem i zbadaj orbitę Fobosa';
    if (!p.mars.baseNeutralized)
        return p.mars.baseDiscovered
            ? 'Zneutralizuj instalację na Fobosie'
            : 'Zbadaj powierzchnię Fobosa';
    if (!p.mars.memoryDelivered)
        return 'Odholuj moduł pamięci do Satuk 15 · wraki statków są opcjonalne';
    if (!p.mars.aiIdentified) return 'Wróć do Satuk 15 na analizę danych';
    if (!p.mars.yardDestroyed) return 'Zniszcz zakład przy dużej asteroidzie';
    return 'Wyeliminuj pozostałe wymagane jednostki';
}
export function marsArea(p: Point) {
    if (Math.hypot(p.x - MARS_ACT.surface.x, p.y - MARS_ACT.surface.y) < 1900) return 'surface';
    if (Math.hypot(p.x - MARS_ACT.asteroid.x, p.y - MARS_ACT.asteroid.y) < 2000) return 'asteroid';
    if (Math.hypot(p.x - MARS_MAPS.phobos.center.x, p.y - MARS_MAPS.phobos.center.y) < 3000)
        return 'phobos';
    return 'orbit';
}

/** Previously completed expeditions remain complete; partial scans do not imply a safe return. */
export function marsResearchComplete(p: StoryProgress) {
    return !!p.mars.researchReturned || p.claimed.includes('mars-anomaly-research');
}
/** Start the unfinished leg from Satuk. A lost return requires repeating the final scan. */
export function prepareMarsResearchSortie(p: StoryProgress) {
    if (p.sector !== 'mars' || !p.claimed.includes('mars-sector-secure') || marsResearchComplete(p))
        return;
    p.mars.researchSites = Math.min(2, p.mars.researchSites);
    p.mars.researchWaves = Math.min(p.mars.researchSites, p.mars.researchWaves);
    p.mars.researchReturned = false;
    const first = 74010 + p.mars.researchSites * 10;
    p.mars.kills = p.mars.kills.filter((id) => id < first || id >= 74050);
    p.mars.announcements = p.mars.announcements.filter((id) => {
        if (id.startsWith('wave-')) return Number(id.slice(5)) < p.mars.researchSites;
        if (id.startsWith('measure-')) return Number(id.slice(8)) <= p.mars.researchSites;
        return id !== 'research-home';
    });
}
