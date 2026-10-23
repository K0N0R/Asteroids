import { VENUS_SHIELD } from '../frontend/game/state/orbitalConstruction';
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
    VENUS_EXPANSION_TASKS,
    VENUS_OUTPOST,
    deliverOrbitalCargo,
    syncStory,
    solarShieldReady,
    storySectorComplete,
    storyObjectives,
} from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { enemyPosition } from '../frontend/game/systems/enemies';
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
function ready(built = false) {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS.filter(
        (t) => t.act <= 3 && t.required && !VENUS_EXPANSION_TASKS.includes(t.id),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'venus';
    c.bank = { ore: 0, parts: 12 };
    if (built) {
        c.story!.progress['venus-build'] = 1;
        c.story!.claimed.push('venus-build');
    }
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
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
    at(s, VENUS_OUTPOST);
    s.step(idle);
    hold(s, { ...idle, sabotage: true });
    assert.ok(s.venusAssault.active);
    assert.equal(s.lunarAssault.state, 'idle');
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const error = angleDifference(Math.atan2(dy, dx), s.ship.rotation()),
        distance = Math.hypot(dx, dy);
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function win(s: MissionSimulation) {
    for (let f = 0; f < 60 * 300 && s.venusAssault.active && !s.ended; f++) {
        const enemy = [...s.enemies.enemies.values()].find((e) => e.assault);
        if (enemy) s.step({ ...steer(s, enemyPosition(enemy), 240), fire: true, mine: true });
        else if (s.hull < s.maxHull && s.repairKits) s.step({ ...idle, repair: true });
        else s.step(steer(s, VENUS_OUTPOST, 200));
        s.events.length = 0;
    }
    assert.equal(s.ended, null);
    assert.equal(
        s.venusAssault.state,
        'complete',
        `${s.venusAssault.summary}, hull ${s.hull}, kills ${s.enemyKills}`,
    );
}

test('orbital construction requires both preparation goals and a quiet two-second interaction; it persists immediately', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, VENUS_OUTPOST);
        const bank = { ...c.bank };
        for (const blocker of ['fire', 'mine', 'repair', 'sabotage'] as const) {
            hold(s, { ...idle, interact: true, [blocker]: true });
            assert.equal(c.story!.progress['venus-build'], 0);
        }
        // Restore the fixture's prerequisite to test actual equipment and interaction gating.
        c.story!.claimed = c.story!.claimed.filter((id) => id !== 'venus-stockpile');
        c.story!.progress['venus-stockpile'] = 0;
        hold(s, { ...idle, interact: true });
        assert.equal(c.story!.progress['venus-build'], 0);
        c.story!.claimed.push('venus-stockpile');
        c.story!.progress['venus-stockpile'] = 8;
        s.step(idle);
        hold(s, { ...idle, interact: true });
        assert.equal(c.story!.progress['venus-build'], 1);
        assert.ok(s.deliveryRevision > 0);
        assert.deepEqual(c.bank, bank);
        assert.equal(s.venusOutpostStage, 1);
        assert.equal(s.landmarks.find((l) => l.key === 8)!.name, 'Placówka badawcza Wenus');
        const restored = parseCampaign(JSON.stringify(c))!;
        assert.ok(restored);
        finishRun(restored, false, empty, 5, 'refresh');
        assert.equal(restored.story!.progress['venus-build'], 1);
        assert.equal(restored.story!.progress['venus-defense'], 0);
    } finally {
        s.dispose();
    }
});

test('solar shielding accepts three actual part families only after building and supports partial deliveries', () => {
    const c = ready();
    beginRun(c, 1);
    assert.equal(
        deliverOrbitalCargo(c, {
            ore: 0,
            parts: 12,
            lightPlating: 6,
            powerModules: 3,
            electronics: 2,
        }),
        null,
    );
    const built = ready(true);
    beginRun(built, 1);
    assert.ok(deliverOrbitalCargo(built, { ore: 0, parts: 0, lightPlating: 2 }));
    assert.equal(built.story!.progress['venus-shield-plating'], 2);
    assert.equal(solarShieldReady(built.story!), false);
    const cargo = { ore: 0, parts: 12, lightPlating: 6, powerModules: 3, electronics: 2 };
    assert.ok(deliverOrbitalCargo(built, cargo));
    assert.deepEqual(cargo, {
        ore: 0,
        parts: 12,
        lightPlating: 2,
        powerModules: 0,
        electronics: 0,
    });
    assert.ok(solarShieldReady(built.story!));
    assert.equal(deliverOrbitalCargo(built, cargo), null);
    assert.equal(storySectorComplete(built.story!, 'venus'), false);
    assert.ok(parseCampaign(JSON.stringify(built)));
});

test('defense can precede shielding; the final component payment closes Act III without replaying combat rewards', () => {
    const c = ready(true);
    beginRun(c, 1);
    const result = finishRun(c, true, empty, 1, 'dock', c.activeRun!.repairKits, {
        venusDefenseWon: true,
    })!;
    assert.deepEqual(result.reward, { ore: 30, parts: 8 });
    assert.equal(storySectorComplete(c.story!, 'venus'), false);
    assert.equal(solarShieldReady(c.story!), false);
    const bank = { ...c.bank };
    grantOrbitalSupplies(c, VENUS_SHIELD);
    syncStory(c);
    assert.ok(storySectorComplete(c.story!, 'venus'));
    assert.deepEqual(c.bank, bank);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.assaultAvailable, false);
        at(s, VENUS_OUTPOST);
        hold(s, { ...idle, sabotage: true });
        assert.equal(s.venusAssault.state, 'idle');
        const again = finishRun(c, true, empty, 1, 'dock', s.repairKits, {
            venusDefenseWon: true,
        })!;
        assert.deepEqual(again.reward, empty);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('stock Prospector builds through normal flight, prepares the shield and repels actual AI before returning the report', () => {
    const c = ready();
    beginRun(c, 1);
    let s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        for (let f = 0; f < 60 * 180 && !s.ended; f++) {
            const built = c.story!.claimed.includes('venus-build');
            const target = built ? { x: 0, y: 0 } : VENUS_OUTPOST;
            s.step({ ...steer(s, target, 85), interact: built || s.nearbyVenusOutpost });
            s.events.length = 0;
        }
        assert.equal(s.ended, 'returned');
        assert.equal(c.story!.progress['venus-build'], 1);
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits);
    } finally {
        s.dispose();
    }
    grantOrbitalSupplies(c, VENUS_SHIELD);
    syncStory(c);
    assert.ok(solarShieldReady(c.story!));
    beginRun(c, 1);
    s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        for (let f = 0; f < 60 * 90 && !s.nearbyVenusOutpost; f++)
            s.step(steer(s, VENUS_OUTPOST, 85));
        // Brake using ordinary controls before the deliberate G hold.
        for (let f = 0; f < 150; f++) s.step({ ...idle, brake: s.speed > 20 });
        s.step(idle);
        hold(s, { ...idle, sabotage: true });
        assert.ok(s.venusAssault.active);
        win(s);
        assert.equal(s.enemyKills, s.venusAssault.totalEnemies);
        assert.equal(c.story!.progress['venus-defense'], 1);
        assert.ok(
            storyObjectives(c, [], false, 0, true).find((t) => t.id === 'venus-defense')!.complete,
        );
        for (let f = 0; f < 60 * 120 && !s.ended; f++)
            s.step({ ...steer(s, { x: 0, y: 0 }, 85), interact: true });
        assert.equal(s.ended, 'returned');
        const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
            venusDefenseWon: true,
            kills: s.enemyKills,
        })!;
        assert.equal(result.reward.ore, 0);
        assert.equal(result.reward.parts, 0);
        assert.ok(result.reason.includes('Akt III ukończony'));
        assert.ok(storySectorComplete(c.story!, 'venus'));
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(finishRun(c, true, empty, 1, 'again', 0, { venusDefenseWon: true }), null);
    } finally {
        s.dispose();
    }
});

test('AI can destroy the outpost; retry restores its health and keeps construction and shielding', () => {
    const c = ready(true);
    grantOrbitalSupplies(c, VENUS_SHIELD);
    syncStory(c);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        at(s, { x: VENUS_OUTPOST.x, y: VENUS_OUTPOST.y + 1100 });
        let targeted = false;
        for (let f = 0; f < 60 * 120 && s.venusAssault.active; f++) {
            s.step({ ...idle, sabotage: true });
            s.events.length = 0;
            targeted ||= [...s.enemies.enemies.values()].some((e) => e.target === 'station');
        }
        assert.ok(targeted);
        assert.equal(s.venusAssault.state, 'failed');
        assert.equal(s.venusAssault.health, 0);
        assert.equal(s.enemies.enemies.size, 0);
        assert.equal(s.bullets.size, 0);
        at(s, VENUS_OUTPOST);
        hold(s, { ...idle, sabotage: true });
        assert.equal(s.venusAssault.state, 'failed'); // Held G cannot restart automatically.
        start(s);
        assert.equal(s.venusAssault.health, 180);
        assert.ok(solarShieldReady(c.story!));
        assert.equal(c.story!.progress['venus-build'], 1);
    } finally {
        s.dispose();
    }
});

test('leaving the defense aborts only the current attempt; unrelated enemies and completed projects remain', () => {
    const c = ready(true);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        hold(s, idle, 450);
        s.enemies.add([{ id: 900, x: -2500, y: 0, home: { x: -2500, y: 0 }, phase: 0 }]);
        at(s, { x: 0, y: 0 });
        s.step(idle);
        assert.equal(s.venusAssault.state, 'failed');
        assert.deepEqual([...s.enemies.enemies.keys()], [900]);
        assert.equal(s.bullets.size, 0);
        assert.equal(c.story!.progress['venus-build'], 1);
        assert.equal(c.story!.progress['venus-defense'], 0);
    } finally {
        s.dispose();
    }
});

test('a radio-confirmed victory survives refresh and lunar reports cannot complete Venus defense', () => {
    const c = ready(true);
    grantOrbitalSupplies(c, VENUS_SHIELD);
    syncStory(c);
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        start(s);
        win(s);
        const restored = parseCampaign(JSON.stringify(c))!;
        finishRun(restored, false, empty, 1, 'refresh');
        assert.equal(restored.story!.progress['venus-defense'], 1);
        assert.equal(restored.story!.progress['venus-build'], 1);
        assert.ok(solarShieldReady(restored.story!));
        finishRun(c, true, empty, 1, 'wrong report', s.repairKits, { assaultWon: true });
        assert.equal(c.story!.progress['venus-defense'], 1);
    } finally {
        s.dispose();
    }
});
