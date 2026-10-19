import { type Container } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { RECIPES, RECIPE_IDS, type RecipeId, type ProcessRecipe } from '../state/chemistry';
import { maxProduction, productionLock } from '../state/production';
import { RESOURCES, resourceSummary } from '../state/resources';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { button, label, panel, illustrationInBox, STATION_LAYOUT } from './primitives';

interface ProductionActions {
    manufacture: (kind: RecipeId, batches: number) => void;
}
export function laboratoryOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    selected: RecipeId,
    select: (id: RecipeId) => void,
) {
    processOverview(ui, c, actions, 'laboratory', selected, select);
}
export function workshopOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    selected: RecipeId,
    select: (id: RecipeId) => void,
) {
    processOverview(ui, c, actions, 'workshop', selected, select);
}
/** Shared rendering primitives; each screen has its own route, category and selection. */
function processOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    category: 'laboratory' | 'workshop',
    selected: RecipeId,
    select: (id: RecipeId) => void,
) {
    const ids = RECIPE_IDS.filter((id) => RECIPES[id].category === category);
    const id = ids.includes(selected) ? selected : ids[0];
    const recipe: ProcessRecipe = RECIPES[id];
    panel(ui, 280, STATION_LAYOUT.top, 285, 591);
    label(ui, 'WYBIERZ PROCES', 300, 244, 13, C.mint);
    ids.forEach((kind, i) => {
        const y = 284 + i * 43;
        button(ui, RECIPES[kind].title, 296, y, 253, () => select(kind), kind === id, true, 34, 13);
    });
    panel(ui, 585, STATION_LAYOUT.top, 430, 591);
    label(ui, recipe.title, 609, 244, 25, C.text, 382);
    illustrationInBox(ui, itemIllustration(recipe.output), 625, 334, 350, 212);
    label(
        ui,
        recipe.equation ?? (category === 'laboratory' ? 'Struktura materiału' : 'Gotowa część'),
        609,
        580,
        21,
        C.cyan,
        382,
    );
    label(ui, recipe.explanation, 609, 628, 17, C.muted, 382);
    label(ui, 'RĘCZNE WYKONANIE', 1072, 244, 14, C.mint);
    label(ui, 'Na jedną partię', 1072, 278, 26, C.text);
    label(ui, resourceSummary(recipe.inputs), 1072, 334, 18, C.gold, 456);
    label(
        ui,
        `Wynik: ${recipe.amount} × ${recipe.output === 'kit' ? 'Zestaw naprawczy' : RESOURCES[recipe.output].name}`,
        1072,
        460,
        20,
        C.cyan,
        456,
    );
    const lock = productionLock(c, id),
        max = maxProduction(c, id);
    label(
        ui,
        lock ?? 'Składniki gotowe. Wybierz liczbę partii.',
        1072,
        520,
        17,
        lock ? C.gold : C.mint,
        456,
    );
    [1, 5, 10].forEach((count, i) =>
        button(
            ui,
            `WYKONAJ ${count}`,
            1072 + i * 155,
            669,
            146,
            () => actions.manufacture(id, count),
            false,
            !productionLock(c, id, count),
            40,
            13,
        ),
    );
    button(
        ui,
        `WYKONAJ MAKS. (${max})`,
        1072,
        STATION_LAYOUT.actionY,
        456,
        () => actions.manufacture(id, max),
        true,
        max > 0,
        STATION_LAYOUT.actionHeight,
        15,
    );
}
