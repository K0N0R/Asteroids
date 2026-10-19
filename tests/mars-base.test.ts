import { MARS_CONSTRUCTION } from '../frontend/game/state/orbitalConstruction';
import { grantOrbitalSupplies } from './fleet-fixtures';
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
    MARS_BASE,
    contributeStory,
    deliverOrbitalCargo,
    storyAct,
    storyObjectives,
    storyVisibleTasks,
    beltPassageReady,
    actTwoComplete,
    storyRadius,
    travelStory,
    storyTaskAvailable,
} from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { enemyPosition } from '../frontend/game/systems/enemies';
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
function ready(built = false) {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter((t) => t.act <= 4 && t.required)) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'mars';
    c.bank = { ore: 40, parts: 10 };
    if (built) {
        grantOrbitalSupplies(c, MARS_CONSTRUCTION);
        c.story!.progress['mars-base-build'] = 1;
        c.story!.claimed.push('mars-base-build');
    }
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(
    c: ReturnType<typeof ready>,
    marsDefenseWon = false,
    patrolKills = 0,
    data: ('archive' | 'relay')[] = [],
) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, true, empty, 10, 'dock', c.activeRun!.repairKits, {
        marsDefenseWon,
        patrolKills,
        data,
    })!;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function hold(s: MissionSimulation, input: FlightInput, frames = 125) {
    for (let f = 0; f < frames; f++) {
        s.step(input);
        s.events.length = 0;
    }
}
function start(s: MissionSimulation) {
    at(s, MARS_BASE);
    s.step(idle);
    hold(s, { ...idle, sabotage: true });
    assert.ok(s.marsAssault.active);
    assert.equal(s.venusAssault.state, 'idle');
    assert.equal(s.lunarAssault.state, 'idle');
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
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
function win(s: MissionSimulation) {
    for (let f = 0; f < 60 * 300 && s.marsAssault.active && !s.ended; f++) {
        const enemy = [...s.enemies.enemies.values()].find((e) => e.assault);
        if (enemy) s.step({ ...steer(s, enemyPosition(enemy), 240), fire: true, mine: true });
        else if (s.hull < s.maxHull && s.repairKits) s.step({ ...idle, repair: true });
        else s.step(steer(s, MARS_BASE, 200));
        s.events.length = 0;
    }
    assert.equal(s.ended, null);
    assert.equal(s.marsAssault.state, 'complete', `${s.marsAssault.summary}, hull ${s.hull}`);
}

test('Act V requires the Mercury report and leaves the earlier Mars journal and Act II intact', () => {
    const c = ready();
    assert.ok(actTwoComplete(c.story!));
    assert.equal(storyAct(c.story!), 'AKT V');
    assert.equal(storyObjectives(c).length, 5);
    assert.equal(
        storyVisibleTasks(c.story!).length,
        STORY_TASKS.filter((t) => t.sector === 'mars').length,
    );
    assert.ok(storyVisibleTasks(c.story!).some((t) => t.id === 'mars-factory'));
    assert.ok(
        storyObjectives(c).every(
            (t) =>
                ![
                    'mars-trail',
                    'mars-patrol',
                    'mars-belt',
                    'mars-reserve',
                    'mars-factory',
                ].includes(t.id),
        ),
    );
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'mercury-technology');
    c.story!.progress['mercury-technology'] = 0;
    assert.equal(storyAct(c.story!), 'AKT II');
    assert.equal(
        storyVisibleTasks(c.story!).length,
        STORY_TASKS.filter((t) => t.sector === 'mars' && t.act === 2).length,
    );
    assert.equal(contributeStory(c, 'mars-base-ore'), null);
    assert.equal(
        storyTaskAvailable(c.story!, STORY_TASKS.find((t) => t.id === 'mars-base-ore')!),
        false,
    );
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('part deliveries allow partial batches in either order and construction never charges twice', () => {
    for (const reverse of [true, false]) {
        const c = ready();
        beginRun(c, 1);
        const entries = reverse ? [...MARS_CONSTRUCTION].reverse() : MARS_CONSTRUCTION;
        for (const entry of entries) {
            const half = Math.floor(entry.target / 2);
            assert.ok(deliverOrbitalCargo(c, { ore: 0, parts: 0, [entry.resource]: half }));
            assert.equal(c.story!.progress[entry.id], half);
        }
        for (const entry of entries)
            assert.ok(deliverOrbitalCargo(c, { ore: 0, parts: 0, [entry.resource]: entry.target }));
        const bank = { ...c.bank };
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            at(s, MARS_BASE);
            hold(s, { ...idle, interact: true });
            assert.equal(c.story!.progress['mars-base-build'], 1);
            assert.ok(s.landmarks.some((l) => l.key === 8));
            assert.equal(s.enemies.enemies.size, 3);
            assert.deepEqual(c.bank, bank);
            assert.ok(s.deliveryRevision > 0);
            assert.equal(s.landmarks.find((l) => l.key === 7)!.name, 'Baza marsjańska');
            const restored = parseCampaign(JSON.stringify(c))!;
            assert.ok(restored);
            finishRun(restored, false, empty, 1, 'refresh');
            for (const t of MARS_CONSTRUCTION)
                assert.equal(restored.story!.progress[t.id], t.target);
        } finally {
            s.dispose();
        }
    }
});

test('building rejects missing supplies, concurrent weapons and early combat reports', () => {
    const c = ready();
    report(c, false, 3, ['archive']);
    assert.equal(c.story!.progress['mars-corridor'], 0);
    assert.equal(c.story!.progress['mars-patrol'], 2);
    assert.equal(c.story!.progress['mars-route'], 0);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, MARS_BASE);
        hold(s, { ...idle, interact: true });
        assert.equal(c.story!.progress['mars-base-build'], 0);
        assert.equal(s.assaultAvailable, false);
        hold(s, { ...idle, sabotage: true });
        assert.equal(s.marsAssault.state, 'idle');
        assert.equal(s.surfaceUnlocked, false);
        assert.equal(s.solar.elapsed, 0);
    } finally {
        s.dispose();
    }
    const built = ready(true);
    beginRun(built, 1);
    const other = new MissionSimulation(built, built.activeRun!.seed);
    try {
        assert.equal(other.assaultAvailable, true);
        assert.equal(storyRadius(built.story!), 5400);
    } finally {
        other.dispose();
    }
});

test('base defense and corridor can finish in either order; optional route and old tasks never block readiness', () => {
    for (const defenseFirst of [true, false]) {
        const c = ready(true);
        const bank = { ...c.bank };
        const first = defenseFirst ? report(c, true) : report(c, false, 3);
        assert.equal(beltPassageReady(c.story!), false);
        const final = defenseFirst ? report(c, false, 3) : report(c, true);
        assert.equal(first.reward.ore + final.reward.ore, 70);
        assert.equal(first.reward.parts + final.reward.parts, 20);
        assert.ok(final.reason.includes('Akt V ukończony'));
        assert.ok(beltPassageReady(c.story!));
        assert.equal(c.story!.progress['mars-reserve'], 0);
        assert.equal(c.story!.progress['mars-route'], 0);
        assert.equal(c.story!.progress['mars-patrol'], 2);
        assert.deepEqual(c.bank, { ore: bank.ore + 70, parts: bank.parts + 20 });
        const earned = { ...c.bank };
        report(c, true, 3);
        assert.deepEqual(c.bank, earned);
        report(c, false, 0, ['archive']);
        assert.equal(c.story!.progress['mars-route'], 1);
        for (const sector of ['earth', 'venus', 'mercury', 'mars'] as const)
            assert.ok(travelStory(c, sector));
        assert.ok(parseCampaign(JSON.stringify(c)));
    }
});

test('real AI damages the base; failure clears only attackers and held G cannot restart the attempt', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        at(s, { x: MARS_BASE.x, y: MARS_BASE.y + 1100 });
        let targeted = false;
        for (let f = 0; f < 60 * 120 && s.marsAssault.active; f++) {
            s.step({ ...idle, sabotage: true });
            s.events.length = 0;
            targeted ||= [...s.enemies.enemies.values()].some(
                (e) => e.assault && e.target === 'station',
            );
        }
        assert.ok(targeted);
        assert.equal(s.marsAssault.state, 'failed');
        assert.equal(s.marsAssault.health, 0);
        assert.equal(s.enemies.enemies.size, 3);
        assert.ok([...s.enemies.enemies.values()].every((e) => !e.assault));
        at(s, MARS_BASE);
        hold(s, { ...idle, sabotage: true });
        assert.equal(s.marsAssault.state, 'failed');
        start(s);
        assert.equal(s.marsAssault.health, 180);
        assert.equal(c.story!.progress['mars-base-build'], 1);
    } finally {
        s.dispose();
    }
});

test('leaving aborts an attempt but refresh preserves a radio-confirmed base report without losing the structure or confusing Venus reports', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        hold(s, idle, 450);
        at(s, { x: 0, y: 0 });
        s.step(idle);
        assert.equal(s.marsAssault.state, 'failed');
        assert.equal(s.enemies.enemies.size, 3);
        assert.equal(s.bullets.size, 0);
        start(s);
        win(s);
        assert.ok(
            storyObjectives(c, [], false, 0, false, true).find((t) => t.id === 'mars-base-defense')!
                .complete,
        );
        const restored = parseCampaign(JSON.stringify(c))!;
        finishRun(restored, false, empty, 1, 'refresh');
        assert.equal(restored.story!.progress['mars-base-defense'], 1);
        assert.equal(restored.story!.progress['mars-base-build'], 1);
        finishRun(c, true, empty, 1, 'wrong report', s.repairKits, {
            venusDefenseWon: true,
            assaultWon: true,
        });
        assert.equal(c.story!.progress['mars-base-defense'], 1);
    } finally {
        s.dispose();
    }
});

test('stock Prospector flies to build the base, defends it and secures all three corridor contacts through ordinary sorties', () => {
    const c = ready();
    grantOrbitalSupplies(c, MARS_CONSTRUCTION);
    for (const goal of ['build', 'defense', 'corridor', 'corridor', 'corridor'] as const) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            if (goal === 'defense') {
                for (let f = 0; f < 60 * 120 && !s.nearbyOrbitalBase; f++)
                    s.step(steer(s, MARS_BASE, 85));
                for (let f = 0; f < 150; f++) s.step({ ...idle, brake: s.speed > 20 });
                s.step(idle);
                hold(s, { ...idle, sabotage: true });
                assert.ok(s.marsAssault.active);
                win(s);
            }
            for (let f = 0; f < 60 * 360 && !s.ended; f++) {
                let input: FlightInput;
                const done =
                    goal === 'build'
                        ? c.story!.claimed.includes('mars-base-build')
                        : goal === 'defense' || s.storyPatrolKills >= 1;
                if (done) input = { ...steer(s, { x: 0, y: 0 }, 85), interact: true };
                else if (goal === 'build')
                    input = { ...steer(s, MARS_BASE, 85), interact: s.nearbyOrbitalBase };
                else {
                    const enemy = [...s.enemies.enemies.values()]
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
                    assert.ok(enemy);
                    input = { ...steer(s, enemyPosition(enemy), 240), fire: true, mine: true };
                }
                s.step(input);
                s.events.length = 0;
            }
            assert.equal(
                s.ended,
                'returned',
                `${goal}: hull ${s.hull}, kills ${s.storyPatrolKills}, position ${JSON.stringify(s.position)}`,
            );
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                marsDefenseWon: s.marsAssault.state === 'complete',
                patrolKills: s.storyPatrolKills,
                kills: s.enemyKills,
            });
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.ok(beltPassageReady(c.story!));
    assert.equal(c.story!.progress['mars-route'], 0);
    assert.equal(c.story!.progress['mars-patrol'], 2);
});
