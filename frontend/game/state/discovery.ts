import type { Campaign } from './campaign';
import { RECIPES, RECIPE_IDS, type RecipeId } from './chemistry';
import { actTwoComplete } from './story';
import { stationProjectLock, stationProjectLevel, type StationProject } from './stationProgression';

export type StationDevice = StationProject | 'shield' | 'drones';

/** Visibility follows knowledge, not stock. Owning an installation always preserves access. */
export function stationDeviceDiscovered(c: Campaign, id: StationDevice) {
    const p = c.story;
    if (id === 'laboratory') return true;
    if (id === 'workshop')
        return (
            c.station.workshopLevel > 0 ||
            (c.station.laboratoryLevel > 0 && (!p || p.claimed.includes('lunar-attack')))
        );
    if (id === 'extraction')
        return (
            c.station.extraction ||
            (!p
                ? c.station.workshopLevel > 0
                : actTwoComplete(p) || p.claimed.includes('mercury-technology'))
        );
    if (id === 'shield')
        return (
            c.station.shield ||
            !p ||
            (p.claimed.includes('lunar-attack') && c.station.workshopLevel > 0)
        );
    return (
        !!c.station.sentries ||
        (!!p && p.claimed.includes('lunar-attack') && c.station.workshopLevel > 0)
    );
}

/** An available blueprint may be short of materials, but never of undiscovered research. */
export function stationBlueprintReady(c: Campaign, id: StationProject) {
    return stationProjectLock({ ...c, activeRun: null }, id, false) === null;
}

export function visibleStationTiers(c: Campaign, id: StationProject) {
    if (!stationDeviceDiscovered(c, id)) return [];
    const current = stationProjectLevel(c, id);
    const maximum = Math.min(
        id === 'extraction' ? 1 : 3,
        current + Number(stationBlueprintReady(c, id)),
    );
    return Array.from({ length: maximum }, (_, i) => i + 1);
}

export function recipeDiscovered(c: Campaign, id: RecipeId, siteLevel?: number) {
    if (!Object.hasOwn(RECIPES, id)) return false;
    const recipe = RECIPES[id];
    const level =
        siteLevel ??
        (recipe.category === 'laboratory' ? c.station.laboratoryLevel : c.station.workshopLevel);
    if (recipe.level > level) return false;
    return (
        !['kineticPlate', 'kineticModule'].includes(id) ||
        !c.story ||
        c.story.claimed.includes('mercury-technology')
    );
}

export function visibleRecipes(c: Campaign, category: 'laboratory' | 'workshop', level?: number) {
    return RECIPE_IDS.filter(
        (id) => RECIPES[id].category === category && recipeDiscovered(c, id, level),
    );
}

export function kineticBlueprintReady(c: Campaign) {
    return (
        c.station.shield &&
        c.station.shieldLevel < 2 &&
        c.station.workshopLevel >= 2 &&
        (!c.story ||
            (c.story.claimed.includes('mercury-technology') &&
                (c.station.shieldLevel === 0 ||
                    ['mars-base-defense', 'mars-corridor'].every((id) =>
                        c.story!.claimed.includes(id),
                    ))))
    );
}

export function stationTabDiscovered(c: Campaign, tab: string) {
    if (tab === 'laboratory') return c.station.laboratoryLevel > 0;
    if (tab === 'workshop' || tab === 'shipyard') return c.station.workshopLevel > 0;
    return true;
}
