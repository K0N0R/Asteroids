import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PHOBOS_MAZE_BANDS,
    PHOBOS_ORBIT_BANDS,
    PHOBOS_MAZE_ROUTE,
    PHOBOS_MAZE_BRANCHES,
    PHOBOS_MAZE_ENTRY,
    PHOBOS_MAZE_GATE,
    marsAnomalyClearance,
    marsAnomalyTouches,
    MARS_CLEAR_ROUTES,
} from '../frontend/game/worlds/phobosMaze';
import { polygonDistance, ANOMALY_FEATHER } from '../frontend/game/systems/anomalyField';
import { MARS_MAPS, MARS_GATES, inMarsMap } from '../frontend/game/worlds/marsLayout';
test('curving passages have full hull clearance, loops, dead ends and varied widths', () => {
    for (const route of [PHOBOS_MAZE_ROUTE, ...PHOBOS_MAZE_BRANCHES])
        for (const p of route)
            assert.equal(marsAnomalyTouches(p, 'mars', 58.05), false, JSON.stringify(p));
    assert.ok(PHOBOS_MAZE_BRANCHES.length >= 6);
    const connected = PHOBOS_MAZE_BRANCHES.filter((branch) =>
        PHOBOS_MAZE_ROUTE.some(
            (p) => Math.hypot(p.x - branch.at(-1)!.x, p.y - branch.at(-1)!.y) < 5,
        ),
    );
    assert.ok(connected.length >= 3, 'multiple through passages');
    assert.ok(PHOBOS_MAZE_BRANCHES.length - connected.length >= 2, 'exploration dead ends');
    const diagonal = PHOBOS_MAZE_ROUTE.slice(1).filter(
        (p, i) =>
            Math.abs(p.x - PHOBOS_MAZE_ROUTE[i].x) > 10 &&
            Math.abs(p.y - PHOBOS_MAZE_ROUTE[i].y) > 10,
    );
    assert.ok(diagonal.length > PHOBOS_MAZE_ROUTE.length * 0.7);
    const widths = PHOBOS_MAZE_ROUTE.map((p) => marsAnomalyClearance(p, 'mars'));
    assert.ok(Math.max(...widths) - Math.min(...widths) > 300);
});

test('independent path search confirms a long route through the maze, without an exterior bypass', () => {
    const step = 50,
        start = PHOBOS_MAZE_ENTRY,
        goal = PHOBOS_MAZE_GATE,
        key = (x: number, y: number) => `${x},${y}`,
        seen = new Set([key(start.x, start.y)]),
        queue = [{ ...start, d: 0 }];
    let shortest = Infinity;
    for (let i = 0; i < queue.length; i++) {
        const p = queue[i];
        if (p.x === goal.x && p.y === goal.y) {
            shortest = p.d;
            break;
        }
        for (const [dx, dy] of [
            [step, 0],
            [-step, 0],
            [0, step],
            [0, -step],
        ]) {
            const x = p.x + dx,
                y = p.y + dy,
                k = key(x, y);
            if (
                !inMarsMap('mars', { x, y }) ||
                seen.has(k) ||
                marsAnomalyTouches({ x, y }, 'mars', 40)
            )
                continue;
            seen.add(k);
            queue.push({ x, y, d: p.d + step });
        }
    }
    assert.ok(Number.isFinite(shortest));
    assert.ok(shortest > 20000, `shortest ${shortest}`);
});
test('narrower corridors leave roughly 75 / 38 / 0 percent contamination', () => {
    for (const m of Object.values(MARS_MAPS)) {
        let all = 0,
            on = 0;

        for (let x = m.center.x - m.radius; x < m.center.x + m.radius; x += 200)
            for (let y = m.center.y - m.radius; y < m.center.y + m.radius; y += 200) {
                const p = { x: x + 100, y: y + 100 };
                if (!inMarsMap(m.id, p)) continue;
                all++;
                if (marsAnomalyClearance(p, m.id) <= 0) on++;
            }
        const expected = m.id === 'mars' ? 0.75 : m.id === 'phobos' ? 0.38 : 0;
        assert.ok(
            Math.abs(on / all - expected) < (m.id === 'phobos' ? 0.04 : 0.025),
            `${m.id}: ${on / all}`,
        );
    }
});

test('interpolated visual boundary agrees with hazard field away from the feather', () => {
    for (let y = -10000; y < 2000; y += 351)
        for (let x = -2500; x < 12000; x += 389) {
            const p = { x, y },
                field = marsAnomalyClearance(p, 'mars');
            if (Math.abs(field) < 90) continue;
            const filled = PHOBOS_MAZE_BANDS.some((b) => polygonDistance(p, b) === 0);
            assert.equal(filled, field < 0, JSON.stringify(p));
        }
});

test('hull contact uses the visible contour instead of treating the construction field as a distance', () => {
    const radius = 58.05;
    let point: { x: number; y: number } | undefined;
    for (let y = -9000; y < 0 && !point; y += 40)
        for (let x = 2500; x < 11000; x += 40) {
            const candidate = { x, y },
                field = marsAnomalyClearance(candidate, 'mars');
            if (field >= 0 && field < radius && !marsAnomalyTouches(candidate, 'mars', radius)) {
                point = candidate;
                break;
            }
        }
    assert.ok(point, 'a flattened construction gradient must not count as hull contact');
    assert.ok(
        marsAnomalyClearance(point, 'mars') < radius,
        'old contact check reported damage here',
    );
    assert.ok(
        PHOBOS_MAZE_BANDS.every((poly) => polygonDistance(point!, poly) > radius + ANOMALY_FEATHER),
    );
    assert.equal(marsAnomalyTouches(point, 'mars', radius), false);
    assert.equal(marsAnomalyTouches({ x: 4000, y: -4000 }, 'mars', radius), true);
    assert.equal(marsAnomalyTouches(point, 'asteroid', radius), false);
});

test('indexed hull contact matches a full scan of the rendered polygons at varied radii and cell boundaries', () => {
    for (const [id, polygons] of [
        ['mars', PHOBOS_MAZE_BANDS],
        ['phobos', PHOBOS_ORBIT_BANDS],
    ] as const) {
        const map = MARS_MAPS[id];
        for (let i = 0; i < 140; i++) {
            const angle = i * 2.399963,
                distance = ((i % 19) * map.radius) / 16,
                point = {
                    x: map.center.x + Math.cos(angle) * distance,
                    y: map.center.y + Math.sin(angle) * distance,
                },
                radius = [0, 32, 58.05, 128][i % 4];
            assert.equal(
                marsAnomalyTouches(point, id, radius),
                polygons.some((poly) => polygonDistance(point, poly) <= radius + ANOMALY_FEATHER),
                `${id}: ${JSON.stringify(point)} radius ${radius}`,
            );
        }
    }
});

test('anomaly contact starts when the hull edge enters, while the ship center is still outside', () => {
    const radius = 40;
    let left = 30000,
        right = 31500;
    for (let i = 0; i < 50; i++) {
        const x = (left + right) / 2;
        if (marsAnomalyTouches({ x, y: 0 }, 'phobos', radius)) right = x;
        else left = x;
    }
    assert.equal(marsAnomalyTouches({ x: left - 1, y: 0 }, 'phobos', radius), false);
    assert.equal(marsAnomalyTouches({ x: right + 1, y: 0 }, 'phobos', radius), true);
    assert.equal(
        marsAnomalyTouches({ x: right + 1, y: 0 }, 'phobos', 0),
        false,
        'center has not entered the field',
    );
});

test('all gate routes and their approach margins are clear in the damage field and visible geometry', () => {
    for (const lane of MARS_CLEAR_ROUTES) {
        const a = Math.atan2(lane.b.y - lane.a.y, lane.b.x - lane.a.x);
        for (let i = 0; i <= 100; i++)
            for (const side of [-250, 0, 250]) {
                const p = {
                    x: lane.a.x + ((lane.b.x - lane.a.x) * i) / 100 - Math.sin(a) * side,
                    y: lane.a.y + ((lane.b.y - lane.a.y) * i) / 100 + Math.cos(a) * side,
                };
                for (const orbit of ['mars', 'phobos'] as const)
                    assert.ok(
                        marsAnomalyClearance(p, orbit) > 250,
                        `${orbit}: ${JSON.stringify(p)}`,
                    );
                if (side === 0)
                    assert.equal(
                        [...PHOBOS_MAZE_BANDS, ...PHOBOS_ORBIT_BANDS].some(
                            (b) => polygonDistance(p, b) === 0,
                        ),
                        false,
                    );
            }
    }
});

test('anomaly continues beyond the playable circle with an irregular outer boundary', () => {
    const m = MARS_MAPS.mars;
    let contaminatedOutside = 0;
    const edges: number[] = [];
    for (let i = 0; i < 32; i++) {
        const a = (i * Math.PI) / 16;
        const at = (r: number) =>
            marsAnomalyClearance(
                { x: m.center.x + Math.cos(a) * r, y: m.center.y + Math.sin(a) * r },
                'mars',
            );
        if (at(m.radius + 300) < 0) contaminatedOutside++;
        if (at(m.radius) < 0) {
            let r = m.radius;
            while (r < m.radius + 2600 && at(r) < 0) r += 80;
            edges.push(r);
        }
    }
    assert.ok(contaminatedOutside > 16);
    assert.ok(Math.max(...edges) - Math.min(...edges) > 700);
});

test('asteroid return approaches the cleared southwest without carving a straight corridor through Mars', () => {
    const a = MARS_GATES.asteroidReturn,
        b = MARS_GATES.marsReturn;
    assert.ok(MARS_MAPS.asteroid.center.y > MARS_MAPS.phobos.center.y + 20000);
    for (let i = 0; i <= 200; i++) {
        const point = { x: a.x + ((b.x - a.x) * i) / 200, y: a.y + ((b.y - a.y) * i) / 200 };
        if (inMarsMap('mars', point))
            assert.ok(marsAnomalyClearance(point, 'mars') > 180, JSON.stringify(point));
    }
    assert.ok(
        marsAnomalyClearance({ x: 4000, y: 4000 }, 'mars') < 0,
        'southeast has no diagonal return cut',
    );
    assert.ok(!MARS_CLEAR_ROUTES.some((route) => route.a === a || route.b === b));
});

test('Phobos return gate is northwest, its western half is clear and the east is contaminated', () => {
    const m = MARS_MAPS.phobos;
    assert.ok(MARS_CLEAR_ROUTES[0].b.x < m.center.x - 1200);
    assert.ok(MARS_CLEAR_ROUTES[0].b.y < m.center.y - 1200);
    let east = 0,
        total = 0;
    for (let x = m.center.x - m.radius; x < m.center.x + m.radius; x += 160)
        for (let y = -m.radius; y < m.radius; y += 160) {
            const p = { x, y };
            if (!inMarsMap('phobos', p)) continue;
            if (x < m.center.x - 300)
                assert.ok(marsAnomalyClearance(p, 'phobos') > 100, JSON.stringify(p));
            if (x > m.center.x + 1200) {
                total++;
                if (marsAnomalyClearance(p, 'phobos') < 0) east++;
            }
        }
    assert.ok(east / total > 0.85);
});

import { MARS_ACT } from '../frontend/game/state/marsAct';
test('eastern anomaly leaves probes, landing and the southern asteroid gate accessible', () => {
    for (const point of [MARS_ACT.probe, MARS_ACT.oldShip, MARS_ACT.phobos])
        assert.ok(marsAnomalyClearance(point, 'phobos') > 180, JSON.stringify(point));
    for (let i = 0; i <= 10; i++)
        assert.ok(
            marsAnomalyClearance(
                { x: MARS_ACT.probe.x + i * 85, y: MARS_ACT.probe.y + i * 50 },
                'phobos',
            ) > 100,
            'probe pocket connects to open space',
        );
});
