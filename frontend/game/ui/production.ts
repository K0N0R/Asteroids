import { partInfo, PART_FAMILIES, TIER_NAMES } from '../state/partTiers';
import { Container } from 'pixi.js';
import type { Campaign } from '../state/campaign';
import { RECIPES, RECIPE_IDS, type RecipeId, type ProcessRecipe } from '../state/chemistry';
import { productionLock, productionPreview, type ProductionScope } from '../state/production';
import { visibleRecipes, recipeDiscovered } from '../state/discovery';
import { RESOURCES } from '../state/resources';
import { itemIllustration, ingredientIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { button, label, panel, illustrationInBox, STATION_LAYOUT } from './primitives';

export interface ProductionNavigation {
    openRecipe: (id: RecipeId) => void;
    back?: () => void;
    openStation?: (project: 'laboratory' | 'workshop') => void;
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
    const siteLevel =
        category === 'laboratory' ? c.station.laboratoryLevel : c.station.workshopLevel;
    const installed = scope?.site === 'lunar' ? Math.min(1, siteLevel) : siteLevel;
    if (!installed) {
        panel(ui, 280, STATION_LAYOUT.top, 1280, 591);
        label(
            ui,
            `Najpierw uruchom ${category === 'laboratory' ? 'Laboratorium' : 'Warsztat'}`,
            320,
            270,
            30,
            C.text,
            1100,
        );
        label(ui, 'Urządzenie nie jest jeszcze uruchomione.', 320, 335, 20, C.muted, 1100);
        if (scope?.site !== 'lunar' && navigation?.openStation)
            button(
                ui,
                'ROZBUDOWA STACJI →',
                320,
                430,
                350,
                () => navigation.openStation?.(category),
                true,
                true,
                44,
                18,
            );
        return;
    }
    const knownLevel = installed;
    const ids = visibleRecipes(c, category, knownLevel);
    const id = ids.includes(selected) ? selected : ids[0];
    const recipe: ProcessRecipe = RECIPES[id];
    panel(ui, 280, STATION_LAYOUT.top, 285, 591);
    label(ui, 'WYBIERZ PROCES', 300, 244, 13, C.mint);
    if (navigation?.back) button(ui, 'POWRÓT', 453, 237, 96, navigation.back, false, true, 28, 12);
    const tier = partInfo(recipe.output)?.tier ?? 1;
    if (category === 'workshop') {
        TIER_NAMES.slice(0, knownLevel).forEach((name, index) =>
            button(
                ui,
                `TIER ${name}`,
                296 + index * 86,
                272,
                80,
                () => {
                    const family = partInfo(recipe.output)?.family;
                    const output = family ? PART_FAMILIES[family][index] : null;
                    const first = ids.find((key) =>
                        output
                            ? RECIPES[key].output === output
                            : (partInfo(RECIPES[key].output)?.tier ?? 1) === index + 1,
                    );
                    if (first) select(first);
                },
                tier === index + 1,
                index + 1 <= knownLevel,
                30,
                12,
            ),
        );
    }
    const listed =
        category === 'workshop'
            ? ids.filter((key) => (partInfo(RECIPES[key].output)?.tier ?? 1) === tier)
            : ids;
    listed.forEach((kind, i) => {
        const y = category === 'workshop' ? 314 + i * 40 : 284 + i * 43;
        button(ui, RECIPES[kind].title, 296, y, 253, () => select(kind), kind === id, true, 34, 13);
    });
    const details = new Container();
    ui.addChild(details);
    const batches = 1;
    const preview = productionPreview(c, id, batches, scope);
    const lock = productionLock(c, id, batches, scope);
    const missing = preview.ingredients.some((r) => r.have < r.need);
    const output = recipe.output === 'kit' ? 'Zestaw naprawczy' : RESOURCES[recipe.output].name;
    panel(details, 585, STATION_LAYOUT.top, 430, 591);
    label(details, recipe.title, 609, 244, 25, C.text, 382);
    label(details, 'PROCES', 609, 295, 13, C.mint);
    illustrationInBox(details, ingredientIllustration(recipe.inputs), 625, 330, 350, 110);
    label(details, 'SKŁADNIK', 609, 460, 12, C.muted);
    label(details, 'MASZ', 862, 460, 12, C.muted);
    label(details, 'POTRZEBA', 925, 460, 12, C.muted);
    preview.ingredients.forEach((row, i) => {
        const y = 488 + i * 40;
        const source = RECIPE_IDS.find(
            (sourceId) =>
                RECIPES[sourceId].output === row.resource &&
                recipeDiscovered(
                    c,
                    sourceId,
                    scope?.site === 'lunar'
                        ? Math.min(
                              1,
                              c.station[
                                  RECIPES[sourceId].category === 'laboratory'
                                      ? 'laboratoryLevel'
                                      : 'workshopLevel'
                              ],
                          )
                        : undefined,
                ),
        );
        const canNavigate = !!source && !!navigation;
        const name =
            row.resource === 'stabilizedAnomaly'
                ? 'MA · materiał anomalii'
                : row.resource === 'resonantComposite'
                  ? 'KR · kompozyt rezonansowy'
                  : RESOURCES[row.resource].name;
        label(details, name, 609, y, 14, C.text, canNavigate ? 162 : 239);
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
    label(details, recipe.equation ?? 'Ciekawostka', 609, 694, 19, C.cyan, 382);
    label(details, recipe.explanation, 609, 730, 15, C.muted, 382);
    label(details, output, 1072, 244, 25, C.text, 456);
    label(
        details,
        partInfo(recipe.output) ? `PRODUKT · TIER ${TIER_NAMES[tier - 1]}` : 'PRODUKT',
        1072,
        295,
        13,
        C.mint,
    );
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
            ? missing && lock.startsWith('Potrzeba:')
                ? 'Brakuje składników zaznaczonych w tabeli.'
                : lock
            : 'Gotowe do wykonania.',
        1072,
        621,
        16,
        lock ? C.gold : C.mint,
        456,
    );
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
}
