import { lunarTransferPose } from './lunarTransfer';
import { VENUS_PLANET_RADIUS } from './planetView';
import { VENUS_CELESTIAL_BODY } from '../worlds/celestialBodies';
import { VENUS_MAPS } from '../worlds/venusLayout';
import type { Point } from '../worlds/sector';

export interface VenusTransferPresentation {
    progress: number;
    descending: boolean;
    orbitalCamera: Point;
    atmospherePoint: Point;
}
/** The lunar camera curve, starting exactly at the existing parallax planet's projection. */
export function venusTransferPose(state: VenusTransferPresentation, zoom: number) {
    const spec = VENUS_CELESTIAL_BODY;
    const globeRadius = VENUS_PLANET_RADIUS * spec.scale * zoom;
    const globeZoom = globeRadius / VENUS_MAPS.atmosphere.radius;
    const center = VENUS_MAPS.atmosphere.center;
    const orbitalPivot = {
        x: center.x - ((spec.anchor.x - state.orbitalCamera.x) * spec.depth * zoom) / globeZoom,
        y: center.y - ((spec.anchor.y - state.orbitalCamera.y) * spec.depth * zoom) / globeZoom,
    };
    const pose = lunarTransferPose(state.progress, state.descending, zoom, {
        center,
        exit: state.atmospherePoint,
        radius: VENUS_MAPS.atmosphere.radius,
        globeRadius,
        orbitalPivot,
    });
    const t = Math.max(0, Math.min(1, state.progress));
    const ease = t * t * (3 - 2 * t),
        approach = state.descending ? ease : 1 - ease;
    const fog = Math.max(0, Math.min(1, (approach - 0.22) / 0.65));
    return {
        ...pose,
        planetScale: (spec.scale * zoom * pose.zoom) / globeZoom,
        atmosphere: fog * fog * (3 - 2 * fog),
    };
}
