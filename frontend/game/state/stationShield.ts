import { DRONES } from '../config';
import type { Campaign } from './campaign';

export const STATION_SHIELD = {
    radius: DRONES.safeRadius,
    dockProtection: 260,
    cost: { ore: 30, parts: 6, powerModules: 3 },
} as const;

export function stationProtectionRadius(c: Campaign) {
    return !c.story || c.station.shield
        ? STATION_SHIELD.radius + c.station.shieldLevel * 150
        : STATION_SHIELD.dockProtection;
}
export function stationShieldLock(c: Campaign): string | null {
    if (!c.story) return 'Tryb testowy korzysta z pełnej osłony od początku.';
    if (c.station.shield) return 'Generator już zamontowany.';
    if (c.activeRun) return 'Montaż jest dostępny po powrocie do stacji.';
    if (c.story && !c.story.claimed.includes('earth-workshop'))
        return 'Ukończ rozwój zaplecza Satuk 15 w sektorze Ziemi.';
    if (c.station.workshop < 1) return 'Wymagany warsztat I.';
    if (!c.crew.mechanic) return 'Zatrudnij mechanika w stacji.';
    const cost = STATION_SHIELD.cost;
    if (
        c.bank.ore < cost.ore ||
        c.bank.parts < cost.parts ||
        (c.bank.powerModules ?? 0) < cost.powerModules
    )
        return 'Potrzeba 30 Fe, 6 komponentów i 3 modułów zasilania.';
    return null;
}
export function installStationShield(c: Campaign) {
    if (stationShieldLock(c)) return false;
    c.bank.ore -= STATION_SHIELD.cost.ore;
    c.bank.parts -= STATION_SHIELD.cost.parts;
    c.bank.powerModules = (c.bank.powerModules ?? 0) - STATION_SHIELD.cost.powerModules;
    c.station.shield = true;
    return true;
}
