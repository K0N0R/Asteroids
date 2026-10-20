import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    constructionManifest,
    deliverLunarCargo,
    deliverLunarShipment,
    recordStoryReturn,
    lunarBuildStage,
} from '../frontend/game/state/story';
import { LUNAR_PROCESSING, lunarProcessingReady } from '../frontend/game/state/lunarConstruction';
import { RESOURCE_IDS, resourceTotal } from '../frontend/game/state/resources';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
before(async () => RAPIER.init());
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) => (t.sector === 'earth' && t.act === 1 && t.required) || t.id === 'lunar-survey',
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'lunar';
    c.bank = {
        ore: 500,
        parts: 20,
        electronics: 10,
        storageFrames: 10,
        powerModules: 10,
        lifeSupport: 10,
    };
    return c;
}
test('the mixed bootstrap manifest charges each item once, fits the starter cargo and survives save', () => {
    const c = ready();
    const manifest = constructionManifest(c);
    assert.deepEqual(manifest, {
        ore: 0,
        parts: 8,
        storageFrames: 4,
        electronics: 3,
        powerModules: 2,
        lifeSupport: 2,
    });
    assert.equal(resourceTotal(manifest), 19);
    const bank = { ...c.bank };
    assert.ok(beginRun(c, 1, null, true));
    for (const id of RESOURCE_IDS)
        assert.equal(c.bank[id] ?? 0, (bank[id] ?? 0) - (manifest[id] ?? 0));
    const before = structuredClone(c);
    assert.equal(beginRun(c, 1, null, true), false);
    assert.deepEqual(c, before);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 53 })), null);
});
test('partial equipment and raw minerals cannot replace delivery of the parcel', () => {
    const c = ready();
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    const cargo = { ore: 160, parts: 3, electronics: 2, carbon: 2 };
    assert.equal(deliverLunarCargo(c, cargo), null);
    assert.equal(deliverLunarCargo(c, cargo, false), null);
    assert.equal(c.story!.progress['lunar-hull'], 0);
    assert.equal(lunarProcessingReady(c.story!), false);
    finishRun(c, false, cargo, 1, 'loss');
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('delivered equipment starts local processing; freight cannot generate mining XP', () => {
    const c = ready();
    beginRun(c, 1, null, true);
    c.activeRun!.area = 'surface';
    const delivery = deliverLunarShipment(c)!;
    assert.deepEqual(delivery.titles, ['Wyposażenie stacji']);
    assert.equal(lunarProcessingReady(c.story!), true);
    assert.equal(deliverLunarShipment(c), null);
    assert.equal(c.activeRun!.unloaded, undefined);
    assert.equal(c.activeRun!.freight, undefined);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(hullUnlocked(c, 'mule'), false);
    assert.ok(deliverLunarCargo(c, { ore: 160, parts: 0, carbon: 2 }, false));
    assert.equal(lunarBuildStage(c.story!), 2);
    assert.equal(hullUnlocked(c, 'mule'), false);
    recordStoryReturn(c, 'lunar', ['archive']);
    assert.equal(hullUnlocked(c, 'mule'), true);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('Mule appears after parcel contact and can start in the same sortie', () => {
    const c = ready();
    beginRun(c, 1, null, true);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    const idle = {
        target: MOON.construction,
        thrust: false,
        brake: false,
        fire: false,
        interact: false,
    };
    try {
        assert.equal(s.miningEscort, null);
        s.area = 'surface';
        c.activeRun!.area = 'surface';
        const parcel = s.salvage.towed!;
        s.salvage.detach();
        parcel.body.setTranslation(
            { x: MOON.construction.x / 100, y: MOON.construction.y / 100 },
            true,
        );
        s.ship.setTranslation({ x: MOON.exit.x / 100, y: MOON.exit.y / 100 }, true);
        s.step(idle);
        const mule = s.miningEscort!;
        assert.ok(mule);
        assert.equal(mule.processingReady, true);
        s.ship.setTranslation({ x: mule.position.x / 100, y: mule.position.y / 100 }, true);
        for (let i = 0; i < 140; i++) s.step({ ...idle, interact: true });
        assert.notEqual(mule.state, 'idle');
    } finally {
        s.dispose();
    }
});
