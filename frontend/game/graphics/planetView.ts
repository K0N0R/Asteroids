import { drawEarthTerrain, earthClouds } from './earthTerrain';
import { Container, Graphics } from 'pixi.js';
import type { StorySectorId } from '../state/story';
import { C } from './theme';
import { random } from '../worlds/sector';
import { drawLunarTerrain } from './lunarTerrain';
import { drawMarsTerrain } from './marsTerrain';
import { marsMoonView, type MarsMoonId } from './marsMoons';
import { drawVenusAtmosphere } from './venusAtmosphere';
import { drawMercuryTerrain } from './mercuryTerrain';
import { drawJupiterAtmosphere } from './jupiterAtmosphere';
import { drawSaturnAtmosphere, saturnRingHalf, SATURN_RING_TILT } from './saturnAppearance';
import { drawUranusAtmosphere, uranusRingHalf, URANUS_RING_TILT } from './uranusAppearance';
import { drawNeptuneAtmosphere } from './neptuneAtmosphere';
import { drawPlutoTerrain } from './plutoTerrain';
import { drawCeresTerrain } from './ceresTerrain';

export type PlanetAppearance = StorySectorId | MarsMoonId | 'ceres' | null;

const PLANETS = {
    earth: { radius: 144, body: 0x3b87cb, light: 0x75cde8 },
    lunar: { radius: 126, body: 0xa6aac6, light: 0xd9d8e7 },
    mars: { radius: 135, body: 0xdd8069, light: 0xffb086 },
    venus: { radius: 144, body: 0xd7ab72, light: 0xf5dfad },
    mercury: { radius: 118, body: 0x8c92a5, light: 0xd9c9a4 },
    jupiter: { radius: 160, body: 0xe7d4b4, light: 0xf2ddbc },
    saturn: { radius: 120, body: 0xdfc996, light: 0xf1dfb9 },
    uranus: { radius: 139, body: 0x76c9d5, light: 0xbce9eb },
    neptune: { radius: 139, body: 0x3263ba, light: 0x8daee8 },
    pluto: { radius: 104, body: 0xaaa6a8, light: 0xd5dcd5 },
    ceres: { radius: 96, body: 0x858b96, light: 0xc0c9cd },
} as const;

export class PlanetIllustration extends Container {
    cloudDrift: Container | null = null;
    cloudPeriod = 288;
    updateAppearance(seconds: number) {
        if (this.cloudDrift && Number.isFinite(seconds))
            this.cloudDrift.x =
                (((seconds * 0.8) % this.cloudPeriod) + this.cloudPeriod) % this.cloudPeriod;
    }
}

/** Flat, clipped atlas illustration: geography and bands never extend outside the globe. */
export function planetView(region: PlanetAppearance) {
    const root = new PlanetIllustration();
    root.eventMode = 'none';
    if (region === 'phobos' || region === 'deimos') {
        root.addChild(marsMoonView(region));
        root.cacheAsTexture({ resolution: 2, antialias: true });
        return root;
    }
    if (region === 'belt') {
        const g = new Graphics(),
            rng = random(150076);
        for (let i = 0; i < 44; i++) {
            const angle = rng() * Math.PI * 2,
                radius = 105 + rng() * 100;
            g.ellipse(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.42,
                4 + rng() * 10,
                3 + rng() * 7,
            ).fill([0xa3a1bf, 0xd5b2a1, 0x827baf][i % 3]);
        }
        root.addChild(g);
        return root;
    }
    const id = region ?? 'earth',
        p = PLANETS[id],
        r = p.radius;
    const rings =
        id === 'saturn'
            ? saturnRingHalf(r, false)
            : id === 'uranus'
              ? uranusRingHalf(r, false)
              : new Graphics();
    root.addChild(
        new Graphics()
            .circle(0, 0, r + 21)
            .fill({
                color: p.light,
                alpha: id === 'mercury' || id === 'pluto' || id === 'ceres' ? 0.025 : 0.07,
            })
            .circle(0, 0, r + 10)
            .fill({
                color: p.light,
                alpha: id === 'mercury' || id === 'pluto' || id === 'ceres' ? 0.055 : 0.13,
            }),
        rings,
    );
    const globe = new Container(),
        ink = new Graphics().circle(0, 0, r).fill(p.body);
    const mask = new Graphics().circle(0, 0, r).fill(0xffffff);
    globe.addChild(ink, mask);
    globe.mask = mask;
    if (id === 'earth') {
        drawEarthTerrain(ink, r);
    } else if (id === 'mars') {
        drawMarsTerrain(ink, r);
    } else if (id === 'venus') {
        drawVenusAtmosphere(ink, r);
    } else if (id === 'mercury') {
        drawMercuryTerrain(ink, r);
    } else if (id === 'jupiter') {
        drawJupiterAtmosphere(ink, r);
    } else if (id === 'saturn') {
        drawSaturnAtmosphere(ink, r);
        ink.rotation = SATURN_RING_TILT;
    } else if (id === 'uranus') {
        drawUranusAtmosphere(ink, r);
        ink.rotation = URANUS_RING_TILT;
    } else if (id === 'neptune') {
        drawNeptuneAtmosphere(ink, r);
    } else if (id === 'lunar') {
        drawLunarTerrain(ink, r);
    } else if (id === 'pluto') {
        drawPlutoTerrain(ink, r);
    } else if (id === 'ceres') {
        drawCeresTerrain(ink, r);
    }
    if (id === 'earth') {
        // Cache only the terrain; the separately clipped cloud layer must keep moving.
        const surface = new Container();
        globe.removeChild(ink);
        surface.addChild(ink);
        globe.addChildAt(surface, 0);
        surface.cacheAsTexture({ resolution: 2, antialias: true });
        root.cloudDrift = earthClouds(r);
        root.cloudPeriod = r * 2;
        globe.addChild(root.cloudDrift);
    }
    const shade = new Graphics().moveTo(0, -r).arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    shade.bezierCurveTo(r * 0.76, r * 0.43, r * 0.83, -r * 0.43, 0, -r);
    shade.closePath().fill({
        color: id === 'mars' ? 0x512c38 : id === 'venus' ? 0x65516a : 0x202b61,
        alpha: 0.24,
    });
    globe.addChild(shade);
    root.addChild(globe);
    if (id === 'venus')
        root.addChild(
            new Graphics()
                .circle(0, 0, r + 0.7)
                .stroke({ color: 0xb8e3e5, width: 1.5, alpha: 0.45 }),
        );
    if (id === 'saturn') root.addChild(saturnRingHalf(r, true));
    if (id === 'uranus') root.addChild(uranusRingHalf(r, true));
    // Composite the static illustration before fading it behind the flight HUD.
    // Fading individual overlapping fills otherwise exposes their triangulation edges.
    if (id !== 'earth') root.cacheAsTexture({ resolution: 2, antialias: true });
    return root;
}
