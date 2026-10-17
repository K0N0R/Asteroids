import type { Campaign } from './campaign';

export const STATION_DRONES = {
    count: 3,
    hull: 80,
    radius: 18,
    orbit: 1080,
    leash: 1550,
    detection: 650,
    range: 520,
    speed: 210,
    damage: 9,
    shotInterval: 0.8,
    repairDelay: 8,
    repairRate: 4,
    rebuildSeconds: 30,
    cost: { ore: 40, parts: 12, powerModules: 3 },
    replacement: { parts: 2, powerModules: 1 },
} as const;

export interface StationDroneState {
    hull: number;
    rebuildRemaining: number;
}

export function stationDronesLock(c: Campaign): string | null {
    if (!c.story) return 'Hangar jest dostępny w kampanii Satuk 15.';
    if (c.station.sentries) return 'Hangar już zamontowany.';
    if (c.activeRun) return 'Montaż jest dostępny po powrocie do stacji.';
    if (!c.station.shield) return 'Najpierw zamontuj generator tarczy stacji.';
    if (!c.story.claimed.includes('earth-workshop') || c.station.workshop < 1)
        return 'Wymagane zaplecze Satuk 15 i warsztat I.';
    if (!c.crew.mechanic || c.crew.mechanicAboard) return 'Mechanik musi pracować w stacji.';
    const cost = STATION_DRONES.cost;
    if (
        c.bank.ore < cost.ore ||
        c.bank.parts < cost.parts ||
        (c.bank.powerModules ?? 0) < cost.powerModules
    )
        return 'Potrzeba 40 Fe, 12 komponentów i 3 modułów zasilania.';
    return null;
}

export function installStationDrones(c: Campaign) {
    if (stationDronesLock(c)) return false;
    const cost = STATION_DRONES.cost;
    c.bank.ore -= cost.ore;
    c.bank.parts -= cost.parts;
    c.bank.powerModules = (c.bank.powerModules ?? 0) - cost.powerModules;
    c.station.sentries = Array.from({ length: STATION_DRONES.count }, () => ({
        hull: STATION_DRONES.hull,
        rebuildRemaining: 0,
    }));
    return true;
}
