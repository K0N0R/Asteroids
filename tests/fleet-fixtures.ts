import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import type { Campaign } from '../frontend/game/state/campaign';
import type { HullId } from '../frontend/game/config';
import { HULL_CONSTRUCTION, HULL_PARTS } from '../frontend/game/state/fleetConstruction';
/** Explicit fixture stock for tests of loadouts/locks rather than resource acquisition. */
export function fundHull(c: Campaign, hull: HullId = 'prospector', count = 1) {
    for (const id of HULL_PARTS)
        c.bank[id] = (c.bank[id] ?? 0) + HULL_CONSTRUCTION[hull][id] * count;
}

/** Exact extra stock for physics/loadout tests; economy tests supply their own bills. */
export function fundEquipment(
    c: Campaign,
    bill: import('../frontend/game/state/resources').ResourceStore,
) {
    for (const [id, count] of Object.entries(bill)) {
        const key = id as keyof typeof c.bank;
        c.bank[key] = (c.bank[key] ?? 0) + count;
    }
}

/** Completed bootstrap for tests that exercise the later lunar mining/defense phase. */
export function grantLunarProcessing(c: Campaign) {
    for (const task of LUNAR_PROCESSING) {
        c.story!.progress[task.id] = task.target;
        if (!c.story!.claimed.includes(task.id)) c.story!.claimed.push(task.id);
    }
}
