import { Graphics } from 'pixi.js';
import { random } from '../worlds/sector';

/** Schematic near-side maria: west at left, lunar north at top. */
export const LUNAR_MARIA = [
    {
        name: 'Oceanus Procellarum',
        points: [
            -0.78, -0.41, -0.53, -0.54, -0.34, -0.38, -0.35, -0.11, -0.42, 0.05, -0.32, 0.24, -0.45,
            0.35, -0.68, 0.22, -0.76, -0.04, -0.83, -0.18,
        ],
    },
    {
        name: 'Mare Imbrium',
        points: [
            -0.53, -0.57, -0.34, -0.7, -0.12, -0.6, 0.04, -0.42, -0.04, -0.22, -0.22, -0.16, -0.47,
            -0.22, -0.6, -0.38,
        ],
    },
    {
        name: 'Mare Frigoris',
        points: [
            -0.51, -0.73, -0.21, -0.78, 0.12, -0.75, 0.4, -0.64, 0.3, -0.59, 0.04, -0.65, -0.27,
            -0.63,
        ],
    },
    {
        name: 'Mare Serenitatis',
        points: [0.07, -0.51, 0.29, -0.53, 0.44, -0.36, 0.36, -0.17, 0.17, -0.12, 0.03, -0.28],
    },
    {
        name: 'Mare Tranquillitatis',
        points: [
            0.22, -0.15, 0.39, -0.24, 0.59, -0.13, 0.61, 0.06, 0.43, 0.18, 0.25, 0.1, 0.16, -0.03,
        ],
    },
    {
        name: 'Mare Crisium',
        points: [0.62, -0.37, 0.77, -0.36, 0.84, -0.22, 0.78, -0.09, 0.62, -0.1, 0.56, -0.23],
    },
    {
        name: 'Mare Fecunditatis',
        points: [0.53, 0.1, 0.72, 0.12, 0.78, 0.3, 0.63, 0.42, 0.51, 0.3, 0.44, 0.21],
    },
    { name: 'Mare Nectaris', points: [0.27, 0.18, 0.43, 0.17, 0.49, 0.3, 0.4, 0.38, 0.26, 0.32] },
    {
        name: 'Mare Nubium',
        points: [-0.39, 0.14, -0.16, 0.15, 0.02, 0.32, -0.1, 0.49, -0.32, 0.47, -0.43, 0.3],
    },
    {
        name: 'Mare Humorum',
        points: [-0.62, 0.25, -0.46, 0.22, -0.35, 0.36, -0.43, 0.49, -0.6, 0.47, -0.69, 0.36],
    },
] as const;
export const LUNAR_CRATERS = [
    { name: 'Tycho', x: -0.12, y: 0.68, r: 0.047, rays: 0.31 },
    { name: 'Copernicus', x: -0.32, y: 0.06, r: 0.066, rays: 0.19 },
    { name: 'Kepler', x: -0.59, y: 0.12, r: 0.035, rays: 0.1 },
    { name: 'Aristarchus', x: -0.63, y: -0.25, r: 0.034, rays: 0.07 },
    { name: 'Plato', x: -0.24, y: -0.64, r: 0.051, rays: 0 },
    { name: 'Clavius', x: -0.12, y: 0.83, r: 0.078, rays: 0 },
    { name: 'Aristoteles', x: 0.2, y: -0.65, r: 0.038, rays: 0 },
    { name: 'Posidonius', x: 0.32, y: -0.48, r: 0.039, rays: 0 },
    { name: 'Langrenus', x: 0.72, y: 0.17, r: 0.043, rays: 0 },
    { name: 'Petavius', x: 0.7, y: 0.37, r: 0.058, rays: 0 },
] as const;
export function drawLunarTerrain(view: Graphics, radius: number) {
    view.circle(0, 0, radius).fill(0xa2abbc);
    view.ellipse(-radius * 0.12, radius * 0.3, radius * 0.72, radius * 0.61).fill(0xafb6c5);
    for (const sea of LUNAR_MARIA) {
        const points = Array.from({ length: sea.points.length / 2 }, (_, i) => ({
            x: sea.points[i * 2] * radius,
            y: sea.points[i * 2 + 1] * radius,
        }));
        view.roundShape(points, radius * 0.055, true, 0.65).fill(0x6f7b93);
    }
    const rng = random(731);
    for (let i = 0; i < 26; i++) {
        const x = (rng() - 0.5) * 1.8,
            y = (rng() - 0.5) * 1.8;
        if (x * x + y * y > 0.86) continue;
        const r = radius * (0.008 + rng() * 0.016);
        view.circle(x * radius, y * radius, r * 1.35).fill({ color: 0xe0e1e6, alpha: 0.42 });
        view.circle(x * radius + r * 0.2, y * radius + r * 0.2, r).fill({
            color: 0x8d98ae,
            alpha: 0.55,
        });
    }
    for (const crater of LUNAR_CRATERS) {
        const x = crater.x * radius,
            y = crater.y * radius,
            r = crater.r * radius;
        if (crater.rays)
            for (let i = 0; i < 10; i++) {
                const angle = i * Math.PI * 0.2 + 0.19,
                    length = radius * crater.rays * (0.62 + rng() * 0.38);
                view.moveTo(x + Math.cos(angle) * r * 1.5, y + Math.sin(angle) * r * 1.5)
                    .lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
                    .stroke({
                        color: 0xe0e4e9,
                        alpha: crater.name === 'Tycho' ? 0.45 : 0.31,
                        width: radius * 0.007,
                        cap: 'round',
                    });
            }
        view.circle(x, y, r * 1.28).fill(0xa0aabe);
        view.circle(x - radius * 0.004, y - radius * 0.006, r * 1.12).fill(0xb7c1d2);
        view.circle(x + radius * 0.004, y + radius * 0.004, r * 0.85).fill(
            crater.name === 'Plato' ? 0x737e98 : 0x8c98af,
        );
        view.circle(x + radius * 0.008, y + radius * 0.009, r * 0.62).fill(
            crater.name === 'Plato' ? 0x6f7b93 : 0x9eabbe,
        );
        if (crater.rays) view.circle(x, y, r * 0.23).fill(0xcbd4df);
    }
}
