import type { ResourceId } from './resources';
/** Delivered equipment brings the lunar site's processing line online. */
export const LUNAR_PROCESSING = [
    { id: 'lunar-hull', resource: 'steel', target: 8, title: 'Stal do montażu prefabrykatów' },
    { id: 'lunar-electronics', resource: 'silica', target: 4, title: 'Izolacja krzemionkowa' },
    { id: 'lunar-life-support', resource: 'water', target: 2, title: 'Woda do obiegów instalacji' },
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
