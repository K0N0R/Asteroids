import { MOON, EARTH_MOON_LANE } from './moon';
import type { ResourceStore } from '../state/resources';
export const SATELLITE_FIELD = { x: 4200, y: 0, radius: 700, name: 'Wraki satelit' };
export const ASTEROID_FIELD = { x: 4200, y: -4500, radius: 800, name: 'Bogata asteroida' };
export const LUNAR_PROBE = { x: 650, y: -4800 };
export const SATELLITES = [
    {
        id: 61001,
        task: 'earth-satellite-0',
        x: 4020,
        y: -120,
        parts: { parts: 3, storageFrames: 1 },
    },
    {
        id: 61002,
        task: 'earth-satellite-1',
        x: 4380,
        y: -80,
        parts: { electronics: 2, powerModules: 1 },
    },
    {
        id: 61003,
        task: 'earth-satellite-2',
        x: 4220,
        y: 180,
        parts: { lifeSupport: 1, propulsion: 2 },
    },
] as const satisfies readonly {
    id: number;
    task: string;
    x: number;
    y: number;
    parts: ResourceStore;
}[];
type Progress = { claimed: readonly string[] };
export function earthSystemLanes(p: Progress) {
    if (!p.claimed.includes('earth-relay')) return [];
    return [
        { ...EARTH_MOON_LANE },
        { name: 'Ziemia — wraki satelit', a: { x: 1350, y: 0 }, b: { x: 3650, y: 0 } },
        ...(p.claimed.includes('lunar-survey')
            ? [
                  {
                      name: 'Księżyc — bogata asteroida',
                      a: { x: 750, y: -4500 },
                      b: { x: 3550, y: -4500 },
                  },
              ]
            : []),
    ];
}
export function earthSystemZones(p: Progress) {
    const zones = [{ x: 0, y: 0, radius: 1450, name: 'Satuk 15 · orbita Ziemi' }];
    if (!p.claimed.includes('earth-relay')) return zones;
    return [
        ...zones,
        { x: 750, y: 650, radius: 1200, name: 'Przekaźnik orbitalny' },
        {
            ...MOON.entrance,
            radius: p.claimed.includes('lunar-survey') ? 1400 : 900,
            name: 'Orbita Księżyca',
        },
        SATELLITE_FIELD,
        ...(p.claimed.includes('lunar-survey') ? [ASTEROID_FIELD] : []),
    ];
}
