import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import type { Campaign } from '../frontend/game/state/campaign';
import type { HullId } from '../frontend/game/config';
import { HULL_CONSTRUCTION, hullPartIds } from '../frontend/game/state/fleetConstruction';
import { STORY_TASKS } from '../frontend/game/state/story';
import {
    MARS_AMBUSH,
    MARS_SURFACE_PATROLS,
    MARS_YARD_PATROLS,
} from '../frontend/game/state/marsAct';
/** Explicit fixture stock for tests of loadouts/locks rather than resource acquisition. */
export function fundHull(c: Campaign, hull: HullId = 'swift', count = 1) {
    for (const id of hullPartIds(hull))
        c.bank[id] = (c.bank[id] ?? 0) + (HULL_CONSTRUCTION[hull][id] ?? 0) * count;
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
    grantStoryTasks(c, ['lunar-equipment']);
}

/** Prepare explicit prior history for physics tests, including internal delivery counters. */
export function grantStoryTasks(c: Campaign, ids: readonly string[]) {
    const visited = new Set<string>();
    const claim = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        const task = STORY_TASKS.find((t) => t.id === id);
        if (!task) throw new Error(`Unknown fixture task: ${id}`);
        task.dependencies.forEach(claim);
        task.deliveryItems?.forEach((item) => claim(item.id));
        c.story!.progress[id] = task.target;
        if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
        if (task.kind === 'laboratory' || task.kind === 'workshop') {
            const key = task.kind === 'laboratory' ? 'laboratoryLevel' : 'workshopLevel';
            c.station[key] = Math.max(c.station[key], task.facilityLevel ?? 1);
            c.station.laboratoryLevel = Math.max(
                c.station.laboratoryLevel,
                c.station.workshopLevel,
            );
        }
        if (id === 'mars-extraction-adapter') c.station.extraction = true;
        if (id === 'mars-anomaly-sample') c.station.anomalySampleDelivered = true;
    };
    [...ids].forEach(claim);
    const story = c.story!,
        mars = story.mars;
    // This is completed history; its lunar reward has already been settled.
    if (story.claimed.includes('lunar-attack') && story.lunarMule === 'active')
        story.lunarMule = 'transferred';
    if (story.claimed.includes('mars-shields')) c.station.shield = true;
    if (story.claimed.includes('mars-landing-blocked')) mars.landingBlocked = true;
    if (story.claimed.includes('mars-phobos-route')) mars.ambushEntered = true;
    if (story.claimed.includes('mars-phobos-base')) {
        mars.ambushEntered = mars.baseNeutralized = mars.memoryDelivered = true;
        mars.kills = [...new Set([...mars.kills, ...MARS_AMBUSH])];
    }
    if (story.claimed.includes('mars-ai-discovery')) mars.aiIdentified = true;
    if (story.claimed.includes('mars-asteroid-yard')) mars.yardDestroyed = true;
    if (story.claimed.includes('mars-sector-secure'))
        mars.kills = [
            ...new Set([
                ...mars.kills,
                ...MARS_AMBUSH,
                ...MARS_SURFACE_PATROLS,
                ...MARS_YARD_PATROLS,
            ]),
        ];
    if (story.claimed.includes('mars-anomaly-research')) {
        mars.researchSites = 3;
        mars.researchWaves = 4;
        mars.researchReturned = true;
    }
}

export function grantOrbitalSupplies(
    c: Campaign,
    group: readonly { id: string; target: number }[],
) {
    for (const task of group) {
        c.story!.progress[task.id] = task.target;
        if (!c.story!.claimed.includes(task.id)) c.story!.claimed.push(task.id);
    }
}
