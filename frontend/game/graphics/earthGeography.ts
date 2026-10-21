/** Simplified coastlines in longitude/latitude, projected from an Atlantic-facing globe. */
export const EARTH_COASTLINES = [
    {
        name: 'North America',
        points: [
            [-168, 66],
            [-150, 70],
            [-133, 69],
            [-125, 72],
            [-106, 74],
            [-96, 69],
            [-84, 72],
            [-65, 60],
            [-57, 53],
            [-65, 47],
            [-73, 45],
            [-80, 32],
            [-81, 25],
            [-85, 30],
            [-96, 28],
            [-97, 22],
            [-89, 20],
            [-87, 16],
            [-83, 15],
            [-78, 9],
            [-84, 9],
            [-92, 15],
            [-105, 21],
            [-114, 29],
            [-118, 34],
            [-125, 49],
            [-136, 58],
            [-153, 59],
            [-166, 60],
        ],
    },
    {
        name: 'South America',
        points: [
            [-81, 12],
            [-71, 12],
            [-61, 9],
            [-52, 4],
            [-50, -1],
            [-35, -6],
            [-38, -15],
            [-42, -23],
            [-49, -29],
            [-54, -35],
            [-62, -41],
            [-67, -55],
            [-72, -51],
            [-75, -41],
            [-73, -30],
            [-70, -18],
            [-78, -7],
            [-81, -1],
            [-77, 5],
        ],
    },
    {
        name: 'Greenland',
        points: [
            [-52, 60],
            [-44, 61],
            [-25, 70],
            [-18, 78],
            [-32, 83],
            [-49, 83],
            [-62, 78],
            [-69, 72],
            [-58, 66],
        ],
    },
    {
        name: 'Africa',
        points: [
            [-17, 15],
            [-17, 22],
            [-10, 31],
            [-5, 36],
            [8, 37],
            [11, 34],
            [20, 32],
            [25, 32],
            [33, 30],
            [35, 23],
            [43, 12],
            [51, 12],
            [43, 1],
            [40, -11],
            [35, -19],
            [32, -28],
            [20, -35],
            [17, -29],
            [12, -17],
            [13, -5],
            [9, 4],
            [1, 5],
            [-5, 5],
            [-10, 7],
        ],
    },
    {
        name: 'Eurasia',
        points: [
            [-10, 36],
            [-9, 43],
            [-2, 44],
            [-1, 48],
            [6, 50],
            [8, 54],
            [5, 58],
            [11, 64],
            [18, 71],
            [29, 71],
            [32, 62],
            [40, 66],
            [60, 70],
            [90, 75],
            [120, 73],
            [145, 65],
            [176, 66],
            [180, 55],
            [158, 51],
            [142, 45],
            [131, 43],
            [128, 36],
            [121, 30],
            [122, 23],
            [115, 21],
            [110, 17],
            [108, 11],
            [104, 2],
            [100, 5],
            [98, 18],
            [91, 22],
            [88, 22],
            [80, 8],
            [75, 17],
            [69, 24],
            [61, 25],
            [57, 17],
            [51, 13],
            [43, 13],
            [35, 29],
            [30, 31],
            [35, 36],
            [27, 40],
            [24, 38],
            [24, 35],
            [21, 37],
            [19, 42],
            [14, 45],
            [17, 41],
            [16, 39],
            [12, 42],
            [9, 44],
            [6, 43],
            [3, 42],
            [-1, 37],
        ],
    },
    {
        name: 'Britain',
        points: [
            [-6, 50],
            [0, 51],
            [1, 53],
            [-2, 55],
            [-3, 59],
            [-6, 58],
            [-5, 55],
        ],
    },
    {
        name: 'Ireland',
        points: [
            [-10, 51],
            [-6, 52],
            [-6, 55],
            [-9, 55],
        ],
    },
    {
        name: 'Iceland',
        points: [
            [-24, 64],
            [-18, 63],
            [-13, 66],
            [-21, 67],
        ],
    },
    {
        name: 'Madagascar',
        points: [
            [48, -13],
            [50, -16],
            [47, -25],
            [44, -25],
            [44, -20],
        ],
    },
    {
        name: 'Australia',
        points: [
            [113, -22],
            [115, -34],
            [130, -32],
            [138, -39],
            [149, -38],
            [153, -28],
            [145, -15],
            [136, -12],
            [130, -13],
            [122, -18],
        ],
    },
    {
        name: 'Antarctica',
        points: [
            [-180, -74],
            [-140, -73],
            [-100, -73],
            [-65, -64],
            [-60, -73],
            [-20, -75],
            [20, -70],
            [65, -66],
            [110, -66],
            [150, -70],
            [180, -74],
            [180, -90],
            [-180, -90],
        ],
    },
] as const;
const rad = Math.PI / 180;
export function earthPoint(longitude: number, latitude: number) {
    const lon = (longitude + 25) * rad,
        lat = latitude * rad,
        tilt = 12 * rad;
    return {
        x: Math.cos(lat) * Math.sin(lon),
        y: Math.sin(tilt) * Math.cos(lat) * Math.cos(lon) - Math.cos(tilt) * Math.sin(lat),
        z: Math.cos(tilt) * Math.cos(lat) * Math.cos(lon) + Math.sin(tilt) * Math.sin(lat),
    };
}
/** Clip hidden coasts to the horizon instead of drawing the far side through the globe. */
export function projectCoastline(points: readonly (readonly [number, number])[], radius: number) {
    const sampled: ReturnType<typeof earthPoint>[] = [];
    points.forEach((point, i) => {
        const next = points[(i + 1) % points.length],
            steps = Math.max(
                1,
                Math.ceil(Math.max(Math.abs(next[0] - point[0]), Math.abs(next[1] - point[1])) / 3),
            );
        for (let j = 0; j < steps; j++)
            sampled.push(
                earthPoint(
                    point[0] + ((next[0] - point[0]) * j) / steps,
                    point[1] + ((next[1] - point[1]) * j) / steps,
                ),
            );
    });
    const clipped: ReturnType<typeof earthPoint>[] = [];
    sampled.forEach((b, i) => {
        const a = sampled[(i + sampled.length - 1) % sampled.length];
        if (a.z >= 0 !== b.z >= 0) {
            const t = a.z / (a.z - b.z),
                x = a.x + (b.x - a.x) * t,
                y = a.y + (b.y - a.y) * t,
                n = Math.hypot(x, y);
            clipped.push({ x: x / n, y: y / n, z: 0 });
        }
        if (b.z >= 0) clipped.push(b);
    });
    const output: number[] = [];
    clipped.forEach((p, i) => {
        output.push(p.x * radius, p.y * radius);
        const next = clipped[(i + 1) % clipped.length];
        if (p.z === 0 && next.z === 0) {
            const start = Math.atan2(p.y, p.x),
                end = Math.atan2(next.y, next.x),
                delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
            const steps = Math.ceil(Math.abs(delta) / 0.04);
            for (let j = 1; j < steps; j++) {
                const a = start + (delta * j) / steps;
                output.push(Math.cos(a) * radius, Math.sin(a) * radius);
            }
        }
    });
    return output;
}
