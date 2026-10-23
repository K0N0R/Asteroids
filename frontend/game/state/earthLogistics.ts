import { storageCapacity, storageUsed, type Campaign, type Cargo } from './campaign';
import { RESOURCE_IDS, STORAGE_PRIORITY, resourceTotal } from './resources';
import { syncStory } from './story';

/** Secure mined cargo for return XP; loaded freight is never new mining. */
export function recordCargoDelivery(c: Campaign, accepted: Cargo) {
    const run = c.activeRun;
    if (!run) return;
    const total = (run.unloaded ??= { ore: 0, parts: 0 });
    for (const id of RESOURCE_IDS) {
        const n = accepted[id] ?? 0;
        if (!n) continue;
        const freight = Math.min(n, run.freight?.[id] ?? 0);
        if (run.freight && freight) run.freight[id] = run.freight[id]! - freight;
        total[id] = (total[id] ?? 0) + n - freight;
    }
}

/** Move only accepted cargo. Full storage leaves the remainder aboard. */
export function receiveStationCargo(c: Campaign, cargo: Cargo) {
    const run = c.activeRun,
        p = c.story;
    if (
        !run ||
        !p ||
        !['earth', 'lunar', 'mars', 'venus'].includes(p.sector) ||
        run.sector !== p.sector ||
        run.area ||
        run.mission?.aborted
    )
        return null;
    const accepted: Cargo = { ore: 0, parts: 0 },
        titles: string[] = [];
    let overflow = 0;
    let free = Math.max(0, storageCapacity(c) - storageUsed(c));
    for (const id of STORAGE_PRIORITY) {
        const n = Math.min(free, cargo[id] ?? 0);
        if (!n) continue;
        cargo[id] = (cargo[id] ?? 0) - n;
        c.bank[id] = (c.bank[id] ?? 0) + n;
        accepted[id] = (accepted[id] ?? 0) + n;
        free -= n;
    }
    if (!resourceTotal(accepted)) return null;
    if ((accepted.anomalyOre ?? 0) > 0 && c.station.extraction)
        c.station.anomalySampleDelivered = true;
    recordCargoDelivery(c, accepted);
    const change = syncStory(c)!;
    titles.push(...change.titles);
    overflow += change.overflow;
    return { accepted, titles, overflow };
}
export function receiveEarthCargo(c: Campaign, cargo: Cargo) {
    return c.story?.sector === 'earth' ? receiveStationCargo(c, cargo) : null;
}
