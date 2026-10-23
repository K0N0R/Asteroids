import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    newShip,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, deliverLunarCargo, constructionLoadLock } from '../frontend/game/state/story';
import { LUNAR_PROCESSING, lunarProcessingReady } from '../frontend/game/state/lunarConstruction';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
import { salvagePosition } from '../frontend/game/systems/salvage';
before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newStoryCampaign();
    c.station.laboratoryLevel = 1;
    const claim = (id: string) => {
        if (c.story!.claimed.includes(id)) return;
        const t = STORY_TASKS.find((t) => t.id === id)!;
        t.dependencies.forEach(claim);
        c.story!.progress[id] = t.target;
        c.story!.claimed.push(id);
    };
    claim('earth-supply');
    claim('lunar-survey');
    for (const t of LUNAR_PROCESSING) c.bank[t.resource] = t.target;
    return c;
}
function launch() {
    const c = ready();
    assert.equal(beginRun(c, 1, null, true), true);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    return { c, s };
}
test('packing requires all parts atomically and stores equipment in a parcel instead of ship cargo', () => {
    const c = ready();
    c.bank.silica!--;
    const bank = { ...c.bank };
    assert.ok(constructionLoadLock(c));
    assert.equal(beginRun(c, 1, null, true), false);
    assert.deepEqual(c.bank, bank);
    assert.equal(c.lunarShipment, null);
    c.bank.silica!++;
    assert.equal(constructionLoadLock(c), null);
    assert.equal(beginRun(c, 1, null, true), true);
    assert.ok(c.lunarShipment);
    assert.equal(c.activeRun!.freight, undefined);
    for (const t of LUNAR_PROCESSING) assert.equal(c.bank[t.resource], 0);
    assert.equal(c.story!.claimed.includes('lunar-equipment'), false);
    assert.equal(lunarProcessingReady(c.story!), false);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('fresh parcel is automatically towed, cannot be recycled at Satuk and cannot spawn the Mule early', () => {
    const { c, s } = launch();
    try {
        assert.equal(s.salvage.towed?.source, 'shipment');
        assert.equal(s.miningEscort, null);
        for (let i = 0; i < 30; i++) s.step(idle);
        assert.ok(c.lunarShipment);
        assert.equal(s.salvage.towing.size, 1);
        assert.equal(s.recycledWreck, undefined);
        assert.equal(c.activeRun!.deliveries, undefined);
    } finally {
        s.dispose();
    }
});
test('loose parts and player transfers cannot complete the parcel quest', () => {
    const c = ready();
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    const cargo = { ...c.bank };
    assert.equal(deliverLunarCargo(c, cargo), null);
    assert.equal(lunarProcessingReady(c.story!), false);
    assert.equal(c.story!.claimed.includes('lunar-equipment'), false);
});
test('parcel remains after damage, ship loss and save; next sortie can recover the same physical object without paying again', () => {
    const { c, s } = launch();
    const id = c.lunarShipment!.id;
    try {
        const item = s.salvage.towed!;
        s.salvage.detach();
        item.body.setTranslation({ x: 5, y: 2 }, true);
        s.step(idle);
        const point = salvagePosition(item);
        assert.equal(s.salvage.damage(item, 99999), false);
        assert.ok(s.salvage.items.has(id));
        finishRun(c, false, { ore: 0, parts: 0 }, 1, 'test');
        const saved = parseCampaign(JSON.stringify(c))!;
        assert.ok(saved);
        assert.equal(saved.lunarShipment!.id, id);
        assert.ok(
            Math.hypot(saved.lunarShipment!.x - point.x, saved.lunarShipment!.y - point.y) < 1,
        );
        saved.ship = newShip(saved.nextShipId++, 'prospector');
        saved.pilots = newStoryCampaign().pilots;
        saved.selectedPilot = saved.pilots[0].id;
        assert.equal(beginRun(saved, 2, null, true), false);
        assert.equal(beginRun(saved, 2), true);
        const next = new MissionSimulation(saved, saved.activeRun!.seed);
        try {
            assert.ok(next.salvage.items.has(id));
            assert.equal(next.salvage.towed, null);
            assert.equal(next.salvage.attach(next.salvage.items.get(id)!, next.ship), true);
            for (const t of LUNAR_PROCESSING) assert.equal(saved.bank[t.resource], 0);
        } finally {
            next.dispose();
        }
    } finally {
        s.dispose();
    }
});
test('contact with the lunar station automatically accepts even a detached parcel once, completes the quest and spawns the Mule', () => {
    const { c, s } = launch();
    try {
        const item = s.salvage.towed!;
        s.salvage.detach();
        s.area = 'surface';
        c.activeRun!.area = 'surface';
        s.ship.setTranslation({ x: MOON.exit.x / 100, y: MOON.exit.y / 100 }, true);
        item.body.setTranslation(
            { x: MOON.construction.x / 100, y: MOON.construction.y / 100 },
            true,
        );
        s.step(idle);
        assert.equal(c.lunarShipment, null);
        assert.equal(c.story!.claimed.includes('lunar-equipment'), true);
        assert.equal(lunarProcessingReady(c.story!), true);
        assert.ok(s.miningEscort);
        assert.equal(s.salvage.items.has(item.id), false);
        const mule = s.miningEscort;
        s.step(idle);
        assert.equal(s.miningEscort, mule);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    } finally {
        s.dispose();
    }
});
test('parcel travels through the Earth-Moon hypergate and retains one tow and one campaign identity', () => {
    const { c, s } = launch();
    try {
        for (const rock of s.rocks.values()) {
            s.world.removeRigidBody(rock.body);
            s.asteroidColliders.delete(rock.collider.handle);
        }
        s.rocks.clear();
        const lane = s.sector.hyperlanes[0],
            item = s.salvage.towed!;
        s.ship.setTranslation({ x: lane.a.x / 100, y: lane.a.y / 100 }, true);
        item.body.setTranslation({ x: lane.a.x / 100, y: (lane.a.y + 130) / 100 }, true);
        s.step(idle);
        assert.equal(s.hyperdriveLock, null);
        for (let i = 0; i < 121; i++) s.step({ ...idle, target: lane.a, interact: true });
        for (let i = 0; i < 200; i++) s.step(idle);
        assert.equal(s.ended, null);
        assert.equal(s.hyperdrive.state, 'idle');
        assert.ok(Math.hypot(s.position.x - lane.b.x, s.position.y - lane.b.y) < 5);
        assert.equal(s.salvage.towed?.id, c.lunarShipment!.id);
    } finally {
        s.dispose();
    }
});

test('landing keeps the parcel attached and persists its surface position before a refresh', () => {
    const { c, s } = launch();
    try {
        const item = s.salvage.towed!;
        s.ship.setTranslation({ x: MOON.entrance.x / 100, y: MOON.entrance.y / 100 }, true);
        item.body.setTranslation(
            { x: (MOON.entrance.x - 100) / 100, y: MOON.entrance.y / 100 },
            true,
        );
        s.step(idle);
        for (let i = 0; i < 130; i++) s.step({ ...idle, interact: true });
        assert.equal(s.area, 'surface');
        assert.equal(c.lunarShipment!.area, 'surface');
        assert.equal(s.salvage.towed?.id, item.id);
        assert.ok(
            Math.hypot(c.lunarShipment!.x - MOON.exit.x, c.lunarShipment!.y - MOON.exit.y) < 250,
        );
        const saved = parseCampaign(JSON.stringify(c))!;
        assert.ok(saved);
        finishRun(saved, false, { ore: 0, parts: 0 }, 0, 'refresh');
        assert.ok(saved.lunarShipment);
        assert.equal(saved.lunarShipment.area, 'surface');
        assert.equal(saved.story!.claimed.includes('lunar-equipment'), false);
    } finally {
        s.dispose();
    }
});
test('a full ordinary wreck pool cannot prevent the story parcel from spawning and attaching', () => {
    const c = ready();
    assert.equal(beginRun(c, 1, null, true), true);
    for (let i = 0; i < 12; i++)
        c.worldSalvage.push({
            id: c.nextSalvageId++,
            seed: c.activeRun!.seed,
            x: 600 + i * 100,
            y: 400,
            source: 'patrol',
        });
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.salvage.towed?.id, c.lunarShipment!.id);
    } finally {
        s.dispose();
    }
});
