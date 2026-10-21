import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PHOBOS_MAZE_BANDS,
    PHOBOS_MAZE_ROUTE,
    PHOBOS_MAZE_ENTRY,
    PHOBOS_MAZE_GATE,
} from '../frontend/game/worlds/phobosMaze';
import { polygonDistance } from '../frontend/game/systems/anomalyField';

test('the full winding route has generous hull clearance and is over four times the direct distance', () => {
    let length = 0;
    for (let i = 1; i < PHOBOS_MAZE_ROUTE.length; i++) {
        const a = PHOBOS_MAZE_ROUTE[i - 1],
            b = PHOBOS_MAZE_ROUTE[i];
        length += Math.hypot(b.x - a.x, b.y - a.y);
        for (let t = 0; t <= 1; t += 0.01) {
            const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            assert.ok(
                PHOBOS_MAZE_BANDS.every((band) => polygonDistance(p, band) > 180),
                JSON.stringify(p),
            );
        }
    }
    assert.deepEqual(PHOBOS_MAZE_ROUTE.at(-1), PHOBOS_MAZE_GATE);
    assert.ok(
        length >
            4 *
                Math.hypot(
                    PHOBOS_MAZE_GATE.x - PHOBOS_MAZE_ENTRY.x,
                    PHOBOS_MAZE_GATE.y - PHOBOS_MAZE_ENTRY.y,
                ),
    );
});

test('a shortest-path search cannot bypass the maze by flying around its outer walls', () => {
    const step = 100,
        start = PHOBOS_MAZE_ENTRY,
        goal = PHOBOS_MAZE_GATE;
    const key = (x: number, y: number) => `${x},${y}`;
    const seen = new Set([key(start.x, start.y)]),
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
            if (x < 0 || x > 6500 || y < -3800 || y > 2300 || seen.has(k)) continue;
            if (PHOBOS_MAZE_BANDS.some((b) => polygonDistance({ x, y }, b) <= 80)) continue;
            seen.add(k);
            queue.push({ x, y, d: p.d + step });
        }
    }
    assert.ok(Number.isFinite(shortest), 'gate remains reachable');
    assert.ok(shortest > 16000, `shortest ${shortest}`);
});
