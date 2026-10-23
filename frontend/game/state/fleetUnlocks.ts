import { HULLS, type HullId } from '../config';
import type { Campaign } from './campaign';
/** Project availability follows production technology; no hull-specific quests. */
export const HULL_UNLOCKS = {};
export function hullUnlocked(c: Campaign, hull: HullId) {
    return (
        hull !== 'prospector' &&
        !('salvageOnly' in HULLS[hull]) &&
        c.station.workshopLevel >= HULLS[hull].workshop
    );
}
export function hullUnlockReason(c: Campaign, hull: HullId) {
    if (hull === 'prospector') return 'Statek startowy i awaryjny · bez produkcji i ulepszeń';
    if ('salvageOnly' in HULLS[hull]) return 'Kadłub wyłącznie z odzysku';
    return hullUnlocked(c, hull)
        ? ''
        : `Wymagany Warsztat ${['0', 'I', 'II', 'III'][HULLS[hull].workshop]}`;
}
