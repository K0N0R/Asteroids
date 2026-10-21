import { inEarthSystem } from '../worlds/moon';
import { lunarProcessingReady, lunarConstructionReady } from './lunarConstruction';
import type { Campaign } from './campaign';
import { REPAIR_KITS } from '../config';
import { RECIPES, RECIPE_IDS, type RecipeId, type ProcessRecipe } from './chemistry';
import { RESOURCE_IDS, resourceSummary } from './resources';

export interface ProductionScope {
    site: 'satuk' | 'lunar';
    canAccess?: () => boolean;
}
export const SATUK_PRODUCTION: ProductionScope = { site: 'satuk' };
function productionContext(c: Campaign, scope: ProductionScope) {
    if (scope.site === 'satuk')
        return {
            bank: c.bank,
            level: c.station.workshop,
            blocked: c.activeRun ? 'Produkcja dostępna po powrocie do bazy.' : null,
        };
    const ready =
        inEarthSystem(c.story?.sector) &&
        inEarthSystem(c.activeRun?.sector) &&
        lunarProcessingReady(c.story) &&
        scope.canAccess?.();
    return {
        bank: c.lunarStation.bank,
        level: c.story && lunarConstructionReady(c.story) ? 1 : 0,
        blocked: ready ? null : 'Produkcja wymaga postoju przy działającej bazie księżycowej.',
    };
}
/** Preview and execution resolve the same warehouse, including the lunar station. */
export function productionPreview(
    c: Campaign,
    id: RecipeId,
    batches = 1,
    scope: ProductionScope = SATUK_PRODUCTION,
) {
    const context = productionContext(c, scope);
    const recipe: ProcessRecipe = RECIPES[id];
    const outputHave = recipe.output === 'kit' ? c.repairKits : (context.bank[recipe.output] ?? 0);
    return {
        ingredients: RESOURCE_IDS.filter((r) => (recipe.inputs[r] ?? 0) > 0).map((resource) => ({
            resource,
            have: context.bank[resource] ?? 0,
            need: recipe.inputs[resource]! * batches,
        })),
        outputHave,
        gain: recipe.amount * batches,
        outputAfter: outputHave + recipe.amount * batches,
    };
}
export function productionLock(
    c: Campaign,
    id: RecipeId,
    batches = 1,
    scope: ProductionScope = SATUK_PRODUCTION,
): string | null {
    if (!Object.hasOwn(RECIPES, id)) return 'Nieznany przepis.';
    if (!Number.isSafeInteger(batches) || batches <= 0) return 'Wybierz poprawną liczbę partii.';
    const context = productionContext(c, scope);
    if (context.blocked) return context.blocked;
    const recipe: ProcessRecipe = RECIPES[id];
    if (context.level < recipe.level)
        return `Wymagane zaplecze produkcyjne ${recipe.level === 1 ? 'I' : 'II'}.`;
    if (
        (id === 'kineticPlate' || id === 'kineticModule') &&
        c.story &&
        !c.story.claimed.includes('mercury-survey')
    )
        return 'Najpierw badania na Merkurym.';
    if (recipe.output === 'kit' && c.repairKits + recipe.amount * batches > REPAIR_KITS.kitLimit)
        return 'Osiągnięto limit zestawów naprawczych.';
    if (
        !Number.isSafeInteger(
            recipe.amount * batches +
                (recipe.output === 'kit' ? c.repairKits : (context.bank[recipe.output] ?? 0)),
        )
    )
        return 'Zbyt duża partia.';
    for (const resource of RESOURCE_IDS) {
        const amount = (recipe.inputs[resource] ?? 0) * batches;
        if (!Number.isSafeInteger(amount) || (context.bank[resource] ?? 0) < amount)
            return `Potrzeba: ${resourceSummary(recipe.inputs)} na partię.`;
    }
    return null;
}
export function maxProduction(
    c: Campaign,
    id: RecipeId,
    scope: ProductionScope = SATUK_PRODUCTION,
) {
    const context = productionContext(c, scope);
    if (!Object.hasOwn(RECIPES, id)) return 0;
    const recipe: ProcessRecipe = RECIPES[id];
    let count = Math.min(
        ...RESOURCE_IDS.filter((r) => (recipe.inputs[r] ?? 0) > 0).map((r) =>
            Math.floor((context.bank[r] ?? 0) / recipe.inputs[r]!),
        ),
    );
    const existing = recipe.output === 'kit' ? c.repairKits : (context.bank[recipe.output] ?? 0);
    count = Math.min(
        count,
        Math.floor(
            ((recipe.output === 'kit' ? REPAIR_KITS.kitLimit : Number.MAX_SAFE_INTEGER) -
                existing) /
                recipe.amount,
        ),
    );
    return Number.isSafeInteger(count) && count > 0 && !productionLock(c, id, count, scope)
        ? count
        : 0;
}
/** Validate the whole batch before mutating either inventory. No queues or elapsed-time production. */
export function manufacture(
    c: Campaign,
    id: RecipeId,
    batches = 1,
    scope: ProductionScope = SATUK_PRODUCTION,
) {
    const context = productionContext(c, scope);
    if (productionLock(c, id, batches, scope)) return false;
    const recipe: ProcessRecipe = RECIPES[id];
    for (const resource of RESOURCE_IDS) {
        const amount = (recipe.inputs[resource] ?? 0) * batches;
        if (amount) context.bank[resource] = (context.bank[resource] ?? 0) - amount;
    }
    if (recipe.output === 'kit') c.repairKits += recipe.amount * batches;
    else context.bank[recipe.output] = (context.bank[recipe.output] ?? 0) + recipe.amount * batches;
    return true;
}
export function availableProcesses(c: Campaign) {
    return RECIPE_IDS.filter((id) => RECIPES[id].level <= c.station.workshop);
}
