import type { ResourceId } from './resources';

type Delivery = { id: string; resource: ResourceId; target: number; title: string };
export const MARS_CONSTRUCTION = [
    { id: 'mars-base-ore', resource: 'parts', target: 12, title: 'Poszycie bazy marsjańskiej' },
    {
        id: 'mars-base-parts',
        resource: 'storageFrames',
        target: 6,
        title: 'Maszyneria bazy marsjańskiej',
    },
    {
        id: 'mars-base-electronics',
        resource: 'electronics',
        target: 4,
        title: 'Sterowanie bazy marsjańskiej',
    },
    {
        id: 'mars-base-power',
        resource: 'powerModules',
        target: 4,
        title: 'Zasilanie bazy marsjańskiej',
    },
    { id: 'mars-base-life', resource: 'lifeSupport', target: 4, title: 'Zaplecze życia na Marsie' },
] as const satisfies readonly Delivery[];
export const VENUS_CONSTRUCTION = [
    { id: 'venus-stockpile', resource: 'parts', target: 8, title: 'Poszycie placówki Wenus' },
    {
        id: 'venus-machinery',
        resource: 'storageFrames',
        target: 4,
        title: 'Maszyneria placówki Wenus',
    },
    {
        id: 'venus-electronics',
        resource: 'electronics',
        target: 3,
        title: 'Sterowanie placówki Wenus',
    },
    { id: 'venus-power', resource: 'powerModules', target: 3, title: 'Zasilanie placówki Wenus' },
    { id: 'venus-life', resource: 'lifeSupport', target: 3, title: 'Zaplecze życia przy Wenus' },
] as const satisfies readonly Delivery[];
export const VENUS_SHIELD = [
    {
        id: 'venus-shield-plating',
        resource: 'lightPlating',
        target: 6,
        title: 'Poszycie osłony słonecznej',
    },
    {
        id: 'venus-shield-power',
        resource: 'powerModules',
        target: 3,
        title: 'Zasilanie osłony słonecznej',
    },
    {
        id: 'venus-shield-electronics',
        resource: 'electronics',
        target: 2,
        title: 'Sterowanie osłoną słoneczną',
    },
] as const satisfies readonly Delivery[];
export function orbitalSuppliesReady(p: { claimed: readonly string[] }, sector: 'mars' | 'venus') {
    return (sector === 'mars' ? MARS_CONSTRUCTION : VENUS_CONSTRUCTION).every((t) =>
        p.claimed.includes(t.id),
    );
}
