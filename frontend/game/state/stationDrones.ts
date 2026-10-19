import {
    DRONE_HANGAR_CONSTRUCTION,
    DRONE_REPLACEMENT,
    droneReplacementBill,
} from './stationConstruction';
import { canAffordEquipment, spendEquipment } from './equipmentCosts';
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
    cost: DRONE_HANGAR_CONSTRUCTION,
    replacement: DRONE_REPLACEMENT,
} as const;

export interface StationDroneState {
    hull: number;
    rebuildRemaining: number;
}

export function stationDronesLock(c: Campaign): string | null {
    if (!c.story) return 'Hangar jest dostępny w kampanii Satuk 15.';
    if (c.activeRun) return 'Montaż jest dostępny po powrocie do stacji.';
    if (c.station.sentries) {
        const lost = c.station.sentries.filter((s) => s.hull <= 0).length;
        if (!lost) return 'Wszystkie drony są sprawne.';
        if (!canAffordEquipment(c.bank, droneReplacementBill(lost)))
            return 'Brakuje części do odbudowy utraconych dronów.';
        return null;
    }
    if (!c.station.shield) return 'Najpierw zamontuj generator tarczy stacji.';
    if (!c.story.claimed.includes('earth-workshop') || c.station.workshop < 1)
        return 'Wymagane zaplecze Satuk 15 poziomu I.';
    if (!canAffordEquipment(c.bank, STATION_DRONES.cost))
        return 'Brakuje części do montażu hangaru.';
    return null;
}

export function installStationDrones(c: Campaign) {
    if (stationDronesLock(c)) return false;
    if (c.station.sentries) {
        const lost = c.station.sentries.filter((s) => s.hull <= 0);
        if (!spendEquipment(c.bank, droneReplacementBill(lost.length))) return false;
        for (const state of lost) {
            state.hull = STATION_DRONES.hull;
            state.rebuildRemaining = 0;
        }
        return true;
    }
    if (!spendEquipment(c.bank, STATION_DRONES.cost)) return false;
    c.station.sentries = Array.from({ length: STATION_DRONES.count }, () => ({
        hull: STATION_DRONES.hull,
        rebuildRemaining: 0,
    }));
    return true;
}
