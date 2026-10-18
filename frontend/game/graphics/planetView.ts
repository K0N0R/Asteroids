import { Container, Graphics } from 'pixi.js';
import type { StorySectorId } from '../state/story';
import { C } from './theme';
import { random } from '../worlds/sector';

const PLANETS = {
    earth: { radius: 144, body: 0x3b87cb, light: 0x75cde8 },
    lunar: { radius: 126, body: 0xa6aac6, light: 0xd9d8e7 },
    mars: { radius: 135, body: 0xdd8069, light: 0xffb086 },
    venus: { radius: 144, body: 0xe2ab66, light: 0xffd28d },
    mercury: { radius: 118, body: 0x9895ad, light: 0xddbd9c },
    jupiter: { radius: 160, body: 0xe0bc97, light: 0xffdfbb },
    saturn: { radius: 120, body: 0xd7b77c, light: 0xffdf9f },
    uranus: { radius: 139, body: 0x7bcdd1, light: 0xb9eae0 },
    neptune: { radius: 139, body: 0x537cdb, light: 0x8bb8f6 },
    pluto: { radius: 104, body: 0xb69ca0, light: 0xe6c5b2 },
} as const;

/** Flat, clipped atlas illustration: geography and bands never extend outside the globe. */
export function planetView(region: StorySectorId | null) {
    const root = new Container();
    root.eventMode = 'none';
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
    const rings = new Graphics();
    if (id === 'saturn' || id === 'uranus') {
        rings
            .ellipse(0, 12, r * 1.85, r * 0.39)
            .stroke({ color: id === 'saturn' ? 0x9d83ad : 0xa0c2e8, width: 30 });
        rings.ellipse(0, 12, r * 1.92, r * 0.42).stroke({ color: p.light, width: 7 });
        if (id === 'uranus') rings.rotation = -1.1;
    }
    root.addChild(
        new Graphics()
            .circle(0, 0, r + 21)
            .fill({ color: p.light, alpha: 0.07 })
            .circle(0, 0, r + 10)
            .fill({ color: p.light, alpha: 0.13 }),
        rings,
    );
    const globe = new Container(),
        ink = new Graphics().circle(0, 0, r).fill(p.body);
    const mask = new Graphics().circle(0, 0, r).fill(0xffffff);
    globe.addChild(ink, mask);
    globe.mask = mask;
    const band = (y: number, height: number, color: number, x = -r * 1.1, width = r * 2.2) =>
        ink.roundRect(x, y, width, height, height / 2).fill(color);
    if (id === 'earth') {
        const land = (points: number[], color: number) =>
            ink
                .roundShape(
                    Array.from({ length: points.length / 2 }, (_, i) => ({
                        x: points[i * 2],
                        y: points[i * 2 + 1],
                    })),
                    20,
                    true,
                    0.85,
                )
                .fill(color);
        land(
            [
                -111, -60, -86, -91, -45, -98, -25, -75, -42, -53, -29, -25, -57, -10, -87, -27,
                -107, -16,
            ],
            0x64c68d,
        );
        land([-62, 5, -27, 17, -20, 53, -40, 101, -57, 75, -68, 33], 0x79d099);
        land(
            [9, -81, 44, -100, 85, -79, 111, -42, 81, -25, 60, -43, 32, -18, 8, -32, -7, -55],
            0x79d099,
        );
        land([8, -14, 45, -14, 55, 25, 33, 66, 11, 44, -1, 9], 0x64c68d);
        land([79, 53, 109, 46, 123, 68, 105, 87, 82, 80], 0x85d0a0);
        for (const [x, y, w] of [
            [-125, -54, 79],
            [-51, -8, 54],
            [42, 5, 83],
            [-103, 60, 60],
            [22, -103, 73],
            [55, 94, 72],
        ])
            band(y, 12, 0xe4f4e7, x, w);
        band(-143, 18, 0xdcf5ee, -45, 96);
    } else if (id === 'jupiter' || id === 'saturn') {
        for (let i = -6; i <= 6; i++)
            band(
                i * 23,
                10 + ((i + 6) % 3) * 5,
                [0xa47e8a, 0xf4d8b4, 0xc3937d, 0xe8c79e][(i + 6) % 4],
            );
        if (id === 'jupiter')
            ink.ellipse(49, 43, 39, 20).fill(0xbd6e69).ellipse(45, 40, 26, 11).fill(0xe69779);
    } else if (id === 'venus' || id === 'uranus' || id === 'neptune') {
        for (const [i, y] of [-88, -43, 3, 48, 95].entries()) {
            band(y, 14 + (i % 2) * 10, p.light, -r + i * 17, r * 1.8);
            band(
                y + 24,
                8,
                id === 'venus' ? 0xc38d69 : id === 'uranus' ? 0x5faab9 : 0x4164ad,
                -r - 12,
                r * 1.6,
            );
        }
        if (id === 'neptune') ink.ellipse(-45, 32, 27, 13).fill(0x344da1);
    } else {
        const rng = random(id === 'mars' ? 277 : 731);
        for (let i = 0; i < 12; i++) {
            const x = (rng() - 0.5) * r * 1.8,
                y = (rng() - 0.5) * r * 1.8,
                size = 8 + rng() * 25;
            ink.ellipse(x + 2, y + 4, size, size * 0.8)
                .fill(p.light)
                .ellipse(x, y, size, size * 0.8)
                .fill(id === 'mars' ? 0xb96262 : id === 'mercury' ? 0x73738e : 0x8588aa);
        }
        if (id === 'mars') {
            ink.roundRect(-105, -15, 120, 16, 8).fill(0xb35a60);
            ink.ellipse(0, -r + 6, 40, 14).fill(0xf0ddd0);
        }
        if (id === 'pluto') ink.ellipse(18, 10, 25, 34).ellipse(49, 5, 28, 31).fill(0xf2d6c0);
    }
    const shade = new Graphics()
        .moveTo(0, -r)
        .arc(0, 0, r, -Math.PI / 2, Math.PI / 2)
        .lineTo(0, -r)
        .closePath()
        .fill({ color: 0x202b61, alpha: 0.24 });
    globe.addChild(shade);
    root.addChild(globe);
    if (id === 'saturn')
        root.addChild(
            new Graphics()
                .moveTo(-r * 1.85, 12)
                .bezierCurveTo(-r * 1.65, r * 0.68, r * 1.65, r * 0.68, r * 1.85, 12)
                .stroke({ color: 0xe6c9b8, width: 22 }),
        );
    if (id === 'uranus') {
        const frontRings = new Graphics();
        const frontArc = (rx: number, ry: number, color: number, width: number) => {
            frontRings.moveTo(rx, 12);
            for (let i = 1; i <= 64; i++) {
                const angle = (i / 64) * Math.PI;
                frontRings.lineTo(Math.cos(angle) * rx, 12 + Math.sin(angle) * ry);
            }
            frontRings.stroke({ color, width });
        };
        // Same ellipse and tilt as the rear rings; only the near half overlays the globe.
        frontArc(r * 1.85, r * 0.39, 0xa0c2e8, 30);
        frontArc(r * 1.92, r * 0.42, p.light, 7);
        frontRings.rotation = rings.rotation;
        root.addChild(frontRings);
    }
    // Composite the static illustration before fading it behind the flight HUD.
    // Fading individual overlapping fills otherwise exposes their triangulation edges.
    root.cacheAsTexture({ resolution: 2, antialias: true });
    return root;
}
