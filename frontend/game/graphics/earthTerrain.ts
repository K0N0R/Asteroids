import { Container, Graphics } from 'pixi.js';
import { EARTH_COASTLINES, projectCoastline } from './earthGeography';

/** Round geographic corners before projection so dense horizon samples do not retain kinks. */
function roundedCoast(points: readonly (readonly [number, number])[]) {
    let ring = points.map(([x, y]) => [x, y] as [number, number]);
    for (let pass = 0; pass < 3; pass++) {
        const next: [number, number][] = [];
        ring.forEach((a, i) => {
            const b = ring[(i + 1) % ring.length];
            next.push(
                [a[0] * 0.8 + b[0] * 0.2, a[1] * 0.8 + b[1] * 0.2],
                [a[0] * 0.2 + b[0] * 0.8, a[1] * 0.2 + b[1] * 0.8],
            );
        });
        ring = next;
    }
    return ring;
}

export function drawEarthTerrain(ink: Graphics, r: number) {
    ink.circle(0, 0, r).fill(0x397eb9);
    ink.ellipse(-r * 0.19, -r * 0.06, r * 0.88, r * 0.9).fill(0x428fcb);
    for (const coast of EARTH_COASTLINES) {
        const points = projectCoastline(roundedCoast(coast.points), r);
        if (points.length < 6) continue;
        ink.poly(points).fill(
            coast.name === 'Greenland' || coast.name === 'Antarctica'
                ? 0xd9ece8
                : coast.name === 'Africa'
                  ? 0x79b88b
                  : 0x65b88c,
        );
    }
    // Broad climate regions, clipped to the actual African coastline by staying inland.
    const sahara = projectCoastline(
        roundedCoast([
            [-12, 25],
            [-4, 31],
            [12, 31],
            [28, 28],
            [31, 20],
            [20, 16],
            [2, 17],
            [-10, 19],
        ]),
        r,
    );
    ink.poly(sahara).fill(0xc9c593);
    const forest = projectCoastline(
        roundedCoast([
            [-72, -1],
            [-62, 1],
            [-51, -4],
            [-51, -12],
            [-64, -15],
            [-73, -8],
        ]),
        r,
    );
    ink.poly(forest).fill(0x4a9e7b);
}
export function earthClouds(r: number) {
    const drift = new Container();
    drift.label = 'earth-cloud-drift';
    drift.eventMode = 'none';
    const paths = [
        [-0.86, -0.52, 0.45, 0.04],
        [-0.27, -0.73, 0.4, -0.04],
        [0.31, -0.5, 0.54, 0.06],
        [-0.54, 0.04, 0.45, -0.04],
        [0.13, 0.13, 0.51, -0.06],
        [-0.87, 0.44, 0.49, 0.08],
        [0.29, 0.57, 0.51, -0.04],
        [-0.17, 0.77, 0.39, 0.03],
    ];
    for (const offset of [-2 * r, 0, 2 * r]) {
        const g = drift.addChild(new Graphics());
        for (const [x, y, w, bend] of paths) {
            const px = x * r + offset,
                py = y * r,
                width = w * r;
            g.moveTo(px, py)
                .bezierCurveTo(
                    px + width * 0.12,
                    py - r * 0.035,
                    px + width * 0.26,
                    py - r * 0.04,
                    px + width * 0.43,
                    py - r * 0.008,
                )
                .bezierCurveTo(
                    px + width * 0.63,
                    py + bend * r + r * 0.018,
                    px + width * 0.8,
                    py + bend * r + r * 0.022,
                    px + width,
                    py + bend * r,
                )
                .bezierCurveTo(
                    px + width * 0.82,
                    py + bend * r + r * 0.047,
                    px + width * 0.65,
                    py + bend * r + r * 0.044,
                    px + width * 0.42,
                    py + r * 0.018,
                )
                .bezierCurveTo(
                    px + width * 0.23,
                    py - r * 0.008,
                    px + width * 0.12,
                    py + r * 0.014,
                    px,
                    py,
                )
                .closePath()
                .fill({ color: 0xf5f8f0, alpha: 0.84 });
        }
    }
    return drift;
}
