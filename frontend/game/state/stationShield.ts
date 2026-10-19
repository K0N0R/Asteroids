import { SHIELD_CONSTRUCTION } from './stationConstruction';
import { canAffordEquipment, spendEquipment } from './equipmentCosts';
import { DRONES } from '../config';
import type { Campaign } from './campaign';

export const STATION_SHIELD = {
    radius: DRONES.safeRadius,
    dockProtection: 260,
    cost: SHIELD_CONSTRUCTION,
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
    if (c.station.workshop < 1) return 'Wymagane zaplecze produkcyjne I.';
    if (!canAffordEquipment(c.bank, STATION_SHIELD.cost))
        return 'Brakuje części do montażu generatora.';
    return null;
}
export function installStationShield(c: Campaign) {
    if (stationShieldLock(c)) return false;
    if (!spendEquipment(c.bank, STATION_SHIELD.cost)) return false;
    c.station.shield = true;
    return true;
}
