import type { Point } from './sector';

export const PHOBOS_MAZE_GATE = { x: 5200, y: -2800 };
export const PHOBOS_MAZE_ENTRY = { x: 1900, y: 1400 };
/** Reference centreline for clearance tests; it is not an autopilot or a drawn solution. */
export const PHOBOS_MAZE_ROUTE: readonly Point[] = [
    PHOBOS_MAZE_ENTRY,
    ...Array.from({ length: 7 }, (_, row) => [
        { x: row % 2 ? 5200 : 2600, y: 1400 - row * 700 },
        { x: row % 2 ? 2600 : 5200, y: 1400 - row * 700 },
    ]).flat(),
];
const rect = (x: number, y: number, w: number, h: number): readonly Point[] => [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
];
/** One opening, six alternating baffles and a sealed final gate pocket: no route around the outside. */
export const PHOBOS_MAZE_BANDS: readonly (readonly Point[])[] = [
    rect(2100, -3300, 3600, 250),
    rect(2100, 1650, 3600, 250),
    rect(5450, -3300, 250, 5200),
    rect(2100, -3300, 250, 4450),
    rect(2100, 1650, 250, 250),
    ...Array.from({ length: 6 }, (_, row) =>
        rect(row % 2 ? 2950 : 2100, 950 - row * 700, 2750, 200),
    ),
];
