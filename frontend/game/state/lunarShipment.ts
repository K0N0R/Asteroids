import type { Campaign } from './campaign';
import type { Point } from '../worlds/sector';
import { LUNAR_PROCESSING, lunarProcessingReady } from './lunarConstruction';
import { inEarthSystem } from '../worlds/moon';

export interface LunarShipment extends Point {
    id: number;
    area?: 'surface';
}
export function lunarShipmentPending(c: Campaign) {
    return (
        !!c.story &&
        inEarthSystem(c.story.sector) &&
        c.story.claimed.includes('lunar-survey') &&
        !lunarProcessingReady(c.story)
    );
}
export function lunarShipmentLock(c: Campaign) {
    if (!lunarShipmentPending(c)) return 'Brak wyposażenia do dostarczenia.';
    if (c.lunarShipment) return 'Paczka jest już w świecie. Podejmij ją na hol.';
    if (!c.ship) return 'Wybierz statek do holowania.';
    return LUNAR_PROCESSING.some((t) => (c.bank[t.resource] ?? 0) < t.target)
        ? 'Brakuje pełnego zestawu części do paczki.'
        : null;
}
/** Atomic packing: these parts belong to one persistent object, never to ship cargo. */
export function packLunarShipment(c: Campaign) {
    if (c.activeRun || lunarShipmentLock(c)) return null;
    for (const t of LUNAR_PROCESSING) c.bank[t.resource] = (c.bank[t.resource] ?? 0) - t.target;
    c.lunarShipment = { id: c.nextSalvageId++, x: 100, y: 0 };
    return c.lunarShipment;
}
