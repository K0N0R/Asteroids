import { Graphics, type Container } from 'pixi.js';
import { RESOURCE_IDS, RESOURCES, type ResourceStore } from '../state/resources';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { illustrationInBox, label, button } from './primitives';
import { RECIPES, RECIPE_IDS, type RecipeId } from '../state/chemistry';

/** Two columns with reserved icon/name/count space; shared by all station devices. */
export function constructionCosts(
    ui: Container,
    bank: ResourceStore,
    bill: ResourceStore,
    y = 542,
    openRecipe?: (id: RecipeId) => void,
) {
    label(ui, 'CZĘŚCI DO MONTAŻU', 1072, y, 12, C.muted);
    RESOURCE_IDS.filter((id) => (bill[id] ?? 0) > 0).forEach((id, i) => {
        const x = 1072 + (i % 2) * 234;
        const rowY = y + 24 + Math.floor(i / 2) * 52;
        ui.addChild(
            new Graphics().roundRect(x, rowY, 222, 46, 8).fill({ color: C.ink, alpha: 0.24 }),
        );
        illustrationInBox(ui, itemIllustration(id), x + 8, rowY + 8, 27, 27);
        label(ui, RESOURCES[id].name, x + 43, rowY + 5, 14, C.text, 171);
        const need = bill[id]!,
            have = bank[id] ?? 0;
        label(
            ui,
            `${Math.min(have, need)} / ${need}`,
            x + 43,
            rowY + 26,
            13,
            have >= need ? C.mint : C.gold,
        );
        const recipe = RECIPE_IDS.find((recipe) => RECIPES[recipe].output === id);
        if (recipe && openRecipe)
            button(
                ui,
                'STWÓRZ',
                x + 124,
                rowY + 23,
                88,
                () => openRecipe(recipe),
                false,
                true,
                23,
                10,
            );
    });
}
