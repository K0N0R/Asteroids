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
    recordStoryReturn,
    lunarBuildStage,
} from '../frontend/game/state/story';
import { LUNAR_PROCESSING, lunarProcessingReady } from '../frontend/game/state/lunarConstruction';
import { RESOURCE_IDS, resourceTotal, type ResourceStore } from '../frontend/game/state/resources';
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
test('partial equipment deliveries persist after loss, and raw minerals cannot substitute for them', () => {
    const c = ready();
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    assert.equal(deliverLunarCargo(c, { ore: 160, parts: 0, carbon: 2 }), null);
    assert.equal(deliverLunarCargo(c, { ore: 0, parts: 8 }, false), null);
    const cargo = { ore: 0, parts: 3, electronics: 2 };
    const delivered = deliverLunarCargo(c, cargo)!;
    assert.deepEqual(delivered.accepted, { ore: 0, parts: 3, electronics: 2 });
    assert.equal(c.story!.progress['lunar-hull'], 3);
    assert.equal(c.story!.progress['lunar-electronics'], 2);
    assert.equal(lunarProcessingReady(c.story!), false);
    finishRun(c, false, cargo, 1, 'loss');
    assert.equal(c.story!.progress['lunar-hull'], 3);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('delivered equipment starts local processing; freight cannot generate mining XP', () => {
    const c = ready();
    beginRun(c, 1, null, true);
    c.activeRun!.area = 'surface';
    const cargo = { ...c.activeRun!.freight! };
    const delivery = deliverLunarCargo(c, cargo)!;
    assert.equal(delivery.amount, 19);
    assert.equal(lunarProcessingReady(c.story!), true);
    assert.equal(deliverLunarCargo(c, cargo), null);
    assert.ok(Object.values(c.activeRun!.unloaded!).every((n) => n === 0));
    assert.ok(Object.values(c.activeRun!.freight!).every((n) => n === 0));
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(hullUnlocked(c, 'mule'), false);
    assert.ok(deliverLunarCargo(c, { ore: 160, parts: 0, carbon: 2 }, false));
    assert.equal(lunarBuildStage(c.story!), 2);
    assert.equal(hullUnlocked(c, 'mule'), false);
    recordStoryReturn(c, 'lunar', ['archive']);
    assert.equal(hullUnlocked(c, 'mule'), true);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('Mule waits for delivered equipment and can start in the same sortie after the last part', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    const idle = {
        target: MOON.construction,
        thrust: false,
        brake: false,
        fire: false,
        interact: false,
    };
    try {
        s.area = 'surface';
        c.activeRun!.area = 'surface';
        const mule = s.miningEscort!;
        s.ship.setTranslation({ x: mule.position.x / 100, y: mule.position.y / 100 }, true);
        for (let i = 0; i < 160; i++) s.step({ ...idle, interact: true });
        assert.equal(mule.state, 'idle');
        assert.equal(mule.processingReady, false);
        const cargo: { ore: number; parts: number } & ResourceStore = { ore: 0, parts: 0 };
        for (const t of LUNAR_PROCESSING) cargo[t.resource] = t.target;
        assert.ok(deliverLunarCargo(c, cargo));
        s.step(idle);
        for (let i = 0; i < 140; i++) s.step({ ...idle, interact: true });
        assert.equal(mule.processingReady, true);
        assert.notEqual(mule.state, 'idle');
    } finally {
        s.dispose();
    }
});
