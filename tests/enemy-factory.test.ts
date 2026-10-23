import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { EnemyFactory, ENEMY_FACTORY as F } from '../frontend/game/systems/enemyFactory';
import { EnemyFleet, enemyPosition } from '../frontend/game/systems/enemies';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, travelStory } from '../frontend/game/state/story';
import { selectableMission } from '../frontend/game/state/missionOrders';
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
function ready() {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS.filter((t) => t.required && t.act === 1)) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    assert.ok(travelStory(c, 'mars'));
    beginRun(c, 1);
    finishRun(c, true, empty, 30, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
        patrolKills: 2,
    });
    assert.ok(selectableMission(c, 'mars-factory'));
    return c;
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius = 80): FlightInput {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y,
        d = Math.hypot(dx, dy);
    const err = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, err * 2.5)),
        thrust: Math.abs(err) < 0.3 && d > radius + stop + 15,
        brake: s.speed > 20 && (d < radius + stop || Math.abs(err) > 0.6),
    };
}
function at(s: MissionSimulation, x = F.position.x + 200, y = F.position.y) {
    s.ship.setTranslation({ x: x / 100, y: y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    s.ship.setRotation(Math.PI, true);
}
function shot(
    s: MissionSimulation,
    damage = 1000,
    team: 'player' | 'enemy' = 'player',
    explosive?: 'rocket' | 'grenade',
) {
    s.bullets.set(900000, {
        id: 900000,
        x: F.position.x + 250,
        y: F.position.y,
        vx: -12000,
        vy: 0,
        life: 1,
        team,
        damage,
        ...(explosive ? { explosive } : {}),
    });
    s.step(idle);
}

test('factory activates locally, respects launch cadence, blocked pads and live-unit cap, and stops without erasing surviving enemies', () => {
    const w = new RAPIER.World({ x: 0, y: 0 }),
        fleet = new EnemyFleet(w, []),
        f = new EnemyFactory(w);
    try {
        f.update(300, { x: 0, y: 0 }, fleet, () => false);
        assert.equal(f.active, false);
        assert.equal(f.launched, 0);
        f.update(40, F.position, fleet, () => true);
        assert.equal(f.launched, 0);
        f.update(0.01, F.position, fleet, () => false);
        assert.equal(f.launched, 1);
        f.update(1, F.position, fleet, () => false);
        assert.equal(f.launched, 1);
        for (let i = 0; i < 100; i++) f.update(1, F.position, fleet, () => false);
        assert.equal(f.units.size, F.limit);
        assert.equal(fleet.enemies.size, F.limit);
        assert.equal(f.launched, F.limit);
        assert.ok([...fleet.enemies.values()].some((e) => e.kind === 'lancer'));
        fleet.damage([...f.units][0], 10000);
        for (let i = 0; i < F.interval; i++) f.update(1, F.position, fleet, () => false);
        assert.equal(f.launched, F.limit + 1);
        const alive = fleet.enemies.size;
        assert.equal(f.damage(-100), false);
        assert.equal(f.health, F.health);
        assert.ok(f.damage(F.health));
        assert.equal(f.collider, null);
        for (let i = 0; i < 120; i++) f.update(1, F.position, fleet, () => false);
        assert.equal(f.launched, F.limit + 1);
        assert.equal(fleet.enemies.size, alive);
    } finally {
        w.free();
    }
});

test('stock Prospector prioritizes repair support at the factory, fights real launches and safely reports permanent shutdown once', () => {
    const c = ready();
    assert.ok(beginRun(c, 1, null, false, 'mars-factory'));
    const s = new MissionSimulation(c, 1);
    const f = s.enemyFactory!;
    try {
        assert.ok(s.landmarks.some((l) => l.key === 5 && l.kind === 'factory' && !l.siteId));
        for (let frame = 0; frame < 60 * 240 && !s.ended && !f.destroyed; frame++) {
            const input = steer(s, { x: F.position.x + 380, y: F.position.y });
            const enemy = [...s.enemies.enemies.values()]
                .filter(
                    (e) =>
                        Math.hypot(
                            enemyPosition(e).x - s.position.x,
                            enemyPosition(e).y - s.position.y,
                        ) < 1050,
                )
                .sort(
                    (a, b) =>
                        Number(b.kind === 'support') - Number(a.kind === 'support') ||
                        Math.hypot(
                            enemyPosition(a).x - s.position.x,
                            enemyPosition(a).y - s.position.y,
                        ) -
                            Math.hypot(
                                enemyPosition(b).x - s.position.x,
                                enemyPosition(b).y - s.position.y,
                            ),
                )[0];
            if (enemy) {
                input.target = enemyPosition(enemy);
                input.fire = true;
            } else if (
                f.launched >= 2 &&
                Math.hypot(s.position.x - F.position.x, s.position.y - F.position.y) < 1000
            ) {
                input.target = F.position;
                input.fire = true;
            }
            s.step(input);
            s.events.length = 0;
        }
        assert.equal(s.ended, null, `hull ${s.hull}, core ${f.health}, launched ${f.launched}`);
        assert.ok(
            f.destroyed,
            `core ${f.health}, launched ${f.launched}, player ${JSON.stringify(s.position)}`,
        );
        assert.ok(f.launched >= 2);
        assert.ok(s.enemyKills >= 2);
        assert.ok(s.surveyData.has('factory'));
        assert.equal(c.story!.progress['mars-factory'], 1);
        assert.equal(s.missionReturnBlocked, false);
        const launches = f.launched;
        for (let frame = 0; frame < 60 * 100 && !s.ended; frame++) {
            const input = steer(s, { x: 0, y: 0 }, 65);
            input.interact = true;
            const enemy = [...s.enemies.enemies.values()].find(
                (e) =>
                    Math.hypot(
                        enemyPosition(e).x - s.position.x,
                        enemyPosition(e).y - s.position.y,
                    ) < 900,
            );
            if (enemy) {
                input.target = enemyPosition(enemy);
                input.fire = true;
                input.interact = false;
            }
            s.step(input);
            s.events.length = 0;
        }
        assert.equal(s.ended, 'returned');
        assert.equal(f.launched, launches);
        const result = finishRun(
            c,
            true,
            s.cargo,
            s.elapsed,
            'dock',
            s.repairKits,
            s.missionReport,
        )!;
        assert.deepEqual(result.reward, { ore: 0, parts: 0 });
        assert.ok(c.story!.claimed.includes('mars-factory'));
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(selectableMission(c, 'mars-factory'), null);
        beginRun(c, 2);
        const next = new MissionSimulation(c, 2);
        try {
            assert.ok(next.enemyFactory!.destroyed);
            assert.equal(next.enemyFactory!.collider, null);
            assert.equal(next.enemyFactory!.launched, 0);
        } finally {
            next.dispose();
        }
    } finally {
        s.dispose();
    }
});

test('a factory cannot be scanned or destroyed by friendly fire, and retreat preserves radio-confirmed destruction', () => {
    const c = ready();
    beginRun(c, 1, null, false, 'mars-factory');
    const s = new MissionSimulation(c, 1);
    try {
        at(s, F.position.x, F.position.y + 200);
        for (let i = 0; i < 300; i++) s.step({ ...idle, interact: true });
        assert.equal(s.surveyData.has('factory'), false);
        assert.equal(s.enemyFactory!.health, F.health);
        shot(s, 1000, 'enemy');
        assert.equal(s.enemyFactory!.health, F.health);
        shot(s);
        assert.ok(s.enemyFactory!.destroyed);
        assert.ok(s.surveyData.has('factory'));
        assert.ok(s.abortMission());
        finishRun(c, true, s.cargo, s.elapsed, 'retreat', s.repairKits, s.missionReport);
        assert.equal(c.story!.progress['mars-factory'], 1);
        assert.equal(selectableMission(c, 'mars-factory'), null);
        beginRun(c, 2, null, false, 'mars-factory');
        const retry = new MissionSimulation(c, 2);
        try {
            assert.ok(retry.enemyFactory!.destroyed);
        } finally {
            retry.dispose();
        }
    } finally {
        s.dispose();
    }
});

test('mining lasers and rocket explosions damage the physical core without awarding material drops', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    try {
        at(s);
        for (let i = 0; i < 10; i++) s.step({ ...idle, target: F.position, mine: true });
        assert.ok(s.enemyFactory!.health < F.health);
        const health = s.enemyFactory!.health;
        shot(s, 200, 'player', 'rocket');
        assert.equal(s.enemyFactory!.health, health - 200);
        assert.equal(s.loot.size, 0);
        assert.equal(s.surveyData.has('factory'), false);
    } finally {
        s.dispose();
    }
});
