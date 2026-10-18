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
    STORY_TASKS,
    recordStoryReturn,
    storyObjectives,
    type StorySectorId,
} from '../frontend/game/state/story';
import { missionObjectiveMet, missionOrderStatus } from '../frontend/game/state/missionOrders';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
const empty = { ore: 0, parts: 0 };
function ready(sector: StorySectorId, target: string) {
    const c = newStoryCampaign();
    const task = STORY_TASKS.find((t) => t.id === target)!;
    function grant(id: string) {
        const t = STORY_TASKS.find((t) => t.id === id)!;
        t.dependencies.forEach(grant);
        c.story!.progress[id] = t.target;
        if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
    }
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) => t.required && (t.act < task.act || (sector === 'neptune' && t.sector === 'uranus')),
    ))
        grant(t.id);
    task.dependencies.forEach(grant);
    c.story!.sector = sector;
    assert.ok(parseCampaign(JSON.stringify(c)), 'valid initial fixture');
    beginRun(c, 1, null, false, target);
    assert.ok(c.activeRun?.mission, target);
    return c;
}

test('radio persists partial patrol counts once, does not open docking early, and survives serialization', () => {
    const c = ready('mars', 'mars-patrol'),
        s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.storyPatrolKills = 1;
        s.step(idle);
        assert.equal(c.story!.progress['mars-patrol'], 1);
        assert.equal(s.missionReturnBlocked, true);
        const revision = s.deliveryRevision;
        for (let i = 0; i < 20; i++) s.step(idle);
        assert.equal(c.story!.progress['mars-patrol'], 1);
        assert.equal(s.deliveryRevision, revision);
        assert.equal(
            storyObjectives(c, [], false, 1).find((t) => t.id === 'mars-patrol')!.progress,
            '1/2',
        );
        const loaded = parseCampaign(JSON.stringify(c));
        assert.ok(loaded);
        assert.equal(loaded.activeRun!.reportedPatrolKills, 1);
        assert.equal(missionObjectiveMet(loaded, { patrolKills: 1 }), false);
        const bank = { ...c.bank };
        s.storyPatrolKills = 2;
        s.step(idle);
        assert.ok(c.story!.claimed.includes('mars-patrol'));
        assert.equal(s.missionReturnBlocked, false);
        assert.match(missionOrderStatus(c, s.missionReport), /Raport przyjęty/);
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(s.radioMessages.length, 1);
        assert.ok(c.bank.ore > bank.ore);
        const paid = { ...c.bank };
        recordStoryReturn(c, 'mars', [], false, false, 2);
        assert.deepEqual(c.bank, paid);
        const result = finishRun(c, true, empty, 10, 'dock', 0, { patrolKills: 2 })!;
        assert.equal(result.success, true);
        assert.equal(result.reward.ore, 0);
        assert.equal(c.story!.progress['mars-patrol'], 2);
    } finally {
        s.dispose();
    }
});

for (const [sector, task] of [
    ['venus', 'venus-survey'],
    ['mercury', 'mercury-survey'],
    ['belt', 'belt-survey'],
    ['jupiter', 'jupiter-survey'],
    ['saturn', 'saturn-survey'],
    ['uranus', 'uranus-survey'],
    ['neptune', 'neptune-survey'],
    ['pluto', 'pluto-survey'],
] as const)
    test(`${sector} accepts radio scans before docking and retains them after loss`, () => {
        const c = ready(sector, task),
            s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            s.surveyData.add(STORY_TASKS.find((t) => t.id === task)!.site!);
            s.step(idle);
            assert.ok(c.story!.claimed.includes(task));
            assert.equal(s.missionReturnBlocked, false);
            assert.equal(s.radioMessages.length, 1);
            assert.match(s.radioMessages[0], /następny wylot/);
            assert.ok(parseCampaign(JSON.stringify(c)));
            s.step(idle);
            assert.equal(s.radioMessages.length, 1);
            finishRun(c, false, empty, 10, 'loss', 0);
            assert.ok(c.story!.claimed.includes(task));
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    });

test('aborted or destroyed sorties cannot send unconfirmed reports', () => {
    for (const death of [false, true]) {
        const c = ready('jupiter', 'jupiter-survey'),
            s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            s.surveyData.add('relay');
            if (death) s.hull = 0;
            else c.activeRun!.mission!.aborted = true;
            s.step(idle);
            assert.equal(c.story!.claimed.includes('jupiter-survey'), false);
            assert.equal(s.radioMessages.length, 0);
        } finally {
            s.dispose();
        }
    }
});

test('boss radio records a single XP bonus and never awards it again on a later sortie', () => {
    for (const [sector, task, bonus] of [
        ['neptune', 'neptune-boss', 12],
        ['pluto', 'pluto-boss', 18],
    ] as const) {
        const c = ready(sector, task);
        recordStoryReturn(
            c,
            sector,
            [],
            false,
            false,
            0,
            false,
            false,
            [],
            0,
            sector === 'neptune',
            sector === 'pluto',
        );
        assert.equal(c.activeRun!.reportedBossXp, bonus);
        assert.ok(c.story!.claimed.includes(task));
        assert.ok(parseCampaign(JSON.stringify(c)));
        const pilot = c.pilots.find((p) => p.id === c.activeRun!.pilotId)!;
        const xp = pilot.xp;
        finishRun(c, true, empty, 10, 'dock', 0, {
            firstBossWon: sector === 'neptune',
            finalBossWon: sector === 'pluto',
        });
        assert.equal(pilot.xp - xp, bonus);
        beginRun(c, 2);
        recordStoryReturn(
            c,
            sector,
            [],
            false,
            false,
            0,
            false,
            false,
            [],
            0,
            sector === 'neptune',
            sector === 'pluto',
        );
        assert.equal(c.activeRun!.reportedBossXp, undefined);
    }
});

test('save parser rejects invalid radio counters and the previous format', () => {
    const c = ready('mars', 'mars-patrol');
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 45 })), null);
    for (const value of [-1, 1.5, '1', 1000001]) {
        c.activeRun!.reportedPatrolKills = value as number;
        assert.equal(parseCampaign(JSON.stringify(c)), null);
    }
    delete c.activeRun!.reportedPatrolKills;
    c.activeRun!.reportedBossXp = 12;
    assert.equal(parseCampaign(JSON.stringify(c)), null);
});
