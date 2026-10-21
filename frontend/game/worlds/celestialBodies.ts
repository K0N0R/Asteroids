import type { StorySectorId } from '../state/story';
import type { Point } from './sector';
import { MOON } from './moon';
import type { PlanetAppearance } from '../graphics/planetView';
import { MARS_MOONS } from './marsMoons';

export interface CelestialBodySpec {
    id: string;
    appearance: PlanetAppearance;
    anchor: Point;
    /** Fraction of foreground camera motion; distant bodies must stay below one. */
    depth: number;
    scale: number;
}
export const EARTH_SYSTEM_BODY_SCALE = { earth: 1.8, moon: 0.56 } as const;

const EARTH_SYSTEM_BODIES: readonly CelestialBodySpec[] = [
    {
        id: 'earth',
        appearance: 'earth',
        anchor: { x: 0, y: 850 },
        depth: 0.12,
        scale: EARTH_SYSTEM_BODY_SCALE.earth,
    },
    {
        id: 'moon',
        appearance: 'lunar',
        anchor: MOON.entrance,
        depth: 0.18,
        scale: EARTH_SYSTEM_BODY_SCALE.moon,
    },
];
/** Moon artwork is anchored to its actual approach, just as in the Earth–Moon sector. */
export const MARS_SYSTEM_PREVIEW_BODIES: readonly CelestialBodySpec[] = [
    { id: 'mars', appearance: 'mars', anchor: { x: 12000, y: 6000 }, depth: 0.035, scale: 0.95 },
    {
        id: 'phobos',
        appearance: 'phobos',
        anchor: MARS_MOONS.phobos.entrance,
        depth: 0.18,
        scale: 1.4,
    },
    {
        id: 'deimos',
        appearance: 'deimos',
        anchor: MARS_MOONS.deimos.entrance,
        depth: 0.18,
        scale: 1.2,
    },
];
export const SECTOR_CELESTIAL_BODIES: Partial<Record<StorySectorId, readonly CelestialBodySpec[]>> =
    {
        earth: EARTH_SYSTEM_BODIES,
        lunar: EARTH_SYSTEM_BODIES,
        mars: MARS_SYSTEM_PREVIEW_BODIES,
    };
/** Sector scenery is a list: adding another planet or moon needs no renderer branch. */
export function celestialBodiesFor(region: StorySectorId | null): readonly CelestialBodySpec[] {
    return (
        (region && SECTOR_CELESTIAL_BODIES[region]) || [
            {
                id: region ?? 'distant',
                appearance: region,
                anchor: { x: 12000, y: 6000 },
                depth: 0.035,
                scale: 0.95,
            },
        ]
    );
}
