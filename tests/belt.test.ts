import { grantStoryTasks } from './fleet-fixtures';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    BELT_BARRIERS,
    STORY_TASKS,
    beltPassageReady,
    storySectorUnlocked,
    storySectorComplete,
    storyRadius,
    storyAct,
    storyObjectives,
    travelStory,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const empty = { ore: 0, parts: 0 };
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(surveyed = false) {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const task of STORY_TASKS.filter(
        (t) => t.required && (t.act <= 5 || (surveyed && t.id === 'belt-survey')),
    )) {
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    grantStoryTasks(c, c.story!.claimed);
    c.story!.sector = 'mars';
    assert.ok(beltPassageReady(c.story!));
    assert.ok(travelStory(c, 'belt'));
    c.bank = { ...empty };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    payload: Parameters<typeof finishRun>[7] = {},
    success = true,
) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, success, empty, 10, 'dock', c.activeRun!.repairKits, payload)!;
}
function steer(
    s: MissionSimulation,
    target: { x: number; y: number },
    radius: number,
): FlightInput {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const distance = Math.hypot(dx, dy),
        error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function fly(s: MissionSimulation, target: { x: number; y: number }, radius = 80) {
    for (let f = 0; f < 60 * 160 && !s.ended; f++) {
        s.step({ ...steer(s, target, radius), mine: true });
        s.events.length = 0;
        if (
            Math.hypot(s.position.x - target.x, s.position.y - target.y) < radius + 35 &&
            s.speed < 25
        )
            return;
    }
    assert.fail(
        `flight failed: hull ${s.hull}, at ${JSON.stringify(s.position)}, target ${JSON.stringify(target)}`,
    );
}
function scan(s: MissionSimulation) {
    for (let f = 0; f < 240; f++) {
        s.step({ ...idle, interact: true });
        s.events.length = 0;
    }
}
function dock(c: ReturnType<typeof ready>, s: MissionSimulation) {
    fly(s, { x: 0, y: 0 });
    for (let f = 0; f < 180 && !s.ended; f++) s.step({ ...idle, interact: true });
    assert.equal(s.ended, 'returned', `hull ${s.hull}, position ${JSON.stringify(s.position)}`);
    const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
        data: [...s.surveyData],
        clearedBeltRocks: [...s.clearedBeltRocks],
        patrolKills: s.storyPatrolKills,
    });
    assert.ok(result);
    assert.ok(parseCampaign(JSON.stringify(c)));
    return result;
}

test('belt requires the Mercury technology and all main Mars preparations, preserving backtracking', () => {
    const c = ready();
    assert.equal(storyAct(c.story!), 'AKT VI');
    assert.equal(storyObjectives(c).length, 1);
    assert.equal(storyRadius(c.story!), 2200);
    assert.equal(storySectorComplete(c.story!, 'belt'), false);
    for (const id of ['mercury-technology', 'mars-base-defense', 'mars-corridor']) {
        const p = structuredClone(c.story!);
        p.claimed = p.claimed.filter((t) => t !== id);
        p.progress[id] = 0;
        assert.equal(storySectorUnlocked(p, 'belt'), false);
    }
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'belt'));
    beginRun(c, 1);
    assert.equal(travelStory(c, 'mars'), false);
});

test('belt layout is deterministic, expands on survey, and exposes each remaining physical obstacle by its own key', () => {
    const c = ready(),
        a = generateStorySector(c.story!);
    assert.deepEqual(a, generateStorySector(c.story!));
    assert.equal(a.enemies.length, 0);
    assert.equal(a.rocks.filter((r) => r.beltBarrier !== undefined).length, 0);
    report(c, { data: ['relay'] });
    assert.equal(storyRadius(c.story!), 5700);
    const b = generateStorySector(c.story!);
    assert.equal(b.rocks.filter((r) => r.beltBarrier !== undefined).length, 3);
    assert.ok(b.rocks.some((r) => r.vy !== 0));
    assert.equal(b.enemies.length, 2);
    assert.equal(
        b.landmarks.some((l) => l.key === 8),
        false,
    );
    assert.ok(b.rocks.every((r) => Math.hypot(r.x, r.y) + r.radius < 5700));
    report(c, { clearedBeltRocks: [2] });
    const d = generateStorySector(c.story!);
    assert.deepEqual(
        d.rocks.filter((r) => r.beltBarrier !== undefined).map((r) => r.beltBarrier),
        [0, 1],
    );
    assert.equal(
        d.landmarks.some((l) => l.key === 5),
        false,
    );
});

test('clearance reports validate indices, do not cross sectors or prerequisites, and reward each unique obstacle once', () => {
    const c = ready();
    report(c, { clearedBeltRocks: [0, 1, 2], data: ['archive'], patrolKills: 2 });
    assert.equal(c.story!.progress['belt-clear-0'], 0);
    assert.equal(c.story!.progress['belt-patrol'], 0);
    report(c, { data: ['relay'] });
    report(c, { clearedBeltRocks: [2, 2, -1, 3, 0.5, NaN] });
    assert.equal(c.story!.progress['belt-clear-2'], 1);
    assert.equal(c.story!.progress['belt-clear-0'], 0);
    const bank = { ...c.bank };
    report(c, { clearedBeltRocks: [2] });
    assert.deepEqual(c.bank, bank);
    travelStory(c, 'mars');
    report(c, { clearedBeltRocks: [0, 1] });
    assert.equal(c.story!.progress['belt-clear-0'], 0);
    travelStory(c, 'belt');
    report(c, { clearedBeltRocks: [1, 0] });
    assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
    const result = report(c, { data: ['archive'] });
    assert.ok(storySectorComplete(c.story!, 'belt'));
    assert.match(result.reason, /Akt VI/);
    assert.equal(c.story!.progress['belt-patrol'], 0);
    assert.deepEqual(c.bank, { ore: 78, parts: 18 });
    report(c, { patrolKills: 1 });
    assert.equal(c.story!.progress['belt-patrol'], 1);
    report(c, { patrolKills: 1 });
    assert.deepEqual(c.bank, { ore: 100, parts: 24 });
    const finalBank = { ...c.bank };
    report(c, { data: ['archive'], clearedBeltRocks: [0, 1, 2], patrolKills: 2 });
    assert.deepEqual(c.bank, finalBank);
});

test('loss and interrupted sortie discard pending obstacle and scan reports without resetting earlier confirmations', () => {
    const c = ready(true);
    report(c, { clearedBeltRocks: [1] });
    const bank = { ...c.bank };
    report(c, { clearedBeltRocks: [0, 2], data: ['archive'] }, false);
    assert.equal(c.story!.progress['belt-clear-1'], 1);
    assert.equal(c.story!.progress['belt-clear-0'], 0);
    assert.equal(c.story!.progress['belt-exit'], 0);
    assert.deepEqual(c.bank, bank);
    const d = ready(true);
    beginRun(d, 1);
    const next = parseCampaign(JSON.stringify(d))!;
    assert.ok(next.activeRun);
    finishRun(next, false, empty, 0, 'reload');
    assert.deepEqual(next.story!.claimed, d.story!.claimed);
    assert.equal(
        generateStorySector(next.story!).rocks.filter((r) => r.beltBarrier !== undefined).length,
        3,
    );
});

test('stock Prospector flies the entry, mines all three obstacles in reverse order and reaches the outer boundary through ordinary sorties', () => {
    const c = ready();
    for (const goal of ['survey', 2, 1, 0, 'exit'] as const) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (typeof goal === 'string') {
                const point = s.landmarks.find((l) => l.key === (goal === 'survey' ? 7 : 8))!;
                assert.ok(point);
                fly(s, point);
                scan(s);
                assert.ok(
                    s.surveyData.has(goal === 'survey' ? 'relay' : 'archive'),
                    `${goal}: ${JSON.stringify(s.position)}, speed ${s.speed}, scan ${s.scanProgress}, hull ${s.hull}, context ${s.context}`,
                );
            } else {
                fly(s, { x: BELT_BARRIERS[goal].x, y: 0 });
                for (let f = 0; f < 60 * 200 && !s.clearedBeltRocks.has(goal) && !s.ended; f++) {
                    const rock = [...s.rocks.values()].find((r) => r.beltBarrier === goal)!;
                    assert.ok(rock);
                    const pos = rock.body.translation(),
                        target = { x: pos.x * 100, y: pos.y * 100 };
                    s.step({ ...steer(s, target, 110), mine: true });
                    s.events.length = 0;
                }
                assert.ok(
                    s.clearedBeltRocks.has(goal),
                    `obstacle ${goal}: hull ${s.hull}, ${JSON.stringify(s.position)}`,
                );
                assert.equal(s.clearedBeltRocks.size, 1);
                assert.equal(
                    s.landmarks.some((l) => l.key === BELT_BARRIERS[goal].key),
                    false,
                );
                assert.equal(c.story!.progress[`belt-clear-${goal}`], 1);
                assert.equal(
                    storyObjectives(c, [], false, 0, false, false, [goal]).find(
                        (g) => g.id === `belt-clear-${goal}`,
                    )!.complete,
                    true,
                );
            }
            if (typeof goal === 'number') fly(s, { x: BELT_BARRIERS[goal].x, y: 0 });
            dock(c, s);
        } finally {
            s.dispose();
        }
    }
    assert.ok(storySectorComplete(c.story!, 'belt'));
    assert.equal(c.story!.progress['belt-patrol'], 0);
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'belt'));
});
