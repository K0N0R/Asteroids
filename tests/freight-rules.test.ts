import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newCampaign,
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    constructionManifest,
    constructionLoadLock,
    STORY_TASKS,
} from '../frontend/game/state/story';
import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import { manufacture } from '../frontend/game/state/production';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { solveTerminal } from './terminal-test-helper';
before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    function claim(id: string) {
        const t = STORY_TASKS.find((t) => t.id === id)!;
        for (const d of t.dependencies) if (!c.story!.claimed.includes(d)) claim(d);
        c.story!.progress[id] = t.target;
        if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
    }
    claim('earth-workshop');
    claim('lunar-survey');
    return { c, claim };
}
test('construction loads the entire bootstrap bill atomically and never a partial available subset', () => {
    const { c } = ready(),
        manifest = constructionManifest(c);
    assert.deepEqual(manifest, {
        ore: 0,
        parts: 8,
        storageFrames: 4,
        electronics: 3,
        powerModules: 2,
        lifeSupport: 2,
    });
    c.bank = { ...manifest, lifeSupport: 1 };
    const before = structuredClone(c);
    assert.ok(constructionLoadLock(c));
    assert.equal(beginRun(c, 1, null, true), false);
    assert.deepEqual(c, before);
    c.bank.lifeSupport = 2;
    assert.equal(constructionLoadLock(c), null);
    assert.ok(beginRun(c, 1, null, true));
    assert.deepEqual(c.activeRun!.freight, manifest);
    assert.equal(
        Object.values(c.bank).reduce((s, n) => s + n, 0),
        0,
    );
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('a complete construction load that exceeds the chosen ship capacity is rejected intact', () => {
    const { c, claim } = ready();
    for (const t of LUNAR_PROCESSING) claim(t.id);
    c.bank = { ore: 160, parts: 0, carbon: 2 };
    const before = structuredClone(c);
    assert.deepEqual(constructionManifest(c), { ore: 160, parts: 0, carbon: 2 });
    assert.match(constructionLoadLock(c)!, /162/);
    assert.equal(beginRun(c, 1, null, true), false);
    assert.deepEqual(c, before);
});
test('repair kits use the shared stock during flight, are consumed once and are never loaded or returned', () => {
    const c = newCampaign();
    c.repairKits = 7;
    beginRun(c, 1);
    assert.equal(c.repairKits, 7);
    assert.equal(Object.hasOwn(c.activeRun!, 'repairKits'), false);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.repairKits, 7);
        s.hull = s.maxHull - 5;
        for (let i = 0; i < 330; i++) s.step({ ...idle, repair: true });
        assert.equal(s.hull, s.maxHull);
        assert.equal(c.repairKits, 6);
        assert.equal(s.statistics.repairKitsUsed, 1);
        assert.ok(parseCampaign(JSON.stringify(c)));
        finishRun(c, true, { ore: 0, parts: 0 }, s.elapsed, 'dock', 99);
        assert.equal(c.repairKits, 6);
    } finally {
        s.dispose();
    }
});
test('kits produced at a lunar station immediately join the shared stock without collection', () => {
    const { c, claim } = ready();
    for (const t of LUNAR_PROCESSING) claim(t.id);
    c.repairKits = 3;
    c.lunarStation.bank = { ore: 0, parts: 10, conductors: 10 };
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    assert.ok(manufacture(c, 'kit', 1, { site: 'lunar', canAccess: () => true }));
    assert.equal(c.repairKits, 4);
    assert.equal(Object.hasOwn(c.lunarStation, 'repairKits'), false);
    finishRun(c, false, { ore: 0, parts: 0 }, 0, 'loss', 0, {
        lossPosition: { x: 24300, y: 24000 },
    });
    assert.equal(c.repairKits, 4);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('power redirection works with an empty hold and does not consume any material', () => {
    const c = newCampaign();
    beginRun(c, 71);
    const s = new MissionSimulation(c, 71);
    try {
        for (const rock of s.rocks.values()) s.world.removeRigidBody(rock.body);
        s.rocks.clear();
        for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
        const p = s.sector.outpost.terminal;
        s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        assert.deepEqual(s.cargo, { ore: 0, parts: 0 });
        solveTerminal(s, 'power');
        assert.ok(s.outpost.sabotaged);
        assert.deepEqual(s.cargo, { ore: 0, parts: 0 });
    } finally {
        s.dispose();
    }
});
