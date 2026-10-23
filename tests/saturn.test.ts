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
    STORY_TASKS,
    storySectorUnlocked,
    storySectorComplete,
    storyRadius,
    storyAct,
    storyObjectives,
    travelStory,
    contributeStory,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
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
function ready(surveyed = false) {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS.filter(
        (t) => t.required && (t.act <= 7 || (surveyed && t.id === 'saturn-survey')),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    grantStoryTasks(c, c.story!.claimed);
    assert.ok(travelStory(c, 'saturn'));
    c.bank = { ...empty };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    ore = 0,
    data: ('relay' | 'archive')[] = [],
    patrolKills = 0,
    success = true,
) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, success, { ore, parts: 0 }, 10, 'dock', c.activeRun!.repairKits, {
        data,
        patrolKills,
    })!;
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
        `flight hull ${s.hull}, position ${JSON.stringify(s.position)}, target ${JSON.stringify(target)}`,
    );
}
function dock(c: ReturnType<typeof ready>, s: MissionSimulation) {
    fly(s, { x: 0, y: 0 });
    hold(s, { ...idle, interact: true }, 180);
    assert.equal(s.ended, 'returned');
    const r = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
        data: [...s.surveyData],
        patrolKills: s.storyPatrolKills,
        kills: s.enemyKills,
    })!;
    assert.ok(r);
    assert.ok(parseCampaign(JSON.stringify(c)));
    return r;
}

test('Saturn opens after Jupiter operations, keeps backtracking and offers a calm mining field separated from the patrol', () => {
    const c = ready();
    assert.equal(storyAct(c.story!), 'AKT VIII');
    assert.equal(storyObjectives(c).length, 1);
    assert.equal(storyRadius(c.story!), 2500);
    const p = structuredClone(c.story!);
    p.claimed = p.claimed.filter((id) => id !== 'jupiter-observations');
    p.progress['jupiter-observations'] = 0;
    assert.equal(storySectorUnlocked(p, 'saturn'), false);
    assert.equal(c.story!.progress['jupiter-reserve'], 0);
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'saturn'));
    const a = generateStorySector(c.story!);
    assert.deepEqual(a, generateStorySector(c.story!));
    assert.equal(a.enemies.length, 0);
    assert.equal(a.rocks.filter((r) => r.crystal).length, 0);
    assert.ok(a.rocks.length >= 15);
    report(c, 0, ['relay']);
    assert.equal(storyRadius(c.story!), 4200);
    const b = generateStorySector(c.story!);
    assert.equal(b.enemies.length, 1);
    assert.equal(b.enemies[0].kind, 'patrol');
    assert.ok(b.enemies[0].x < 0);
    assert.equal(b.rocks.filter((r) => r.crystal).length, 3);
    assert.ok(b.landmarks.some((l) => l.key === 5));
    assert.equal(
        b.landmarks.some((l) => l.key === 8),
        false,
    );
    assert.ok(b.rocks.every((r) => Math.hypot(r.x, r.y) + r.radius < 4200));
    assert.ok(
        b.rocks
            .filter((r) => !r.crystal)
            .reduce((n, r) => n + Math.ceil(r.radius / 17) - (r.rich ? 1 : 0), 0) >= 72,
    );
});

test('supply counts only returned cargo, supports partial transports and opens the route with combat in either order', () => {
    for (const combatFirst of [false, true]) {
        const c = ready();
        report(c, 0, ['relay']);
        c.bank.ore += 60;
        assert.equal(contributeStory(c, 'saturn-supply'), null);
        report(c);
        assert.equal(c.story!.progress['saturn-supply'], 0);
        c.bank.ore -= 60;
        if (combatFirst) report(c, 0, [], 1);
        report(c, 12);
        assert.equal(c.story!.progress['saturn-supply'], 12);
        assert.equal(
            generateStorySector(c.story!).landmarks.some((l) => l.key === 8),
            false,
        );
        const preview = storyObjectives(c, [], false, 0, false, false, [], 24).find(
            (g) => g.id === 'saturn-supply',
        )!;
        assert.match(preview.progress, /36\/36.*wróć z ładunkiem/);
        assert.equal(preview.complete, false);
        report(c, 24);
        assert.equal(c.story!.progress['saturn-supply'], 36);
        if (!combatFirst) {
            report(c, 0, ['archive']);
            assert.equal(c.story!.progress['saturn-route'], 0);
            report(c, 0, [], 1);
        }
        assert.equal(storyRadius(c.story!), 5400);
        assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
        const result = report(c, 0, ['archive']);
        assert.match(result.reason, /Cele operacyjne Saturna/);
        assert.ok(storySectorComplete(c.story!, 'saturn'));
        assert.deepEqual(c.bank, { ore: 122, parts: 25 });
        assert.equal(c.story!.progress['saturn-reserve'], 0);
        const bank = { ...c.bank };
        report(c, 0, ['relay', 'archive'], 1);
        assert.deepEqual(c.bank, bank);
        assert.equal(finishRun(c, true, { ore: 36, parts: 0 }, 1, 'duplicate'), null);
        assert.equal(c.story!.progress['saturn-supply'], 36);
        contributeStory(c, 'saturn-reserve');
        assert.deepEqual(c.bank, { ore: 112, parts: 29 });
        assert.equal(c.story!.progress['saturn-supply'], 36);
    }
});

test('early, foreign, lost and interrupted transports cannot credit supplies; confirmed partial deliveries survive', () => {
    const c = ready();
    report(c, 10, ['relay'], 1);
    assert.equal(c.story!.progress['saturn-supply'], 0);
    assert.equal(c.story!.progress['saturn-patrol'], 0);
    report(c, 9);
    assert.equal(c.story!.progress['saturn-supply'], 9);
    const bank = { ...c.bank };
    report(c, 30, [], 1, false);
    assert.equal(c.story!.progress['saturn-supply'], 9);
    assert.equal(c.story!.progress['saturn-patrol'], 0);
    assert.deepEqual(c.bank, bank);
    const d = ready(true);
    travelStory(d, 'earth');
    report(d, 20, [], 1);
    assert.equal(d.story!.progress['saturn-supply'], 0);
    travelStory(d, 'saturn');
    report(d, 7);
    beginRun(d, 1);
    const restored = parseCampaign(JSON.stringify(d))!;
    finishRun(restored, false, { ore: 25, parts: 0 }, 0, 'reload');
    assert.equal(restored.story!.progress['saturn-supply'], 7);
    assert.equal(restored.story!.progress['saturn-patrol'], 0);
    assert.ok(parseCampaign(JSON.stringify(restored)));
});

test('the optional crystal deposit is a real destructible and collectable field, without a compulsory crystal task', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const r = [...s.rocks.values()].find((r) => r.crystal)!;
        assert.ok(r);
        const p = r.body.translation();
        s.ship.setTranslation({ x: p.x - 1.1, y: p.y }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        hold(s, { ...idle, target: { x: p.x * 100, y: p.y * 100 }, mine: true }, 500);
        assert.ok(!s.rocks.has(r.id));
        assert.ok((s.cargo.crystals ?? 0) >= 1);
        assert.equal(c.story!.progress['saturn-supply'], 0);
        assert.ok(s.saturnSector);
        assert.equal(s.solar.heat, 0);
        assert.equal(s.surfaceUnlocked, false);
    } finally {
        s.dispose();
    }
});

test('stock Prospector surveys, returns mined supplies in two transports, fights the patrol and reads the distant route through ordinary sorties', () => {
    const c = ready();
    for (const goal of ['survey', 'mine', 'patrol', 'mine', 'route'] as const) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (goal === 'mine') {
                for (let cycle = 0; cycle < 15 && s.cargo.ore < 18 && !s.ended; cycle++) {
                    const rock = [...s.rocks.values()]
                        .filter((r) => !r.crystal && r.radius <= 44)
                        .sort((a, b) => {
                            const ap = a.body.translation(),
                                bp = b.body.translation(),
                                p = s.position;
                            return (
                                Math.hypot(ap.x * 100 - p.x, ap.y * 100 - p.y) -
                                Math.hypot(bp.x * 100 - p.x, bp.y * 100 - p.y)
                            );
                        })[0];
                    assert.ok(rock);
                    for (let f = 0; f < 60 * 90 && s.rocks.has(rock.id) && !s.ended; f++) {
                        const p = rock.body.translation();
                        s.step({ ...steer(s, { x: p.x * 100, y: p.y * 100 }, 110), mine: true });
                        s.events.length = 0;
                    }
                    assert.ok(!s.rocks.has(rock.id));
                    fly(s, rock.previous, 45);
                    hold(s, idle, 150);
                }
                assert.ok(s.cargo.ore >= 18, `ore ${s.cargo.ore}, hull ${s.hull}`);
                assert.ok(s.cargoUsed <= s.cargoCapacity);
            } else if (goal === 'patrol') {
                for (let f = 0; f < 60 * 220 && !s.ended && s.storyPatrolKills < 1; f++) {
                    const e = [...s.enemies.enemies.values()].find((e) => e.storyPatrol)!;
                    assert.ok(e);
                    s.step({ ...steer(s, enemyPosition(e), 230), fire: true, mine: true });
                    s.events.length = 0;
                }
                assert.equal(s.storyPatrolKills, 1);
            } else {
                const site = s.landmarks.find((l) => l.key === (goal === 'survey' ? 7 : 8))!;
                assert.ok(site);
                fly(s, site);
                hold(s, { ...idle, interact: true }, 200);
                assert.ok(s.surveyData.has(goal === 'survey' ? 'relay' : 'archive'));
            }
            dock(c, s);
            if (goal === 'mine') assert.ok(c.story!.progress['saturn-supply'] >= 18);
        } finally {
            s.dispose();
        }
    }
    assert.equal(c.story!.progress['saturn-supply'], 36);
    assert.ok(storySectorComplete(c.story!, 'saturn'));
    assert.equal(c.story!.progress['saturn-reserve'], 0);
    assert.ok(travelStory(c, 'earth'));
    assert.ok(travelStory(c, 'saturn'));
});
