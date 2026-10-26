import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RadarTrail } from '../frontend/game/systems/radarTrail';
import {
    RADAR_RADIUS,
    RADAR_ZOOMS,
    radarPoint,
    zoomRadarFrame,
} from '../frontend/game/systems/radarFrame';

test('radar is 25 percent larger and every supported zoom keeps the player visible', () => {
    assert.equal(RADAR_RADIUS, 88 * 1.25);
    const center = { x: 28000, y: -17000 },
        ship = { x: 31000, y: -19000 };
    for (const zoom of RADAR_ZOOMS) {
        const frame = zoomRadarFrame(center, 5000, ship, zoom);
        const player = radarPoint(ship, frame.center, frame.radius, true);
        assert.ok(Math.hypot(player.x - 1470, player.y - 130) < RADAR_RADIUS);
        if (zoom > 1) assert.deepEqual(player, { x: 1470, y: 130 });
        const far = radarPoint({ x: 100000, y: -80000 }, frame.center, frame.radius, true);
        assert.ok(Math.hypot(far.x - 1470, far.y - 130) < RADAR_RADIUS);
        assert.equal(frame.radius, 5000 / zoom);
    }
});

test('dotted travel history fades, survives radar refreshes and expires while stationary', () => {
    const trail = new RadarTrail();
    for (let i = 0; i < 100; i++) trail.update({ x: 28000 + i * 100, y: -9000 }, i * 0.3);
    assert.equal(trail.points.length, 100);
    assert.ok(trail.opacity(30, trail.points[0]) < trail.opacity(30, trail.points[99]));
    for (let i = 0; i < 1000; i++) trail.update({ x: 37900, y: -9000 }, 30);
    assert.equal(trail.points.length, 100, 'refresh does not flood the trail');
    trail.update({ x: 37900, y: -9000 }, 110);
    assert.equal(trail.points.length, 1, 'old points expire without movement');
    assert.equal(trail.opacity(110, { time: 0 }), 0);
});

import { Graphics } from 'pixi.js';
import { drawRadarAnomaly } from '../frontend/game/ui/radarAnomaly';
import { MARS_MAPS } from '../frontend/game/worlds/marsLayout';

test('empty anomaly overlay never repaints the radar background, including all asteroid zooms', () => {
    for (const zoom of RADAR_ZOOMS) {
        const g = new Graphics().circle(1470, 130, RADAR_RADIUS).fill(0x303c45);
        const before = [...g.context.instructions];
        assert.equal(
            drawRadarAnomaly(
                g,
                zoomRadarFrame(
                    MARS_MAPS.asteroid.center,
                    MARS_MAPS.asteroid.radius,
                    MARS_MAPS.asteroid.center,
                    zoom,
                ),
            ),
            0,
        );
        assert.deepEqual([...g.context.instructions], before);
        g.destroy(true);
    }
    const g = new Graphics().circle(1470, 130, RADAR_RADIUS).fill(0x303c45);
    const before = [...g.context.instructions];
    assert.equal(drawRadarAnomaly(g, { center: { x: 28500, y: 0 }, radius: 700 }), 0);
    assert.deepEqual(
        [...g.context.instructions],
        before,
        'zoomed safe Phobos region keeps its background',
    );
    g.destroy(true);
});

test('partial Phobos coverage never colors the whole radar and zooming into safety removes the overlay', () => {
    const g = new Graphics();
    const cells = drawRadarAnomaly(g, {
        center: MARS_MAPS.phobos.center,
        radius: MARS_MAPS.phobos.radius,
    });
    assert.ok(cells > 300 && cells < 2000, `partial contamination: ${cells}`);
    g.clear().circle(1470, 130, RADAR_RADIUS).fill(0x303c45);
    const before = [...g.context.instructions];
    assert.equal(drawRadarAnomaly(g, { center: { x: 28500, y: 0 }, radius: 700 }), 0);
    assert.deepEqual([...g.context.instructions], before);
    g.destroy(true);
});
