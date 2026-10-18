import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME } from '../frontend/game/config';
import { generateSector, navigationWaypoint } from '../frontend/game/worlds/sector';
import { EnemyFleet, enemyPosition } from '../frontend/game/systems/enemies';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { newCampaign } from '../frontend/game/state/campaign';

before(async () => RAPIER.init());

test('outer sectors have complete treasure rings and seven crystal rocks inside them', () => {
    for (let seed = 0; seed < 100; seed++) {
        const sector = generateSector(seed);
        const cluster = navigationWaypoint(sector.landmarks, 12);
        assert.equal(Math.round(Math.hypot(cluster.x, cluster.y)), 6400);
        const rocks = sector.rocks.filter(
            (r) => Math.hypot(r.x - cluster.x, r.y - cluster.y) < 700,
        );
        assert.equal(rocks.length, 70);
        assert.equal(rocks.filter((r) => r.crystal).length, 7);
        for (const radius of [320, 450, 580]) {
            const ring = rocks.filter(
                (r) => Math.abs(Math.hypot(r.x - cluster.x, r.y - cluster.y) - radius) < 1,
            );
            assert.equal(ring.length, radius === 320 ? 15 : radius === 450 ? 21 : 27);
        }
        assert.ok(sector.rocks.every((r) => Math.hypot(r.x, r.y) + r.radius < GAME.sectorRadius));
    }
});

test('roaming routes cover the outer sector without crossing the protected starting region', () => {
    for (let seed = 0; seed < 100; seed++) {
        const roamers = generateSector(seed).enemies.filter((e) => e.route);
        assert.equal(roamers.length, 3);
        for (const enemy of roamers) {
            assert.equal(enemy.route!.length, 6);
            for (let i = 0; i < 6; i++) {
                const a = enemy.route![i],
                    b = enemy.route![(i + 1) % 6];
                for (let t = 0; t <= 1; t += 0.05)
                    assert.ok(Math.hypot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t) > 3500);
            }
        }
    }
});

test('a roaming drone travels between waypoints and pursues from a local anchor', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    world.timestep = GAME.step;
    const fleet = new EnemyFleet(world, [
        {
            id: 10,
            x: 5000,
            y: 0,
            home: { x: 5000, y: 0 },
            phase: 0,
            route: [
                { x: 5300, y: 0 },
                { x: 5600, y: 0 },
            ],
        },
    ]);
    try {
        for (let i = 0; i < 480; i++) {
            fleet.update(
                GAME.step,
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                () => false,
                () => false,
            );
            world.step();
        }
        const enemy = fleet.enemies.get(10)!;
        assert.equal(enemy.routeIndex, 1);
        const p = enemyPosition(enemy);
        assert.ok(p.x > 5400);
        fleet.update(
            GAME.step,
            { x: p.x + 300, y: p.y },
            { x: 0, y: 0 },
            () => false,
            () => false,
        );
        assert.equal(enemy.state, 'chase');
        assert.deepEqual(enemy.home, p);
        fleet.update(
            GAME.step,
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => false,
        );
        assert.equal(enemy.state, 'return');
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('Perseid asteroids travel through the sector without a forced circular orbit', () => {
    const sim = new MissionSimulation(newCampaign(), 731);
    try {
        sim.enemies.dispose();
        const rock = [...sim.rocks.values()].find(
            (r) => Math.hypot(r.previousVelocity.x, r.previousVelocity.y) > 90,
        )!;
        for (const other of [...sim.rocks.values()])
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        const start = { ...rock.previous };
        assert.equal(rock.orbit, undefined);
        for (let i = 0; i < 1800; i++)
            sim.step({
                target: { x: 0, y: 0 },
                thrust: false,
                brake: false,
                fire: false,
                interact: false,
            });
        const p = rock.body.translation();
        assert.ok(Math.hypot(p.x * 100 - start.x, p.y * 100 - start.y) > 300);
        assert.ok(Math.hypot(p.x * 100, p.y * 100) <= sim.sectorRadius + 500);
        assert.ok(Math.hypot(rock.body.linvel().x, rock.body.linvel().y) * 100 > 50);
    } finally {
        sim.dispose();
    }
});
