import { solveRelay } from './relay-helper';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { HULLS, type HullId } from '../frontend/game/config';
import {
    beginRun,
    buyShip,
    buyUpgrade,
    deliverSalvage,
    finishRun,
    newCampaign,
    newShip,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { HULL_UNLOCKS, hullUnlocked, hullUnlockReason } from '../frontend/game/state/fleetUnlocks';
import { missionObjectiveMet, selectableMission } from '../frontend/game/state/missionOrders';
import {
    contributeStory,
    STORY_TASKS,
    storyObjectives,
    syncStory,
    travelStory,
} from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
const empty = { ore: 0, parts: 0 };
function hold(s: MissionSimulation, input: FlightInput, count = 180) {
    for (let f = 0; f < count && !s.ended; f++) {
        s.step(input);
        s.events.length = 0;
    }
}
function fly(s: MissionSimulation, target: { x: number; y: number }) {
    for (let f = 0; f < 60 * 120 && !s.ended; f++) {
        const dx = target.x - s.position.x,
            dy = target.y - s.position.y,
            d = Math.hypot(dx, dy),
            e = angleDifference(Math.atan2(dy, dx), s.ship.rotation()),
            stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
        s.step({
            ...idle,
            target,
            turn: Math.max(-1, Math.min(1, e * 2.5)),
            thrust: Math.abs(e) < 0.3 && d > 75 + stop,
            brake: s.speed > 20 && (d < 60 + stop || Math.abs(e) > 0.6),
            mine: true,
        });
        s.events.length = 0;
        if (d < 100 && s.speed < 25) return;
    }
    assert.fail(`flight ${s.hull} ${JSON.stringify(s.position)}`);
}
function grant(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const task = STORY_TASKS.find((t) => t.id === id)!;
    c.story!.progress[id] = task.target;
    c.story!.claimed.push(id);
}

test('new campaign offers only Prospector and Swift, while legacy shops keep all normal hulls and economic requirements', () => {
    const c = newStoryCampaign();
    c.bank = { ore: 9999, parts: 9999 };
    c.station.workshop = 2;
    assert.deepEqual(
        (Object.keys(HULLS) as HullId[]).filter((h) => hullUnlocked(c, h)),
        ['prospector', 'swift'],
    );
    const before = structuredClone(c);
    assert.equal(buyShip(c, 'aegis'), false);
    assert.deepEqual(c, before);
    assert.ok(hullUnlockReason(c, 'aegis'));
    assert.ok(buyShip(c, 'swift'));
    const legacy = newCampaign();
    legacy.bank = { ore: 9999, parts: 9999 };
    legacy.station.workshop = 2;
    assert.ok(buyShip(legacy, 'aegis'));
    assert.equal(buyShip(legacy, 'lancer'), false);
    const poor = newStoryCampaign();
    assert.equal(buyShip(poor, 'swift'), false);
});

test('every normal hull has a campaign unlock and lunar construction opens Mule without free hulls or bypassing prices', () => {
    const c = newStoryCampaign();
    for (const [hull, rule] of Object.entries(HULL_UNLOCKS)) {
        assert.ok(STORY_TASKS.some((t) => t.id === rule.task));
        assert.equal(hullUnlocked(c, hull as HullId), false);
    }
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, empty, 1, 'dock', c.activeRun!.repairKits, { data: ['relay'] });
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    assert.equal(hullUnlocked(c, 'mule'), false);
    grant(c, 'lunar-survey');
    grant(c, 'lunar-foundation');
    assert.ok(hullUnlocked(c, 'mule'));
    assert.equal(c.ship!.hull, 'prospector');
    assert.equal(buyShip(c, 'mule'), false);
    c.bank = { ore: 1000, parts: 1000 };
    assert.ok(buyShip(c, 'mule'));
    assert.equal(c.bank.ore, 1000 - HULLS.mule.ore);
    for (const [hull, rule] of Object.entries(HULL_UNLOCKS)) {
        if (!c.story!.claimed.includes(rule.task)) grant(c, rule.task);
        assert.ok(hullUnlocked(c, hull as HullId));
    }
    assert.equal(Object.keys(HULL_UNLOCKS).length, 10);
});

test('mission orders reject future, completed, station, foreign and rescue/delivery combinations before charging anything', () => {
    const c = newStoryCampaign();
    for (const id of ['earth-route', 'earth-supply', 'lunar-survey', 'unknown']) {
        const before = structuredClone(c);
        assert.equal(beginRun(c, 1, null, false, id), false);
        assert.deepEqual(c, before);
    }
    assert.equal(beginRun(c, 1, null, true, 'earth-relay'), false);
    assert.equal(beginRun(c, 1, 123, false, 'earth-relay'), false);
    assert.equal(beginRun(newCampaign(), 1, null, false, 'earth-relay'), false);
    assert.ok(beginRun(c, 1, null, false, 'earth-relay'));
    assert.ok(parseCampaign(JSON.stringify(c)));
    const invalid = JSON.parse(JSON.stringify(c));
    invalid.activeRun.mission.task = 'earth-route';
    assert.equal(parseCampaign(JSON.stringify(invalid)), null);
});

test('stock Prospector cannot dock before a selected scan, flies the real relay, and radio confirmation commits progress', () => {
    const c = newStoryCampaign();
    assert.ok(beginRun(c, 1, null, false, 'earth-relay'));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        fly(s, { x: 0, y: 0 });
        hold(s, { ...idle, interact: true });
        assert.equal(s.ended, null);
        assert.equal(s.dockProgress, 0);
        assert.ok(s.missionReturnBlocked);
        const before = structuredClone(c);
        assert.equal(finishRun(c, true, empty, 1, 'dock'), null);
        assert.deepEqual(c, before);
        fly(s, s.landmarks.find((l) => l.siteId === 'relay')!);
        hold(s, { ...idle, interact: true }, 200);
        solveRelay(s);
        assert.ok(s.surveyData.has('relay'));
        assert.equal(s.missionReturnBlocked, false);
        s.step(idle);
        assert.match(s.missionStatus, /Raport przyjęty/);
        assert.equal(c.story!.progress['earth-relay'], 1);
        assert.match(
            storyObjectives(c, [...s.surveyData]).find((t) => t.id === 'earth-relay')!.title,
            /▶/,
        );
        const refreshed = parseCampaign(JSON.stringify(c))!;
        finishRun(refreshed, false, empty, 0, 'reload');
        assert.equal(refreshed.story!.progress['earth-relay'], 1);
        fly(s, { x: 0, y: 0 });
        hold(s, { ...idle, interact: true });
        assert.equal(s.ended, 'returned');
        assert.ok(finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport));
        assert.equal(c.story!.progress['earth-relay'], 1);
        assert.equal(selectableMission(c, 'earth-relay'), null);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('combat orders require the remaining patrol count and distinguish Neptune from final boss reports', () => {
    const c = newStoryCampaign();
    c.station.workshop = 2;
    for (const task of STORY_TASKS.filter((t) => t.required && t.act === 1)) grant(c, task.id);
    assert.ok(travelStory(c, 'mars'));
    assert.ok(beginRun(c, 1, null, false, 'mars-patrol'));
    assert.equal(missionObjectiveMet(c, { patrolKills: 1 }), false);
    assert.equal(missionObjectiveMet(c, { patrolKills: 2 }), true);
    assert.equal(finishRun(c, true, empty, 1, 'dock', 0, { patrolKills: 1 }), null);
    assert.ok(finishRun(c, true, empty, 1, 'dock', 0, { patrolKills: 2 }));
    const n = newStoryCampaign();
    n.station.workshop = 2;
    for (const task of STORY_TASKS.filter(
        (t) =>
            t.required &&
            (t.act <= 8 ||
                t.sector === 'uranus' ||
                ['neptune-survey', 'neptune-base'].includes(t.id)),
    ))
        grant(n, task.id);
    assert.ok(travelStory(n, 'neptune'));
    assert.ok(beginRun(n, 1, null, false, 'neptune-boss'));
    assert.equal(missionObjectiveMet(n, { finalBossWon: true }), false);
    assert.equal(missionObjectiveMet(n, { firstBossWon: true }), true);
});

test('abort opens docking, persists the order and discards carried cargo, reports, rewards and XP while retaining pilot and hull', () => {
    const c = newStoryCampaign();
    beginRun(c, 1, null, false, 'earth-relay');
    const ship = structuredClone(c.ship),
        pilot = structuredClone(c.pilots[0]),
        bank = { ...c.bank };
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.surveyData.add('relay');
        s.cargo.ore = 20;
        s.cargo.parts = 4;
        assert.ok(s.abortMission());
        assert.equal(s.abortMission(), false);
        assert.equal(s.missionReturnBlocked, false);
        assert.equal(deliverSalvage(c, 200, 'patrol'), null);
        assert.ok(parseCampaign(JSON.stringify(c))!.activeRun!.mission!.aborted);
        assert.equal(
            storyObjectives(c, ['relay']).find((t) => t.id === 'earth-relay')!.progress,
            '',
        );
        fly(s, { x: 0, y: 0 });
        hold(s, { ...idle, interact: true });
        assert.equal(s.ended, 'returned');
        const r = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
            ...s.missionReport,
            patrolKills: 99,
            finalBossWon: true,
        })!;
        assert.equal(r.aborted, true);
        assert.deepEqual(r.cargo, empty);
        assert.deepEqual(r.reward, empty);
        assert.equal(r.pilotProgress!.gainedXp, 0);
        assert.deepEqual(c.bank, bank);
        assert.deepEqual(c.ship, ship);
        assert.deepEqual(c.pilots[0], pilot);
        assert.equal(c.story!.progress['earth-relay'], 0);
        assert.match(r.reason, /przerwana/);
        assert.ok(beginRun(c, 1, null, false, 'earth-relay'));
    } finally {
        s.dispose();
    }
});

test('free flights retain ordinary docking and death after abort still loses the active pilot and ship', () => {
    const free = newStoryCampaign();
    beginRun(free, 1);
    const s = new MissionSimulation(free, free.activeRun!.seed);
    try {
        fly(s, { x: 0, y: 0 });
        hold(s, { ...idle, interact: true });
        assert.equal(s.ended, 'returned');
        assert.equal(s.abortMission(), false);
    } finally {
        s.dispose();
    }
    const c = newStoryCampaign();
    beginRun(c, 1, null, false, 'earth-relay');
    c.activeRun!.mission!.aborted = true;
    finishRun(c, false, { ore: 10, parts: 5 }, 5, 'destroyed');
    assert.equal(c.ship, null);
    assert.equal(c.pilots.length, 0);
    assert.equal(c.story!.progress['earth-relay'], 0);
});
