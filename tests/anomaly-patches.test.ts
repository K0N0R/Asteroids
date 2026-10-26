import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeSmallAnomalyPatches } from '../frontend/game/worlds/anomalyPatches';

test('isolated small specks and shallow patches disappear while a dense field retains its core', () => {
    const width = 24,
        values = new Float32Array(width * 12).fill(200);
    const rect = (x: number, y: number, w: number, h: number, depth: number) => {
        for (let yy = y; yy < y + h; yy++)
            for (let xx = x; xx < x + w; xx++) values[yy * width + xx] = -depth;
    };
    rect(1, 1, 5, 5, 300);
    rect(10, 1, 2, 2, 400);
    rect(17, 1, 5, 5, 30);
    assert.equal(removeSmallAnomalyPatches(values, width), 2);
    assert.equal(values[2 * width + 2], -300, 'large core stays dense');
    assert.ok(values[width + 10] > 0, 'small speck removed');
    assert.ok(values[width + 17] > 0, 'shallow patch cannot become an invisible island');
    assert.equal(removeSmallAnomalyPatches(values, width), 0, 'cleanup is stable');
});

test('patch connectivity follows the same diagonal as the terrain triangulation', () => {
    const connected = new Float32Array([-200, 100, 100, -200]),
        separated = new Float32Array([100, -200, -200, 100]);
    assert.equal(removeSmallAnomalyPatches(connected, 2, 2), 0);
    assert.equal(removeSmallAnomalyPatches(separated, 2, 2), 2);
    assert.ok([...separated].every((v) => v > 0));
});
