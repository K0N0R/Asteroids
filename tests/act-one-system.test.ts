import { selectableMission } from '../frontend/game/state/missionOrders';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    deliverSalvage,
    buyShip,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    storyVisibleTasks,
    travelStory,
    storySectorUnlocked,
    syncStory,
    actOneComplete,
    storyObjectives,
} from '../frontend/game/state/story';
import {
    earthSystemLanes,
    earthSystemZones,
    SATELLITES,
    LUNAR_PROBE,
    ASTEROID_FIELD,
} from '../frontend/game/worlds/earthSystem';
import { MOON } from '../frontend/game/worlds/moon';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { HULL_CONSTRUCTION } from '../frontend/game/state/fleetConstruction';
import { segmentDistance } from '../frontend/game/systems/hyperdrive';
import { DIALOGUES, completeDialogue, pendingDialogue } from '../frontend/game/state/dialogues';
import { grantLunarProcessing } from './fleet-fixtures';
before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function claim(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const t = STORY_TASKS.find((t) => t.id === id)!;
    c.story!.progress[id] = t.target;
    if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
}
function ready(probe = false) {
    const c = newStoryCampaign();
    claim(c, 'earth-supply');
    claim(c, 'earth-relay');
    c.station.workshop = 1;
    syncStory(c);
    if (probe) {
        claim(c, 'earth-route');
        claim(c, 'lunar-survey');
    }
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function step(s: MissionSimulation, n = 1, input: FlightInput = idle) {
    for (let i = 0; i < n; i++) {
        s.step(input);
        s.events.length = 0;
    }
}
function clear(s: MissionSimulation) {
    for (const r of s.rocks.values()) {
        s.world.removeRigidBody(r.body);
        s.asteroidColliders.delete(r.collider.handle);
    }
    s.rocks.clear();
    for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
}
function tune(s: MissionSimulation, point: { x: number; y: number }) {
    at(s, point);
    step(s);
    step(s, 1, { ...idle, interact: true });
    const t = s.relayTuning;
    assert.ok(t, 'E opens satellite tuning');
    for (let channel = 0; channel < 3; channel++)
        while (t.phases[channel] !== t.targets[channel]) s.relayAction({ channel, delta: 1 });
    assert.ok(s.relayAction({ confirm: true }));
    step(s, 3);
}

test('one continuous Earth–Moon journal, one initial satellite and two staged route unlocks', () => {
    const c = newStoryCampaign(),
        p = c.story!;
    assert.equal(generateStorySector(p).hyperlanes.length, 0);
    assert.equal(generateStorySector(p).landmarks.filter((l) => l.kind === 'relay').length, 1);
    assert.equal(travelStory(c, 'lunar'), false);
    const initial = earthSystemZones(p);
    claim(c, 'earth-relay');
    assert.equal(earthSystemLanes(p).length, 2);
    assert.ok(earthSystemZones(p).length > initial.length);
    assert.ok(storyVisibleTasks(p).some((t) => t.id === 'lunar-survey'));
    assert.ok(storyVisibleTasks(p).some((t) => t.id === 'earth-salvage' && !t.required));
    assert.equal(travelStory(c, 'lunar'), false);
    claim(c, 'earth-route');
    assert.ok(selectableMission(c, 'lunar-survey'));
    assert.equal(storySectorUnlocked(p, 'mars'), false);
    const before = earthSystemZones(p).find((z) => z.name === 'Orbita Księżyca')!.radius;
    claim(c, 'earth-route');
    claim(c, 'lunar-survey');
    assert.equal(earthSystemLanes(p).length, 3);
    assert.ok(earthSystemZones(p).find((z) => z.name === 'Orbita Księżyca')!.radius > before);
    const world = generateStorySector(p);
    assert.ok(world.landmarks.some((l) => l.area === 'surface' && l.kind === 'construction'));
    assert.ok(
        world.rocks.some(
            (r) =>
                r.radius >= 150 && Math.hypot(r.x - ASTEROID_FIELD.x, r.y - ASTEROID_FIELD.y) < 500,
        ),
    );
    for (const lane of world.hyperlanes) {
        for (const endpoint of [lane.a, lane.b])
            assert.ok(
                earthSystemZones(p).some(
                    (z) => Math.hypot(endpoint.x - z.x, endpoint.y - z.y) < z.radius,
                ),
            );
        assert.ok(world.rocks.every((r) => segmentDistance(r, lane.a, lane.b) > r.radius + 110));
    }
});

test('actual Earth satellite tuning opens gates live; stock Prospector arrives and tunes separate lunar probe', () => {
    const c = newStoryCampaign();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed),
        run = c.activeRun;
    try {
        clear(s);
        tune(s, { x: 750, y: 650 });
        assert.ok(c.story!.claimed.includes('earth-relay'));
        assert.equal(s.sector.hyperlanes.length, 2);
        assert.equal(
            [...s.salvage.items.values()].filter((i) => i.source === 'satellite').length,
            3,
        );
        const lane = s.sector.hyperlanes[0];
        at(s, lane.a);
        step(s);
        step(s, 1, { ...idle, hyperdrive: true });
        step(s, 150);
        assert.equal(s.ended, null);
        assert.ok(Math.hypot(s.position.x - lane.b.x, s.position.y - lane.b.y) < 1);
        assert.ok(c.story!.claimed.includes('earth-route'));
        assert.equal(c.story!.claimed.includes('lunar-survey'), false);
        assert.equal(s.surfaceUnlocked, false);
        tune(s, LUNAR_PROBE);
        assert.ok(c.story!.claimed.includes('lunar-survey'));
        assert.ok(s.surfaceUnlocked);
        assert.equal(s.sector.hyperlanes.length, 3);
        assert.equal(c.activeRun, run);
        assert.equal(c.story!.sector, 'earth');
        assert.equal(c.station.workshop, 0);
        assert.equal(c.ship!.hull, 'prospector');
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('satellite tow crosses gate safely and is physically delivered at Satuk 15 exactly once', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        clear(s);
        const lane = s.sector.hyperlanes[1],
            sat = SATELLITES[0];
        const item = s.salvage.items.get(sat.id)!;
        assert.ok(item);
        at(s, lane.b);
        item.body.setTranslation({ x: (lane.b.x + 100) / 100, y: lane.b.y / 100 }, true);
        assert.ok(s.salvage.attach(item, s.ship));
        step(s);
        assert.equal(s.hyperdriveLock, null);
        step(s, 1, { ...idle, hyperdrive: true });
        step(s, 150);
        assert.equal(s.ended, null);
        assert.ok(Math.hypot(s.position.x - lane.a.x, s.position.y - lane.a.y) < 1);
        assert.ok(s.salvage.towing.has(item.id));
        assert.ok(
            Math.hypot(
                item.body.translation().x * 100 - s.position.x,
                item.body.translation().y * 100 - s.position.y,
            ) < 250,
        );
        at(s, { x: 100, y: 0 });
        item.body.setTranslation({ x: 1.7, y: 0 }, true);
        item.body.setLinvel({ x: 0, y: 0 }, true);
        step(s, 3, { ...idle, unload: true });
        assert.ok(c.story!.claimed.includes(sat.task));
        assert.equal(c.bank.parts, 3);
        assert.equal(c.bank.storageFrames, 1);
        assert.equal(deliverSalvage(c, sat.id, 'satellite'), null);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('three optional satellite deliveries fund Swift with no duplicate or missing parts', () => {
    const c = ready();
    beginRun(c, 1);
    for (const sat of SATELLITES) assert.ok(deliverSalvage(c, sat.id, 'satellite'));
    for (const [id, count] of Object.entries(HULL_CONSTRUCTION.swift))
        assert.equal(c.bank[id as keyof typeof c.bank] ?? 0, count);
    assert.ok(c.story!.claimed.includes('earth-salvage'));
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock');
    assert.ok(buyShip(c, 'swift'));
    assert.ok(parseCampaign(JSON.stringify(c)));
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(
            [...s.salvage.items.values()].filter((i) => i.source === 'satellite').length,
            0,
        );
    } finally {
        s.dispose();
    }
});

test('lunar landing stays in Earth sortie; completed construction automatically launches attack and unlocks Mars after victory', () => {
    const c = ready(true);
    grantLunarProcessing(c);
    claim(c, 'lunar-foundation');
    claim(c, 'lunar-installations');
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        clear(s);
        at(s, MOON.entrance);
        step(s);
        step(s, 125, { ...idle, interact: true });
        assert.equal(s.area, 'surface');
        while (s.transferActive) step(s);
        assert.equal(c.activeRun!.sector, 'earth');
        at(s, { x: MOON.construction.x + 160, y: MOON.construction.y });
        step(s);
        step(s, 200, { ...idle, interact: true });
        step(s, 150);
        assert.ok(c.story!.claimed.includes('lunar-commission'));
        assert.ok(
            s.lunarAssault.active,
            'enemy attack starts without G or optional asteroid waves',
        );
        assert.equal(c.story!.claimed.includes('lunar-defense'), false);
        for (let i = 0; i < 3000 && s.lunarAssault.state !== 'complete'; i++) {
            for (const id of [...s.lunarAssault.enemies]) s.enemies.remove(id);
            step(s);
        }
        assert.equal(s.lunarAssault.state, 'complete');
        step(s, 10);
        assert.ok(c.story!.claimed.includes('lunar-attack'));
        assert.ok(actOneComplete(c.story!));
        assert.equal(c.story!.claimed.includes('earth-salvage'), false);
        assert.ok(storySectorUnlocked(c.story!, 'mars'));
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
    finishRun(c, true, { ore: 0, parts: 0 }, 40, 'dock');
    for (const d of DIALOGUES.filter(
        (d) => d.sector === 'earth' && d.id !== 'earth-act-one-finale',
    ))
        completeDialogue(c, d.id);
    assert.equal(pendingDialogue(c)?.id, 'earth-act-one-finale');
    assert.ok(completeDialogue(c, 'earth-act-one-finale'));
    assert.ok(travelStory(c, 'mars'));
    assert.ok(travelStory(c, 'earth'));
});

test('optional upgrade credit and HUD are independent of collected ore; obsolete saves rejected', () => {
    const c = ready();
    c.ship!.engine = 1;
    syncStory(c);
    assert.ok(c.story!.claimed.includes('earth-ship-upgrade'));
    const salvage = storyObjectives(c, [], false, 0, false, false, [], 99).find(
        (t) => t.id === 'earth-salvage',
    )!;
    assert.equal(salvage.progress, '0/3');
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 58 })), null);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
