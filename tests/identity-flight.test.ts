import { newCampaign, hirePilot, parseCampaign } from '../frontend/game/state/campaign';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pilotName, newPilot, clonePilot, pilotAppearanceId } from '../frontend/game/state/pilots';
import { RadarTrail } from '../frontend/game/systems/radarTrail';
import { followCameraZoom } from '../frontend/game/systems/flight';
test('pilot identity stays stable through cloning and repeated names no longer follow the archetype', () => {
    const names = new Set<string>();
    for (let id = 2; id < 102; id++) {
        const p = newPilot(id, 0);
        names.add(pilotName(p));
        assert.equal(pilotName(clonePilot(p)), pilotName(p));
    }
    assert.equal(names.size, 100);
    assert.equal(pilotName(newPilot()), 'Mira Voss');
});
test('radar trail samples travel rather than idle time and fades on simulation time', () => {
    const trail = new RadarTrail();
    trail.update({ x: 0, y: 0 }, 0);
    trail.update({ x: 0, y: 0 }, 10);
    assert.equal(trail.points.length, 1);
    trail.update({ x: 100, y: 0 }, 11);
    assert.equal(trail.points.length, 2);
    assert.ok(trail.opacity(30, trail.points[0]) < trail.opacity(11, trail.points[0]));
    trail.update({ x: 200, y: 0 }, 80);
    assert.equal(trail.points.length, 2);
    assert.equal(trail.points[0].time, 11);
    for (let i = 0; i < 1000; i++) trail.update({ x: 300 + i * 100, y: 0 }, 81 + i * 0.25);
    assert.ok(trail.points.length <= 240);
});
test('speed zoom eases consistently across frame rates, remains bounded and returns at rest', () => {
    const results = [30, 60, 144].map((fps) => {
        let zoom = 1;
        for (let i = 0; i < fps * 3; i++) zoom = followCameraZoom(zoom, 1000, 1 / fps);
        return zoom;
    });
    assert.ok(Math.max(...results) - Math.min(...results) < 1e-8);
    assert.ok(results[0] > 0.64 && results[0] < 0.66);
    let zoom = results[0];
    for (let i = 0; i < 240; i++) zoom = followCameraZoom(zoom, 0, 1 / 60);
    assert.ok(zoom > 0.99 && zoom <= 1);
    assert.equal(followCameraZoom(0.8, 1000, 0), 0.8);
});

test('all three recruits have distinct first names, hairstyles and skin tones for every roster position', () => {
    for (let id = 2; id < 500; id++) {
        const candidates = [0, 1, 2].map((archetype) => newPilot(id, archetype));
        assert.equal(new Set(candidates.map((p) => pilotName(p).split(' ')[0])).size, 3);
        assert.equal(new Set(candidates.map((p) => pilotAppearanceId(p) % 4)).size, 3);
        assert.equal(new Set(candidates.map((p) => pilotAppearanceId(p) % 6)).size, 3);
    }
});
test('hiring each offered archetype preserves the preview name and portrait after reload and cloning', () => {
    for (const archetype of [0, 1, 2]) {
        const c = newCampaign();
        c.nextPilotId = 11;
        c.bank.ore = 20;
        const offered = newPilot(c.nextPilotId, archetype);
        assert.ok(hirePilot(c, archetype));
        const hired = c.pilots.find((p) => p.id === 11)!;
        assert.equal(pilotName(hired), pilotName(offered));
        assert.equal(pilotAppearanceId(hired), pilotAppearanceId(offered));
        const loaded = parseCampaign(JSON.stringify(c))!;
        assert.equal(pilotName(loaded.pilots[1]), pilotName(offered));
        assert.equal(pilotAppearanceId(clonePilot(hired)), pilotAppearanceId(offered));
    }
});
