import { Container } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { RECIPES, RECIPE_IDS, type RecipeId, type ProcessRecipe } from '../state/chemistry';
import {
    maxProduction,
    productionLock,
    productionPreview,
    type ProductionScope,
} from '../state/production';
import { RESOURCES } from '../state/resources';
import { itemIllustration, ingredientIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { button, label, panel, clear, illustrationInBox, STATION_LAYOUT } from './primitives';

export interface ProductionNavigation {
    openRecipe: (id: RecipeId) => void;
    back?: () => void;
}
interface ProductionActions {
    manufacture: (kind: RecipeId, batches: number) => void;
}
export function laboratoryOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    selected: RecipeId,
    select: (id: RecipeId) => void,
    scope?: ProductionScope,
    navigation?: ProductionNavigation,
) {
    processOverview(ui, c, actions, 'laboratory', selected, select, scope, navigation);
}
export function workshopOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    selected: RecipeId,
    select: (id: RecipeId) => void,
    scope?: ProductionScope,
    navigation?: ProductionNavigation,
) {
    processOverview(ui, c, actions, 'workshop', selected, select, scope, navigation);
}
/** Shared rendering primitives; each screen has its own route, category and selection. */
function processOverview(
    ui: Container,
    c: Campaign,
    actions: ProductionActions,
    category: 'laboratory' | 'workshop',
    selected: RecipeId,
    select: (id: RecipeId) => void,
    scope?: ProductionScope,
    navigation?: ProductionNavigation,
) {
    const ids = RECIPE_IDS.filter((id) => RECIPES[id].category === category);
    const id = ids.includes(selected) ? selected : ids[0];
    const recipe: ProcessRecipe = RECIPES[id];
    panel(ui, 280, STATION_LAYOUT.top, 285, 591);
    label(ui, 'WYBIERZ PROCES', 300, 244, 13, C.mint);
    if (navigation?.back) button(ui, 'POWRÓT', 453, 237, 96, navigation.back, false, true, 28, 12);
    ids.forEach((kind, i) => {
        const y = 284 + i * 43;
        button(ui, RECIPES[kind].title, 296, y, 253, () => select(kind), kind === id, true, 34, 13);
    });
    const details = new Container();
    ui.addChild(details);
    let batches = 1;
    const render = () => {
        clear(details);
        const preview = productionPreview(c, id, batches, scope);
        const max = maxProduction(c, id, scope);
        const lock = productionLock(c, id, batches, scope);
        const missing = preview.ingredients.some((r) => r.have < r.need);
        const output = recipe.output === 'kit' ? 'Zestaw naprawczy' : RESOURCES[recipe.output].name;
        panel(details, 585, STATION_LAYOUT.top, 430, 591);
        label(details, recipe.title, 609, 244, 25, C.text, 382);
        label(details, 'PROCES', 609, 295, 13, C.mint);
        illustrationInBox(details, ingredientIllustration(recipe.inputs), 625, 330, 350, 155);
        label(details, 'SKŁADNIK', 609, 510, 12, C.muted);
        label(details, 'MASZ', 862, 510, 12, C.muted);
        label(details, 'POTRZEBA', 925, 510, 12, C.muted);
        preview.ingredients.forEach((row, i) => {
            const y = 539 + i * 36;
            const source = RECIPE_IDS.find((sourceId) => RECIPES[sourceId].output === row.resource);
            const canNavigate = !!source && !!navigation;
            label(
                details,
                RESOURCES[row.resource].name,
                609,
                y,
                15,
                C.text,
                canNavigate ? 162 : 239,
            );
            if (source && navigation)
                button(
                    details,
                    'STWÓRZ',
                    779,
                    y - 3,
                    68,
                    () => navigation.openRecipe(source),
                    false,
                    true,
                    28,
                    10,
                );
            label(details, `${row.have}`, 862, y, 17, row.have < row.need ? C.coral : C.mint);
            label(details, `${row.need}`, 947, y, 17, C.gold);
        });
        label(details, recipe.equation ?? 'Ciekawostka', 609, 664, 19, C.cyan, 382);
        label(details, recipe.explanation, 609, 708, 15, C.muted, 382);
        label(details, output, 1072, 244, 25, C.text, 456);
        label(details, 'PRODUKT', 1072, 295, 13, C.mint);
        illustrationInBox(details, itemIllustration(recipe.output), 1120, 329, 350, 180);
        label(details, `W magazynie: ${preview.outputHave}`, 1072, 539, 18, C.muted);
        label(
            details,
            `Otrzymasz: +${preview.gain}   →   Będziesz mieć: ${preview.outputAfter}`,
            1072,
            577,
            19,
            C.cyan,
            456,
        );
        label(
            details,
            lock
                ? missing
                    ? 'Brakuje składników zaznaczonych w tabeli.'
                    : lock
                : 'Gotowe do wykonania.',
            1072,
            621,
            16,
            lock ? C.gold : C.mint,
            456,
        );
        [1, 5, 10, max].forEach((count, i) => {
            button(
                details,
                i === 3 ? `MAKS. ${max}` : `${count}`,
                1072 + i * 116,
                675,
                108,
                () => {
                    batches = count;
                    render();
                },
                batches === count && (i !== 3 || ![1, 5, 10].includes(max)),
                count > 0,
                36,
                13,
            );
        });
        button(
            details,
            `WYTWÓRZ · ${preview.gain} × ${output}`,
            1072,
            STATION_LAYOUT.actionY,
            456,
            () => actions.manufacture(id, batches),
            true,
            !lock,
            STATION_LAYOUT.actionHeight,
            14,
        );
    };
    render();
}
