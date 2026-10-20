import type { Container } from 'pixi.js';
import { itemIllustration } from '../graphics/items';
import { C } from '../graphics/shapes';
import { RESOURCES, type ResourceId, type ResourceStore } from '../state/resources';
import { illustrationInBox, label, panel } from './primitives';

export function cargoReceipt(
    ui: Container,
    resources: ResourceId[],
    gains: ResourceStore,
    bank: ResourceStore,
) {
    resources.forEach((id, i) => {
        const x = 450 + (i % 2) * 358,
            y = 414 + Math.floor(i / 2) * 45;
        panel(ui, x, y, 340, 41);
        illustrationInBox(ui, itemIllustration(id), x + 9, y + 7, 28, 28);
        label(ui, RESOURCES[id].name, x + 47, y + 4, 16, C.text, 280);
        label(ui, `+${gains[id]}  →  ${bank[id] ?? 0}`, x + 47, y + 22, 18, C.mint, 280);
    });
}
