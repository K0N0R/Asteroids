import { solveTerminal } from './terminal-test-helper';
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
    NEPTUNE_ARENA,
    OUTER_BASES,
    STORY_TASKS,
    storySectorUnlocked,
    storySectorComplete,
    storyRadius,
    storyAct,
    storyObjectives,
    travelStory,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { FIRST_BOSS } from '../frontend/game/systems/firstBoss';
import { angleDifference } from '../frontend/game/systems/flight';
import { enemyPosition } from '../frontend/game/systems/enemies';

before(async () => RAPIER.init());
const empty = { ore: 0, parts: 0 };
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(neptune = false, base = false) {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) =>
            t.required &&
            (t.act <= 8 ||
                (neptune && t.sector === 'uranus') ||
                (base && ['neptune-survey', 'neptune-base'].includes(t.id))),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    assert.ok(travelStory(c, neptune ? 'neptune' : 'uranus'));
    c.bank = { ...empty };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    data: ('relay' | 'archive' | 'outpost')[] = [],
    patrolKills = 0,
    firstBossWon = false,
    success = true,
) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, success, empty, 10, 'dock', c.activeRun!.repairKits, {
        data,
        patrolKills,
        firstBossWon,
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
        d = Math.hypot(dx, dy),
        e = angleDifference(Math.atan2(dy, dx), s.ship.rotation()),
        stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, e * 2.5)),
        thrust: Math.abs(e) < 0.3 && d > radius + stop + 15,
        brake: s.speed > 20 && (d < radius + stop || Math.abs(e) > 0.6),
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
        `flight hull ${s.hull}, position ${JSON.stringify(s.position)}, target ${JSON.stringify(target)}`,
    );
}
function dock(c: ReturnType<typeof ready>, s: MissionSimulation) {
    fly(s, { x: 0, y: 0 });
    hold(s, { ...idle, interact: true }, 180);
    assert.equal(s.ended, 'returned', `hull ${s.hull}`);
    const r = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
        data: [...s.surveyData],
        patrolKills: s.storyPatrolKills,
        kills: s.enemyKills,
        firstBossWon: s.firstBoss.complete,
    })!;
    assert.ok(r);
    assert.ok(parseCampaign(JSON.stringify(c)));
    return r;
}
function start(s: MissionSimulation) {
    at(s, NEPTUNE_ARENA);
    s.step(idle);
    hold(s, { ...idle, sabotage: true }, 125);
    assert.equal(s.firstBoss.state, 'warning');
    hold(s, idle, 185);
    assert.equal(s.firstBoss.state, 'battle');
}
function fight(s: MissionSimulation) {
    let phaseTwo = false;
    for (let f = 0; f < 60 * 180 && s.firstBoss.active && !s.ended; f++) {
        const e = s.enemies.enemies.get(FIRST_BOSS.id);
        if (e) s.step({ ...steer(s, enemyPosition(e), 260), fire: true, mine: true });
        else s.step(idle);
        phaseTwo ||= s.firstBoss.phase === 2;
        s.events.length = 0;
    }
    assert.equal(s.ended, null, `boss hull ${s.hull}, ${s.firstBoss.summary}`);
    assert.equal(s.firstBoss.state, 'complete', s.firstBoss.summary);
    assert.ok(phaseTwo);
    assert.equal(s.firstBoss.health, FIRST_BOSS.retreatAt);
    assert.equal(s.enemies.enemies.has(FIRST_BOSS.id), false);
}
function acquireComponent(s: MissionSimulation) {
    const rock = [...s.rocks.values()]
        .filter((r) => r.rich && !r.crystal)
        .sort((a, b) => {
            const ap = a.body.translation(),
                bp = b.body.translation();
            return Math.hypot(ap.x, ap.y) - Math.hypot(bp.x, bp.y);
        })[0];
    assert.ok(rock);
    for (let f = 0; f < 60 * 120 && s.rocks.has(rock.id) && !s.ended; f++) {
        const p = rock.body.translation();
        s.step({ ...steer(s, { x: p.x * 100, y: p.y * 100 }, 110), mine: true });
        s.events.length = 0;
    }
    assert.ok(!s.rocks.has(rock.id));
    fly(s, rock.previous, 45);
    hold(s, idle, 180);
    assert.ok(s.cargo.parts >= 1);
}

test('Act IX opens Uranus after Saturn and Neptune after the full Uranus route, with no optional stockpile gate', () => {
    const c = ready();
    assert.equal(storyAct(c.story!), 'AKT IX');
    assert.equal(storyObjectives(c).length, 1);
    assert.equal(storyRadius(c.story!), 2700);
    assert.equal(storySectorUnlocked(c.story!, 'neptune'), false);
    assert.equal(travelStory(c, 'neptune'), false);
    const p = structuredClone(c.story!);
    p.claimed = p.claimed.filter((id) => id !== 'saturn-route');
    p.progress['saturn-route'] = 0;
    assert.equal(storySectorUnlocked(p, 'uranus'), false);
    assert.equal(c.story!.progress['saturn-reserve'], 0);
    const a = generateStorySector(c.story!);
    assert.deepEqual(a, generateStorySector(c.story!));
    assert.equal(a.enemies.length, 0);
    assert.ok(a.outpost.x > 10000);
    report(c, ['relay']);
    assert.equal(storyRadius(c.story!), 4600);
    const b = generateStorySector(c.story!);
    assert.equal(b.enemies.length, 2);
    assert.equal(b.outpost.guards.length, 2);
    assert.ok(b.landmarks.some((l) => l.key === 0 && !l.siteId));
    report(c, [], 2);
    assert.equal(
        b.landmarks.some((l) => l.key === 8),
        false,
    );
    report(c, ['outpost']);
    assert.equal(storyRadius(c.story!), 5600);
    report(c, ['archive']);
    assert.ok(travelStory(c, 'neptune'));
    assert.equal(storyRadius(c.story!), 2800);
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'neptune'));
});

test('Uranus data and combat reports accept either order, while unrelated flags and premature data never credit the first encounter', () => {
    for (const hackFirst of [false, true]) {
        const c = ready();
        report(c, ['outpost', 'archive'], 2, true);
        assert.equal(c.story!.progress['uranus-base'], 0);
        assert.equal(c.story!.progress['uranus-patrol'], 0);
        assert.equal(c.story!.progress['neptune-boss'], 0);
        report(c, ['relay']);
        if (hackFirst) report(c, ['outpost']);
        else report(c, [], 2);
        report(c, ['archive']);
        assert.equal(c.story!.progress['uranus-route'], 0);
        if (hackFirst) report(c, [], 2);
        else report(c, ['outpost']);
        report(c, ['archive']);
        assert.deepEqual(c.bank, { ore: 98, parts: 26 });
        const bank = { ...c.bank };
        report(c, ['relay', 'outpost', 'archive'], 2, true);
        assert.deepEqual(c.bank, bank);
        assert.equal(c.story!.progress['uranus-reserve'], 0);
    }
    const c = ready(true);
    report(c, [], 0, true);
    assert.equal(c.story!.progress['neptune-boss'], 0);
    report(c, ['relay']);
    assert.equal(storyRadius(c.story!), 4800);
    report(c, ['outpost']);
    assert.equal(storyRadius(c.story!), 5800);
    const a = generateStorySector(c.story!);
    assert.ok(a.landmarks.some((l) => l.key === 3));
    assert.equal(
        a.landmarks.some((l) => l.key === 8),
        false,
    );
    assert.equal(a.enemies.length, 2);
    assert.ok(
        a.rocks.every(
            (r) => Math.hypot(r.x - NEPTUNE_ARENA.x, r.y - NEPTUNE_ARENA.y) > r.radius + 1200,
        ),
    );
});

test('the first encounter is opt-in, has two real attack profiles, telegraphs a three-shot second-phase salvo', () => {
    const c = ready(true, true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, NEPTUNE_ARENA);
        hold(s, idle, 250);
        assert.equal(s.firstBoss.state, 'idle');
        assert.ok(!s.enemies.enemies.has(FIRST_BOSS.id));
        start(s);
        const e = s.enemies.enemies.get(FIRST_BOSS.id)!;
        assert.ok(e.boss);
        assert.equal(e.health, 720);
        assert.equal(e.config.radius, 52);
        assert.equal(e.config.windup, 1.4);
        e.health = FIRST_BOSS.phaseAt;
        s.step(idle);
        assert.equal(s.firstBoss.phase, 2);
        assert.equal(e.config.windup, 0.9);
        let salvo = false;
        for (let f = 0; f < 240 && !salvo && !s.ended; f++) {
            s.step(idle);
            s.events.length = 0;
            salvo =
                [...s.bullets.values()].filter((b) => b.shooterId === FIRST_BOSS.id).length >= 3;
        }
        assert.ok(salvo);
        assert.equal(s.storyPatrolKills, 0);
        assert.equal(c.story!.progress['neptune-boss'], 0);
    } finally {
        s.dispose();
    }
});

test('leaving, timeout or loss aborts the attempt, cleans only encounter bodies and shots, and requires releasing G before retry', () => {
    const c = ready(true, true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        s.addBullet(900000, {
            id: 900000,
            x: NEPTUNE_ARENA.x,
            y: NEPTUNE_ARENA.y,
            vx: 0,
            vy: 0,
            life: 10,
            team: 'enemy',
            damage: 1,
            shooterId: FIRST_BOSS.id,
        });
        at(s, { x: NEPTUNE_ARENA.x + FIRST_BOSS.arenaRadius + 20, y: NEPTUNE_ARENA.y });
        hold(s, { ...idle, sabotage: true }, 1);
        assert.equal(s.firstBoss.state, 'failed');
        assert.equal(s.enemies.enemies.size, 2);
        assert.equal(s.bullets.has(900000), false);
        at(s, NEPTUNE_ARENA);
        hold(s, { ...idle, sabotage: true }, 160);
        assert.equal(s.firstBoss.state, 'failed');
        hold(s, idle, 1);
        hold(s, { ...idle, sabotage: true }, 125);
        assert.equal(s.firstBoss.state, 'warning');
        hold(s, idle, 185);
        s.firstBoss.timer = 0;
        s.step(idle);
        assert.equal(s.firstBoss.state, 'failed');
        assert.equal(s.enemies.enemies.size, 2);
        hold(s, idle, 1);
        hold(s, { ...idle, sabotage: true }, 125);
        s.hull = 0;
        s.step(idle);
        assert.equal(s.firstBoss.state, 'failed');
        assert.equal(s.ended, 'destroyed');
        assert.equal(c.story!.progress['neptune-boss'], 0);
    } finally {
        s.dispose();
    }
});

test('real first-encounter combat retreats without kill loot, confirms its report over radio, and rejects wrong-sector or lost reports', () => {
    const c = ready(true, true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        fight(s);
        assert.equal(s.enemyKills, 0);
        assert.equal(s.storyPatrolKills, 0);
        assert.equal(s.loot.size, 0);
        assert.equal(s.salvage.items.size, 0);
        assert.equal(c.story!.progress['neptune-boss'], 1);
        assert.equal(
            storyObjectives(c, [], false, 0, false, false, [], 0, true).find(
                (g) => g.id === 'neptune-boss',
            )!.complete,
            true,
        );
        const restored = parseCampaign(JSON.stringify(c))!;
        finishRun(restored, false, empty, 0, 'reload');
        assert.equal(restored.story!.progress['neptune-boss'], 1);
        const result = dock(c, s);
        assert.ok(result.pilotProgress!.gainedXp >= 12);
        assert.equal(c.story!.progress['neptune-boss'], 1);
        assert.equal(c.story!.progress['neptune-route'], 0);
        assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
        assert.deepEqual(c.bank, { ore: 50, parts: 16 });
        const duplicate = report(c, [], 0, true);
        assert.equal(duplicate.pilotProgress!.gainedXp, 0);
        assert.deepEqual(c.bank, { ore: 50, parts: 16 });
    } finally {
        s.dispose();
    }
    const d = ready(true, true);
    report(d, [], 0, true, false);
    assert.equal(d.story!.progress['neptune-boss'], 0);
    const e = ready(true, true);
    travelStory(e, 'uranus');
    report(e, [], 0, true);
    assert.equal(e.story!.progress['neptune-boss'], 0);
});

test('stock Prospector traverses both sectors, mines hacking supplies, defeats both Uranus contacts and forces the heavy unit to retreat through ordinary sorties', () => {
    const c = ready();
    for (const goal of [
        'u-survey',
        'u-base',
        'patrol',
        'patrol',
        'u-route',
        'n-survey',
        'n-base',
        'boss',
        'n-route',
    ] as const) {
        if (goal === 'n-survey') assert.ok(travelStory(c, 'neptune'));
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (goal === 'u-base' || goal === 'n-base') {
                acquireComponent(s);
                fly(s, OUTER_BASES[goal === 'u-base' ? 'uranus' : 'neptune'].terminal, 45);
                for (let f = 0; f < 600 && !s.outpost.sabotaged && !s.ended; f++) {
                    s.step({ ...idle, sabotage: true });
                    s.events.length = 0;
                }
                solveTerminal(s, 'power');
                assert.ok(s.outpost.sabotaged, `sabotage ${goal}, hull ${s.hull}`);
                hold(s, { ...idle, interact: true }, 250);
                solveTerminal(s, 'breach');
                assert.ok(s.surveyData.has('outpost'));
            } else if (goal === 'patrol') {
                for (let f = 0; f < 60 * 230 && !s.ended && s.storyPatrolKills < 1; f++) {
                    const e = [...s.enemies.enemies.values()]
                        .filter((e) => e.storyPatrol)
                        .sort((a, b) => {
                            const ap = enemyPosition(a),
                                bp = enemyPosition(b),
                                p = s.position;
                            return (
                                Math.hypot(ap.x - p.x, ap.y - p.y) -
                                Math.hypot(bp.x - p.x, bp.y - p.y)
                            );
                        })[0];
                    assert.ok(e);
                    s.step({ ...steer(s, enemyPosition(e), 230), fire: true, mine: true });
                    s.events.length = 0;
                }
                assert.equal(s.storyPatrolKills, 1);
            } else if (goal === 'boss') {
                fly(s, NEPTUNE_ARENA, 60);
                hold(s, { ...idle, sabotage: true }, 125);
                assert.equal(s.firstBoss.state, 'warning');
                fight(s);
            } else {
                const scan = goal.endsWith('survey') ? 'relay' : 'archive',
                    site = s.landmarks.find((l) => l.siteId === scan)!;
                assert.ok(site);
                fly(s, site);
                hold(s, { ...idle, interact: true }, 200);
                assert.ok(s.surveyData.has(scan));
            }
            dock(c, s);
        } finally {
            s.dispose();
        }
    }
    assert.ok(storySectorComplete(c.story!, 'uranus'));
    assert.ok(storySectorComplete(c.story!, 'neptune'));
    assert.equal(c.story!.progress['neptune-patrol'], 0);
    assert.equal(c.story!.progress['uranus-reserve'], 0);
});
