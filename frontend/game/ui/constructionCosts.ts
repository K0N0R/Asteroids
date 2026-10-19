import type { Container } from 'pixi.js';
import { RESOURCE_IDS, RESOURCES, type ResourceStore } from '../state/resources';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { illustrationInBox, label } from './primitives';

/** Two columns with reserved icon/name/count space; shared by all station devices. */
export function constructionCosts(
    ui: Container,
    bank: ResourceStore,
    bill: ResourceStore,
    y = 570,
) {
    label(ui, 'CZĘŚCI DO MONTAŻU', 1072, y, 12, C.muted);
    RESOURCE_IDS.filter((id) => (bill[id] ?? 0) > 0).forEach((id, i) => {
        const x = 1072 + (i % 2) * 232;
        const rowY = y + 22 + Math.floor(i / 2) * 36;
        illustrationInBox(ui, itemIllustration(id), x, rowY + 2, 26, 26);
        label(ui, RESOURCES[id].name, x + 34, rowY, 15, C.text, 188);
        const need = bill[id]!,
            have = bank[id] ?? 0;
        label(
            ui,
            `${Math.min(have, need)} / ${need}`,
            x + 34,
            rowY + 19,
            13,
            have >= need ? C.mint : C.gold,
        );
    });
}
