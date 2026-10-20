import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    magneticCoverage,
    magneticBoundaryArcs,
    MAGNETIC_RELAYS,
    REMOTE_MAGNETIC_ZONE,
} from '../frontend/game/systems/magneticZones';

test('separate safe islands have complete red boundaries', () => {
    const zones = [{ x: 0, y: 0, radius: 1450 }, REMOTE_MAGNETIC_ZONE];
    const arcs = magneticBoundaryArcs(zones);
    assert.equal(arcs.length, 2);
    assert.ok(arcs.every((a) => a.start === 0 && a.end === Math.PI * 2));
});
test('overlapping relay protection has no dangerous boundary inside another safe area', () => {
    const zones = [{ x: 0, y: 0, radius: 1450 }, ...MAGNETIC_RELAYS, REMOTE_MAGNETIC_ZONE];
    const arcs = magneticBoundaryArcs(zones);
    assert.ok(arcs.length > 0);
    for (const a of arcs)
        for (const t of [0.1, 0.5, 0.9]) {
            const angle = a.start + (a.end - a.start) * t;
            const p = { x: a.x + Math.cos(angle) * a.radius, y: a.y + Math.sin(angle) * a.radius };
            assert.ok(zones.every((z) => Math.hypot(p.x - z.x, p.y - z.y) >= z.radius - 1e-6));
        }
    assert.ok(arcs.some((a) => a.x === REMOTE_MAGNETIC_ZONE.x && a.y === REMOTE_MAGNETIC_ZONE.y));
});
test('contained and duplicate protection circles draw only the outer boundary', () => {
    const arcs = magneticBoundaryArcs([
        { x: 0, y: 0, radius: 100 },
        { x: 0, y: 0, radius: 20 },
        { x: 0, y: 0, radius: 100 },
    ]);
    assert.equal(arcs.length, 1);
    assert.equal(arcs[0].radius, 100);
});

test('inactive relays have safe approaches and activation expands protection beyond the existing boundary', () => {
    for (const relay of MAGNETIC_RELAYS) {
        assert.ok(Math.hypot(relay.x, relay.y) < 1450 - 80);
        for (let step = 0; step <= 20; step++)
            assert.ok(magneticCoverage({ x: (relay.x * step) / 20, y: (relay.y * step) / 20 }, []));
        const outside = { x: relay.x * 1.6, y: relay.y * 1.6 };
        assert.equal(magneticCoverage(outside, []), false);
        assert.equal(magneticCoverage(outside, [relay.id]), true);
    }
});
