import type { ResourceId } from './resources';
/** Delivered equipment brings the lunar site's processing line online. */
export const LUNAR_PROCESSING = [
    { id: 'lunar-hull', resource: 'parts', target: 8, title: 'Moduł konstrukcyjny' },
    { id: 'lunar-machinery', resource: 'storageFrames', target: 4, title: 'Linia przetwarzania' },
    { id: 'lunar-electronics', resource: 'electronics', target: 3, title: 'Sterowanie produkcją' },
    { id: 'lunar-power', resource: 'powerModules', target: 2, title: 'Zasilanie placówki' },
    { id: 'lunar-life-support', resource: 'lifeSupport', target: 2, title: 'Zaplecze życia' },
] as const satisfies readonly { id: string; resource: ResourceId; target: number; title: string }[];
export const LUNAR_PROCESSING_TASKS = LUNAR_PROCESSING.map((t) => t.id);
export function lunarProcessingReady(p: { claimed: readonly string[] }) {
    return LUNAR_PROCESSING_TASKS.every((id) => p.claimed.includes(id));
}
export function lunarConstructionReady(p: { claimed: readonly string[] }) {
    return p.claimed.includes('lunar-foundation') && p.claimed.includes('lunar-installations');
}
export function lunarModules(p: { claimed: readonly string[] }) {
    return LUNAR_PROCESSING.map((t) => p.claimed.includes(t.id));
}
