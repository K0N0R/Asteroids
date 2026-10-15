import { DRONES, EnemyKind, GAME, OUTPOST, SCAN_SITES, ScanSiteId } from '../config';

export interface Point {
    x: number;
    y: number;
}
export interface RockSpec extends Point {
    defense?: boolean;
    radius: number;
    rich: boolean;
    crystal?: boolean;
    orbit?: Point & { radius: number; speed: number };
    variant: number;
    vx: number;
    vy: number;
}
export interface Landmark extends Point {
    area?: 'surface';
    name: string;
    key: number;
    kind:
        | 'field'
        | 'belt'
        | 'wreck'
        | 'relay'
        | 'archive'
        | 'cluster'
        | 'fortress'
        | 'passage'
        | 'construction';
    siteId?: ScanSiteId;
    radius: number;
}
export interface EnemySpec extends Point {
    assault?: boolean;
    storyPatrol?: boolean;
    kind?: EnemyKind;
    id: number;
    home: Point;
    phase: number;
    route?: Point[];
}
export interface CacheSpec extends Point {
    id: number;
    name: string;
}
export interface OutpostSpec extends Point {
    name: string;
    phase: number;
    terminal: Point;
    guards: EnemySpec[];
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
    const innerRadius = 5400; // Preserve the original generation and saved salvage locations.
    const rocks: RockSpec[] = [];
    const add = (x: number, y: number, rich: boolean, moving: boolean) => {
        const radius = 24 + rng() * 52;
        if (Math.hypot(x, y) < 450 || Math.hypot(x, y) > innerRadius - 100) return;
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
            variant: Math.floor(rng() * 128),
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
            d = 550 + rng() * (innerRadius - 750);
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
                    kind: index === 5 && i === 1 ? 'lancer' : 'patrol',
                    home: { x: home.x, y: home.y },
                    phase: angle,
                });
                break;
            }
        }
    }
    const cacheRng = random(seed ^ 0x3c61a9),
        caches: CacheSpec[] = [];
    for (let id = 1; id <= 2; id++) {
        for (let attempt = 0; attempt < 1000; attempt++) {
            const angle = cacheRng() * Math.PI * 2;
            const distance = id === 1 ? 1100 + cacheRng() * 400 : 3200 + cacheRng() * 700;
            const point = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
            if (
                rocks.some(
                    (rock) => Math.hypot(point.x - rock.x, point.y - rock.y) < rock.radius + 220,
                ) ||
                landmarks.some(
                    (site) =>
                        (site.siteId || site.kind === 'wreck') &&
                        Math.hypot(point.x - site.x, point.y - site.y) < 450,
                ) ||
                enemies.some(
                    (enemy) => Math.hypot(point.x - enemy.home.x, point.y - enemy.home.y) < 1100,
                ) ||
                caches.some((cache) => Math.hypot(point.x - cache.x, point.y - cache.y) < 700)
            )
                continue;
            caches.push({ ...point, id, name: `Skrytka ${id === 1 ? 'Kurier' : 'Nomada'}` });
            break;
        }
    }
    // Separate stream preserves existing sectors, salvage locations, patrols and caches.
    const outpostRng = random(seed ^ 0x1cb371);
    let location: Point | null = null;
    let bestClearance = -Infinity;
    for (let attempt = 0; attempt < 4000; attempt++) {
        const angle = outpostRng() * Math.PI * 2,
            distance = 2800 + outpostRng() * 1700;
        const point = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
        const clearance = Math.min(
            ...rocks.map((r) => Math.hypot(point.x - r.x, point.y - r.y) - r.radius - 440),
            ...landmarks.map((l) => Math.hypot(point.x - l.x, point.y - l.y) - 800),
            ...caches.map((c) => Math.hypot(point.x - c.x, point.y - c.y) - 700),
            ...enemies.map((e) => Math.hypot(point.x - e.home.x, point.y - e.home.y) - 1200),
        );
        if (clearance > bestClearance) {
            location = point;
            bestClearance = clearance;
        }
        if (clearance >= 0) break;
    }
    const phase = outpostRng() * Math.PI * 2,
        center = location!;
    const outpost: OutpostSpec = {
        ...center,
        name: 'Placówka Cerber',
        phase,
        terminal: {
            x: center.x - Math.cos(phase) * OUTPOST.terminalDistance,
            y: center.y - Math.sin(phase) * OUTPOST.terminalDistance,
        },
        guards: [-1, 1].map((side, index) => ({
            id: 101 + index,
            x: center.x + Math.cos(phase + side * 1.4) * 330,
            y: center.y + Math.sin(phase + side * 1.4) * 330,
            home: { ...center },
            phase: phase + side * 1.4,
        })),
    };
    const crystalRng = random(seed ^ 0x3a712f);
    const crystalRocks = rocks.filter((rock) => rock.rich && Math.hypot(rock.x, rock.y) > 2000);
    // Independent sampling preserves existing locations and salvage seeds.
    for (let i = 0; i < Math.min(5, crystalRocks.length); i++) {
        const pick = i + Math.floor(crystalRng() * (crystalRocks.length - i));
        [crystalRocks[i], crystalRocks[pick]] = [crystalRocks[pick], crystalRocks[i]];
        crystalRocks[i].crystal = true;
    }
    // New content uses its own stream, preserving the original inner sector and salvage seeds.
    const outerRng = random(seed ^ 0x62de91);
    const cluster: Landmark = {
        ...place(1.25, 6400),
        name: 'Gniazdo kryształów',
        key: 12,
        kind: 'cluster',
        radius: 700,
    };
    landmarks.push(cluster);
    const outerRock = (
        point: Point,
        radius: number,
        crystal = false,
        speed = 0,
        center = cluster,
    ) => {
        if (rocks.some((r) => Math.hypot(r.x - point.x, r.y - point.y) < r.radius + radius + 12))
            return;
        const dx = point.x - center.x,
            dy = point.y - center.y,
            distance = Math.hypot(dx, dy);
        rocks.push({
            ...point,
            radius,
            rich: crystal,
            crystal,
            variant: Math.floor(outerRng() * 128),
            vx: distance ? (-dy / distance) * speed : 0,
            vy: distance ? (dx / distance) * speed : 0,
            ...(speed ? { orbit: { ...center, radius: distance, speed } } : {}),
        });
    };
    for (const [radius, count] of [
        [320, 15],
        [450, 21],
        [580, 27],
    ]) {
        const phase = outerRng() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
            const angle = phase + (i / count) * Math.PI * 2;
            outerRock(
                {
                    x: cluster.x + Math.cos(angle) * radius,
                    y: cluster.y + Math.sin(angle) * radius,
                },
                55 + outerRng() * 4,
            );
        }
    }
    outerRock(cluster, 42, true);
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        outerRock({ x: cluster.x + Math.cos(a) * 145, y: cluster.y + Math.sin(a) * 145 }, 40, true);
    }
    const drift: Landmark = {
        ...place(3.7, 6400),
        name: 'Prąd Perseid',
        key: 13,
        kind: 'belt',
        radius: 900,
    };
    landmarks.push(drift);
    for (let i = 0; i < 65; i++) {
        const a = outerRng() * Math.PI * 2,
            d = 300 + outerRng() * 550;
        outerRock(
            { x: drift.x + Math.cos(a) * d, y: drift.y + Math.sin(a) * d },
            28 + outerRng() * 32,
            false,
            95 + outerRng() * 35,
            drift,
        );
    }
    // Helios now retains a circulating flow rather than drifting away permanently.
    for (const rock of rocks) {
        const belt = landmarks[1],
            dx = rock.x - belt.x,
            dy = rock.y - belt.y,
            d = Math.hypot(dx, dy);
        if (d < 950 && d > 160 && !rock.orbit) {
            rock.orbit = { x: belt.x, y: belt.y, radius: d, speed: 75 };
            rock.vx = (-dy / d) * 75;
            rock.vy = (dx / d) * 75;
        }
    }
    for (let id = 10; id < 13; id++) {
        const phase = outerRng() * Math.PI * 2;
        const route = Array.from({ length: 6 }, (_, i) =>
            place(phase + (i * Math.PI) / 3, 4400 + outerRng() * 2700),
        );
        // Start clear of geometry, with a local pursuit anchor and an independent route.
        for (let attempt = 0; attempt < 200; attempt++) {
            const point = place(phase + (outerRng() - 0.5) * 0.4, 5500 + outerRng() * 1700);
            const fortressCenter = place(5.05, 6800);
            if (
                Math.hypot(point.x - fortressCenter.x, point.y - fortressCenter.y) < 1200 ||
                rocks.some(
                    (r) => Math.hypot(r.x - point.x, r.y - point.y) < r.radius + DRONES.radius + 30,
                ) ||
                enemies.some(
                    (e) => Math.hypot(e.x - point.x, e.y - point.y) < DRONES.radius * 2 + 40,
                )
            )
                continue;
            enemies.push({ ...point, id, home: { ...point }, phase, route });
            break;
        }
    }
    // The fortress is isolated from original locations, the treasure nest and Perseids.
    const fortressSite: Landmark = {
        ...place(5.05, 6800),
        name: 'Twierdza Aegis',
        key: 14,
        kind: 'fortress',
        siteId: 'fortress',
        radius: 1000,
    };
    landmarks.push(fortressSite);
    const vertices = Array.from({ length: 8 }, (_, i) => ({
        x: fortressSite.x + Math.cos((i * Math.PI) / 4) * 1000,
        y: fortressSite.y + Math.sin((i * Math.PI) / 4) * 1000,
    }));
    // Leave the south-east edge open as a permanent, navigable gate.
    const walls = vertices.flatMap((from, i) =>
        i === 1 ? [] : [{ from, to: vertices[(i + 1) % 8] }],
    );
    const guards: EnemySpec[] = Array.from({ length: 5 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 5;
        return {
            id: 201 + i,
            kind: i >= 3 ? 'lancer' : 'patrol',
            home: { x: fortressSite.x, y: fortressSite.y },
            phase: angle,
            x: fortressSite.x + Math.cos(angle) * 520,
            y: fortressSite.y + Math.sin(angle) * 520,
        };
    });
    const fortress = {
        ...fortressSite,
        walls,
        guards,
        gate: {
            x: (vertices[1].x + vertices[2].x) / 2,
            y: (vertices[1].y + vertices[2].y) / 2,
        },
    };
    const researchRng = random(seed ^ 0x347e2d);
    let research: Point = { x: 0, y: 0 },
        clearance = -Infinity;
    for (let attempt = 0; attempt < 4000; attempt++) {
        const point = place(researchRng() * Math.PI * 2, 2400 + researchRng() * 1300);
        const space = Math.min(
            ...rocks.map((r) => Math.hypot(point.x - r.x, point.y - r.y) - r.radius - 240),
            ...landmarks
                .filter((l) => l.siteId || l.kind === 'wreck')
                .map((l) => Math.hypot(point.x - l.x, point.y - l.y) - 650),
            ...enemies
                .filter((e) => !e.route)
                .map((e) => Math.hypot(point.x - e.home.x, point.y - e.home.y) - 1100),
            Math.hypot(point.x - outpost.x, point.y - outpost.y) - 800,
        );
        if (space > clearance) {
            research = point;
            clearance = space;
        }
        if (space >= 0) break;
    }
    const researchSite = { ...research, name: 'Anomalia Keplera' };
    return { seed, landmarks, rocks, enemies, caches, outpost, fortress, researchSite };
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
