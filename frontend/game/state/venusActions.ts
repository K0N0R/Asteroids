import { syncStory, storyTaskAvailable, STORY_TASKS } from './story';
import { venusProgress, VENUS_PROBE_COST } from './venusAct';
import { canAffordEquipment, spendEquipment } from './equipmentCosts';
import type { Campaign } from './campaign';
export function completeVenusTask(c: Campaign, id: string) {
    const p = c.story,
        t = STORY_TASKS.find((t) => t.id === id);
    if (!p || !t || p.claimed.includes(id) || !storyTaskAvailable(p, t)) return null;
    p.progress[id] = 1;
    return syncStory(c);
}
export function venusStationAction(c: Campaign, id: string) {
    if (c.activeRun || c.story?.sector !== 'venus') return false;
    const p = c.story,
        v = venusProgress(p);
    if (
        id === 'venus-probe-build' &&
        p.claimed.includes('venus-dead-laboratory') &&
        !v.probeBuilt &&
        c.station.workshopLevel >= 1 &&
        canAffordEquipment(c.bank, VENUS_PROBE_COST)
    ) {
        spendEquipment(c.bank, VENUS_PROBE_COST);
        v.probeBuilt = true;
        return true;
    }
    if (
        id === 'venus-analyse' &&
        p.claimed.includes('venus-atmospheric-probe') &&
        !p.claimed.includes('venus-horizon-project') &&
        c.station.laboratoryLevel >= 1
    ) {
        completeVenusTask(c, 'venus-horizon-project');
        return true;
    }
    return false;
}
