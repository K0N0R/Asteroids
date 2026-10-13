import { DRONES, GAME, SCAN_SITES, ScanSiteId } from '../config';

export interface Point {
    x: number;
    y: number;
}
export interface RockSpec extends Point {
    radius: number;
    rich: boolean;
    variant: number;
    vx: number;
    vy: number;
}
export interface Landmark extends Point {
    name: string;
    key: number;
    kind: 'field' | 'belt' | 'wreck' | 'relay' | 'archive';
    siteId?: ScanSiteId;
    radius: number;
}
export interface EnemySpec extends Point {
    id: number;
    home: Point;
    phase: number;
}
export function random(seed: number) {
    let state = seed >>> 0;
    return () => {
        state += 0x6d2b79f5;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function generateSector(seed: number) {
    const rng = random(seed);
    const turn = rng() * Math.PI * 2;
    const sitesRng = random(seed ^ 0x4d2a91);
    const place = (angle: number, distance: number): Point => ({
        x: Math.cos(angle + turn) * distance,
        y: Math.sin(angle + turn) * distance,
    });
    const landmarks: Landmark[] = [
        { ...place(0, 1150), name: 'Pole K-07', key: 2, kind: 'field', radius: 650 },
        { ...place(2.1, 2550), name: 'Pas Helios', key: 3, kind: 'belt', radius: 1000 },
        { ...place(4.1, 3150), name: 'Wrak Echa', key: 4, kind: 'wreck', radius: 400 },
        { ...place(0.65, 4050), name: 'Żyła bursztynowa', key: 5, kind: 'field', radius: 720 },
        {
            ...place(-1.15 + (sitesRng() - 0.5) * 0.4, 1500 + sitesRng() * 600),
            name: SCAN_SITES.relay.name,
            key: SCAN_SITES.relay.key,
            kind: 'relay',
            siteId: 'relay',
            radius: 180,
        },
        {
            ...place(3.05 + (sitesRng() - 0.5) * 0.4, 3400 + sitesRng() * 700),
            name: SCAN_SITES.archive.name,
            key: SCAN_SITES.archive.key,
            kind: 'archive',
            siteId: 'archive',
            radius: 180,
        },
    ];
    const rocks: RockSpec[] = [];
    const add = (x: number, y: number, rich: boolean, moving: boolean) => {
        const radius = 24 + rng() * 52;
        if (Math.hypot(x, y) < 450 || Math.hypot(x, y) > GAME.sectorRadius - 100) return;
        if (rocks.some((r) => Math.hypot(r.x - x, r.y - y) < r.radius + radius + 12)) return;
        if (
            landmarks.some(
                (l) =>
                    (l.kind === 'wreck' || l.siteId) &&
                    Math.hypot(x - l.x, y - l.y) < (l.siteId ? 220 + radius : 170),
            )
        )
            return;
        rocks.push({
            x,
            y,
            radius,
            rich,
            variant: Math.floor(rng() * 8),
            vx: moving ? (rng() - 0.5) * 85 : (rng() - 0.5) * 8,
            vy: moving ? (rng() - 0.5) * 85 : (rng() - 0.5) * 8,
        });
    };
    for (const [i, field] of landmarks.entries()) {
        if (field.kind !== 'field' && field.kind !== 'belt') continue;
        for (let k = 0; k < (field.kind === 'belt' ? 80 : 55); k++) {
            const a = rng() * Math.PI * 2,
                d = Math.sqrt(rng()) * field.radius;
            add(
                field.x + Math.cos(a) * d,
                field.y + Math.sin(a) * d,
                i === 3 || rng() < 0.16,
                field.kind === 'belt',
            );
        }
    }
    // A visible starter deposit gives players something to mine immediately after launch.
    add(580, -60, false, false);
    add(750, 140, true, false);
    add(680, -260, false, false);
    for (let i = 0; i < 90; i++) {
        const a = rng() * Math.PI * 2,
            d = 550 + rng() * (GAME.sectorRadius - 750);
        add(Math.cos(a) * d, Math.sin(a) * d, rng() < 0.13, false);
    }
    const enemyRng = random(seed ^ 0x7ad191),
        enemies: EnemySpec[] = [];
    for (const [index, count] of [
        [2, 1],
        [3, 2],
        [5, 2],
    ]) {
        const home = landmarks[index];
        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < 100; attempt++) {
                const angle = enemyRng() * Math.PI * 2,
                    radius = 100 + enemyRng() * 420;
                const point = {
                    x: home.x + Math.cos(angle) * radius,
                    y: home.y + Math.sin(angle) * radius,
                };
                if (
                    Math.hypot(point.x, point.y) < DRONES.safeRadius + DRONES.detectRange ||
                    Math.hypot(point.x, point.y) > GAME.sectorRadius - 200 ||
                    rocks.some(
                        (r) =>
                            Math.hypot(r.x - point.x, r.y - point.y) <
                            r.radius + DRONES.radius + 30,
                    ) ||
                    enemies.some(
                        (e) => Math.hypot(e.x - point.x, e.y - point.y) < DRONES.radius * 2 + 40,
                    )
                )
                    continue;
                enemies.push({
                    ...point,
                    id: enemies.length + 1,
                    home: { x: home.x, y: home.y },
                    phase: angle,
                });
                break;
            }
        }
    }
    return { seed, landmarks, rocks, enemies };
}

export function navigationWaypoint(
    landmarks: readonly Landmark[],
    key: number,
    signal: (Point & { id: number }) | null = null,
) {
    if (key === 6)
        return signal
            ? { ...signal, name: `Sygnał #${signal.id}` }
            : { x: 0, y: 0, name: 'Aurora / brak sygnału' };
    return landmarks.find((site) => site.key === key) ?? { x: 0, y: 0, name: 'Aurora' };
}
