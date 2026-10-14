import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, ENEMY_PROFILES, GAME } from '../frontend/game/config';
import { generateSector } from '../frontend/game/worlds/sector';
import { EnemyFleet } from '../frontend/game/systems/enemies';
import { EnemyNavigation } from '../frontend/game/systems/enemyNavigation';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { newCampaign } from '../frontend/game/state/campaign';
before(async () => {
    await RAPIER.init();
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function arena() {
    const world = new RAPIER.World({ x: 0, y: 0 });
    world.timestep = GAME.step;
    const fleet = new EnemyFleet(world, [
        { id: 7, kind: 'lancer', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
    ]);
    world.step();
    return { world, fleet, enemy: fleet.enemies.get(7)! };
}
test('sectors replace one observatory guard with a Lancer, retaining five enemies and clear physical spawns', () => {
    for (let seed = 0; seed < 100; seed++) {
        const sector = generateSector(seed),
            lancers = sector.enemies.filter((e) => e.kind === 'lancer');
        assert.equal(sector.enemies.length, 5);
        assert.equal(lancers.length, 1);
        assert.equal(lancers[0].id, 5);
        assert.deepEqual(lancers[0].home, { x: sector.landmarks[5].x, y: sector.landmarks[5].y });
        assert.ok(
            sector.rocks.every(
                (r) =>
                    Math.hypot(r.x - lancers[0].x, r.y - lancers[0].y) >
                    r.radius + ENEMY_PROFILES.lancer.radius,
            ),
        );
    }
});
test('Lancer has physical armor and a larger body; damage removes it once after five normal hits', () => {
    const { world, fleet, enemy } = arena();
    try {
        assert.equal(enemy.health, 90);
        assert.ok(Math.abs(enemy.collider.radius() - 0.32) < 1e-6);
        for (let i = 0; i < 4; i++) assert.equal(fleet.damage(7, 18), null);
        assert.equal(enemy.health, 18);
        assert.ok(fleet.damage(7, 18));
        assert.equal(fleet.damage(7, 18), null);
        assert.equal(fleet.colliders.size, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
});
test('long-range artillery visibly charges longer than a patrol and observes its slow cooldown', () => {
    const { world, fleet, enemy } = arena();
    let shots = 0;
    const update = () => {
        fleet.update(
            GAME.step,
            { x: 3700, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => {
                shots++;
                return true;
            },
        );
        world.step();
    };
    try {
        for (let i = 0; i < 60; i++) update();
        assert.equal(shots, 0);
        assert.ok(enemy.charge > 0.6);
        for (let i = 0; i < 60; i++) update();
        assert.equal(shots, 1);
        for (let i = 0; i < 90; i++) update();
        assert.equal(shots, 1);
        assert.ok(
            Math.hypot(enemy.body.linvel().x, enemy.body.linvel().y) * 100 <=
                ENEMY_PROFILES.lancer.chaseSpeed + 1,
        );
    } finally {
        fleet.dispose();
        world.free();
    }
});
test('artillery retreats from close opponents and camouflage or Aurora protection cancels acquisition', () => {
    const { world, fleet, enemy } = arena();
    try {
        fleet.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => true,
            0.4,
        );
        assert.equal(enemy.state, 'patrol');
        for (let i = 0; i < 60; i++) {
            fleet.update(
                GAME.step,
                { x: 3300, y: 0 },
                { x: 0, y: 0 },
                () => false,
                () => true,
            );
            world.step();
        }
        assert.ok(enemy.body.translation().x < 29.5);
        fleet.update(
            GAME.step,
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => true,
        );
        assert.equal(enemy.state, 'return');
        assert.equal(enemy.charge, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
});
test('cover blocks Lancer detection and aiming, including its longer weapon range', () => {
    const { world, fleet, enemy } = arena();
    try {
        const wall = world.createCollider(RAPIER.ColliderDesc.cuboid(0.8, 5).setTranslation(33, 0));
        world.step();
        let shots = 0;
        for (let i = 0; i < 120; i++) {
            fleet.update(
                GAME.step,
                { x: 3700, y: 0 },
                { x: 0, y: 0 },
                (c) => c.handle === wall.handle,
                () => {
                    shots++;
                    return true;
                },
            );
            world.step();
        }
        assert.equal(shots, 0);
        assert.notEqual(enemy.state, 'chase');
        assert.equal(enemy.charge, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
});
test('actual artillery rounds use the profile, navigation identifies Lancer and one kill drops its richer salvage', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        const enemy = [...sim.enemies.enemies.values()].find((e) => e.kind === 'lancer')!;
        for (const e of [...sim.enemies.enemies.values()])
            if (e.id !== enemy.id) sim.enemies.damage(e.id, 10000);
        enemy.home = { x: 3000, y: 0 };
        enemy.body.setTranslation({ x: 30, y: 0 }, true);
        enemy.body.setRotation(0, true);
        sim.ship.setTranslation({ x: 37, y: 0 }, true);
        const nav = new EnemyNavigation();
        assert.equal(nav.waypoint(sim.enemies, sim.position).name, 'Lancer #5');
        let bullet;
        for (let i = 0; i < 150; i++) {
            sim.step(idle);
            bullet = [...sim.bullets.values()].find((b) => b.team === 'enemy');
            if (bullet) break;
        }
        assert.ok(bullet);
        assert.equal(bullet.damage, 18);
        assert.equal(bullet.heavy, true);
        assert.ok(Math.hypot(bullet.vx, bullet.vy) > DRONES.shotSpeed + 150);
        sim.bullets.clear();
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        const p = enemy.body.translation();
        sim.bullets.set(9999, {
            id: 9999,
            x: p.x * 100 - 100,
            y: p.y * 100,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'player',
            damage: 100,
        });
        sim.step(idle);
        assert.equal(sim.enemyKills, 1);
        assert.equal(sim.loot.size, 8);
        assert.equal([...sim.loot.values()].filter((l) => l.kind === 'parts').length, 4);
    } finally {
        sim.dispose();
    }
});
