import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    deliverSalvage,
    emergencyKit,
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    syncStory,
    travelStory,
    storyTaskAvailable,
    acknowledgeStoryBriefing,
    storySectorUnlocked,
    validStory,
} from '../frontend/game/state/story';
import {
    MARS_ACT as M,
    phobosRouteOpen,
    phobosOrbitSecured,
    MARS_AMBUSH,
    MARS_SURFACE_PATROLS,
    MARS_YARD_PATROLS,
} from '../frontend/game/state/marsAct';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { solveTerminal } from './terminal-test-helper';
import { marsOrbitAt } from '../frontend/game/worlds/marsLayout';
import { MARS_MAPS, MARS_GATES } from '../frontend/game/worlds/marsLayout';
import { PHOBOS_MAZE_GATE } from '../frontend/game/worlds/phobosMaze';
import { migrateMarsLayout } from '../frontend/game/state/marsLayoutMigration';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import { MARS_MOONS } from '../frontend/game/worlds/marsMoons';
import { marsCelestialBodies } from '../frontend/game/worlds/celestialBodies';
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
before(async () => RAPIER.init());
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter((t) => t.act === 1)) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    assert.ok(travelStory(c, 'mars'));
    assert.ok(validStory(c.story));
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function openPhobos(c: ReturnType<typeof ready>) {
    c.station.shield = true;
    c.story!.mars.landingBlocked = true;
    syncStory(c);
}
function orbitSecured(c: ReturnType<typeof ready>) {
    openPhobos(c);
    c.story!.mars.ambushEntered = true;
    c.story!.mars.kills.push(...MARS_AMBUSH);
    syncStory(c);
}
function ai(c: ReturnType<typeof ready>) {
    orbitSecured(c);
    c.story!.mars.baseNeutralized = true;
    c.story!.mars.kills.push(...MARS_SURFACE_PATROLS);
    c.story!.mars.memoryDelivered = true;
    syncStory(c);
    assert.ok(c.story!.mars.aiIdentified);
}
function spawn(c: ReturnType<typeof ready>) {
    assert.ok(beginRun(c, 123));
    return new MissionSimulation(c, c.activeRun!.seed);
}
function move(s: MissionSimulation, p: { x: number; y: number }) {
    if (s.area === 'orbit' && marsOrbitAt(p)) s.marsOrbit = marsOrbitAt(p)!.id;
    if (s.area === 'surface') s.marsOrbit = 'phobos';
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
test('two independent opening conditions reveal Phobos; orbit begins peaceful', () => {
    const c = ready(),
        p = c.story!;
    assert.equal(generateStorySector(p).enemies.length, 0);
    assert.equal(
        generateStorySector(p).hyperlanes.some((l) => l.name.includes('Fobosa')),
        false,
    );
    assert.equal(hullUnlocked(c, 'fighter'), false);
    assert.equal(hullUnlocked(c, 'tug'), false);
    p.mars.landingBlocked = true;
    syncStory(c);
    assert.equal(phobosRouteOpen(p), false);
    c.station.shield = true;
    syncStory(c);
    assert.ok(phobosRouteOpen(p));
    assert.ok(hullUnlocked(c, 'fighter'));
    assert.ok(hullUnlocked(c, 'tug'));
    assert.equal(generateStorySector(p).enemies.length, 3);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('shields before the barrier also work and no industrial route leaks early', () => {
    const c = ready();
    c.station.shield = true;
    syncStory(c);
    assert.equal(phobosRouteOpen(c.story!), false);
    c.story!.mars.landingBlocked = true;
    syncStory(c);
    assert.ok(phobosRouteOpen(c.story!));
    assert.ok(
        generateStorySector(c.story!).hyperlanes.some((l) => l.name === 'Mars — orbita Fobosa'),
    );
    assert.ok(!generateStorySector(c.story!).landmarks.some((l) => l.kind === 'factory'));
});
test('defeated Phobos patrols persist; landing needs all three', () => {
    const c = ready();
    openPhobos(c);
    c.story!.mars.ambushEntered = true;
    c.story!.mars.kills.push(71000);
    syncStory(c);
    assert.equal(generateStorySector(c.story!).enemies.length, 2);
    assert.equal(phobosOrbitSecured(c.story!), false);
    c.story!.mars.kills.push(71001, 71002);
    syncStory(c);
    assert.ok(phobosOrbitSecured(c.story!));
    assert.ok(storyTaskAvailable(c.story!, STORY_TASKS.find((t) => t.id === 'mars-phobos-base')!));
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('base destruction alone never completes memory delivery or enables assimilation', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.enemyFactory!.damage(s.enemyFactory!.health);
    s.marsAct!.factoryDestroyed();
    assert.ok(c.story!.mars.baseNeutralized);
    assert.equal(c.story!.mars.aiIdentified, false);
    assert.ok(!c.story!.claimed.includes('mars-phobos-base'));
    const memory = s.salvage.items.get(M.memoryId);
    assert.ok(memory);
    assert.equal(s.marsAct!.deliver(M.memoryId), false);
    s.dispose();
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost');
    c.bank.ore = 0;
    emergencyKit(c);
    const retry = spawn(c);
    assert.ok(retry.salvage.items.has(M.memoryId));
    retry.dispose();
});
test('physical memory docking unlocks analysis only after return to Satuk', () => {
    const c = ready();
    orbitSecured(c);
    c.story!.mars.baseNeutralized = true;
    const s = spawn(c),
        memory = s.salvage.items.get(M.memoryId)!;
    memory.body.setTranslation({ x: 0, y: 0 }, true);
    assert.ok(s.marsAct!.deliver(M.memoryId));
    assert.ok(c.story!.claimed.includes('mars-phobos-base'));
    assert.equal(c.story!.mars.aiIdentified, false);
    s.dispose();
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
    syncStory(c);
    assert.ok(c.story!.mars.aiIdentified);
    assert.equal(
        generateStorySector(c.story!).enemies.filter((e) => e.id >= 72000 && e.id < 73000).length,
        12,
    );
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('all required surviving patrols must be eliminated after factory destruction', () => {
    const c = ready();
    ai(c);
    c.story!.mars.yardDestroyed = true;
    syncStory(c);
    assert.ok(!c.story!.claimed.includes('mars-sector-secure'));
    c.story!.mars.kills.push(...MARS_YARD_PATROLS);
    syncStory(c);
    assert.ok(c.story!.claimed.includes('mars-sector-secure'));
    assert.equal(storySectorUnlocked(c.story!, 'venus'), false);
    c.story!.mars.researchWaves = 3;
    c.story!.mars.researchSites = 3;
    syncStory(c);
    assert.ok(acknowledgeStoryBriefing(c));
    assert.ok(storySectorUnlocked(c.story!, 'venus'));
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('live layout reveals gates and first ambush without restarting the sortie', () => {
    const c = ready();
    c.station.shield = true;
    syncStory(c);
    const s = spawn(c);
    move(s, M.landing);
    s.marsAct!.update(idle, 0.02);
    assert.ok(s.sector.hyperlanes.some((l) => l.name === 'Mars — orbita Fobosa'));
    assert.equal(s.enemies.enemies.size, 3);
    move(s, M.phobos);
    s.marsAct!.update(idle, 0.02);
    assert.ok(c.story!.mars.ambushEntered);
    s.dispose();
});
test('silent terminal route neutralizes the base without production or radio completion', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, M.terminal);
    s.marsAct!.update({ ...idle, interact: true }, 0.01);
    solveTerminal(s);
    assert.ok(c.story!.mars.quietHack);
    assert.ok(c.story!.mars.baseNeutralized);
    assert.equal(c.story!.mars.memoryDelivered, false);
    assert.equal(s.enemyFactory!.launched, 0);
    assert.ok(MARS_SURFACE_PATROLS.every((id) => !s.enemies.enemies.has(id)));
    const disabled = c.worldSalvage.filter((item) => item.source === 'patrol');
    assert.equal(disabled.length, 4);
    assert.ok(disabled.every((item) => item.area === 'surface' && s.salvage.items.has(item.id)));
    assert.ok(parseCampaign(JSON.stringify(c)));
    s.dispose();
});
test('research waves remain finite and survive a later sortie through stable identities', () => {
    const c = ready();
    ai(c);
    c.story!.mars.yardDestroyed = true;
    c.story!.mars.kills.push(...MARS_YARD_PATROLS);
    syncStory(c);
    const s = spawn(c);
    s.escort!.state = 'research';
    s.escort!.body.setTranslation({ x: M.research[0].x / 100, y: M.research[0].y / 100 }, true);
    s.marsAct!.update(idle, 0.02);
    s.marsAct!.update(idle, 0.02);
    assert.equal(c.story!.mars.researchWaves, 1);
    assert.equal([...s.enemies.enemies.keys()].filter((id) => id >= 74010).length, 2);
    c.story!.mars.kills.push(74010);
    s.dispose();
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost');
    c.bank.ore = 0;
    emergencyKit(c);
    const retry = spawn(c);
    assert.ok(retry.enemies.enemies.has(74011));
    assert.ok(!retry.enemies.enemies.has(74010));
    assert.equal(c.story!.mars.researchSites, 0);
    retry.dispose();
});
test('journal 29 migrates a partial Mars campaign without losing inventory or ships', () => {
    const c = ready(),
        old = JSON.parse(JSON.stringify(c));
    old.story.version = 29;
    delete old.story.mars;
    for (const t of STORY_TASKS.filter((t) => t.act === 2 && t.id !== 'earth-debrief'))
        delete old.story.progress[t.id];
    for (const id of ['mars-trail', 'mars-patrol', 'mars-belt', 'mars-factory', 'mars-reserve'])
        old.story.progress[id] = 0;
    old.story.progress['mars-trail'] = 1;
    old.story.claimed.push('mars-trail');
    const loaded = parseCampaign(JSON.stringify(old));
    assert.ok(loaded);
    assert.equal(loaded.story!.version, 31);
    assert.deepEqual(loaded.bank, c.bank);
    assert.deepEqual(loaded.ship, c.ship);
    assert.equal(loaded.story!.mars.aiIdentified, false);
    assert.equal(generateStorySector(loaded.story!).enemies.length, 0);
});
test('journal migration preserves an already finished old Mars chain and later travel', () => {
    const c = ready(),
        old = JSON.parse(JSON.stringify(c));
    old.story.version = 29;
    delete old.story.mars;
    for (const t of STORY_TASKS.filter((t) => t.act === 2 && t.id !== 'earth-debrief'))
        delete old.story.progress[t.id];
    for (const [id, target] of [
        ['mars-trail', 1],
        ['mars-patrol', 2],
        ['mars-belt', 1],
        ['mars-factory', 0],
        ['mars-reserve', 0],
    ] as const) {
        old.story.progress[id] = target;
        if (target) old.story.claimed.push(id);
    }
    const loaded = parseCampaign(JSON.stringify(old));
    assert.ok(loaded);
    assert.ok(loaded.story!.claimed.includes('mars-anomaly-research'));
    assert.ok(acknowledgeStoryBriefing(loaded));
    assert.ok(storySectorUnlocked(loaded.story!, 'venus'));
    assert.ok(parseCampaign(JSON.stringify(loaded)));
});
test('physical memory retains its last position after loss, and a damaged base retains health', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.enemyFactory!.damage(250);
    s.marsAct!.update(idle, 0.02);
    assert.equal(c.story!.mars.baseHealth, 650);
    s.enemyFactory!.damage(650);
    s.marsAct!.factoryDestroyed();
    const memory = s.salvage.items.get(M.memoryId)!;
    memory.body.setTranslation({ x: 50, y: 20 }, true);
    s.marsAct!.update(idle, 0.02);
    s.dispose();
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost');
    c.bank.ore = 0;
    emergencyKit(c);
    const retry = spawn(c),
        recovered = retry.salvage.items.get(M.memoryId)!;
    assert.equal(recovered.body.translation().x, 50);
    assert.equal(recovered.body.translation().y, 20);
    retry.dispose();
});
test('combat alarm produces durable reinforcements instead of allowing a silent bypass', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, { x: M.base.x + 300, y: M.base.y });
    s.hull = 1000;
    s.step({ ...idle, fire: true });
    for (let i = 0; i < 430 && !s.ended; i++) s.step(idle);
    assert.ok(c.story!.mars.baseAlarm);
    assert.ok(c.story!.mars.reinforcements.length > 0);
    assert.equal(c.story!.mars.quietHack, false);
    const ids = c.story!.mars.reinforcements.map((e) => e.id);
    s.dispose();
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
    const retry = spawn(c);
    assert.ok(ids.every((id) => retry.enemies.enemies.has(id)));
    retry.dispose();
});
test('the actual simulation completes three separate escorted measurements and unlocks the briefing', () => {
    const c = ready();
    ai(c);
    c.story!.mars.yardDestroyed = true;
    c.story!.mars.kills.push(...MARS_YARD_PATROLS);
    syncStory(c);
    const s = spawn(c);
    for (let site = 0; site < 3; site++) {
        const point = M.research[site],
            e = s.escort!;
        e.state = 'research';
        e.researchProgress = 0;
        e.body.setTranslation({ x: point.x / 100, y: point.y / 100 }, true);
        e.body.setLinvel({ x: 0, y: 0 }, true);
        move(s, { x: point.x + 90, y: point.y });
        for (let i = 0; i < 850 && c.story!.mars.researchSites === site && !s.ended; i++) {
            for (const id of [...s.enemies.enemies.keys()]) {
                s.enemies.remove(id);
                s.marsAct!.killed(id);
            }
            s.step(idle);
        }
        assert.equal(s.ended, null);
        assert.equal(c.story!.mars.researchSites, site + 1);
    }
    assert.equal(c.story!.mars.researchWaves, 3);
    assert.ok(c.story!.claimed.includes('mars-anomaly-research'));
    s.dispose();
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
    assert.ok(acknowledgeStoryBriefing(c));
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('AI hull adaptation is gated by the physical analysis while ordinary material salvage remains available', () => {
    const before = ready();
    openPhobos(before);
    spawn(before).dispose();
    for (let id = 1; id <= 24; id++) assert.ok(deliverSalvage(before, id, 'patrol'));
    assert.equal(before.reserveShips.length, 0);
    const after = ready();
    ai(after);
    spawn(after).dispose();
    for (let id = 1; id <= 24; id++) assert.ok(deliverSalvage(after, id, 'patrol'));
    assert.ok(after.reserveShips.some((ship) => ship.hull === 'raider'));
});

test('Phobos has dedicated approach artwork and real reversible orbit/surface transfers', () => {
    for (const body of [MARS_MOONS.phobos]) {
        const c = ready();
        orbitSecured(c);
        const s = spawn(c);
        const artwork = marsCelestialBodies('phobos').find((v) => v.id === body.id)!;
        assert.deepEqual(artwork.anchor, body.entrance);
        assert.ok(!s.sector.hyperlanes.some((l) => l.name === 'Lądowanie na Fobosie'));
        move(s, body.entrance);
        assert.equal(s.nearbyPassage?.surfaceBody, body.id);
        s.step(idle);
        for (let i = 0; i < 130; i++) s.step({ ...idle, interact: true });
        assert.equal(s.area, 'surface');
        assert.equal(s.marsMoon?.id, body.id);
        assert.deepEqual(s.mapCenter, body.center);
        assert.equal(s.sectorRadius, body.radius);
        assert.ok(Math.hypot(s.position.x - body.exit.x, s.position.y - body.exit.y) < 10);
        assert.ok(s.landmarks.every((l) => l.surfaceBody === body.id));
        assert.ok(s.hyperdriveLock);
        assert.ok(s.notice.includes(body.name));
        assert.ok(parseCampaign(JSON.stringify(c)), `${body.id}: landed save remains valid`);
        for (let i = 0; i < 220; i++) s.step(idle);
        // Releasing E is required, just as for the Moon; holding it cannot bounce back.
        for (let i = 0; i < 130; i++) s.step({ ...idle, interact: true });
        assert.equal(s.area, 'orbit');
        assert.ok(Math.hypot(s.position.x - body.entrance.x, s.position.y - body.entrance.y) < 10);
        assert.equal(c.activeRun!.area, undefined);
        s.dispose();
    }
});

test('Phobos landing remains locked until the ambush is cleared and cannot be bypassed by flying to its ground', () => {
    const c = ready();
    openPhobos(c);
    const s = spawn(c);
    move(s, M.phobos);
    assert.equal(s.nearbyPassage, undefined);
    move(s, M.surface);
    s.marsAct!.update(idle, 0.02);
    assert.equal(s.area, 'orbit');
    assert.equal(c.story!.mars.baseDiscovered, false);
    assert.ok(Math.hypot(s.position.x - M.surface.x, s.position.y - M.surface.y) > 1900);
    s.dispose();
});

test('return from Phobos carries the physical memory and keeps cargo and damage', () => {
    const c = ready();
    orbitSecured(c);
    c.story!.mars.baseNeutralized = true;
    const s = spawn(c),
        body = MARS_MOONS.phobos;
    s.area = 'surface';
    move(s, body.exit);
    s.hull = 42;
    s.cargo.ore = 7;
    const memory = s.salvage.items.get(M.memoryId)!;
    memory.body.setTranslation({ x: (body.exit.x - 100) / 100, y: body.exit.y / 100 }, true);
    assert.ok(s.salvage.attach(memory, s.ship));
    s.step(idle);
    for (let i = 0; i < 160 && s.area === 'surface'; i++) s.step({ ...idle, interact: true });
    assert.equal(s.area, 'orbit');
    assert.equal(s.cargo.ore, 7);
    assert.equal(s.hull, 42);
    assert.ok(s.salvage.towing.has(M.memoryId));
    assert.ok(
        Math.hypot(
            memory.body.translation().x * 100 - body.entrance.x,
            memory.body.translation().y * 100 - body.entrance.y,
        ) < 300,
    );
    assert.equal(c.story!.mars.memoryDelivered, false);
    s.dispose();
});

test('loss on Phobos saves a recovery signal at that moon instead of moving it to the Moon', () => {
    for (const body of [MARS_MOONS.phobos]) {
        const c = ready();
        orbitSecured(c);
        const s = spawn(c);
        s.area = 'surface';
        move(s, body.exit);
        c.activeRun!.area = 'surface';
        c.activeRun!.lastPosition = s.position;
        const saved = JSON.parse(JSON.stringify(c));
        assert.ok(parseCampaign(JSON.stringify(saved)));
        s.dispose();
        let found = false;
        for (let pilotId = 1; pilotId < 20 && !found; pilotId++) {
            const copy = structuredClone(saved);
            // Keep sector seed fixed in the saved result; deterministic identities vary survival.
            copy.activeRun.pilotId = copy.pilots[0].id = pilotId;
            copy.selectedPilot = pilotId;
            copy.nextPilotId = pilotId + 1;
            finishRun(copy, false, { ore: 0, parts: 0 }, 1, 'lost', { lossPosition: body.exit });
            const signal = copy.recoverySignals[0];
            if (!signal) continue;
            found = true;
            assert.equal(signal.area, 'surface');
            assert.ok(
                Math.hypot(signal.x - body.center.x, signal.y - body.center.y) <=
                    body.radius - 200 + 1e-8,
            );
            assert.ok(parseCampaign(JSON.stringify(copy)));
        }
        assert.ok(found);
    }
});

test('Mars contamination is 1.5 times boundary damage, bypasses full shields and caps boosted speed', () => {
    const c = ready(),
        s = spawn(c),
        outside = spawn(ready());
    move(s, { x: 4500, y: -5000 });
    s.ship.setLinvel({ x: 10, y: 0 }, true);
    move(outside, { x: 15000, y: 0 });
    const shield = s.kineticShield.charge,
        hull = s.hull,
        other = outside.hull;
    for (let i = 0; i < 60; i++) {
        s.step({ ...idle, thrust: true, boost: true, target: { x: 9000, y: -5000 } });
        outside.step(idle);
        assert.ok(s.speed <= 25 + 1e-6);
    }
    assert.ok(Math.abs(hull - s.hull - 15) < 1e-6);
    assert.ok(Math.abs(other - outside.hull - 10) < 1e-6);
    assert.equal(s.kineticShield.charge, shield);
    assert.equal(s.statistics.shieldDamage, 0);
    move(s, { x: 1800, y: -1000 });
    const after = s.hull;
    s.step(idle);
    assert.equal(s.hull, after);
    s.dispose();
    outside.dispose();
});

test('the Phobos gate at the maze exit still performs its calibrated jump without contamination during hyperspace', () => {
    const c = ready();
    openPhobos(c);
    const s = spawn(c);
    const lane = s.sector.hyperlanes.find((l) => l.name === 'Mars — orbita Fobosa')!;
    move(s, lane.a);
    const hp = s.hull;
    s.step({ ...idle, hyperdrive: true });
    assert.ok(s.hyperdrive.active);
    for (let i = 0; i < 240 && s.hyperdrive.active; i++) s.step(idle);
    assert.equal(s.hyperdrive.active, false);
    assert.equal(s.hull, hp);
    assert.ok(Math.hypot(s.position.x - lane.b.x, s.position.y - lane.b.y) < 30);
    s.dispose();
});

test('actual gates change orbital bounds and allow towing disabled drones back to Mars', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    move(s, PHOBOS_MAZE_GATE);
    s.step({ ...idle, hyperdrive: true });
    for (let i = 0; i < 200; i++) s.step(idle);
    assert.equal(s.marsOrbit, 'phobos');
    assert.deepEqual(s.mapCenter, MARS_MAPS.phobos.center);
    assert.equal(s.sectorRadius, 2800);
    assert.ok(s.landmarks.every((l) => s.inCurrentMap(l)));
    assert.equal(s.nearbyPassage, undefined);
    const drone = s.salvage.add(
        100999,
        'patrol',
        { x: s.position.x - 80, y: s.position.y },
        { x: 0, y: 0 },
    );
    assert.ok(s.salvage.attach(drone, s.ship));
    assert.equal(s.hyperdriveLock, null);
    s.step({ ...idle, hyperdrive: true });
    for (let i = 0; i < 200; i++) s.step(idle);
    assert.equal(s.marsOrbit, 'mars');
    assert.deepEqual(s.mapCenter, MARS_MAPS.mars.center);
    assert.equal(s.sectorRadius, 9000);
    assert.ok(s.salvage.towing.has(drone.id));
    assert.ok(
        Math.hypot(
            drone.body.translation().x * 100 - s.position.x,
            drone.body.translation().y * 100 - s.position.y,
        ) < 300,
    );
    s.dispose();
});

test('the industrial map is dense, uncontaminated, and reachable through its own reversible gate', () => {
    const c = ready();
    ai(c);
    const s = spawn(c);
    move(s, MARS_GATES.asteroidExit);
    s.step({ ...idle, hyperdrive: true });
    for (let i = 0; i < 200; i++) s.step(idle);
    assert.equal(s.marsOrbit, 'asteroid');
    assert.equal(s.sectorRadius, 1800);
    assert.equal(s.marsAnomalies.length, 0);
    assert.equal(s.marsMoon, null);
    assert.ok(s.sector.rocks.filter((r) => marsOrbitAt(r)?.id === 'asteroid').length > 150);
    assert.ok(s.sector.rocks.some((r) => r.radius === 420 && r.anchored));
    assert.ok(MARS_YARD_PATROLS.every((id) => s.enemies.enemies.has(id)));
    s.step({ ...idle, hyperdrive: true });
    for (let i = 0; i < 200; i++) s.step(idle);
    assert.equal(s.marsOrbit, 'phobos');
    s.dispose();
});

test('terminal timer raises an alarm, while waiting beside the console never auto-hacks', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, M.terminal);
    s.marsAct!.security.disabledTime = 100;
    s.marsAct!.update(idle, 6);
    assert.equal(c.story!.mars.baseNeutralized, false);
    s.marsAct!.update({ ...idle, interact: true }, 0.01);
    assert.ok(s.terminalPuzzle);
    s.marsAct!.update(idle, 16);
    assert.equal(c.story!.mars.baseAlarm, true);
    assert.equal(s.terminalPuzzle, null);
    assert.equal(c.story!.mars.quietHack, false);
    s.dispose();
});

test('journal 30 relocates orbital items but preserves Phobos surface and finished patrols', () => {
    const old: any = {
        story: {
            version: 30,
            mars: {
                memoryPosition: { x: 6500, y: 100 },
                baseNeutralized: true,
                kills: [],
                reinforcements: [{ id: 73001, x: -500, y: 6500 }],
            },
        },
        worldSalvage: [
            { seed: 150073, x: 6500, y: 0 },
            { seed: 150073, area: 'surface', x: 6600, y: 6220 },
        ],
        recoverySignals: [{ seed: 150073, area: 'surface', x: -24000, y: 24000 }],
        activeRun: { sector: 'mars', lastPosition: { x: -500, y: 6500 } },
    };
    migrateMarsLayout(old);
    assert.equal(old.story.version, 31);
    assert.deepEqual(old.story.mars.memoryPosition, { x: 30000, y: 100 });
    assert.equal(old.story.mars.reinforcements[0].x, 60000);
    assert.equal(old.worldSalvage[0].x, 30000);
    assert.equal(old.worldSalvage[1].x, 6600);
    assert.deepEqual(old.activeRun.lastPosition, { x: 60000, y: 0 });
    assert.equal(old.recoverySignals[0].area, undefined);
    assert.ok(MARS_SURFACE_PATROLS.every((id) => old.story.mars.kills.includes(id)));
    const once = JSON.stringify(old);
    migrateMarsLayout(old);
    assert.equal(JSON.stringify(old), once);
});

test('loss on each separated orbit keeps a valid local recovery position', () => {
    for (const map of ['phobos', 'asteroid'] as const) {
        const c = ready();
        ai(c);
        const s = spawn(c);
        const center = MARS_MAPS[map].center;
        move(s, { x: center.x + 300, y: center.y + 300 });
        c.activeRun!.lastPosition = s.position;
        s.dispose();
        const saved = structuredClone(c);
        let found = false;
        for (let i = 1; i < 20 && !found; i++) {
            const copy = structuredClone(saved);
            copy.activeRun!.pilotId = copy.pilots[0].id = i;
            copy.selectedPilot = i;
            copy.nextPilotId = i + 1;
            finishRun(copy, false, { ore: 0, parts: 0 }, 1, 'lost');
            const signal = copy.recoverySignals.at(-1);
            if (!signal) continue;
            found = true;
            assert.equal(marsOrbitAt(signal)?.id, map);
            assert.ok(parseCampaign(JSON.stringify(copy)));
        }
        assert.ok(found);
    }
});

test('Kepler does not exist before the escort mission and appears when it unlocks live', () => {
    const c = ready();
    ai(c);
    const s = spawn(c);
    assert.equal(s.escort, null);
    c.story!.mars.yardDestroyed = true;
    c.story!.mars.kills.push(...MARS_YARD_PATROLS);
    syncStory(c);
    s.marsAct!.update(idle, 0.01);
    assert.ok(s.escort);
    assert.equal(s.escort.state, 'idle');
    const escort = s.escort;
    s.marsAct!.update(idle, 0.01);
    assert.equal(s.escort, escort);
    s.dispose();
});
