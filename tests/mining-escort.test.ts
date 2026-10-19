import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    buyUpgrade,
    finishRun,
    newStoryCampaign,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    contributeStory,
    syncStory,
    travelStory,
    deliverLunarCargo,
} from '../frontend/game/state/story';
import { selectableMission } from '../frontend/game/state/missionOrders';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { angleDifference } from '../frontend/game/systems/flight';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import { MOON } from '../frontend/game/worlds/moon';
import { MiningEscort, MINING_CONVOY } from '../frontend/game/systems/miningEscort';
import { GAME, HULLS } from '../frontend/game/config';
import { GripperSystem } from '../frontend/game/systems/grippers';

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
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', c.activeRun!.repairKits, {
        data: ['relay'],
    });
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, { data: ['archive'] });
    travelStory(c, 'lunar');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, { data: ['relay'] });
    return c;
}
function steer(
    s: MissionSimulation,
    target: { x: number; y: number },
    radius: number,
): FlightInput {
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

function enterSurface(s: MissionSimulation) {
    for (let f = 0; f < 60 * 90 && s.area !== 'surface' && !s.ended; f++) {
        const input = steer(s, MOON.entrance, 70);
        input.interact =
            Math.hypot(s.position.x - MOON.entrance.x, s.position.y - MOON.entrance.y) < 160;
        s.step(input);
    }
    assert.equal(s.area, 'surface');
    while (s.transferActive) s.step(idle);
}

test('construction Mule appears only after lunar survey, waits on the surface, and its hull remains locked', () => {
    const earth = newStoryCampaign();
    assert.equal(selectableMission(earth, 'earth-mining-escort'), null);
    beginRun(earth, 1);
    const earthFlight = new MissionSimulation(earth, 1);
    try {
        assert.equal(earthFlight.miningEscort, null);
    } finally {
        earthFlight.dispose();
    }
    const c = ready();
    assert.equal(hullUnlocked(c, 'mule'), false);
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    try {
        const e = s.miningEscort!;
        assert.ok(e);
        const field = [...s.rocks.values()].filter(
            (rock) =>
                rock.anchored &&
                !rock.copper &&
                Math.abs(rock.previous.x - MINING_CONVOY.site.x) <= 680 &&
                Math.abs(rock.previous.y - MINING_CONVOY.site.y) <= 680,
        );
        assert.equal(field.length, 64);
        assert.ok(new Set(field.map((rock) => Math.round(rock.previous.x))).size > 50);
        assert.ok(new Set(field.map((rock) => Math.round(rock.previous.y))).size > 50);
        for (const [index, rock] of field.entries()) {
            assert.ok(Math.abs(rock.previous.x - MINING_CONVOY.site.x) > rock.radius + 100);
            assert.ok(Math.abs(rock.previous.y - MINING_CONVOY.site.y) > rock.radius + 100);
            for (const other of field.slice(index + 1))
                assert.ok(
                    Math.hypot(
                        rock.previous.x - other.previous.x,
                        rock.previous.y - other.previous.y,
                    ) >
                        rock.radius + other.radius + 11,
                );
        }
        const p = e.position;
        for (let i = 0; i < 300; i++) s.step({ ...idle, interact: true });
        assert.equal(e.state, 'idle');
        assert.deepEqual(e.position, p);
        assert.equal(e.cargoUsed, 0);
    } finally {
        s.dispose();
    }
});

test('stock Prospector reaches the Moon, escorts repeated mining deliveries, defeats the ambush, and unlocks Mule after construction', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    const e = s.miningEscort!;
    try {
        enterSurface(s);
        for (let f = 0; f < 60 * 120 && e.state === 'idle' && !s.ended; f++) {
            const input = steer(s, e.position, 65);
            input.interact =
                Math.hypot(s.position.x - e.position.x, s.position.y - e.position.y) < 160;
            s.step(input);
        }
        assert.notEqual(e.state, 'idle');
        let sawLasers = false;
        let sawExtendedGripper = false,
            sawHeldResource = false,
            sawGripperDelivery = false;
        let sawMining = false,
            sawReturn = false;
        for (let f = 0; f < 60 * 900 && !s.ended && e.state !== 'complete'; f++) {
            const input = steer(s, { x: e.position.x - 120, y: e.position.y + 90 }, 100);
            const enemy = [...s.enemies.enemies.values()]
                .filter(
                    (n) =>
                        Math.hypot(
                            enemyPosition(n).x - s.position.x,
                            enemyPosition(n).y - s.position.y,
                        ) < 950,
                )
                .sort(
                    (a, b) =>
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
            }
            if (!enemy && s.speed < 30) {
                const obstacle = [...s.rocks.values()]
                    .filter((r) => {
                        const q = r.body.translation();
                        return (
                            Math.hypot(q.x * 100 - s.position.x, q.y * 100 - s.position.y) <
                            r.radius + 230
                        );
                    })
                    .sort(
                        (a, b) =>
                            Math.hypot(a.previous.x - s.position.x, a.previous.y - s.position.y) -
                            Math.hypot(b.previous.x - s.position.x, b.previous.y - s.position.y),
                    )[0];
                if (obstacle) {
                    const q = obstacle.body.translation();
                    input.target = { x: q.x * 100, y: q.y * 100 };
                    input.mine = true;
                }
            }
            const cargoBefore = e.cargoUsed;
            const returningResource = e.grippers.arms.some(
                (arm) => arm.phase === 'return' && arm.held,
            );
            s.step(input);
            s.events.length = 0;
            sawExtendedGripper ||= e.grippers.arms.some((arm) => arm.phase === 'extend');
            sawHeldResource ||= e.grippers.arms.some((arm) => arm.held !== null);
            if (e.cargoUsed > cargoBefore) {
                assert.ok(
                    returningResource,
                    'cargo may arrive only on a returning physical gripper',
                );
                sawGripperDelivery = true;
            }
            assert.ok(e.cargoUsed <= MINING_CONVOY.target);
            sawMining ||= e.extracting;
            if (e.beams.length) {
                assert.equal(e.beams.length, 2);
                for (const beam of e.beams)
                    assert.ok(
                        Math.hypot(beam.to.x - beam.from.x, beam.to.y - beam.from.y) <=
                            HULLS.mule.laserRange + 1e-6,
                    );
                assert.ok(
                    Math.hypot(
                        e.beams[0].from.x - e.beams[1].from.x,
                        e.beams[0].from.y - e.beams[1].from.y,
                    ) > 60,
                );
                sawLasers = true;
            }
            sawReturn ||= e.returning;
            if (e.failed || e.state === 'destroyed') break;
        }
        assert.equal(
            e.state,
            'complete',
            `${e.status} ${JSON.stringify(e.position)} player ${JSON.stringify(s.position)} ore ${e.cargoOre} parts ${e.cargoParts} progress ${c.story!.progress['lunar-foundation']}`,
        );
        assert.ok(sawMining && sawReturn);
        assert.ok(sawLasers, 'real deliveries must include both visible mining lasers');
        assert.ok(sawExtendedGripper && sawHeldResource && sawGripperDelivery);
        assert.ok(e.trips >= 2);
        assert.ok(e.ambushed);
        assert.ok(s.enemyKills >= 2);
        assert.equal(c.story!.progress['lunar-foundation'], 160);
        assert.ok(hullUnlocked(c, 'mule'));
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(
            s.surveyData.has('escort'),
            false,
            'deliveries must not create a duplicate report reward',
        );
        for (let f = 0; f < 60 * 120 && !s.ended; f++) {
            const target = s.area === 'surface' ? MOON.exit : { x: 0, y: 0 };
            const input = steer(s, target, 70);
            input.interact = Math.hypot(s.position.x - target.x, s.position.y - target.y) < 160;
            s.step(input);
            s.events.length = 0;
        }
        assert.equal(s.ended, 'returned');
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('Mule uses the same timed gripper mechanism, capacity and target reservations as a player ship', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const escort = new MiningEscort(world);
    try {
        assert.ok(escort.grippers instanceof GripperSystem);
        assert.equal(escort.grippers.range, HULLS.mule.grabberRange);
        assert.deepEqual(
            escort.grippers.arms.map((arm) => arm.mount),
            HULLS.mule.grabbers,
        );
        const loot = new Map([[1, { id: 1, x: 150, y: 0, kind: 'ore' as const, amount: 3 }]]);
        let cargo = 0;
        const tick = (reserved: number[] = [], clear = true) =>
            escort.grippers.update(
                GAME.step,
                { x: 0, y: 0 },
                0,
                HULLS.mule.size,
                1 - cargo,
                loot,
                () => cargo++,
                () => clear,
                reserved,
            );
        tick([1]);
        assert.ok(escort.grippers.arms.every((arm) => arm.phase === 'idle'));
        tick([], false);
        assert.ok(escort.grippers.arms.every((arm) => arm.phase === 'idle'));
        tick();
        assert.equal(cargo, 0);
        assert.equal(loot.get(1)!.amount, 3);
        assert.ok(escort.grippers.arms.some((arm) => arm.phase === 'extend'));
        for (let frame = 0; frame < 120; frame++) tick();
        assert.equal(cargo, 1);
        assert.equal(loot.get(1)!.amount, 2);
    } finally {
        escort.dispose();
        world.free();
    }
});

test('Mule mining applies both stock lasers through real ray hits and cannot damage through a rock', () => {
    const campaign = ready();
    beginRun(campaign, 1);
    const simulation = new MissionSimulation(campaign, 1);
    try {
        simulation.area = 'surface';
        const escort = simulation.miningEscort!;
        escort.ambushed = true;
        const [target, blocker] = [...simulation.rocks.values()].filter(
            (rock) => rock.surface && rock.anchored && !rock.copper,
        );
        for (const rock of [...simulation.rocks.values()]) {
            if (rock === target || rock === blocker) continue;
            simulation.world.removeRigidBody(rock.body);
            simulation.rocks.delete(rock.id);
        }
        const site = MINING_CONVOY.site;
        const place = (rock: typeof target, x: number, y: number) => {
            rock.body.setTranslation({ x: x / 100, y: y / 100 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            rock.previous = { x, y };
            rock.health = 10000;
        };
        place(target, site.x + 240, site.y);
        place(blocker, site.x + 120, site.y + 500);
        blocker.defense = true;
        escort.body.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
        escort.body.setRotation(0, true);
        escort.resumeMining({ ...site });
        simulation.ship.setTranslation({ x: (site.x - 200) / 100, y: site.y / 100 }, true);
        simulation.world.step();
        simulation.step(idle);
        assert.equal(escort.beams.length, HULLS.mule.lasers.length);
        assert.ok(
            Math.abs(
                target.health -
                    (10000 -
                        HULLS.mule.lasers.length *
                            GAME.laserDamage *
                            HULLS.mule.miningPower *
                            GAME.step),
            ) < 1e-6,
        );
        const targetHealth = target.health;
        place(blocker, site.x + 120, site.y);
        simulation.world.step();
        simulation.step(idle);
        assert.equal(target.health, targetHealth);
        assert.ok(blocker.health < 10000);
    } finally {
        simulation.dispose();
    }
});

test('player and Mule deliver to one persistent construction counter, including partial loads', () => {
    const c = ready();
    beginRun(c, 1, null, true);
    const s = new MissionSimulation(c, 1);
    try {
        enterSurface(s);
        const playerCargo = { ore: 60, parts: 0 };
        const freight = { ...c.activeRun!.freight };
        const carried = { ...s.cargo };
        const e = s.miningEscort!;
        e.cargoOre = 70;
        e.returnToStation();
        e.body.setTranslation(
            { x: MINING_CONVOY.home.x / 100, y: MINING_CONVOY.home.y / 100 },
            true,
        );
        s.ship.setTranslation(
            { x: (MINING_CONVOY.home.x - 100) / 100, y: MINING_CONVOY.home.y / 100 },
            true,
        );
        s.step(idle);
        assert.equal(c.story!.progress['lunar-foundation'], 70);
        assert.deepEqual(
            c.activeRun!.freight,
            freight,
            'NPC delivery must not debit player freight',
        );
        assert.deepEqual(s.cargo, carried);
        assert.equal(deliverLunarCargo(c, playerCargo)?.amount, 60);
        assert.equal(c.story!.progress['lunar-foundation'], 130);
        assert.equal(e.cargoOre, 0);
        assert.equal(e.trips, 1);
        assert.equal(hullUnlocked(c, 'mule'), false);
        const rest = { ore: 45, parts: 0 };
        deliverLunarCargo(c, rest);
        s.step(idle);
        assert.equal(rest.ore, 15);
        assert.equal(c.story!.progress['lunar-foundation'], 160);
        assert.equal(e.state, 'complete');
        assert.ok(hullUnlocked(c, 'mule'));
        finishRun(c, false, s.cargo, s.elapsed, 'loss');
        assert.equal(c.story!.progress['lunar-foundation'], 160);
        assert.ok(hullUnlocked(c, 'mule'));
    } finally {
        s.dispose();
    }
});

test('AI Mule repairs without cargo or kits, and damage interrupts repair', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const e = new MiningEscort(world);
    try {
        e.state = 'travel';
        e.health = 80;
        e.update(1, e.position, [], false);
        assert.equal(e.cargoUsed, 0);
        assert.equal(e.health, 80);
        assert.equal(e.repairProgress, 1);
        e.damage(5, 0);
        assert.equal(e.repairProgress, 0);
        for (let i = 0; i < 60 * 7; i++) e.update(1 / 60, e.position, [], false);
        assert.equal(e.health, 100);
        assert.equal(e.repairs, 1);
        e.update(10, e.position, [], false);
        assert.equal(e.health, 125, 'another repair is free with empty cargo');
    } finally {
        world.free();
    }
});

test('destroyed loaded Mule grants no delivery; a later sortie has a fresh Mule and retains only delivered ore', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    try {
        enterSurface(s);
        deliverLunarCargo(c, { ore: 40, parts: 0 });
        const e = s.miningEscort!;
        e.cargoOre = 70;
        e.state = 'travel';
        e.damage(1000, 0);
        s.step(idle);
        assert.equal(e.state, 'destroyed');
        assert.equal(c.story!.progress['lunar-foundation'], 40);
        assert.equal(hullUnlocked(c, 'mule'), false);
        finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        beginRun(c, 2);
        const retry = new MissionSimulation(c, 2);
        try {
            assert.equal(retry.miningEscort!.cargoUsed, 0);
            assert.equal(retry.miningEscort!.health, 150);
            assert.equal(c.story!.progress['lunar-foundation'], 40);
        } finally {
            retry.dispose();
        }
    } finally {
        s.dispose();
    }
});
