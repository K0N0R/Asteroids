import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anomalyOpacity } from '../frontend/game/graphics/anomalyAppearance';
const band = [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 400 },
    { x: 0, y: 400 },
];
test('overlapping anomaly footprints do not brighten or double their edges', () => {
    for (let y = -30; y < 450; y += 11)
        for (let x = -30; x < 450; x += 13) {
            assert.equal(anomalyOpacity({ x, y }, [band, band]), anomalyOpacity({ x, y }, [band]));
        }
});
test('anomaly edge fades continuously and leaves distant space transparent', () => {
    assert.equal(anomalyOpacity({ x: -40, y: 200 }, [band]), 0);
    assert.equal(anomalyOpacity({ x: 200, y: 200 }, [band]), 1);
    for (let x = -40; x < 100; x++)
        assert.ok(
            Math.abs(
                anomalyOpacity({ x: x + 1, y: 200 }, [band]) -
                    anomalyOpacity({ x, y: 200 }, [band]),
            ) < 0.05,
        );
});
