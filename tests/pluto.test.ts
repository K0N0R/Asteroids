import { grantStoryTasks } from './fleet-fixtures';
import { manufacture } from '../frontend/game/state/production';
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
    PLUTO_ARENA,
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
import { FINAL_BOSS } from '../frontend/game/systems/firstBoss';
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
function ready(prepared = false) {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS.filter(
        (t) =>
            t.required &&
            (t.act <= 9 ||
                (prepared && ['pluto-survey', 'pluto-base', 'pluto-patrol'].includes(t.id))),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    grantStoryTasks(c, c.story!.claimed);
    assert.ok(travelStory(c, 'pluto'));
    c.bank = { ...empty };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    data: ('relay' | 'archive' | 'outpost')[] = [],
    patrolKills = 0,
    finalBossWon = false,
    success = true,
    firstBossWon = false,
) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, success, empty, 10, 'dock', c.activeRun!.repairKits, {
        data,
        patrolKills,
        finalBossWon,
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
        finalBossWon: s.firstBoss.complete,
    })!;
    assert.ok(r);
    assert.ok(parseCampaign(JSON.stringify(c)));
    return r;
}
function start(s: MissionSimulation) {
    at(s, PLUTO_ARENA);
    s.step(idle);
    hold(s, { ...idle, sabotage: true }, 125);
    assert.equal(s.firstBoss.state, 'warning');
    hold(s, idle, 245);
    assert.equal(s.firstBoss.state, 'battle');
}
function fight(s: MissionSimulation) {
    const phases = new Set<number>();
    for (let f = 0; f < 60 * 180 && s.firstBoss.active && !s.ended; f++) {
        const e = s.enemies.enemies.get(FINAL_BOSS.id);
        if (e) s.step({ ...steer(s, enemyPosition(e), 260), fire: true, mine: true });
        else s.step(idle);
        phases.add(s.firstBoss.phase);
        s.events.length = 0;
    }
    assert.equal(s.ended, null, `boss hull ${s.hull}, ${s.firstBoss.summary}`);
    assert.equal(s.firstBoss.state, 'complete', s.firstBoss.summary);
    assert.deepEqual([...phases], [1, 2, 3]);
    assert.equal(s.firstBoss.health, 0);
    assert.equal(s.enemies.enemies.has(FINAL_BOSS.id), false);
}
function acquireComponent(s: MissionSimulation) {
    assert.ok(s.cargo.parts >= 1, 'sabotage part was prepared at the base');
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

test('Pluto unlocks only after Neptune main reports, expands with parallel preparation, and keeps optional data independent', () => {
    const wrong = ready(true);
    travelStory(wrong, 'neptune');
    report(wrong, [], 0, true);
    assert.equal(wrong.story!.progress['pluto-boss'], 0);
    const c = ready();
    assert.equal(storyAct(c.story!), 'AKT X');
    assert.equal(storyRadius(c.story!), 2800);
    const p = structuredClone(c.story!);
    p.claimed = p.claimed.filter((id) => id !== 'neptune-route');
    p.progress['neptune-route'] = 0;
    assert.equal(storySectorUnlocked(p, 'pluto'), false);
    let sector = generateStorySector(c.story!);
    assert.equal(sector.enemies.length, 0);
    assert.ok(!sector.landmarks.some((l) => l.key === 0 || l.key === 3 || l.key === 8));
    report(c, ['outpost', 'archive'], 2, true);
    assert.equal(c.story!.progress['pluto-boss'], 0);
    assert.equal(c.story!.progress['pluto-base'], 0);
    report(c, ['relay']);
    assert.equal(storyRadius(c.story!), 4800);
    sector = generateStorySector(c.story!);
    assert.equal(sector.enemies.length, 2);
    assert.ok(sector.landmarks.some((l) => l.key === 8));
    assert.ok(!sector.landmarks.some((l) => l.key === 3));
    assert.deepEqual(sector, generateStorySector(c.story!));
    for (const baseFirst of [false, true]) {
        const d = structuredClone(c);
        if (baseFirst) report(d, ['outpost']);
        else report(d, [], 1);
        report(d, [], 0, true);
        assert.equal(d.story!.progress['pluto-boss'], 0);
        if (baseFirst) report(d, [], 2);
        else {
            report(d, [], 1);
            report(d, ['outpost']);
        }
        assert.equal(storyRadius(d.story!), 6000);
        assert.ok(generateStorySector(d.story!).landmarks.some((l) => l.key === 3));
        report(d, [], 0, false, true, true);
        assert.equal(d.story!.progress['pluto-boss'], 0);
        const lost = structuredClone(d);
        report(lost, [], 0, true, false);
        assert.equal(lost.story!.progress['pluto-boss'], 0);
        assert.equal(d.story!.progress['pluto-boss'], 0);
        const result = report(d, [], 0, true);
        assert.match(result.reason, /Cele operacyjne kampanii/);
        assert.ok(storySectorComplete(d.story!, 'pluto'));
        assert.equal(d.story!.progress['pluto-record'], 0);
        const bank = { ...d.bank };
        const duplicate = report(d, [], 0, true);
        assert.deepEqual(d.bank, bank);
        assert.equal(duplicate.pilotProgress!.gainedXp, 0);
        assert.ok(travelStory(d, 'earth'));
        report(d, [], 0, true);
        assert.ok(travelStory(d, 'pluto'));
        assert.ok(parseCampaign(JSON.stringify(d)));
    }
});
test('final encounter has a telegraphed five-shot third phase and failure resets only its own actors and shots', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, PLUTO_ARENA);
        hold(s, idle, 250);
        assert.equal(s.firstBoss.state, 'idle');
        start(s);
        const e = s.enemies.enemies.get(FINAL_BOSS.id)!;
        assert.ok(e.finalBoss);
        assert.equal(e.health, 900);
        e.health = FINAL_BOSS.phaseAt;
        s.step(idle);
        assert.equal(s.firstBoss.phase, 2);
        assert.equal(e.config.windup, 1.1);
        e.health = FINAL_BOSS.thirdAt;
        s.step(idle);
        assert.equal(s.firstBoss.phase, 3);
        assert.equal(e.config.windup, 0.9);
        let salvo = false;
        for (let f = 0; f < 240 && !salvo; f++) {
            s.step(idle);
            s.events.length = 0;
            salvo =
                [...s.bullets.values()].filter((b) => b.shooterId === FINAL_BOSS.id).length >= 5;
        }
        assert.ok(salvo);
        s.addBullet(900000, {
            id: 900000,
            x: PLUTO_ARENA.x,
            y: PLUTO_ARENA.y,
            vx: 0,
            vy: 0,
            life: 10,
            team: 'enemy',
            damage: 1,
            shooterId: FINAL_BOSS.id,
        });
        at(s, { x: PLUTO_ARENA.x + 1520, y: PLUTO_ARENA.y });
        hold(s, { ...idle, sabotage: true }, 1);
        assert.equal(s.firstBoss.state, 'failed');
        assert.ok(!s.bullets.has(900000));
        assert.ok(!s.enemies.enemies.has(FINAL_BOSS.id));
        at(s, PLUTO_ARENA);
        hold(s, { ...idle, sabotage: true }, 160);
        assert.equal(s.firstBoss.state, 'failed');
        hold(s, idle, 1);
        start(s);
        assert.equal(s.firstBoss.health, 900);
        assert.equal(s.firstBoss.phase, 1);
        s.firstBoss.timer = 0;
        s.step(idle);
        assert.equal(s.firstBoss.state, 'failed');
        hold(s, idle, 1);
        hold(s, { ...idle, sabotage: true }, 125);
        s.hull = 0;
        s.step(idle);
        assert.equal(s.firstBoss.state, 'failed');
        assert.equal(s.ended, 'destroyed');
        assert.equal(c.story!.progress['pluto-boss'], 0);
    } finally {
        s.dispose();
    }
});
test('final victory is radio-confirmed before docking and survives loss, and pays boss XP once', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        fight(s);
        assert.equal(s.enemyKills, 0);
        assert.equal(s.storyPatrolKills, 0);
        assert.equal(s.loot.size, 0);
        assert.equal(s.salvage.items.size, 0);
        assert.equal(
            storyObjectives(c, [], false, 0, false, false, [], 0, false, true).find(
                (t) => t.id === 'pluto-boss',
            )!.complete,
            true,
        );
        assert.equal(c.story!.progress['pluto-boss'], 1);
        const lost = parseCampaign(JSON.stringify(c))!;
        finishRun(lost, false, empty, 0, 'reload');
        assert.equal(lost.story!.progress['pluto-boss'], 1);
        const r = dock(c, s);
        assert.ok(r.pilotProgress!.gainedXp >= 18);
        assert.deepEqual(r.reward, { ore: 0, parts: 0 });
        assert.ok(storySectorComplete(c.story!, 'pluto'));
        beginRun(c, 1);
        const next = new MissionSimulation(c, c.activeRun!.seed);
        try {
            assert.equal(next.firstBossAvailable, false);
        } finally {
            next.dispose();
        }
    } finally {
        s.dispose();
    }
});
test('ordinary stock Prospector sorties survey Pluto, hack with prepared supplies, report both patrols and defeat all three final phases', () => {
    const c = ready();
    for (const goal of ['survey', 'base', 'patrol', 'patrol', 'boss'] as const) {
        c.bank.ore += 99;
        c.bank.carbon = (c.bank.carbon ?? 0) + 1;
        assert.ok(manufacture(c, 'steel'));
        assert.ok(manufacture(c, 'plating'));
        assert.ok(beginRun(c, 1, null, false, null, { parts: 1 }));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (goal === 'survey') {
                fly(s, s.landmarks.find((l) => l.siteId === 'relay')!);
                hold(s, { ...idle, interact: true }, 200);
                assert.ok(s.surveyData.has('relay'));
            } else if (goal === 'base') {
                acquireComponent(s);
                fly(s, OUTER_BASES.pluto.terminal, 45);
                hold(s, { ...idle, sabotage: true }, 200);
                solveTerminal(s, 'power');
                assert.ok(s.outpost.sabotaged);
                hold(s, { ...idle, interact: true }, 270);
                solveTerminal(s, 'breach');
                assert.ok(s.outpost.secured);
            } else if (goal === 'patrol') {
                for (let f = 0; f < 60 * 180 && s.storyPatrolKills < 1 && !s.ended; f++) {
                    const e = [...s.enemies.enemies.values()].find((e) => e.storyPatrol)!;
                    assert.ok(e);
                    s.step({ ...steer(s, enemyPosition(e), 230), fire: true, mine: true });
                    s.events.length = 0;
                }
                assert.equal(s.storyPatrolKills, 1);
            } else {
                fly(s, PLUTO_ARENA, 60);
                hold(s, { ...idle, sabotage: true }, 125);
                assert.equal(s.firstBoss.state, 'warning');
                fight(s);
            }
            dock(c, s);
        } finally {
            s.dispose();
        }
    }
    assert.ok(storySectorComplete(c.story!, 'pluto'));
    assert.equal(c.story!.progress['pluto-record'], 0);
});

test('oversized real hits cannot skip final combat phases or create ordinary kill rewards', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        for (const [phase, floor] of [
            [1, 540],
            [2, 270],
            [3, 1],
        ]) {
            assert.equal(s.firstBoss.phase, phase);
            const e = s.enemies.enemies.get(FINAL_BOSS.id)!;
            const p = enemyPosition(e);
            s.addBullet(99000 + phase, {
                id: 99000 + phase,
                x: p.x - 100,
                y: p.y,
                vx: 10000,
                vy: 0,
                life: 1,
                team: 'player',
                damage: 100000,
            });
            s.step(idle);
            assert.equal(e.health, floor);
            s.step(idle);
        }
        assert.ok(s.firstBoss.complete);
        assert.equal(s.enemyKills, 0);
        assert.equal(s.loot.size, 0);
        assert.equal(s.salvage.items.size, 0);
    } finally {
        s.dispose();
    }
});
