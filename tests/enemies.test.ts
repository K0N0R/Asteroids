import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, GAME } from '../frontend/game/config';
import { generateSector } from '../frontend/game/worlds/sector';
import { EnemyFleet, enemyPosition } from '../frontend/game/systems/enemies';
import { FlightInput, MissionSimulation } from '../frontend/game/systems/mission';
import { beginRun, finishRun, newCampaign } from '../frontend/game/state/campaign';
import { trainPilot } from '../frontend/game/state/pilots';

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
        { id: 1, x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
    ]);
    world.step();
    return { world, fleet, enemy: fleet.enemies.get(1)! };
}
function removeRocks(sim: MissionSimulation) {
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
}
function singleEnemy(sim: MissionSimulation) {
    const enemy = [...sim.enemies.enemies.values()][0];
    for (const other of sim.enemies.enemies.values())
        if (other !== enemy) {
            sim.enemies.colliders.delete(other.collider.handle);
            sim.world.removeRigidBody(other.body);
            sim.enemies.enemies.delete(other.id);
        }
    enemy.home = { x: 3400, y: 0 };
    enemy.body.setTranslation({ x: 34, y: 0 }, true);
    enemy.body.setLinvel({ x: 0, y: 0 }, true);
    enemy.body.setRotation(Math.PI, true);
    sim.ship.setTranslation({ x: 31, y: 0 }, true);
    sim.ship.setRotation(0, true);
    return enemy;
}

test('sectors seed five guards and three roamers outside the base and without initial asteroid or drone overlaps', () => {
    for (let seed = 0; seed < 100; seed++) {
        const sector = generateSector(seed);
        assert.equal(sector.enemies.length, 8);
        assert.deepEqual(sector.enemies, generateSector(seed).enemies);
        for (const [index, enemy] of sector.enemies.entries()) {
            assert.ok(Math.hypot(enemy.x, enemy.y) >= DRONES.safeRadius + DRONES.detectRange);
            for (const rock of sector.rocks)
                assert.ok(
                    Math.hypot(enemy.x - rock.x, enemy.y - rock.y) >=
                        rock.radius + DRONES.radius + 30,
                );
            for (const other of sector.enemies.slice(index + 1))
                assert.ok(
                    Math.hypot(enemy.x - other.x, enemy.y - other.y) >= DRONES.radius * 2 + 40,
                );
        }
        assert.equal(
            sector.enemies.filter(
                (e) =>
                    Math.hypot(e.home.x - sector.landmarks[2].x, e.home.y - sector.landmarks[2].y) <
                    1,
            ).length,
            1,
        );
        assert.equal(
            sector.enemies.filter(
                (e) =>
                    Math.hypot(e.home.x - sector.landmarks[5].x, e.home.y - sector.landmarks[5].y) <
                    1,
            ).length,
            2,
        );
    }
});

test('a clear nearby target triggers pursuit and a visible charge before the first shot', () => {
    const { world, fleet, enemy } = arena();
    let shots = 0;
    try {
        for (let i = 0; i < 30; i++) {
            fleet.update(
                GAME.step,
                { x: 3500, y: 0 },
                { x: 0, y: 0 },
                () => false,
                () => {
                    shots++;
                    return true;
                },
            );
            world.step();
        }
        assert.equal(enemy.state, 'chase');
        assert.ok(enemy.charge > 0);
        assert.equal(shots, 0);
        for (let i = 0; i < 90; i++) {
            fleet.update(
                GAME.step,
                { x: 3500, y: 0 },
                { x: 0, y: 0 },
                () => false,
                () => {
                    shots++;
                    return true;
                },
            );
            world.step();
        }
        assert.ok(shots >= 1 && shots <= 2);
        const velocity = enemy.body.linvel();
        assert.ok(Math.hypot(velocity.x, velocity.y) * 100 <= DRONES.chaseSpeed + 1);
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('asteroid cover blocks detection and fire; a hidden target is not tracked through the obstacle', () => {
    const { world, fleet, enemy } = arena();
    let shots = 0;
    try {
        const cover = world.createCollider(RAPIER.ColliderDesc.ball(2).setTranslation(32.5, 0));
        world.step();
        for (let i = 0; i < 90; i++) {
            fleet.update(
                GAME.step,
                { x: 3500, y: 0 },
                { x: 0, y: 0 },
                (c) => c.handle === cover.handle,
                () => {
                    shots++;
                    return true;
                },
            );
            world.step();
        }
        assert.equal(enemy.state, 'patrol');
        assert.equal(shots, 0);
        world.removeCollider(cover, true);
        world.step();
        fleet.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => true,
        );
        world.step();
        assert.equal(enemy.state, 'chase');
        const remembered = { ...enemy.lastSeen };
        const wall = world.createCollider(RAPIER.ColliderDesc.ball(2).setTranslation(32.5, 0));
        world.step();
        fleet.update(
            GAME.step,
            { x: 3500, y: 150 },
            { x: 0, y: 0 },
            (c) => c.handle === wall.handle,
            () => {
                shots++;
                return true;
            },
        );
        world.step();
        assert.deepEqual(enemy.lastSeen, remembered);
        assert.equal(enemy.charge, 0);
        assert.equal(shots, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('range and home leash end a chase and the drone physically returns to its patrol', () => {
    const { world, fleet, enemy } = arena();
    try {
        enemy.state = 'chase';
        enemy.body.setTranslation({ x: 42, y: 0 }, true);
        fleet.update(
            GAME.step,
            { x: 4500, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => true,
        );
        world.step();
        assert.equal(enemy.state, 'return');
        for (let i = 0; i < 780; i++) {
            fleet.update(
                GAME.step,
                { x: 6000, y: 0 },
                { x: 0, y: 0 },
                () => false,
                () => true,
            );
            world.step();
        }
        assert.equal(enemy.state, 'patrol');
        const p = enemyPosition(enemy);
        assert.ok(Math.hypot(p.x - enemy.home.x, p.y - enemy.home.y) < 230);
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('the Aurora zone cancels pursuit and enemy projectiles cannot harm ships inside it', () => {
    const { world, fleet, enemy } = arena();
    try {
        enemy.state = 'chase';
        enemy.charge = 0.6;
        fleet.update(
            GAME.step,
            { x: 700, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => {
                assert.fail('cannot fire toward the base');
            },
        );
        world.step();
        assert.equal(enemy.state, 'return');
        assert.equal(enemy.charge, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        removeRocks(sim);
        sim.enemies.dispose();
        sim.ship.setTranslation({ x: 7, y: 0 }, true);
        sim.bullets.set(900, {
            id: 900,
            x: 500,
            y: 0,
            vx: 30000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: DRONES.shotDamage,
        });
        sim.step(idle);
        assert.equal(sim.hull, sim.maxHull);
        assert.equal(sim.bullets.has(900), false);
    } finally {
        sim.dispose();
    }
});

test('actual AI shots damage a stationary target and escape to the base stops further attacks', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        removeRocks(sim);
        singleEnemy(sim);
        for (let i = 0; i < 240; i++) sim.step(idle);
        assert.ok(sim.events.some((e) => e.kind === 'shot'));
        assert.ok(
            sim.hull < sim.maxHull || sim.kineticShield.charge < sim.kineticShield.profile.capacity,
        );
        sim.ship.setTranslation({ x: 2, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        const health = sim.hull;
        for (let i = 0; i < 240; i++) sim.step(idle);
        assert.equal(sim.hull, health);
        assert.ok([...sim.enemies.enemies.values()].every((e) => e.state !== 'chase'));
    } finally {
        sim.dispose();
    }
});

test('swept enemy fire is absorbed by an asteroid without damaging or mining it', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        sim.enemies.dispose();
        const rock = [...sim.rocks.values()][0];
        for (const other of sim.rocks.values())
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        rock.body.setTranslation({ x: 32.5, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        sim.ship.setTranslation({ x: 35, y: 0 }, true);
        const health = rock.health;
        sim.bullets.set(900, {
            id: 900,
            x: 3100,
            y: 0,
            vx: 30000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 12,
        });
        sim.step(idle);
        assert.equal(sim.hull, sim.maxHull);
        assert.equal(rock.health, health);
        assert.equal(sim.bullets.has(900), false);
        assert.equal(sim.loot.size, 0);
    } finally {
        sim.dispose();
    }
});

test('observatory guards interrupt scanning until they are neutralized or evaded', () => {
    const sim = new MissionSimulation(newCampaign(), 19);
    try {
        removeRocks(sim);
        const site = sim.sector.landmarks.find((s) => s.siteId === 'archive')!;
        sim.ship.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
        for (let i = 0; i < 300; i++) sim.step({ ...idle, interact: true });
        assert.ok(
            sim.hull < sim.maxHull || sim.kineticShield.charge < sim.kineticShield.profile.capacity,
        );
        assert.equal(sim.surveyData.has('archive'), false);
        assert.equal(sim.ended, null);
        sim.enemies.dispose();
        sim.bullets.clear();
        for (let i = 0; i < 240; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.surveyData.has('archive'), true);
    } finally {
        sim.dispose();
    }
});

test('player fire destroys a drone once and its salvage can be secured at the base', () => {
    const c = newCampaign();
    beginRun(c, 7);
    const sim = new MissionSimulation(c, 7);
    try {
        removeRocks(sim);
        const enemy = singleEnemy(sim),
            id = enemy.id;
        for (let i = 0; i < 240 && sim.enemies.enemies.has(id); i++)
            sim.step({ ...idle, fire: true, target: enemyPosition(enemy) });
        assert.equal(sim.enemies.enemies.has(id), false);
        assert.equal(sim.enemyKills, 1);
        assert.equal(sim.enemies.damage(id, 1000), null);
        const items = [...sim.loot.values()];
        assert.equal(
            sim.cargo.ore +
                items.filter((l) => l.kind === 'ore').reduce((sum, l) => sum + l.amount, 0),
            3,
        );
        assert.equal(
            sim.cargo.parts +
                items.filter((l) => l.kind === 'parts').reduce((sum, l) => sum + l.amount, 0),
            2,
        );
        const at = items[0] ?? sim.position;
        sim.ship.setTranslation({ x: at.x / 100, y: at.y / 100 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 60; i++) sim.step(idle);
        assert.deepEqual(sim.cargo, { ore: 3, parts: 2 });
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        for (let i = 0; i < 80; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        finishRun(c, true, sim.cargo, sim.elapsed, 'dock');
        assert.deepEqual(c.bank, { ore: 3, parts: 2 });
        assert.equal(finishRun(c, true, sim.cargo, sim.elapsed, 'again'), null);
    } finally {
        sim.dispose();
    }
});

test('mining bonuses affect asteroids but do not amplify the weapon against enemy hulls', () => {
    const measure = (miningBuild: boolean) => {
        const c = newCampaign();
        if (miningBuild) {
            c.ship!.hull = 'mule';
            c.ship!.drill = 3;
            c.pilots[0].xp = 50;
            trainPilot(c, 1, 'mining');
            trainPilot(c, 1, 'mining');
        }
        const sim = new MissionSimulation(c, 7);
        try {
            removeRocks(sim);
            const enemy = singleEnemy(sim);
            enemy.health = 1000;
            for (let i = 0; i < 20; i++)
                sim.step({ ...idle, fire: i === 0, target: enemyPosition(enemy) });
            return 1000 - enemy.health;
        } finally {
            sim.dispose();
        }
    };
    assert.equal(measure(false), GAME.shotDamage);
    assert.equal(measure(true), GAME.shotDamage);
});

test('hostile hits interrupt repair and can end a mission; ending and disposal stop all AI updates', () => {
    const c = newCampaign();
    beginRun(c, 7);
    const sim = new MissionSimulation(c, 7);
    removeRocks(sim);
    sim.enemies.dispose();
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    sim.kineticShield.charge = 0;
    sim.kineticShield.cooldown = 1000;
    sim.hull = 50;
    sim.engineFault = true;
    sim.repairProgress = 4.9;
    sim.bullets.set(900, {
        id: 900,
        x: 2800,
        y: 0,
        vx: 30000,
        vy: 0,
        life: 1,
        team: 'enemy',
        damage: 12,
    });
    sim.step({ ...idle, repair: true });
    assert.equal(sim.hull, 38);
    assert.ok(sim.repairProgress < 0.1);
    assert.equal(sim.repairKits, 1);
    sim.bullets.set(901, {
        id: 901,
        x: 2800,
        y: 0,
        vx: 30000,
        vy: 0,
        life: 1,
        team: 'enemy',
        damage: 100,
    });
    sim.step(idle);
    assert.equal(sim.ended, 'destroyed');
    assert.match(sim.deathReason, /ostrzał/);
    const elapsed = sim.elapsed;
    sim.step(idle);
    assert.equal(sim.elapsed, elapsed);
    sim.dispose();
    sim.dispose();
    assert.equal(sim.enemies.enemies.size, 0);
    assert.equal(sim.bullets.size, 0);
});
