import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PHOBOS_MAZE_BANDS,
    PHOBOS_MAZE_ROUTE,
    PHOBOS_MAZE_BRANCHES,
    PHOBOS_MAZE_ENTRY,
    PHOBOS_MAZE_GATE,
} from '../frontend/game/worlds/phobosMaze';
import { polygonDistance } from '../frontend/game/systems/anomalyField';
import { segmentDistance } from '../frontend/game/systems/hyperdrive';
import { MARS_MAPS, inMarsMap } from '../frontend/game/worlds/marsLayout';
import { marsAnomaliesFor } from '../frontend/game/worlds/marsSystem';
test('branching maze has ample full-hull clearance and five genuine dead ends', () => {
    for (const route of [PHOBOS_MAZE_ROUTE, ...PHOBOS_MAZE_BRANCHES])
        for (let i = 1; i < route.length; i++)
            for (let t = 0; t <= 1; t += 0.01) {
                const a = route[i - 1],
                    b = route[i],
                    p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
                assert.ok(
                    PHOBOS_MAZE_BANDS.every((b) => polygonDistance(p, b) > 180),
                    JSON.stringify(p),
                );
            }
    assert.equal(PHOBOS_MAZE_BRANCHES.length, 5);
    for (const branch of PHOBOS_MAZE_BRANCHES) {
        const end = branch.at(-1)!;
        assert.ok(
            PHOBOS_MAZE_ROUTE.slice(1).every(
                (b, i) => segmentDistance(end, PHOBOS_MAZE_ROUTE[i], b) > 750,
            ),
        );
    }
});
test('independent path search confirms a long route through the maze, without an exterior bypass', () => {
    const step = 200,
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
                PHOBOS_MAZE_BANDS.some((b) => polygonDistance({ x, y }, b) <= 80)
            )
                continue;
            seen.add(k);
            queue.push({ x, y, d: p.d + step });
        }
    }
    assert.ok(Number.isFinite(shortest));
    assert.ok(shortest > 25000, `shortest ${shortest}`);
});
test('separate orbital maps have roughly 75 / 25 / 0 percent contamination', () => {
    for (const m of Object.values(MARS_MAPS)) {
        let all = 0,
            on = 0;
        const bands = marsAnomaliesFor(m.id);
        for (let x = m.center.x - m.radius; x < m.center.x + m.radius; x += 200)
            for (let y = m.center.y - m.radius; y < m.center.y + m.radius; y += 200) {
                const p = { x: x + 100, y: y + 100 };
                if (!inMarsMap(m.id, p)) continue;
                all++;
                if (bands.some((b) => polygonDistance(p, b) === 0)) on++;
            }
        const expected = m.id === 'mars' ? 0.75 : m.id === 'phobos' ? 0.25 : 0;
        assert.ok(Math.abs(on / all - expected) < 0.025, `${m.id}: ${on / all}`);
    }
});
