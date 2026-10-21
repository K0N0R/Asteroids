import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    EARTH_COASTLINES,
    earthPoint,
    projectCoastline,
} from '../frontend/game/graphics/earthGeography';
import { planetView } from '../frontend/game/graphics/planetView';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';

test('Atlantic view places recognizable continents in the correct quadrants and hides far-side Australia', () => {
    const center = earthPoint(-25, 12);
    assert.ok(
        Math.abs(center.x) < 1e-9 && Math.abs(center.y) < 1e-9 && Math.abs(center.z - 1) < 1e-9,
    );
    const europe = earthPoint(10, 50),
        newYork = earthPoint(-74, 41),
        cape = earthPoint(18, -34),
        brazil = earthPoint(-55, -15);
    assert.ok(europe.x > 0 && europe.y < 0 && europe.z > 0);
    assert.ok(newYork.x < 0 && newYork.y < 0 && newYork.z > 0);
    assert.ok(cape.x > 0 && cape.y > 0 && cape.z > 0);
    assert.ok(brazil.x < 0 && brazil.y > 0 && brazil.z > 0);
    assert.deepEqual(
        projectCoastline(EARTH_COASTLINES.find((c) => c.name === 'Australia')!.points, 144),
        [],
    );
    for (const coast of EARTH_COASTLINES) {
        const points = projectCoastline(coast.points, 144);
        for (let i = 0; i < points.length; i += 2)
            assert.ok(Math.hypot(points[i], points[i + 1]) <= 144.000001, coast.name);
    }
});
test('cloud motion changes only its clipped layer and loops seamlessly without changing globe scale', () => {
    const earth = planetView('earth'),
        moon = planetView('lunar');
    try {
        assert.ok(earth.cloudDrift);
        assert.equal(moon.cloudDrift, null);
        const bounds = earth.getLocalBounds().rectangle.clone();
        earth.updateAppearance(30);
        assert.equal(earth.cloudDrift!.x, 24);
        assert.deepEqual(earth.getLocalBounds().rectangle, bounds);
        earth.updateAppearance(earth.cloudPeriod / 0.8);
        assert.equal(earth.cloudDrift!.x, 0);
        const x = earth.cloudDrift!.x;
        earth.updateAppearance(NaN);
        assert.equal(earth.cloudDrift!.x, x);
        assert.equal(earth.scale.x, 1);
        assert.equal(earth.rotation, 0);
    } finally {
        destroyDisplayTree(earth);
        destroyDisplayTree(moon);
    }
});
