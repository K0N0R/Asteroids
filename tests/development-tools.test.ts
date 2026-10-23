import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newStoryCampaign, parseCampaign, SaveRepository } from '../frontend/game/state/campaign';
import { developmentCopy, DEVELOPMENT_SAVE_KEY } from '../frontend/game/state/development';
import {
    STORY_SECTORS,
    storySectorUnlocked,
    storyTaskAvailable,
    STORY_TASKS,
    type StorySectorId,
} from '../frontend/game/state/story';
import { gateRadarFrame, radarPoint } from '../frontend/game/systems/radarFrame';
import { Hyperdrive, HYPERDRIVE } from '../frontend/game/systems/hyperdrive';
import { PHOBOS_MAZE_GATE } from '../frontend/game/worlds/phobosMaze';
import { MARS_GATES, MARS_MAPS } from '../frontend/game/worlds/marsLayout';
import { anomalyDrift } from '../frontend/game/graphics/anomalyCloudView';

test('every sector can be tested from a fresh save without completing previous acts or mutating the source', () => {
    const c = newStoryCampaign(),
        before = JSON.stringify(c);
    for (const id of Object.keys(STORY_SECTORS) as StorySectorId[]) {
        const copy = developmentCopy(c, id);
        assert.equal(copy.story!.sector, id);
        assert.ok(storySectorUnlocked(copy.story!, id));
        assert.ok(parseCampaign(JSON.stringify(copy)), id);
        assert.equal(copy.story!.claimed.length, 0, 'no invented completed quests');
    }
    assert.equal(JSON.stringify(c), before);
    const mars = developmentCopy(c, 'mars');
    assert.ok(storyTaskAvailable(mars.story!, STORY_TASKS.find((t) => t.id === 'mars-shields')!));
    assert.equal(storySectorUnlocked(c.story!, 'mars'), false);
});
test('normal and test repositories remain separate after a test save is updated', () => {
    const storage = new Map<string, string>(),
        io = {
            getItem: (k: string) => storage.get(k) ?? null,
            setItem: (k: string, v: string) => {
                storage.set(k, v);
            },
        };
    const normal = new SaveRepository(io, { key: 'normal', create: newStoryCampaign }),
        testSlot = new SaveRepository(io, { key: DEVELOPMENT_SAVE_KEY, create: newStoryCampaign });
    const c = normal.load();
    normal.save(c);
    const saved = storage.get('normal');
    const copy = developmentCopy(c, 'pluto');
    testSlot.save(copy);
    assert.equal(storage.get('normal'), saved);
    assert.equal(testSlot.load().story!.sector, 'pluto');
    assert.equal(normal.load().story!.sector, 'earth');
});
test('radar follows both directions of a gate journey without dropping the player outside its disc', () => {
    for (const [from, to] of [
        [PHOBOS_MAZE_GATE, MARS_GATES.phobosArrival],
        [MARS_GATES.phobosArrival, PHOBOS_MAZE_GATE],
        [MARS_GATES.asteroidExit, MARS_GATES.asteroidArrival],
        [MARS_GATES.asteroidArrival, MARS_GATES.asteroidExit],
    ]) {
        const drive = new Hyperdrive();
        assert.ok(drive.start(from, to, true, true));
        drive.charge(HYPERDRIVE.charge);
        let previous: { x: number; y: number } | undefined;
        for (let i = 0; i < 145; i++) {
            const p = drive.next(from, HYPERDRIVE.transferSeconds / 144).point;
            const frame = gateRadarFrame(MARS_MAPS.mars.center, 9000, drive),
                q = radarPoint(p, frame.center, frame.radius, true);
            assert.ok(Math.hypot(q.x - 1470, q.y - 130) < 110);
            if (previous)
                assert.ok(Math.hypot(q.x - previous.x, q.y - previous.y) < 4, 'no minimap jump');
            previous = q;
        }
    }
});
test('anomaly morphing is continuous, bounded and identical at shared tile edges', () => {
    for (let y = -9000; y < 2000; y += 211) {
        const a = anomalyDrift(512, y, 0),
            b = anomalyDrift(512, y, 1 / 60),
            c = anomalyDrift(512, y, 40);
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.35);
        assert.ok(Math.hypot(c.x, c.y) < 38);
        assert.notDeepEqual(a, c);
    }
});
