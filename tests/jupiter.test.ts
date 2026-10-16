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
    JUPITER_UPLINK,
    STORY_TASKS,
    storySectorUnlocked,
    storySectorComplete,
    storyRadius,
    storyAct,
    storyObjectives,
    travelStory,
    contributeStory,
    storyNextStep,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { flightHint } from '../frontend/game/ui/missionReadout';

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
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) => t.required && (t.act <= 6 || (surveyed && t.id === 'jupiter-survey')),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    assert.ok(travelStory(c, 'jupiter'));
    c.bank = { ...empty };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    data: ('relay' | 'archive' | 'outpost')[] = [],
    patrolKills = 0,
    success = true,
) {
    beginRun(c, 1);
    return finishRun(c, success, empty, 10, 'dock', c.activeRun!.repairKits, {
        data,
        patrolKills,
    })!;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function hold(s: MissionSimulation, input: FlightInput, frames: number) {
    for (let f = 0; f < frames && !s.ended; f++) {
        s.step(input);
        s.events.length = 0;
    }
}
function steer(
    s: MissionSimulation,
    target: { x: number; y: number },
    radius: number,
): FlightInput {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y,
        distance = Math.hypot(dx, dy),
        error = angleDifference(Math.atan2(dy, dx), s.ship.rotation()),
        stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function fly(s: MissionSimulation, target: { x: number; y: number }, radius = 65) {
    for (let f = 0; f < 60 * 180 && !s.ended; f++) {
        s.step({ ...steer(s, target, radius), mine: true });
        s.events.length = 0;
        if (
            Math.hypot(s.position.x - target.x, s.position.y - target.y) < radius + 35 &&
            s.speed < 25
        )
            return;
    }
    assert.fail(
        `flight: hull ${s.hull}, position ${JSON.stringify(s.position)}, target ${JSON.stringify(target)}`,
    );
}
function combat(s: MissionSimulation, one = true) {
    const initial = s.storyPatrolKills;
    for (let f = 0; f < 60 * 250 && !s.ended; f++) {
        const e = [...s.enemies.enemies.values()]
            .filter((e) => !one || e.storyPatrol)
            .sort((a, b) => {
                const ap = enemyPosition(a),
                    bp = enemyPosition(b),
                    p = s.position;
                return Math.hypot(ap.x - p.x, ap.y - p.y) - Math.hypot(bp.x - p.x, bp.y - p.y);
            })[0];
        if (!e || (one && s.storyPatrolKills > initial)) break;
        s.step({ ...steer(s, enemyPosition(e), 230), mine: true, fire: true });
        s.events.length = 0;
    }
    assert.equal(s.ended, null, `combat: hull ${s.hull}`);
    if (one) assert.equal(s.storyPatrolKills, initial + 1);
    else assert.equal(s.enemies.enemies.size, 0);
}
function dock(c: ReturnType<typeof ready>, s: MissionSimulation) {
    fly(s, { x: 0, y: 0 });
    hold(s, { ...idle, interact: true }, 180);
    assert.equal(s.ended, 'returned', `hull ${s.hull}`);
    const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
        data: [...s.surveyData],
        patrolKills: s.storyPatrolKills,
        kills: s.enemyKills,
    })!;
    assert.ok(parseCampaign(JSON.stringify(c)));
    return result;
}

test('Jupiter opens only after the main belt passage, preserves earlier acts and expands through two report gates', () => {
    const c = ready();
    assert.equal(storyAct(c.story!), 'AKT VII');
    assert.equal(storyObjectives(c).length, 1);
    assert.equal(storyRadius(c.story!), 2700);
    const p = structuredClone(c.story!);
    p.claimed = p.claimed.filter((id) => id !== 'belt-exit');
    p.progress['belt-exit'] = 0;
    assert.equal(storySectorUnlocked(p, 'jupiter'), false);
    assert.equal(c.story!.progress['belt-patrol'], 0);
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'jupiter'));
    const a = generateStorySector(c.story!);
    assert.deepEqual(a, generateStorySector(c.story!));
    assert.equal(a.enemies.length, 0);
    assert.ok(a.outpost.x > 10000);
    assert.equal(
        a.landmarks.some((l) => l.key === 0 || l.key === 8),
        false,
    );
    report(c, ['relay']);
    assert.equal(storyRadius(c.story!), 4700);
    const b = generateStorySector(c.story!);
    assert.equal(b.enemies.length, 2);
    assert.equal(b.enemies.filter((e) => e.kind === 'lancer').length, 1);
    assert.equal(b.outpost.guards.length, 2);
    assert.ok(b.outpost.guards.every((g) => !g.storyPatrol));
    assert.ok(b.landmarks.some((l) => l.key === 0 && !l.siteId));
    assert.equal(
        b.landmarks.some((l) => l.key === 8),
        false,
    );
});

test('patrol and intrusion reports work in either order and open the distant package without requiring the optional stockpile', () => {
    for (const hackFirst of [false, true]) {
        const c = ready();
        report(c, ['outpost', 'archive'], 2);
        assert.equal(c.story!.progress['jupiter-uplink'], 0);
        assert.equal(c.story!.progress['jupiter-patrol'], 0);
        report(c, ['relay']);
        if (hackFirst) report(c, ['outpost']);
        else {
            report(c, [], 1);
            assert.equal(c.story!.progress['jupiter-patrol'], 1);
            report(c, [], 1);
        }
        assert.equal(
            generateStorySector(c.story!).landmarks.some((l) => l.key === 8),
            false,
        );
        report(c, ['archive']);
        assert.equal(c.story!.progress['jupiter-observations'], 0);
        if (hackFirst) report(c, [], 2);
        else report(c, ['outpost']);
        assert.equal(storyRadius(c.story!), 6100);
        assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
        const result = report(c, ['archive']);
        assert.match(result.reason, /Cele operacyjne Jowisza/);
        assert.ok(storySectorComplete(c.story!, 'jupiter'));
        assert.deepEqual(c.bank, { ore: 108, parts: 28 });
        assert.equal(c.story!.progress['jupiter-reserve'], 0);
        const bank = { ...c.bank };
        report(c, ['relay', 'outpost', 'archive'], 2);
        assert.deepEqual(c.bank, bank);
        contributeStory(c, 'jupiter-reserve');
        assert.deepEqual(c.bank, { ore: 96, parts: 33 });
        assert.doesNotMatch(storyNextStep(c.story!), /Akt VII ukończony/);
    }
});

test('the scanner raises a real alarm and its reinforcement guards never count as story patrols', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        for (let f = 0; f < 140 && !s.outpost.reinforcementsCalled; f++) {
            const a = s.outpost.scannerAngle(s.elapsed);
            at(s, {
                x: JUPITER_UPLINK.x + Math.cos(a) * 400,
                y: JUPITER_UPLINK.y + Math.sin(a) * 400,
            });
            s.step(idle);
            s.events.length = 0;
        }
        assert.ok(s.outpost.alarm > 0);
        assert.ok(s.outpost.reinforcementsCalled);
        assert.equal(s.enemies.enemies.size, 4);
        assert.equal([...s.enemies.enemies.values()].filter((e) => e.storyPatrol).length, 2);
        assert.equal(s.storyPatrolKills, 0);
        at(s, JUPITER_UPLINK.terminal);
        hold(s, { ...idle, interact: true }, 60);
        assert.equal(s.outpost.secured, false);
        assert.ok(!s.surveyData.has('outpost'));
        assert.equal(s.nearbyScanSite, undefined);
        combat(s, false);
        assert.equal(s.enemyKills, 4);
        assert.equal(s.storyPatrolKills, 2);
    } finally {
        s.dispose();
    }
});

test('sabotage consumes one carried component only on completion, clears the alarm and allows actual terminal download', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, JUPITER_UPLINK.terminal);
        s.outpost.alarm = 8;
        s.outpost.reinforcementsCalled = true;
        s.cargo.parts = 1;
        hold(s, { ...idle, sabotage: true }, 90);
        assert.equal(s.cargo.parts, 1);
        hold(s, idle, 1);
        assert.equal(s.outpost.sabotageProgress, 0);
        hold(s, { ...idle, sabotage: true }, 185);
        assert.equal(s.cargo.parts, 0);
        assert.ok(s.outpost.disabledTime > 19);
        assert.equal(s.outpost.alarm, 0);
        hold(s, { ...idle, interact: true }, 245);
        assert.ok(s.surveyData.has('outpost'));
        assert.equal(c.story!.progress['jupiter-uplink'], 0);
        assert.match(flightHint(s), /Satuk 15/);
        hold(s, idle, 1);
        hold(s, { ...idle, interact: true }, 350);
        assert.equal(s.outpost.equipmentSecured, false);
        assert.match(
            storyObjectives(c, [...s.surveyData]).find((g) => g.id === 'jupiter-uplink')!.progress,
            /danymi/,
        );
    } finally {
        s.dispose();
    }
});

test('death, refresh and reports from other sectors cannot keep an unreturned intrusion package', () => {
    const c = ready(true);
    report(c, ['outpost', 'archive'], 2, false);
    assert.equal(c.story!.progress['jupiter-uplink'], 0);
    assert.equal(c.story!.progress['jupiter-patrol'], 0);
    assert.equal(c.story!.progress['jupiter-survey'], 1);
    const d = ready(true);
    travelStory(d, 'earth');
    report(d, ['outpost'], 2);
    assert.equal(d.story!.progress['jupiter-uplink'], 0);
    travelStory(d, 'jupiter');
    beginRun(d, 1);
    const restored = parseCampaign(JSON.stringify(d))!;
    finishRun(restored, false, empty, 0, 'reload');
    assert.equal(restored.story!.progress['jupiter-uplink'], 0);
    assert.equal(restored.story!.progress['jupiter-survey'], 1);
});

test('stock Prospector surveys, fights both patrols, mines sabotage supplies, hacks the node and returns the observation package through ordinary sorties', () => {
    const c = ready();
    for (const goal of ['survey', 'patrol', 'patrol', 'uplink', 'package'] as const) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (goal === 'patrol') combat(s);
            else if (goal === 'uplink') {
                const rich = [...s.rocks.values()]
                    .filter((r) => r.rich)
                    .sort((a, b) => {
                        const ap = a.body.translation(),
                            bp = b.body.translation();
                        return Math.hypot(ap.x, ap.y) - Math.hypot(bp.x, bp.y);
                    })[0];
                assert.ok(rich);
                for (let f = 0; f < 60 * 120 && s.rocks.has(rich.id) && !s.ended; f++) {
                    const p = rich.body.translation();
                    s.step({ ...steer(s, { x: p.x * 100, y: p.y * 100 }, 110), mine: true });
                    s.events.length = 0;
                }
                assert.ok(!s.rocks.has(rich.id));
                fly(s, rich.previous, 45);
                hold(s, idle, 180);
                assert.ok(s.cargo.parts >= 1, 'actual mining provides the sabotage component');
                fly(s, JUPITER_UPLINK.terminal, 45);
                for (let f = 0; f < 600 && !s.outpost.sabotaged && !s.ended; f++) {
                    s.step({ ...idle, sabotage: true });
                    s.events.length = 0;
                }
                assert.ok(s.outpost.sabotaged, `sabotage: hull ${s.hull}`);
                hold(s, { ...idle, interact: true }, 250);
                assert.ok(s.surveyData.has('outpost'), `download: ${s.jupiterStatus}`);
            } else {
                const site = s.landmarks.find((l) => l.key === (goal === 'survey' ? 7 : 8))!;
                assert.ok(site);
                fly(s, site);
                hold(s, { ...idle, interact: true }, 200);
                assert.ok(s.surveyData.has(goal === 'survey' ? 'relay' : 'archive'));
            }
            dock(c, s);
        } finally {
            s.dispose();
        }
    }
    assert.ok(storySectorComplete(c.story!, 'jupiter'));
    assert.equal(c.story!.progress['jupiter-reserve'], 0);
});
