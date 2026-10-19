import type { Campaign } from './campaign';
import { REPAIR_KITS } from '../config';
import { RECIPES, RECIPE_IDS, type RecipeId, type ProcessRecipe } from './chemistry';
import { RESOURCE_IDS, resourceSummary } from './resources';

export function productionLock(c: Campaign, id: RecipeId, batches = 1): string | null {
    if (!Object.hasOwn(RECIPES, id)) return 'Nieznany przepis.';
    if (!Number.isSafeInteger(batches) || batches <= 0) return 'Wybierz poprawną liczbę partii.';
    if (c.activeRun) return 'Produkcja dostępna po powrocie do bazy.';
    const recipe: ProcessRecipe = RECIPES[id];
    if (c.station.workshop < recipe.level) return `Wymagane zaplecze produkcyjne ${recipe.level}.`;
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
                (recipe.output === 'kit' ? c.repairKits : (c.bank[recipe.output] ?? 0)),
        )
    )
        return 'Zbyt duża partia.';
    for (const resource of RESOURCE_IDS) {
        const amount = (recipe.inputs[resource] ?? 0) * batches;
        if (!Number.isSafeInteger(amount) || (c.bank[resource] ?? 0) < amount)
            return `Potrzeba: ${resourceSummary(recipe.inputs)} na partię.`;
    }
    return null;
}
export function maxProduction(c: Campaign, id: RecipeId) {
    if (!Object.hasOwn(RECIPES, id)) return 0;
    const recipe: ProcessRecipe = RECIPES[id];
    let count = Math.min(
        ...RESOURCE_IDS.filter((r) => (recipe.inputs[r] ?? 0) > 0).map((r) =>
            Math.floor((c.bank[r] ?? 0) / recipe.inputs[r]!),
        ),
    );
    const existing = recipe.output === 'kit' ? c.repairKits : (c.bank[recipe.output] ?? 0);
    count = Math.min(
        count,
        Math.floor(
            ((recipe.output === 'kit' ? REPAIR_KITS.kitLimit : Number.MAX_SAFE_INTEGER) -
                existing) /
                recipe.amount,
        ),
    );
    return Number.isSafeInteger(count) && count > 0 && !productionLock(c, id, count) ? count : 0;
}
/** Validate the whole batch before mutating either inventory. No queues or elapsed-time production. */
export function manufacture(c: Campaign, id: RecipeId, batches = 1) {
    if (productionLock(c, id, batches)) return false;
    const recipe: ProcessRecipe = RECIPES[id];
    for (const resource of RESOURCE_IDS) {
        const amount = (recipe.inputs[resource] ?? 0) * batches;
        if (amount) c.bank[resource] = (c.bank[resource] ?? 0) - amount;
    }
    if (recipe.output === 'kit') c.repairKits += recipe.amount * batches;
    else c.bank[recipe.output] = (c.bank[recipe.output] ?? 0) + recipe.amount * batches;
    return true;
}
export function availableProcesses(c: Campaign) {
    return RECIPE_IDS.filter((id) => RECIPES[id].level <= c.station.workshop);
}
export function upgradeHyperdrive(c: Campaign) {
    const ship = c.ship;
    if (!ship || c.activeRun || c.station.workshop < 1 || ship.hyperdriveLevel >= 3) return false;
    const level = ship.hyperdriveLevel + 1;
    if (
        c.bank.parts < 4 * level ||
        (c.bank.propulsion ?? 0) < level ||
        (c.bank.powerModules ?? 0) < level
    )
        return false;
    c.bank.parts -= 4 * level;
    c.bank.propulsion = (c.bank.propulsion ?? 0) - level;
    c.bank.powerModules = (c.bank.powerModules ?? 0) - level;
    ship.hyperdriveLevel = level;
    return true;
}
