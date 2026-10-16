import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    HULLS,
    FLEET_LIMIT,
    PHASE_DASH,
    ARMAMENT_KITS,
    GAME,
    WEAPONS,
    STINGER_AMMO,
    type HullId,
} from '../frontend/game/config';
import {
    beginRun,
    deliverSalvage,
    finishRun,
    newCampaign,
    newShip,
    parseCampaign,
    buyShip,
} from '../frontend/game/state/campaign';
import { assignCrew, advanceCrew, queueJob } from '../frontend/game/state/crew';
import { equipWeapon } from '../frontend/game/state/weapons';
import { MissionSimulation } from '../frontend/game/systems/mission';

before(async () => RAPIER.init());
const idle = {
    target: { x: 4000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function arena(
    hull: HullId = 'widmo',
    weapon: 'standard' | 'pulse' | 'rail' = 'standard',
    drill = 0,
    handling = 0,
) {
    const c = newCampaign();
    c.ship!.hull = hull;
    c.ship!.weapon = weapon;
    c.ship!.drill = drill;
    c.ship!.handling = handling;
    c.ship!.weapons = weapon === 'standard' ? ['standard'] : ['standard', weapon];
    beginRun(c, 71);
    const sim = new MissionSimulation(c, 71);
    for (const enemy of [...sim.enemies.enemies.values()]) sim.enemies.damage(enemy.id, 10000);
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    sim.ship.setRotation(0, true);
    return { c, sim };
}

test('Swift is an entry scout with gun, laser and passive radar jamming; Widmo is advanced', () => {
    const c = newCampaign();
    c.bank = { ore: 35, parts: 2 };
    assert.ok(buyShip(c, 'swift'));
    assert.equal(HULLS.swift.guns.length, 1);
    assert.equal(HULLS.swift.lasers.length, 1);
    assert.ok(HULLS.swift.maxSpeed > HULLS.prospector.maxSpeed);
    assert.ok(HULLS.swift.radarJamming > 0.5);
    assert.equal(HULLS.widmo.workshop, 2);
    assert.equal(HULLS.widmo.guns.length, 0);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('radar jamming is passive and never makes an ordinary ship invisible', () => {
    const { sim } = arena('swift');
    try {
        const signature = 1 - HULLS.swift.radarJamming;
        assert.equal(sim.enemySignature, signature);
        sim.toggleCloak();
        sim.step({ ...idle, fire: true, mine: true, thrust: true, boost: true });
        assert.equal(sim.enemySignature, signature);
        assert.equal(sim.opticalCloak, false);
        assert.equal(sim.cloaked, false);
        assert.equal(sim.laserBeams.length, 1);
        assert.ok(sim.bullets.size > 0);
    } finally {
        sim.dispose();
    }
});

test('station workers survive a loss and cannot auto-repair or fabricate in flight', () => {
    const { c, sim } = arena('prospector');
    try {
        c.crew.mechanic = c.crew.quartermaster = true;
        sim.hull = 25;
        sim.cargo.parts = 16;
        sim.repairKits = 0;
        for (let frame = 0; frame < 2400; frame++) sim.step(idle);
        assert.equal(sim.hull, 25);
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.cargo.parts, 16);
        finishRun(c, false, sim.cargo, sim.elapsed, 'loss');
        assert.ok(c.crew.mechanic && c.crew.quartermaster);
    } finally {
        sim.dispose();
    }
    const station = newCampaign();
    station.crew.mechanic = true;
    station.bank = { ore: 10, parts: 0 };
    assert.ok(queueJob(station, 'refine'));
    assert.ok(beginRun(station, 71));
    assert.equal(advanceCrew(station, 45), 1);
    assert.equal(station.bank.parts, 1);
});

test('enemy wreck bonuses are seeded, saved, credited once and can rebuild both enemy hulls', () => {
    for (const source of ['patrol', 'lancer'] as const) {
        let captured = false,
            upgraded = false;
        for (let seed = 0; seed < 40; seed++) {
            const c = newCampaign();
            c.station.workshop = 2;
            c.reserveShips = [newShip(2)];
            c.nextShipId = 3;
            assert.ok(beginRun(c, seed));
            const copy = parseCampaign(JSON.stringify(c))!;
            const record = deliverSalvage(c, 999, source)!;
            assert.deepEqual(deliverSalvage(copy, 999, source), record);
            if (c.reserveShips.length === 2) {
                captured = true;
                assert.equal(c.reserveShips[1].hull, source === 'patrol' ? 'raider' : 'lancer');
            } else {
                upgraded = true;
                assert.ok(
                    ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'].some(
                        (key) => c.reserveShips[0][key as 'engine'] === 1,
                    ),
                );
            }
            assert.deepEqual(c.ship, newShip(1));
            const snapshot = JSON.stringify(c);
            assert.equal(deliverSalvage(c, 999, source), null);
            assert.equal(JSON.stringify(c), snapshot);
            assert.deepEqual(parseCampaign(snapshot), c);
            finishRun(c, false, { ore: 0, parts: 0 }, 1, 'loss');
            assert.ok(c.reserveShips.length > 0);
            assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        }
        assert.ok(captured && upgraded);
    }
});

test('a full hangar converts rebuild chances to reserve upgrades and never exceeds fleet capacity', () => {
    const c = newCampaign();
    c.station.workshop = 2;
    c.reserveShips = Array.from({ length: FLEET_LIMIT - 1 }, (_, i) => newShip(i + 2));
    c.nextShipId = FLEET_LIMIT + 1;
    beginRun(c, 71);
    for (let id = 1; id < 20; id++) assert.ok(deliverSalvage(c, id, 'lancer'));
    assert.equal(c.reserveShips.length + 1, FLEET_LIMIT);
    assert.equal(c.nextShipId, FLEET_LIMIT + 1);
    assert.ok(
        c.reserveShips.some(
            (ship) =>
                ship.engine + ship.handling + ship.cargo + ship.drill + ship.armor + ship.shield >
                0,
        ),
    );
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(buyShip(c, 'raider'), false);
});

test('every hull can buy and switch role-specific armament variants only in base', () => {
    for (const hull of Object.keys(HULLS) as HullId[]) {
        const c = newCampaign();
        c.ship!.hull = hull;
        c.station.workshop = 2;
        c.bank = { ore: 100, parts: 20 };
        assert.ok(equipWeapon(c, 'pulse'), hull);
        assert.ok(equipWeapon(c, 'rail'), hull);
        const bank = { ...c.bank };
        assert.ok(equipWeapon(c, 'pulse'), hull);
        assert.deepEqual(c.bank, bank);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        beginRun(c, 71);
        assert.equal(equipWeapon(c, 'standard'), false);
    }
});

test('Widmo dash sweeps through an enemy once, has no guns, and cannot repeat while held', () => {
    const { sim } = arena();
    try {
        sim.enemies.add([
            { id: 999, kind: 'lancer', x: 3200, y: 0, home: { x: 3200, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(999)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        enemy.health = 1000;
        enemy.cooldown = 999;
        sim.step({ ...idle, mine: true, fire: true });
        for (let frame = 0; frame < 30; frame++) sim.step({ ...idle, fire: true });
        assert.ok(sim.position.x > 3450);
        assert.equal(enemy.health, 1000 - PHASE_DASH.damage);
        assert.equal(sim.shipCollider.isSensor(), false);
        assert.equal(sim.opticalCloak, true);
        assert.equal(
            [...sim.bullets.values()].filter((bullet) => bullet.team === 'player').length,
            0,
        );
        for (let frame = 0; frame < 310; frame++) sim.step({ ...idle, fire: true });
        assert.equal(sim.dashCooldown, 0);
        assert.equal(sim.dashTime, 0);
    } finally {
        sim.dispose();
    }
});

test('larger phase blades hit enemies just outside the base blade span', () => {
    for (const handling of [0, 3]) {
        const { sim } = arena('widmo', 'standard', 0, handling);
        try {
            sim.enemies.add([
                { id: 999, kind: 'lancer', x: 3200, y: 120, home: { x: 3200, y: 120 }, phase: 0 },
            ]);
            const enemy = sim.enemies.enemies.get(999)!;
            const edge = HULLS.widmo.hitbox[1] * HULLS.widmo.size + enemy.config.radius + 4;
            enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
            enemy.body.setTranslation({ x: 32, y: edge / 100 }, true);
            enemy.health = 1000;
            enemy.cooldown = 999;
            sim.step({ ...idle, fire: true });
            for (let i = 0; i < 30; i++) sim.step(idle);
            assert.equal(enemy.health, handling ? 1000 - sim.dashDamage : 1000);
        } finally {
            sim.dispose();
        }
    }
});

test('dash crosses a reinforced wall and damages it once per use until it breaks', () => {
    const { sim } = arena();
    try {
        const wall = sim.sector.fortress.walls[0];
        const center = { x: (wall.from.x + wall.to.x) / 2, y: (wall.from.y + wall.to.y) / 2 };
        const length = Math.hypot(
            center.x - sim.sector.fortress.x,
            center.y - sim.sector.fortress.y,
        );
        const n = {
            x: (center.x - sim.sector.fortress.x) / length,
            y: (center.y - sim.sector.fortress.y) / length,
        };
        const handle = [...sim.structureHealth.keys()][0];
        for (let use = 0; use < 3; use++) {
            sim.ship.setTranslation(
                { x: (center.x + n.x * 130) / 100, y: (center.y + n.y * 130) / 100 },
                true,
            );
            sim.ship.setLinvel({ x: 0, y: 0 }, true);
            sim.step(idle);
            sim.dashCooldown = 0;
            const target = { x: center.x - n.x * 450, y: center.y - n.y * 450 };
            sim.step({ ...idle, fire: true, target });
            for (let frame = 0; frame < 25; frame++) sim.step(idle);
            assert.ok((sim.position.x - center.x) * n.x + (sim.position.y - center.y) * n.y < -100);
            if (use < 2)
                assert.equal(sim.structureHealth.get(handle), 180 - PHASE_DASH.damage * (use + 1));
        }
        assert.ok(sim.destroyedFortressWalls.has(0));
        assert.equal(sim.world.getCollider(handle), null);
    } finally {
        sim.dispose();
    }
});

test('a long muzzle cannot spawn a shot beyond a wall between the breech and barrel tip', () => {
    const { sim } = arena('prospector', 'rail');
    try {
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.01, 1).setTranslation(30.3, 0),
        );
        sim.fortressColliders.add(wall.handle);
        sim.step({ ...idle, fire: true });
        assert.equal(sim.bullets.size, 0);
    } finally {
        sim.dispose();
    }
});

test('special armament changes actual mining power, beam reach and dash cooldown', () => {
    for (const weapon of ['standard', 'pulse', 'rail'] as const) {
        const { sim } = arena('mule', weapon);
        try {
            sim.step({ ...idle, fire: true });
            const beam = sim.laserBeams[0];
            assert.ok(
                Math.abs(
                    Math.hypot(beam.to.x - beam.from.x, beam.to.y - beam.from.y) -
                        HULLS.mule.laserRange * ARMAMENT_KITS[weapon].range,
                ) < 0.01,
            );
        } finally {
            sim.dispose();
        }
        const dash = arena('widmo', weapon).sim;
        try {
            dash.step({ ...idle, fire: true });
            assert.equal(dash.dashCooldown, PHASE_DASH.cooldown * ARMAMENT_KITS[weapon].cooldown);
        } finally {
            dash.dispose();
        }
        const fighter = arena('stinger', weapon).sim;
        try {
            fighter.step({ ...idle, fire: true });
            const bullet = [...fighter.bullets.values()][0];
            const mount = HULLS.stinger.guns[0],
                size = HULLS.stinger.size;
            const from = {
                x: fighter.position.x + mount.x * size,
                y: fighter.position.y + mount.y * size,
            };
            const muzzle =
                Math.hypot(bullet.x - from.x, bullet.y - from.y) -
                STINGER_AMMO.light.speed * GAME.step;
            assert.ok(Math.abs(muzzle - WEAPONS[weapon].length * size) < 1e-6);
        } finally {
            fighter.dispose();
        }
    }
});

test('mining variants change damage to real asteroids, rather than only hangar statistics', () => {
    for (const weapon of ['standard', 'pulse', 'rail'] as const) {
        const c = newCampaign();
        c.ship!.hull = 'mule';
        c.ship!.weapon = weapon;
        const sim = new MissionSimulation(c, 71);
        try {
            const rock = [...sim.rocks.values()].find((item) => item.radius > 65)!;
            for (const other of [...sim.rocks.values()])
                if (other !== rock) {
                    sim.world.removeRigidBody(other.body);
                    sim.rocks.delete(other.id);
                }
            for (const enemy of [...sim.enemies.enemies.values()])
                sim.enemies.damage(enemy.id, 10000);
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            sim.ship.setRotation(0, true);
            rock.body.setTranslation({ x: 32, y: 0 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            rock.health = 1000;
            sim.step({ ...idle, fire: true });
            const expected =
                GAME.laserDamage *
                GAME.step *
                HULLS.mule.miningPower *
                2 *
                ARMAMENT_KITS[weapon].power;
            assert.ok(Math.abs(1000 - rock.health - expected) < 1e-6);
        } finally {
            sim.dispose();
        }
    }
});

test('phase drive clears an occupied landing point forwards without teleporting back', () => {
    const { sim } = arena();
    try {
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(3, 5).setTranslation(35, 0),
        );
        sim.fortressColliders.add(wall.handle);
        sim.step({ ...idle, fire: true });
        let previous = sim.position.x;
        for (let frame = 0; frame < 65; frame++) {
            sim.step(idle);
            assert.ok(sim.position.x >= previous - 0.01, 'phase must never snap backwards');
            previous = sim.position.x;
        }
        assert.ok(sim.position.x > 3800);
        assert.equal(sim.dashTrail.length, 0);
        assert.equal(sim.shipCollider.isSensor(), false);
    } finally {
        sim.dispose();
    }
});

test('Widmo faces its dash, records a fading trail and upgrades blades independently of cloak', () => {
    const c = newCampaign();
    c.ship!.hull = 'widmo';
    c.ship!.handling = 2;
    c.ship!.drill = 3;
    beginRun(c, 71);
    const sim = new MissionSimulation(c, 71);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        const target = { x: 3000, y: 3000 };
        sim.step({ ...idle, target, fire: true });
        assert.ok(Math.abs(sim.ship.rotation() - Math.PI / 2) < 0.001);
        assert.equal(sim.dashDamage, PHASE_DASH.damage * 1.5);
        assert.equal(sim.dashCooldown, PHASE_DASH.cooldown / 1.3);
        assert.ok(sim.dashTrail.length > 0);
        assert.ok(sim.position.y > 30);
        for (let i = 0; i < 60; i++) sim.step({ ...idle, target });
        assert.equal(sim.dashTrail.length, 0);
    } finally {
        sim.dispose();
    }
});

test('phase blades chip an asteroid once per dash at a fraction of combat damage', () => {
    const c = newCampaign();
    c.ship!.hull = 'widmo';
    beginRun(c, 71);
    const sim = new MissionSimulation(c, 71);
    try {
        for (const enemy of [...sim.enemies.enemies.values()]) sim.enemies.damage(enemy.id, 10000);
        const rock = [...sim.rocks.values()][0];
        for (const other of [...sim.rocks.values()]) {
            if (other === rock) continue;
            sim.world.removeRigidBody(other.body);
            sim.rocks.delete(other.id);
        }
        rock.body.setTranslation({ x: 32, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        rock.health = 1000;
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        sim.step({ ...idle, fire: true });
        for (let i = 0; i < 30; i++) sim.step(idle);
        assert.ok(Math.abs(rock.health - (1000 - sim.dashDamage * 0.12)) < 0.001);
    } finally {
        sim.dispose();
    }
});

test('recovered enemy hulls upgrade their combat systems instead of an absent mining laser', () => {
    for (const hull of ['raider', 'lancer'] as const) {
        const { sim } = arena(hull, 'standard', 1);
        try {
            const damage = sim.weaponConfig.damage;
            assert.equal(sim.gunDamage, damage * 1.25);
            sim.step({ ...idle, fire: true });
            const bullet = [...sim.bullets.values()][0];
            assert.equal(bullet.damage, damage * 1.25);
        } finally {
            sim.dispose();
        }
    }
});
