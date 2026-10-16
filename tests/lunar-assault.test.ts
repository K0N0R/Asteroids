import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, actOneComplete, storyObjectives } from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
import { angleDifference } from '../frontend/game/systems/flight';
import { enemyPosition } from '../frontend/game/systems/enemies';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter((t) => t.act === 1 && t.required && t.kind !== 'assault')) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'lunar';
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function enter(s: MissionSimulation) {
    at(s, MOON.entrance);
    s.step(idle);
    for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
    at(s, MOON.construction);
    s.step(idle);
}
function start(s: MissionSimulation) {
    for (let i = 0; i < 125; i++) s.step({ ...idle, sabotage: true });
    assert.ok(s.lunarAssault.active);
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
    for (let f = 0; f < 60 * 240 && s.lunarAssault.active && !s.ended; f++) {
        const enemy = [...s.enemies.enemies.values()][0];
        if (enemy) s.step({ ...steer(s, enemyPosition(enemy), 240), fire: true, mine: true });
        else if (s.hull < s.maxHull && s.repairKits) s.step({ ...idle, repair: true });
        else s.step(steer(s, MOON.construction, 200));
        s.events.length = 0;
    }
    assert.equal(s.ended, null);
    assert.equal(
        s.lunarAssault.state,
        'complete',
        `${s.lunarAssault.summary}, ship ${s.hull}, kills ${s.enemyKills}`,
    );
}

test('the starter ship can repel real AI waves; only docking with the report completes Act I and rewards once', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        win(s);
        assert.equal(s.enemyKills, 3);
        assert.ok(s.lunarAssault.health > 0);
        assert.equal(c.story!.progress['lunar-attack'], 0);
        assert.equal(actOneComplete(c.story!), false);
        assert.ok(
            storyObjectives(c, [], true)
                .find((t) => t.id === 'lunar-attack')!
                .progress.includes('raportem'),
        );
        assert.equal(s.loot.size, 0);
        assert.equal(s.salvage.items.size, 0);
        // Normal flight from the surface, through its exit, to the Satuk 15 dock.
        s.step(idle);
        for (let f = 0; f < 60 * 90 && s.area === 'surface'; f++)
            s.step({
                ...steer(s, MOON.exit, 85),
                interact: Math.hypot(s.position.x - MOON.exit.x, s.position.y - MOON.exit.y) < 160,
            });
        assert.equal(s.area, 'orbit');
        for (let f = 0; f < 60 * 90 && !s.ended; f++)
            s.step({ ...steer(s, { x: 0, y: 0 }, 85), interact: true });
        assert.equal(s.ended, 'returned');
        const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
            assaultWon: true,
            kills: s.enemyKills,
        })!;
        assert.ok(actOneComplete(c.story!));
        assert.ok(result.reason.includes('Akt I ukończony'));
        assert.equal(c.bank.ore, 40);
        assert.equal(c.bank.parts, 8);
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(
            finishRun(c, true, s.cargo, s.elapsed, 'again', 0, { assaultWon: true }),
            null,
        );
    } finally {
        s.dispose();
    }
});

test('AI can target and damage the station; a failed attack keeps earlier tasks and can restart', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        at(s, MOON.exit);
        let targetingStation = false;
        for (let f = 0; f < 60 * 100 && s.lunarAssault.active; f++) {
            s.step(idle);
            s.events.length = 0;
            targetingStation ||= [...s.enemies.enemies.values()].some(
                (e) => e.target === 'station',
            );
        }
        assert.ok(targetingStation);
        assert.equal(s.lunarAssault.state, 'failed');
        assert.equal(s.lunarAssault.health, 0);
        assert.equal(s.enemies.enemies.size, 0);
        assert.equal(s.bullets.size, 0);
        assert.equal(c.story!.progress['lunar-commission'], 1);
        assert.equal(c.story!.progress['lunar-attack'], 0);
        at(s, MOON.construction);
        s.step(idle);
        start(s);
        assert.equal(s.lunarAssault.health, 180);
    } finally {
        s.dispose();
    }
});

test('leaving the surface interrupts the attack and clears its projectiles and attackers', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        for (let i = 0; i < 450; i++) s.step(idle);
        assert.ok(s.enemies.enemies.size);
        at(s, MOON.exit);
        s.step(idle);
        for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
        assert.equal(s.area, 'orbit');
        assert.equal(s.lunarAssault.state, 'failed');
        assert.equal(s.enemies.enemies.size, 0);
        assert.equal(s.bullets.size, 0);
        assert.equal(actOneComplete(c.story!), false);
    } finally {
        s.dispose();
    }
});

test('refresh after winning but before docking loses the report and cannot close the act', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        start(s);
        win(s);
        const restored = parseCampaign(JSON.stringify(c))!;
        finishRun(restored, false, { ore: 0, parts: 0 }, 10, 'refresh', 0, { assaultWon: true });
        assert.equal(actOneComplete(restored.story!), false);
        assert.deepEqual(restored.bank, { ore: 0, parts: 0 });
    } finally {
        s.dispose();
    }
});
