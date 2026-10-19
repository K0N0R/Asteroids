import { GraphicsContext } from 'pixi.js';
import { ELEMENT_IDS, RESOURCES, type ResourceStore } from '../state/resources';

/** Counts describe game portions; marker presence identifies elements, not a mass percentage. */
export function mineralMarkerKey(contents: Readonly<ResourceStore>) {
    return ELEMENT_IDS.filter((id) => (contents[id] ?? 0) > 0).join(':');
}
export function drawMineralMarkers(
    context: GraphicsContext,
    contents: Readonly<ResourceStore>,
    variant: number,
    surface = false,
) {
    const ids = ELEMENT_IDS.filter((id) => (contents[id] ?? 0) > 0);
    const radius = ids.length <= 2 ? 0.145 : ids.length <= 6 ? 0.115 : 0.09;
    for (const [i, id] of ids.entries()) {
        const angle = variant * 2.399963 + (i * Math.PI * 2) / ids.length;
        const spread = ids.length === 1 ? 0 : ids.length === 2 ? 0.22 : 0.35;
        const x = Math.cos(angle) * spread;
        const y = Math.sin(angle) * spread * (surface ? 0.55 : 1) + (surface ? 0.15 : 0);
        context.circle(x, y, radius).fill(RESOURCES[id].color);
        context
            .circle(x - radius * 0.27, y - radius * 0.28, radius * 0.35)
            .fill({ color: 0xffffff, alpha: 0.27 });
    }
}
