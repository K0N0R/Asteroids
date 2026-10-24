import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newStoryCampaign, parseCampaign, SaveRepository } from '../frontend/game/state/campaign';
import {
    createDevelopmentAct,
    currentDevelopmentStart,
    DEVELOPMENT_STARTS,
    DEVELOPMENT_SAVE_KEY,
} from '../frontend/game/state/development';
import {
    STORY_SECTORS,
    syncStory,
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

test('each act starts with previous history, fresh current missions, normal locks and valid saves', () => {
    for (const start of DEVELOPMENT_STARTS) {
        const c = createDevelopmentAct(start.id),
            p = c.story!;
        assert.equal(p.sector, start.sector);
        assert.ok(!p.development, 'normal progression instead of bypassing locks');
        assert.equal(currentDevelopmentStart(c), start.id);
        assert.ok(storySectorUnlocked(p, start.sector));
        assert.ok(parseCampaign(JSON.stringify(c)), start.id);
        syncStory(c);
        const current = STORY_TASKS.filter(
            (t) =>
                t.act === start.act &&
                (start.id === 'moon'
                    ? t.sector === 'lunar'
                    : start.id === 'neptune'
                      ? t.sector === 'neptune'
                      : true),
        );
        assert.ok(current.length);
        for (const t of current) {
            assert.equal(p.progress[t.id], 0, `${start.id}: ${t.id}`);
            assert.ok(!p.claimed.includes(t.id));
        }
        for (const t of STORY_TASKS.filter((t) => t.act > start.act))
            assert.equal(p.progress[t.id], 0, `${start.id}: future ${t.id}`);
        assert.equal(c.activeRun, null);
        assert.deepEqual(c.recoverySignals, []);
        assert.deepEqual(c.worldSalvage, []);
        assert.deepEqual(c.rescueSites, {});
        assert.equal(c.lunarShipment, null);
    }
    const mars = createDevelopmentAct('act-2');
    assert.equal(mars.station.workshopLevel, 1);
    assert.equal(mars.station.laboratoryLevel, 1);
    assert.equal(mars.station.shield, false);
    assert.equal(mars.story!.mars.ambushEntered, false);
    assert.equal(mars.story!.mars.researchSites, 0);
    assert.ok(storyTaskAvailable(mars.story!, STORY_TASKS.find((t) => t.id === 'mars-shields')!));
    assert.equal(storySectorUnlocked(mars.story!, 'venus'), false);
    const earth = createDevelopmentAct('act-1');
    assert.deepEqual(earth, newStoryCampaign());
    const moon = createDevelopmentAct('moon');
    assert.equal(moon.station.workshopLevel, 0);
    assert.equal(
        storyTaskAvailable(moon.story!, STORY_TASKS.find((t) => t.id === 'earth-workshop')!),
        false,
    );
    const returnMars = createDevelopmentAct('act-5');
    assert.ok(returnMars.story!.claimed.includes('mercury-technology'));
    assert.ok(returnMars.story!.claimed.includes('mars-anomaly-research'));
    assert.equal(returnMars.station.extraction, false);
    assert.equal(returnMars.station.workshopLevel, 1);
});
test('restarting after dirty progress regenerates the same act without carrying later resources or devices', () => {
    const first = createDevelopmentAct('act-2'),
        dirty = structuredClone(first);
    dirty.story!.mars.researchSites = 3;
    dirty.story!.mars.announcements.push('anomaly');
    dirty.station.laboratoryLevel = dirty.station.workshopLevel = 3;
    dirty.station.extraction = true;
    dirty.bank.resonantComposite = 999;
    dirty.story!.radio = {
        pending: [{ speaker: 'science', text: 'Stary komunikat' }],
        acknowledged: [],
    };
    const reset = createDevelopmentAct(currentDevelopmentStart(dirty));
    assert.deepEqual(reset, first);
    assert.equal(reset.bank.resonantComposite, undefined);
    assert.equal(reset.story!.radio, undefined);
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
    const copy = createDevelopmentAct('act-10');
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
