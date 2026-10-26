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
import { PHOBOS_MAZE_GATE, marsAnomalyTouches } from '../frontend/game/worlds/phobosMaze';
import { migrateMarsLayout } from '../frontend/game/state/marsLayoutMigration';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import { MARS_MOONS } from '../frontend/game/worlds/marsMoons';
import { marsCelestialBodies } from '../frontend/game/worlds/celestialBodies';
import { nearestGate } from '../frontend/game/systems/hyperdrive';
import { enqueueRadio, pruneObsoleteMarsRadio } from '../frontend/game/state/communications';
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
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
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
    assert.ok(hullUnlocked(c, 'fighter'));
    assert.ok(hullUnlocked(c, 'tug')); // Workshop I already unlocks both hulls.
    p.mars.landingBlocked = true;
    syncStory(c);
    assert.equal(phobosRouteOpen(p), false);
    c.station.shield = true;
    syncStory(c);
    assert.ok(phobosRouteOpen(p));
    assert.ok(hullUnlocked(c, 'fighter'));
    assert.ok(hullUnlocked(c, 'tug'));
    assert.equal(generateStorySector(p).enemies.length, 0); // No advance ambush contacts.
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
test('security requires surviving patrols to be eliminated but never ship wreck delivery', () => {
    const c = ready();
    ai(c);
    c.story!.mars.yardDestroyed = true;
    syncStory(c);
    assert.ok(!c.story!.claimed.includes('mars-sector-secure'));
    c.story!.mars.kills.push(...MARS_YARD_PATROLS);
    syncStory(c);
    assert.equal(c.story!.mars.announcements.includes('old-ship-delivery'), false);
    assert.equal(c.story!.mars.probeDelivered, false);
    assert.ok(c.story!.claimed.includes('mars-sector-secure'));
    assert.equal(storySectorUnlocked(c.story!, 'venus'), false);
    c.story!.mars.researchWaves = 3;
    c.story!.mars.researchSites = 3;
    c.story!.mars.researchReturned = true;
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
    assert.equal(s.enemies.enemies.size, 0);
    move(s, M.phobos);
    s.marsAct!.update(idle, 0.02);
    assert.ok(c.story!.mars.ambushEntered);
    assert.equal(s.enemies.enemies.size, 3);
    s.dispose();
});

test('Phobos ambush starts only after arrival and fires on the first combat frame without a contact report', async () => {
    const { MissionWorld } = await import('../frontend/game/worlds/missionWorld');
    const { GameSettings } = await import('../frontend/core/systems/gameSettings');
    GameSettings.soundEnabled = false;
    const c = ready();
    openPhobos(c);
    const s = spawn(c);
    move(s, PHOBOS_MAZE_GATE);
    assert.ok(s.hyperdrive.start(s.position, MARS_GATES.phobosArrival, true, true));
    try {
        for (let i = 0; i < 240 && s.hyperdrive.active; i++) {
            s.step(idle);
            if (s.hyperdrive.active) {
                assert.equal(c.story!.mars.ambushEntered, false);
                assert.equal(s.enemies.enemies.size, 0);
            }
        }
        assert.equal(s.hyperdrive.active, false);
        assert.equal(s.marsOrbit, 'phobos');
        assert.equal(c.story!.mars.ambushEntered, true);
        for (const id of MARS_AMBUSH) assert.equal(s.enemies.enemies.get(id)!.state, 'chase');
        s.step(idle);
        assert.equal([...s.bullets.values()].filter((b) => b.team === 'enemy').length, 3);
        const world = new MissionWorld(s, c.ship!, false);
        try {
            world.update(17, idle);
            assert.ok(!c.story!.radio?.pending.some((line) => line.text.includes('Mamy kontakt')));
            assert.ok(!s.radioMessages.some((line) => line.includes('Mamy kontakt')));
        } finally {
            world.dispose();
        }
    } finally {
        s.dispose();
    }
});

test('obsolete contact reports from a previous build are removed before opening Mars radio', () => {
    const c = ready(),
        contact = {
            speaker: 'operations' as const,
            text: 'Mamy kontakt w pobliżu. Uważaj na ostrzał — obserwujemy Twoją pozycję.',
        };
    c.story!.radio = { pending: [contact], acknowledged: [] };
    assert.equal(pruneObsoleteMarsRadio(c.story!), true);
    assert.deepEqual(c.story!.radio.pending, []);
    assert.equal(enqueueRadio(c.story!, contact), false);
    assert.equal(
        enqueueRadio(c.story!, { speaker: 'science', text: 'Moduł pamięci odebrany.' }),
        true,
    );
});

test('industrial victory opens a live one-way shortcut to Mars and preserves physical tow', () => {
    const c = ready();
    ai(c);
    const s = spawn(c);
    try {
        assert.ok(!s.sector.hyperlanes.some((lane) => lane.oneWay));
        move(s, MARS_GATES.asteroidReturn);
        const wreck = s.salvage.add(
            100999,
            'patrol',
            { x: s.position.x + 80, y: s.position.y },
            { x: 0, y: 0 },
        )!;
        assert.ok(s.salvage.attach(wreck, s.ship));
        s.enemyFactory!.damage(s.enemyFactory!.health);
        s.marsAct!.factoryDestroyed();
        const lane = s.sector.hyperlanes.find((route) => route.oneWay)!;
        assert.ok(lane);
        assert.deepEqual(lane.a, MARS_GATES.asteroidReturn);
        assert.deepEqual(lane.b, MARS_GATES.marsReturn);
        assert.deepEqual(s.nearestHypergate!.from, lane.a);
        const health = s.hull;
        for (let i = 0; i < 62; i++) s.step({ ...idle, interact: true });
        assert.ok(s.hyperdrive.active);
        for (let i = 0; i < 240 && s.hyperdrive.active; i++) s.step(idle);
        assert.equal(s.marsOrbit, 'mars');
        assert.ok(Math.hypot(s.position.x - lane.b.x, s.position.y - lane.b.y) < 1);
        assert.equal(s.hull, health);
        assert.ok(s.salvage.towing.has(wreck.id));
        assert.deepEqual(nearestGate([lane], lane.b)!.from, lane.a);
        for (let i = 0; i < 90; i++) s.step({ ...idle, interact: true });
        assert.equal(s.hyperdrive.active, false, 'arrival endpoint cannot reopen the shortcut');
        assert.equal(s.marsOrbit, 'mars');
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.ok(generateStorySector(c.story!).hyperlanes.some((route) => route.oneWay));
    } finally {
        s.dispose();
    }
});

test('Mars system layout places the asteroid southwest of Phobos, with a central landing and southern exit', () => {
    const phobos = MARS_MAPS.phobos.center,
        asteroid = MARS_MAPS.asteroid.center;
    assert.ok(asteroid.x < phobos.x);
    assert.ok(asteroid.y > phobos.y + 5000);
    assert.deepEqual(M.phobos, phobos);
    assert.ok(MARS_GATES.phobosArrival.x < phobos.x && MARS_GATES.phobosArrival.y < phobos.y);
    assert.ok(MARS_GATES.asteroidExit.y > phobos.y + 1500);
});

test('both recoverable probes on Phobos use satellite artwork rather than a Prospector hull', async () => {
    const { MissionWorld } = await import('../frontend/game/worlds/missionWorld');
    const { GameSettings } = await import('../frontend/core/systems/gameSettings');
    GameSettings.soundEnabled = false;
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    move(s, M.phobos);
    const world = new MissionWorld(s, c.ship!, false);
    try {
        world.update(0, idle);
        const views = world as unknown as {
            salvageViews: Map<number, { children: { label: string }[] }>;
        };
        for (const id of [M.probeId, M.oldShipId])
            assert.equal(views.salvageViews.get(id)!.children[0].label, 'recovery-probe');
        assert.ok(!s.landmarks.some((landmark) => landmark.name.includes('Prospectora')));
    } finally {
        world.dispose();
    }
});
test('silent terminal route neutralizes the base without production or radio completion', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, M.terminal);
    s.enemies.enemies.get(MARS_SURFACE_PATROLS[0])!.body.setTranslation({ x: 52.5, y: 56 }, true);
    s.marsAct!.security.disabledTime = 100;
    for (let i = 0; i < 62; i++) s.step({ ...idle, target: M.terminal, interact: true });
    solveTerminal(s);
    assert.ok(c.story!.mars.quietHack);
    assert.ok(c.story!.mars.baseNeutralized);
    assert.equal(c.story!.mars.memoryDelivered, false);
    assert.equal(s.enemyFactory!.launched, 0);
    assert.ok(MARS_SURFACE_PATROLS.every((id) => !s.enemies.enemies.has(id)));
    const disabled = c.worldSalvage.filter((item) => item.source === 'patrol');
    assert.equal(disabled.length, 1);
    assert.ok(disabled.every((item) => item.area === 'surface' && s.salvage.items.has(item.id)));
    assert.ok(parseCampaign(JSON.stringify(c)));
    s.dispose();
});
test('research waves remain finite and a retry launches its wave offscreen only on approach', () => {
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
    assert.ok(!retry.enemies.enemies.has(74011));
    assert.ok(!retry.enemies.enemies.has(74010));
    assert.equal(c.story!.mars.researchWaves, 0);
    assert.equal(c.story!.mars.researchSites, 0);
    retry.dispose();
});
test('a partial journal 29 is rejected by the current progression schema', () => {
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
    assert.equal(parseCampaign(JSON.stringify(old)), null);
});
test('a completed journal 29 also requires the current schema instead of a partial migration', () => {
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
    assert.equal(parseCampaign(JSON.stringify(old)), null);
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
    assert.equal(c.story!.mars.researchWaves, 4);
    assert.ok(!c.story!.claimed.includes('mars-anomaly-research'));
    move(s, { x: 140, y: 80 });
    s.escort!.body.setTranslation({ x: 1.4, y: 0 }, true);
    s.escort!.body.setLinvel({ x: 0, y: 0 }, true);
    s.step(idle);
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
    assert.ok(!before.reserveShips.some((ship) => ship.hull === 'raider'));
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
        // Releasing F is required, just as for the Moon; holding it cannot bounce back.
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
    move(s, { x: -1500, y: -5000 });
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

test('a ship outside the visible anomaly contour takes no phantom hull damage', () => {
    const c = ready();
    openPhobos(c);
    const s = spawn(c);
    try {
        for (const rock of s.rocks.values()) rock.body.setEnabled(false);
        move(s, MARS_GATES.marsReturn);
        const before = s.hull;
        for (let i = 0; i < 60; i++) s.step(idle);
        assert.equal(s.hull, before);
        assert.equal(s.statistics.hullDamage, 0);
        move(s, { x: 4000, y: -4000 });
        for (let i = 0; i < 60; i++) s.step(idle);
        assert.ok(
            Math.abs(s.hull - (before - 15)) < 1e-6,
            'actual contamination still deals 15 HP/s',
        );
    } finally {
        s.dispose();
    }
});

test('partial hull contact at the Phobos anomaly edge immediately damages and slows the ship', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    try {
        for (const rock of s.rocks.values()) {
            s.asteroidColliders.delete(rock.collider.handle);
            s.world.removeRigidBody(rock.body);
        }
        s.rocks.clear();
        const radius = Math.max(...s.hullConfig.hitbox) * s.hullConfig.size;
        let left = 30000,
            right = 31500;
        for (let i = 0; i < 50; i++) {
            const x = (left + right) / 2;
            if (marsAnomalyTouches({ x, y: 0 }, 'phobos', radius)) right = x;
            else left = x;
        }
        move(s, { x: right + 3, y: 0 });
        assert.equal(
            marsAnomalyTouches(s.position, 'phobos', 0),
            false,
            'ship center remains outside',
        );
        s.ship.setLinvel({ x: 0, y: 0.8 }, true);
        const before = s.hull;
        s.step(idle);
        assert.ok(s.hull < before, 'hull contact already deals damage');
        assert.ok(s.speed <= 25 + 1e-6, 'hull contact already limits speed');
        assert.equal(marsAnomalyTouches(s.position, 'phobos', 0), false);
    } finally {
        s.dispose();
    }
});

test('the Phobos gate at the maze exit still performs its calibrated jump without contamination during hyperspace', () => {
    const c = ready();
    openPhobos(c);
    const s = spawn(c);
    const lane = s.sector.hyperlanes.find((l) => l.name === 'Mars — orbita Fobosa')!;
    move(s, lane.a);
    const hp = s.hull;
    for (let i = 0; i < 62; i++)
        s.step({ ...idle, target: s.nearestHypergate!.from, interact: true });
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
    for (let i = 0; i < 62; i++)
        s.step({ ...idle, target: s.nearestHypergate!.from, interact: true });
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
    for (let i = 0; i < 62; i++)
        s.step({ ...idle, target: s.nearestHypergate!.from, interact: true });
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
    for (let i = 0; i < 62; i++)
        s.step({ ...idle, target: s.nearestHypergate!.from, interact: true });
    for (let i = 0; i < 200; i++) s.step(idle);
    assert.equal(s.marsOrbit, 'asteroid');
    assert.equal(s.sectorRadius, 1800);
    assert.equal(s.marsAnomalies.length, 0);
    assert.equal(s.marsMoon, null);
    assert.ok(s.sector.rocks.filter((r) => marsOrbitAt(r)?.id === 'asteroid').length > 150);
    assert.ok(s.sector.rocks.some((r) => r.radius === 420 && r.anchored));
    assert.ok(MARS_YARD_PATROLS.every((id) => s.enemies.enemies.has(id)));
    for (let i = 0; i < 62; i++)
        s.step({ ...idle, target: s.nearestHypergate!.from, interact: true });
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
    s.enemies.enemies.get(MARS_SURFACE_PATROLS[0])!.body.setTranslation({ x: 52.5, y: 56 }, true);
    s.marsAct!.update(idle, 6);
    assert.equal(c.story!.mars.baseNeutralized, false);
    for (let i = 0; i < 62; i++) s.step({ ...idle, target: M.terminal, interact: true });
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

test('current saved asteroid cargo, reinforcements and recovery signals migrate once to the new map', () => {
    const c = ready();
    ai(c);
    const s = spawn(c);
    move(s, M.asteroid);
    c.activeRun!.lastPosition = s.position;
    s.dispose();
    // Produce a real, validated rescue signal, then encode it at the previous map coordinates.
    let saved: typeof c | undefined;
    for (let i = 1; i < 20 && !saved; i++) {
        const attempt = structuredClone(c);
        attempt.activeRun!.pilotId = attempt.pilots[0].id = i;
        attempt.selectedPilot = i;
        attempt.nextPilotId = i + 1;
        finishRun(attempt, false, { ore: 0, parts: 0 }, 1, 'lost');
        if (attempt.recoverySignals.length) saved = attempt;
    }
    assert.ok(saved);
    delete saved.story!.mars.layoutVersion;
    const signal = saved.recoverySignals.at(-1)!;
    const point = { x: signal.x, y: signal.y };
    signal.x += 60000 - M.asteroid.x;
    signal.y -= M.asteroid.y;
    saved.story!.mars.reinforcements.push({ id: 73001, x: 60600, y: 300, kind: 'patrol' });
    saved.worldSalvage.push({ id: 100000, seed: 150073, source: 'patrol', x: 60200, y: -100 });
    saved.nextSalvageId = 100001;
    const migrated = parseCampaign(JSON.stringify(saved));
    assert.ok(migrated);
    assert.equal(migrated.story!.mars.layoutVersion, 3);
    assert.deepEqual(
        { x: migrated.recoverySignals.at(-1)!.x, y: migrated.recoverySignals.at(-1)!.y },
        point,
    );
    assert.equal(marsOrbitAt(migrated.worldSalvage[0])?.id, 'asteroid');
    assert.equal(marsOrbitAt(migrated.story!.mars.reinforcements[0])?.id, 'asteroid');
    assert.deepEqual(parseCampaign(JSON.stringify(migrated)), migrated);
    const intermediate = structuredClone(saved);
    intermediate.story!.mars.layoutVersion = 2;
    intermediate.recoverySignals.at(-1)!.x = point.x + 22000 - M.asteroid.x;
    intermediate.recoverySignals.at(-1)!.y = point.y + 12000 - M.asteroid.y;
    intermediate.worldSalvage[0].x = 22200;
    intermediate.worldSalvage[0].y = 11900;
    intermediate.story!.mars.reinforcements[0].x = 22600;
    intermediate.story!.mars.reinforcements[0].y = 12300;
    assert.deepEqual(parseCampaign(JSON.stringify(intermediate)), migrated);
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

test('wide Phobos landing view hides other maps, the Earth Moon layer and Satuk while preserving local outcrops', async () => {
    const { MissionWorld } = await import('../frontend/game/worlds/missionWorld');
    const { GameSettings } = await import('../frontend/core/systems/gameSettings');
    GameSettings.soundEnabled = false;
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, MARS_MOONS.phobos.exit);
    s.previous = s.position;
    s.transferRemaining = 3.2;
    const world = new MissionWorld(s, c.ship!, false);
    try {
        world.update(0, idle);
        const views = world as unknown as {
            rocks: Map<number, { visible: boolean }>;
            moon: { visible: boolean };
            home: { visible: boolean };
            sentryViews: Map<number, { visible: boolean }>;
        };
        assert.equal(views.moon.visible, false);
        assert.equal(views.home.visible, false);
        for (const r of s.rocks.values())
            if (!r.surface)
                assert.equal(!!views.rocks.get(r.id)?.visible, false, `foreign rock ${r.id}`);
        assert.ok([...s.rocks.values()].some((r) => r.surface && views.rocks.get(r.id)?.visible));
        assert.ok([...views.sentryViews.values()].every((v) => !v.visible));
    } finally {
        world.dispose();
    }
});

test('landing animation advances drifting bodies but keeps the pilot, supplies and physical tow stable', () => {
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.area = 'surface';
    move(s, MARS_MOONS.phobos.exit);
    s.transferRemaining = 3.2;
    const rock = [...s.rocks.values()].find((r) => !r.anchored)!;
    rock.body.setTranslation({ x: 65, y: 44 }, true);
    rock.body.setLinvel({ x: 1, y: 0 }, true);
    const tow = s.salvage.add(
        100888,
        'patrol',
        { x: s.position.x - 90, y: s.position.y },
        { x: 0, y: 0 },
    );
    assert.ok(s.salvage.attach(tow, s.ship));
    const before = {
        position: s.position,
        hull: s.hull,
        cargo: structuredClone(s.cargo),
        tow: { ...tow.body.translation() },
    };
    for (let i = 0; i < 60; i++) s.step({ ...idle, thrust: true, fire: true });
    assert.ok(s.elapsed > 0.9);
    assert.ok(rock.body.translation().x > 65.3);
    assert.deepEqual(s.position, before.position);
    assert.equal(s.hull, before.hull);
    assert.deepEqual(s.cargo, before.cargo);
    assert.deepEqual({ ...tow.body.translation() }, before.tow);
    assert.equal(s.shipCollider.isEnabled(), false);
    while (s.transferActive) s.step(idle);
    s.step(idle);
    assert.equal(s.shipCollider.isEnabled(), true);
    s.dispose();
});

test('gate scenery is available before arrival and only local physics stays enabled after repeated area changes', async () => {
    const { MissionWorld } = await import('../frontend/game/worlds/missionWorld');
    const { GameSettings } = await import('../frontend/core/systems/gameSettings');
    GameSettings.soundEnabled = false;
    const c = ready();
    ai(c);
    const s = spawn(c),
        world = new MissionWorld(s, c.ship!, false);
    try {
        let cloud: unknown;
        for (let round = 0; round < 3; round++) {
            s.area = 'orbit';
            s.marsOrbit = 'mars';
            move(s, PHOBOS_MAZE_GATE);
            s.areaRevision++;
            s.hyperdrive.start(s.position, MARS_GATES.phobosArrival, true, true);
            s.hyperdrive.charge(1);
            world.update(17, idle);
            assert.ok(s.inVisibleMap(MARS_GATES.phobosArrival));
            assert.ok(s.inVisibleMap(PHOBOS_MAZE_GATE));
            const views = world as unknown as { marsCloud: unknown; rocks: Map<number, unknown> };
            if (cloud)
                assert.equal(
                    views.marsCloud,
                    cloud,
                    'gate travel must not recreate the anomaly renderer',
                );
            cloud = views.marsCloud;
            s.hyperdrive.cancel();
            s.marsOrbit = 'asteroid';
            move(s, M.asteroid);
            s.areaRevision++;
            world.update(17, idle);
            assert.equal(views.marsCloud, cloud);
            assert.ok([...s.rocks.values()].some((r) => r.body.isEnabled()));
            assert.ok([...s.rocks.values()].some((r) => !r.body.isEnabled()));
            for (const e of s.enemies.enemies.values())
                if (marsOrbitAt(e.home)?.id !== 'asteroid') assert.equal(e.body.isEnabled(), false);
            s.marsOrbit = 'mars';
            move(s, { x: 0, y: 0 });
            s.areaRevision++;
            world.update(17, idle);
            assert.ok(
                views.rocks.size < 150,
                'renderer retains the camera neighbourhood, not every visited map',
            );
            assert.equal(views.marsCloud, cloud);
        }
    } finally {
        world.dispose();
    }
});

test('required memory navigation cannot be replaced by a closer optional ship wreck', async () => {
    const { MissionHud } = await import('../frontend/game/ui/hud');
    const c = ready();
    orbitSecured(c);
    c.story!.mars.baseNeutralized = true;
    const s = spawn(c);
    s.area = 'surface';
    move(s, M.surface);
    const extra = s.salvage.add(-79888, 'patrol', s.position, { x: 0, y: 0 });
    const hud = Object.create(MissionHud.prototype) as MissionHud;
    Object.assign(hud, { sim: s, wreckId: null, target: 14 });
    hud.trackWreck();
    assert.match(hud.waypoint.name, /Moduł pamięci/);
    assert.equal(hud.waypoint.x, s.salvage.items.get(M.memoryId)!.body.translation().x * 100);
    assert.notEqual(hud.waypoint.x, extra.previous.x);
    assert.equal(c.story!.mars.memoryDelivered, false);
    s.dispose();
});

test('first orbital frame after surface ascent never requests a globe-sized anomaly raster window', async () => {
    const { MissionWorld } = await import('../frontend/game/worlds/missionWorld');
    const { AnomalyCloudView } = await import('../frontend/game/graphics/anomalyCloudView');
    const { GameSettings } = await import('../frontend/core/systems/gameSettings');
    GameSettings.soundEnabled = false;
    const c = ready();
    orbitSecured(c);
    const s = spawn(c);
    s.marsOrbit = 'phobos';
    move(s, MARS_MOONS.phobos.entrance);
    s.transferRemaining = 0.001;
    const original = AnomalyCloudView.prototype.update,
        windows: number[] = [];
    AnomalyCloudView.prototype.update = function (...args: Parameters<typeof original>) {
        windows.push(Math.max(args[1], args[2]));
        return original.apply(this, args);
    };
    const world = new MissionWorld(s, c.ship!, false);
    try {
        assert.ok(world.camera.scale.x < 0.2, 'test starts in the distant globe shot');
        world.update(17, idle);
        assert.equal(s.transferActive, false);
        assert.ok(windows.length > 0);
        assert.ok(
            Math.max(...windows) < 2200,
            'only the ordinary orbital viewport may be prefetched',
        );
    } finally {
        world.dispose();
        AnomalyCloudView.prototype.update = original;
    }
});

test('gate arrival preserves the travel heading even if the final eased frame has zero displacement', () => {
    for (const [from, to] of [
        [PHOBOS_MAZE_GATE, MARS_GATES.phobosArrival],
        [MARS_GATES.phobosArrival, PHOBOS_MAZE_GATE],
        [MARS_GATES.asteroidExit, MARS_GATES.asteroidArrival],
        [MARS_GATES.asteroidArrival, MARS_GATES.asteroidExit],
    ]) {
        const s = spawn(ready());
        const heading = Math.atan2(to.y - from.y, to.x - from.x);
        assert.equal(s.hyperdrive.start(from, to, true, true), true);
        s.hyperdrive.state = 'transit';
        s.hyperdrive.transitElapsed = 2.4 - 1e-9;
        move(s, to);
        s.ship.setRotation(heading, true);
        s.step(idle);
        assert.equal(s.hyperdrive.active, false);
        assert.ok(
            Math.abs(
                Math.atan2(
                    Math.sin(s.ship.rotation() - heading),
                    Math.cos(s.ship.rotation() - heading),
                ),
            ) < 1e-6,
        );
        for (let i = 0; i < 20; i++) s.step(idle);
        assert.ok(
            Math.abs(
                Math.atan2(
                    Math.sin(s.ship.rotation() - heading),
                    Math.cos(s.ship.rotation() - heading),
                ),
            ) < 1e-6,
        );
        s.dispose();
    }
});

import { radarRocks } from '../frontend/game/ui/radarRocks';
import { inMarsMap, nearestMarsOrbit } from '../frontend/game/worlds/marsLayout';

test('orbital resource fields fit playable maps and Mars radar excludes Phobos surface deposits', () => {
    const c = ready();
    ai(c);
    const s = spawn(c);
    const surface = [...s.rocks.values()].filter((r) => r.surface);
    assert.ok(surface.length > 40, 'surface deposits remain available after landing');
    for (const r of s.sector.rocks) {
        if (surface.some((v) => v.x === r.x && v.y === r.y)) continue;
        assert.ok(inMarsMap(nearestMarsOrbit(r).id, r, -r.radius), JSON.stringify(r));
    }
    s.area = 'orbit';
    s.marsOrbit = 'mars';
    move(s, { x: 0, y: 0 });
    const orbital = [...radarRocks(s)];
    assert.ok(orbital.length > 50);
    assert.ok(orbital.every((r) => inMarsMap('mars', r, -r.radius)));
    assert.ok(orbital.every((r) => !surface.some((v) => v.x === r.x && v.y === r.y)));
    const drift = [...s.rocks.values()].find((r) => !r.surface)!;
    drift.body.setTranslation({ x: 40, y: 70 }, true);
    assert.ok(
        [...radarRocks(s)].every((r) => r.x !== 4000 || r.y !== 7000),
        'drifting beyond map does not create unreachable radar resources',
    );
    s.area = 'surface';
    move(s, M.surface);
    const ground = [...radarRocks(s)];
    assert.ok(ground.length > 40, 'ground radar still shows actual deposits');
    assert.ok(
        ground.every((r) => Math.hypot(r.x - M.surface.x, r.y - M.surface.y) < s.sectorRadius),
    );
    s.dispose();
});
