import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { DRONES, GAME } from '../frontend/game/config';
import { newCampaign } from '../frontend/game/state/campaign';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { shieldEntry, impactParticleCount } from '../frontend/game/systems/impact';
import { HULL_PALETTES, shipHull } from '../frontend/game/graphics/shipHull';
import { ShipView } from '../frontend/game/graphics/shapes';

before(async () => {
    await RAPIER.init();
});
test('Phoenix has swept metal wings, orange reactor accents and one central combat laser', () => {
    const hull = shipHull('phoenix', newCampaign().ship!);
    const view = new ShipView({ ...newCampaign().ship!, hull: 'phoenix' });
    try {
        assert.ok(hull.width > 90 && hull.height > 80);
        const fills = hull.context.instructions.filter(
            (instruction) => instruction.action === 'fill',
        );
        assert.ok(fills.some((fill) => fill.data.style.color === HULL_PALETTES.phoenix.panel));
        assert.ok(fills.some((fill) => fill.data.style.color === HULL_PALETTES.phoenix.cargo));
        assert.equal(view.guns.length, 0);
        assert.equal(view.lasers.length, 1);
        assert.equal(view.lasers[0].x, 42);
        assert.equal(view.lasers[0].y, 0);
    } finally {
        hull.destroy();
        view.destroy({ children: true });
    }
});
test('Stinger has broad split wings, a glazed cockpit and two accent panels', () => {
    const hull = shipHull('stinger', newCampaign().ship!);
    try {
        const fills = hull.context.instructions.filter(
            (instruction) => instruction.action === 'fill',
        );
        assert.equal(
            fills.filter((fill) => fill.data.style.color === HULL_PALETTES.stinger.cargo).length,
            2,
        );
        assert.ok(fills.some((fill) => fill.data.style.color === HULL_PALETTES.stinger.hull));
        assert.ok(fills.some((fill) => fill.data.style.color === 0x639cbb));
        assert.ok(hull.height > hull.width);
        assert.ok(hull.width < 90);
        assert.ok(hull.height > 90 && hull.height < 100);
    } finally {
        hull.destroy();
    }
});
test('Stinger renders two forward-facing guns beneath each wing, with no nose gun or mining laser', () => {
    const view = new ShipView({ ...newCampaign().ship!, hull: 'stinger' });
    try {
        assert.equal(view.guns.length, 4);
        assert.equal(view.lasers.length, 0);
        assert.deepEqual(
            view.guns.map((gun) => [gun.x, gun.y]),
            [
                [-20, -42],
                [16, -36],
                [-20, 42],
                [16, 36],
            ],
        );
        assert.ok(view.guns.every((gun) => Math.abs(gun.y) >= 36 && gun.rotation === 0));
        assert.ok(view.guns.every((gun) => view.getChildIndex(gun) < view.children.length - 2));
    } finally {
        view.destroy({ children: true });
    }
});
test('Widmo wings have segmented shaded panels with restrained accents', () => {
    const hull = shipHull('widmo', newCampaign().ship!);
    try {
        const strokes = hull.context.instructions.filter(
            (instruction) => instruction.action === 'stroke',
        );
        assert.ok(strokes.length > 0);
        assert.equal(
            strokes.filter((stroke) => stroke.data.style.color === HULL_PALETTES.widmo.panel)
                .length,
            2,
        );
        for (const instruction of hull.context.instructions)
            if (instruction.action === 'fill' || instruction.action === 'stroke')
                assert.notEqual(instruction.data.style.color, 0x76e3d4);
    } finally {
        hull.destroy();
    }
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function clean(sim: MissionSimulation, keepRock = false, keepEnemy = false) {
    // These fixtures isolate hull/interaction behavior; kinetic shielding has separate integration tests.
    sim.kineticShield.charge = 0;
    sim.kineticShield.cooldown = 1000;

    const rock = [...sim.rocks.values()].find((r) => r.radius < 40)!;
    const enemy = [...sim.enemies.enemies.values()][0];
    for (const r of sim.rocks.values())
        if (!keepRock || r !== rock) {
            sim.world.removeRigidBody(r.body);
            sim.rocks.delete(r.id);
        }
    for (const e of [...sim.enemies.enemies.values()])
        if (!keepEnemy || e !== enemy) sim.enemies.damage(e.id, 10000);
    sim.loot.clear();
    sim.events.length = 0;
    return { rock, enemy };
}

test('shield catches swept entry even when a projectile ends beyond the opposite boundary', () => {
    assert.deepEqual(shieldEntry({ x: 1000, y: 0 }, { x: -1000, y: 0 }, 850), { x: 850, y: 0 });
    assert.equal(shieldEntry({ x: 1000, y: 900 }, { x: -1000, y: 900 }, 850), null);
    assert.equal(shieldEntry({ x: 850, y: 0 }, { x: 900, y: 0 }, 850), null);
    for (const team of ['player', 'enemy'] as const) {
        const sim = new MissionSimulation(newCampaign(), 71);
        try {
            clean(sim);
            sim.ship.setTranslation({ x: 0, y: 4 }, true);
            sim.bullets.set(9999, {
                id: 9999,
                x: 1000,
                y: 0,
                vx: -120000,
                vy: 0,
                damage: 18,
                team,
                life: 1,
            });
            sim.step(idle);
            assert.equal(sim.bullets.size, 0);
            const effect = sim.events.find((e) => e.kind === 'shield')!;
            assert.ok(Math.abs(effect.x - 850) < 0.001);
            assert.equal(effect.strength, 18);
            assert.equal(sim.hull, sim.maxHull);
        } finally {
            sim.dispose();
        }
    }
});

test('Aurora repels rocks including their full visual radius and rejects drones even at the origin', () => {
    const sim = new MissionSimulation(newCampaign(), 71);
    try {
        for (const rock of sim.rocks.values())
            assert.ok(
                Math.hypot(rock.previous.x, rock.previous.y) >= DRONES.safeRadius + rock.radius,
            );
        const { rock, enemy } = clean(sim, true, true);
        rock.body.setTranslation({ x: 0, y: 0 }, true);
        rock.body.setLinvel({ x: -3, y: 0 }, true);
        enemy.body.setTranslation({ x: 0, y: 0 }, true);
        enemy.body.setLinvel({ x: -3, y: 0 }, true);
        for (let i = 0; i < 120; i++) {
            sim.step(idle);
            const p = rock.body.translation(),
                e = enemy.body.translation();
            assert.ok(Math.hypot(p.x, p.y) * 100 >= DRONES.safeRadius + rock.radius - 0.01);
            assert.ok(Math.hypot(e.x, e.y) * 100 >= DRONES.safeRadius + enemy.config.radius - 0.01);
        }
        assert.equal(sim.hull, sim.maxHull);
    } finally {
        sim.dispose();
    }
});

test('incoming asteroid reflects at the shield and emits its contact on the blue boundary', () => {
    const sim = new MissionSimulation(newCampaign(), 71);
    try {
        const { rock } = clean(sim, true);
        rock.body.setTranslation({ x: (DRONES.safeRadius + rock.radius + 5) / 100, y: 0 }, true);
        rock.body.setLinvel({ x: -5, y: 0 }, true);
        sim.step(idle);
        assert.ok(rock.body.linvel().x > 0);
        const effect = sim.events.find((e) => e.kind === 'shield')!;
        assert.ok(Math.abs(effect.x - DRONES.safeRadius) < 0.1);
        assert.ok(effect.strength! > 0);
    } finally {
        sim.dispose();
    }
});

test('projectile sparks use the hull surface and scale with damage on both player and enemy', () => {
    for (const damage of [12, 30]) {
        const sim = new MissionSimulation(newCampaign(), 71);
        try {
            const { enemy } = clean(sim, false, true);
            sim.ship.setTranslation({ x: 25, y: 0 }, true);
            enemy.body.setTranslation({ x: 30, y: 0 }, true);
            enemy.home = { x: 3000, y: 0 };
            sim.bullets.set(9999, {
                id: 9999,
                x: 2400,
                y: 0,
                vx: 10000,
                vy: 0,
                damage,
                team: 'enemy',
                life: 1,
            });
            sim.bullets.set(9998, {
                id: 9998,
                x: 2900,
                y: 0,
                vx: 10000,
                vy: 0,
                damage,
                team: 'player',
                life: 1,
            });
            sim.step(idle);
            const hits = sim.events.filter((e) => e.kind === 'hit');
            assert.equal(hits.length, 2);
            assert.ok(hits.every((e) => e.strength === damage));
            assert.ok(hits.some((e) => e.x > 2400 && e.x < 2490));
            assert.ok(hits.some((e) => e.x > 2900 && e.x < 2990));
            assert.equal(sim.hull, sim.maxHull - damage);
            assert.equal(enemy.health, enemy.config.hull - damage);
        } finally {
            sim.dispose();
        }
    }
    assert.ok(impactParticleCount('hit', 30) > impactParticleCount('hit', 12));
    assert.ok(impactParticleCount('break', 70) > impactParticleCount('hit', 12));
});

test('enemy asteroid collisions damage the drone and emit sparks from the physical contact', () => {
    const sim = new MissionSimulation(newCampaign(), 71);
    try {
        const { rock, enemy } = clean(sim, true, true);
        sim.ship.setTranslation({ x: 45, y: 0 }, true);
        rock.body.setTranslation({ x: 30, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        enemy.body.setTranslation(
            { x: 30 - (rock.radius * 0.89 + enemy.config.radius + 2) / 100, y: 0 },
            true,
        );
        enemy.body.setLinvel({ x: 5, y: 0 }, true);
        enemy.home = { x: 3100, y: 0 };
        for (let i = 0; i < 25 && enemy.health === enemy.config.hull; i++) sim.step(idle);
        assert.ok(enemy.health < enemy.config.hull);
        const hit = sim.events.find((e) => e.kind === 'hit')!;
        assert.ok(hit.strength! > 0);
        assert.ok(hit.x < 3000 - 10 && hit.x > 3000 - rock.radius - 15);
        assert.ok(Math.abs(hit.y) < rock.radius);
    } finally {
        sim.dispose();
    }
});

test('repair welds alternate on the rotated deck and stop immediately when repair is interrupted', () => {
    const sim = new MissionSimulation(newCampaign(), 71);
    try {
        clean(sim);
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        sim.ship.setRotation(Math.PI / 2, true);
        sim.hull -= 30;
        sim.repairKits = 1;
        for (let i = 0; i < 50; i++) sim.step({ ...idle, repair: true });
        const sparks = sim.events.filter((e) => e.kind === 'weld');
        assert.ok(sparks.length >= 8);
        assert.ok(new Set(sparks.map((e) => `${Math.round(e.x)},${Math.round(e.y)}`)).size >= 4);
        assert.ok(sparks.every((e) => Math.hypot(e.x - sim.position.x, e.y - sim.position.y) < 35));
        sim.events.length = 0;
        sim.step({ ...idle, repair: true, fire: true });
        assert.equal(sim.repairProgress, 0);
        assert.equal(sim.events.filter((e) => e.kind === 'weld').length, 0);
    } finally {
        sim.dispose();
    }
});
