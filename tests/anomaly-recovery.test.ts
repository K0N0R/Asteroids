import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    ANOMALY,
    ANOMALY_BANDS,
    AnomalyExposure,
    anomalyDistance,
    polygonDistance,
} from '../frontend/game/systems/anomalyField';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, travelStory } from '../frontend/game/state/story';
import { selectableMission } from '../frontend/game/state/missionOrders';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';
import type { Point } from '../frontend/game/worlds/sector';
import { MARS_AMBUSH, MARS_YARD_PATROLS } from '../frontend/game/state/marsAct';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(survey = true, mission = true) {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    c.station.shield = true;
    Object.assign(c.story!.mars, {
        landingBlocked: true,
        ambushEntered: true,
        baseDiscovered: true,
        baseNeutralized: true,
        baseHealth: 0,
        memoryDelivered: true,
        aiIdentified: true,
        yardDestroyed: true,
        yardHealth: 0,
        researchSites: 3,
        researchWaves: 3,
        kills: [...MARS_AMBUSH, ...MARS_YARD_PATROLS],
    });
    for (const t of STORY_TASKS.filter(
        (t) => t.act <= 6 || (survey && t.id === 'jupiter-survey'),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    assert.ok(travelStory(c, 'jupiter'));
    c.bank = { ore: 0, parts: 0 };
    assert.ok(parseCampaign(JSON.stringify(c)));
    if (mission) assert.ok(beginRun(c, 1, null, false, 'jupiter-recovery'));
    return c;
}
function at(s: MissionSimulation, p: Point) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function hold(s: MissionSimulation, count: number, tow = false) {
    for (let i = 0; i < count && !s.ended; i++) {
        s.step({ ...idle, tow });
        s.events.length = 0;
    }
}
function fly(s: MissionSimulation, target: Point, radius = 65) {
    for (let f = 0; f < 60 * 150 && !s.ended; f++) {
        const dx = target.x - s.position.x,
            dy = target.y - s.position.y;
        const d = Math.hypot(dx, dy),
            err = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
        const stop = s.speed ** 2 / (2 * s.hullConfig.brake);
        s.step({
            ...idle,
            target,
            turn: Math.max(-1, Math.min(1, err * 2.5)),
            thrust: Math.abs(err) < 0.3 && d > radius + stop + 15,
            brake: s.speed > 15 && (d < radius + stop || Math.abs(err) > 0.6),
        });
        s.events.length = 0;
        if (d < radius + 30 && s.speed < 20) return;
    }
    assert.fail(
        `flight: ${JSON.stringify(s.position)}, hull ${s.hull}, target ${JSON.stringify(target)}`,
    );
}

test('irregular anomaly bands have clear corridors for full hulls and a dangerous shorter direct approach', () => {
    assert.ok(ANOMALY_BANDS.every((b) => b.length >= 5));
    const route = [{ x: 240, y: 0 }, ...ANOMALY.waypoints, ANOMALY.probe];
    for (let i = 1; i < route.length; i++) {
        for (let j = 0; j <= 100; j++) {
            const a = route[i - 1],
                b = route[i];
            assert.ok(
                anomalyDistance({
                    x: a.x + ((b.x - a.x) * j) / 100,
                    y: a.y + ((b.y - a.y) * j) / 100,
                }) > 90,
            );
        }
    }
    assert.equal(anomalyDistance({ x: -2300, y: -1800 }), 0);
    const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];
    assert.equal(polygonDistance({ x: 5, y: 5 }, square), 0);
    assert.equal(polygonDistance({ x: 13, y: 5 }, square), 3);
});

test('exposure immediately deals the same environmental damage at different steps and stops outside the full hull boundary', () => {
    const p = { x: -2300, y: -1800 };
    for (const step of [1 / 30, 1 / 60, 1 / 120]) {
        const e = new AnomalyExposure();
        let damage = 0;
        for (let i = 0; i < Math.round(2.8 / step); i++) damage += e.step(p, p, step, 40);
        assert.ok(Math.abs(damage - 42) < 1e-8);
        assert.match(e.status, /15 kadłuba/);
        assert.equal(e.step(ANOMALY.probe, ANOMALY.probe, step, 40), 0);
        assert.equal(e.contaminated, false);
        assert.equal(e.exposure, 0);
    }
    const crossing = new AnomalyExposure();
    crossing.step({ x: -3000, y: -1800 }, { x: -1700, y: -1800 }, 0.5, 30);
    assert.equal(crossing.contaminated, false);
    // Exposure crossed an actual band even though the endpoint is outside it.
    const e = new AnomalyExposure();
    assert.ok(e.step({ x: -2600, y: -1800 }, { x: -1700, y: -1800 }, 6, 30) > 0);
});

test('recovery is optional, unlocks after survey, and creates the physical probe and route in an ordinary flight', () => {
    const c = ready(false, false);
    assert.equal(selectableMission(c, 'jupiter-recovery'), null);
    const unlocked = ready(true, false);
    assert.ok(selectableMission(unlocked, 'jupiter-recovery'));
    beginRun(unlocked, 1);
    const free = new MissionSimulation(unlocked, unlocked.activeRun!.seed);
    try {
        assert.equal(free.anomalyMission, true);
    } finally {
        free.dispose();
    }
    const selected = ready(),
        s = new MissionSimulation(selected, selected.activeRun!.seed);
    try {
        assert.ok(s.anomalyMission);
        assert.equal(s.rescueOperation!.name, 'Sonda');
        assert.equal(s.rescueOperation!.state, 'ready');
        assert.deepEqual(s.rescueOperation!.position, ANOMALY.probe);
        assert.ok([3, 4, 5].every((key) => s.landmarks.filter((l) => l.key === key).length === 1));
        assert.equal(s.missionReturnBlocked, true);
        assert.ok(parseCampaign(JSON.stringify(selected)));
    } finally {
        s.dispose();
    }
});

test('contamination bypasses shields, slows the ship and can kill without confirming a report', () => {
    const c = ready(),
        s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, { x: -2300, y: -1800 });
        const shield = s.kineticShield.charge;
        hold(s, 42);
        assert.ok(s.hull < s.maxHull);
        assert.equal(s.kineticShield.charge, shield);
        hold(s, 420, true);
        assert.ok(s.statistics.hullDamage + s.statistics.shieldDamage > 0);
        assert.equal(c.story!.progress['jupiter-recovery'], 0);
        assert.equal(s.rescueOperation!.delivered, false);
        s.hull = 1;
        hold(s, 600);
        assert.equal(s.ended, 'destroyed');
        assert.match(s.deathReason, /skażenie/);
        assert.equal(c.story!.progress['jupiter-recovery'], 0);
    } finally {
        s.dispose();
    }
});

test('stock Prospector flies the safe maze, physically attaches and tows the probe back, securing one radio reward before docking', () => {
    const c = ready(),
        s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        // Isolate contamination navigation from the independently tested drifting asteroid hazards.
        for (const rock of [...s.rocks.values()]) {
            s.world.removeRigidBody(rock.body);
            s.asteroidColliders.delete(rock.collider.handle);
        }
        s.rocks.clear();

        for (const point of ANOMALY.waypoints) fly(s, point);
        fly(s, { x: ANOMALY.probe.x, y: ANOMALY.probe.y - 110 });
        assert.equal(s.statistics.hullDamage, 0);
        assert.equal(s.statistics.shieldDamage, 0);
        for (let frame = 0; frame < 210; frame++) s.step({ ...idle, interact: true });
        assert.equal(s.rescueOperation!.state, 'ready');
        assert.equal(s.rescueOperation!.attachProgress, 0);
        hold(s, 210, true);
        assert.equal(s.rescueOperation!.state, 'towing');
        assert.equal(c.story!.progress['jupiter-recovery'], 0);
        assert.ok(s.missionReturnBlocked);
        assert.equal(s.rescueOperation!.repair, null);
        for (const point of [...ANOMALY.waypoints].reverse()) fly(s, point);
        fly(s, { x: 250, y: 0 });
        hold(s, 240);
        assert.equal(s.rescueOperation!.delivered, true);
        assert.equal(s.ended, null);
        assert.equal(s.statistics.hullDamage, 0);
        assert.ok(c.story!.claimed.includes('jupiter-recovery'));
        assert.deepEqual(c.bank, { ore: 32, parts: 10 });
        assert.ok(s.radioMessages.some((m) => m.includes('Sonda')));
        assert.equal(s.missionReturnBlocked, false);
        assert.ok(parseCampaign(JSON.stringify(c)));
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        assert.deepEqual(c.bank, { ore: 32, parts: 10 });
        assert.equal(selectableMission(c, 'jupiter-recovery'), null);
    } finally {
        s.dispose();
    }
});

test('releasing the probe retains the same physical body, and losing it allows a fresh unpaid attempt', () => {
    const c = ready(),
        s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, { x: ANOMALY.probe.x, y: ANOMALY.probe.y - 110 });
        hold(s, 210, true);
        const r = s.rescueOperation!;
        assert.equal(r.state, 'towing');
        const body = r.item.body;
        s.releaseWreck();
        assert.equal(r.state, 'ready');
        assert.equal(r.item.body, body);
        s.salvage.damage(r.item, 1000);
        assert.equal(r.state, 'destroyed');
        assert.equal(c.story!.progress['jupiter-recovery'], 0);
        assert.ok(s.abortMission());
        finishRun(c, false, s.cargo, s.elapsed, 'loss', 0);
        assert.ok(selectableMission(c, 'jupiter-recovery'));
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
    } finally {
        s.dispose();
    }
});
