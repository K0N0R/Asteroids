import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    ENEMY_PROFILES,
    ENEMY_SUPPORT,
    ENEMY_MINES,
    GAME,
    type HullId,
} from '../frontend/game/config';
import { EnemyFleet } from '../frontend/game/systems/enemies';
import { EnemyMines } from '../frontend/game/systems/enemyMines';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { newCampaign } from '../frontend/game/state/campaign';
import { SandboxRun, defaultSandboxConfig } from '../frontend/game/systems/sandbox';
import { EnemyFactory, ENEMY_FACTORY } from '../frontend/game/systems/enemyFactory';
import { DroneView } from '../frontend/game/graphics/shapes';

before(async () => RAPIER.init());

test('new roles have distinct physical profiles for pursuit, pressure, repair and mining', () => {
    assert.ok(ENEMY_PROFILES.interceptor.chaseSpeed > ENEMY_PROFILES.patrol.chaseSpeed);
    assert.ok(ENEMY_PROFILES.interceptor.hull < ENEMY_PROFILES.patrol.hull);
    assert.ok(ENEMY_PROFILES.heavy.hull > ENEMY_PROFILES.lancer.hull * 2);
    assert.ok(ENEMY_PROFILES.heavy.chaseSpeed < ENEMY_PROFILES.lancer.chaseSpeed);
    assert.ok(ENEMY_PROFILES.support.preferredRange > ENEMY_PROFILES.heavy.preferredRange);
    assert.ok(ENEMY_PROFILES.minelayer.strafe > ENEMY_PROFILES.patrol.strafe);
});

test('support repairs one wounded visible combat ally, not itself or bosses, and never overheals', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, [
        { id: 1, kind: 'support', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
        { id: 2, kind: 'heavy', x: 3200, y: 0, home: { x: 3200, y: 0 }, phase: 0 },
        { id: 3, kind: 'interceptor', x: 3300, y: 100, home: { x: 3300, y: 100 }, phase: 0 },
    ]);
    const support = fleet.enemies.get(1)!,
        heavy = fleet.enemies.get(2)!,
        interceptor = fleet.enemies.get(3)!;
    const tick = () =>
        fleet.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => true,
        );
    try {
        fleet.damage(1, 10);
        fleet.damage(2, 100);
        fleet.damage(3, 5);
        world.step();
        tick();
        assert.equal(support.health, support.config.hull - 10);
        assert.equal(support.repairTarget, 2);
        assert.ok(
            Math.abs(
                heavy.health -
                    (heavy.config.hull - 100 + ENEMY_SUPPORT.repairPerSecond * GAME.step),
            ) < 1e-6,
        );
        assert.equal(interceptor.health, interceptor.config.hull - 5);
        heavy.health = heavy.config.hull - 0.01;
        interceptor.health = interceptor.config.hull;
        tick();
        assert.equal(heavy.health, heavy.config.hull);
        heavy.health -= 20;
        heavy.boss = true;
        tick();
        assert.equal(support.repairTarget, null);
        assert.equal(heavy.health, heavy.config.hull - 20);
        heavy.boss = false;
        const wall = world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 3).setTranslation(31, 0));
        world.step();
        fleet.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 0 },
            (collider) => collider.handle === wall.handle,
            () => true,
        );
        assert.equal(support.repairTarget, null);
        assert.equal(heavy.health, heavy.config.hull - 20);
        support.weaponDisabled = 2;
        tick();
        assert.equal(support.repairTarget, null);
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('mines arm before triggering, survive their owner, expire and are defused by shots or station shielding', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, [
        { id: 1, kind: 'minelayer', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
    ]);
    const mines = new EnemyMines(world);
    let blasts = 0;
    const tick = (dt: number, targets: { x: number; y: number }[] = [], safeRadius = 850) =>
        mines.update(
            dt,
            fleet,
            safeRadius,
            targets,
            () => false,
            () => blasts++,
        );
    const owner = fleet.enemies.get(1)!;
    try {
        owner.state = 'chase';
        world.step();
        tick(ENEMY_MINES.interval);
        assert.equal(mines.mines.size, 1);
        const mine = [...mines.mines.values()][0];
        tick(1, [mine]);
        assert.equal(blasts, 0);
        fleet.remove(1);
        tick(0.5, [mine]);
        assert.equal(blasts, 1);
        assert.equal(mines.mines.size, 0);
        assert.equal(mines.colliders.size, 0);
        fleet.add([{ id: 2, kind: 'minelayer', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 }]);
        fleet.enemies.get(2)!.state = 'chase';
        tick(5);
        const second = [...mines.mines.values()][0];
        assert.equal(mines.damage(second.id, ENEMY_MINES.hull - 1), null);
        assert.ok(mines.damage(second.id, 1));
        assert.equal(blasts, 1);
        tick(5);
        tick(0, [], 4000);
        assert.equal(mines.mines.size, 0);
        assert.equal(blasts, 1);
        tick(5);
        fleet.remove(2);
        tick(ENEMY_MINES.lifetime);
        assert.equal(mines.mines.size, 0);
    } finally {
        mines.clear();
        fleet.dispose();
        world.free();
    }
});

test('mine production respects per-layer limits, suppression and physical obstacles', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new EnemyFleet(world, [
        { id: 1, kind: 'minelayer', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
    ]);
    const mines = new EnemyMines(world),
        owner = fleet.enemies.get(1)!;
    const tick = (dt: number, obstacle?: RAPIER.Collider) =>
        mines.update(
            dt,
            fleet,
            850,
            [],
            (collider) => collider.handle === obstacle?.handle,
            () => assert.fail('unexpected blast'),
        );
    try {
        owner.state = 'chase';
        owner.weaponDisabled = 20;
        tick(10);
        assert.equal(mines.mines.size, 0);
        owner.weaponDisabled = 0;
        const wall = world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.5, 0.5).setTranslation(29.48, 0),
        );
        world.step();
        tick(5, wall);
        assert.equal(mines.mines.size, 0);
        world.removeCollider(wall, true);
        for (let index = 0; index < 4; index++) {
            owner.body.setTranslation({ x: 30 + index, y: 0 }, true);
            world.step();
            tick(5);
        }
        assert.equal(mines.mines.size, ENEMY_MINES.limitPerLayer);
        for (const mine of mines.mines.values()) mine.life = 100;
        owner.body.setTranslation({ x: 35, y: 0 }, true);
        world.step();
        tick(5);
        assert.equal(mines.mines.size, ENEMY_MINES.limitPerLayer);
        mines.clear();
        assert.equal(mines.colliders.size, 0);
    } finally {
        mines.clear();
        fleet.dispose();
        world.free();
    }
});

const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function mission(hull: HullId = 'prospector') {
    const campaign = newCampaign();
    campaign.ship!.hull = hull;
    const sim = new MissionSimulation(campaign, 71);
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    for (const enemy of [...sim.enemies.enemies.values()]) sim.enemies.remove(enemy.id);
    return sim;
}
function lay(sim: MissionSimulation) {
    sim.enemies.add([
        { id: 9999, kind: 'minelayer', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
    ]);
    sim.enemies.enemies.get(9999)!.state = 'chase';
    sim.world.step();
    sim.mines.update(
        5,
        sim.enemies,
        sim.stationSafeRadius,
        [],
        () => false,
        () => assert.fail('unexpected detonation'),
    );
    sim.enemies.remove(9999);
    return [...sim.mines.mines.values()][0];
}

test('real hostile mine arms near a ship, damages its kinetic shield and hull exactly once, and can instead be shot safely', () => {
    for (const defuse of [false, true]) {
        const sim = mission();
        try {
            const mine = lay(sim);
            sim.ship.setTranslation({ x: mine.x / 100, y: 0 }, true);
            sim.kineticShield.charge = 10;
            sim.kineticShield.cooldown = 100;
            const hull = sim.hull;
            if (defuse) {
                sim.bullets.set(99999, {
                    id: 99999,
                    x: mine.x + 100,
                    y: 0,
                    vx: -12000,
                    vy: 0,
                    damage: 18,
                    team: 'player',
                    life: 1,
                });
            }
            for (let frame = 0; frame < 120; frame++) sim.step(idle);
            assert.equal(sim.mines.mines.size, 0);
            assert.equal(sim.hull, defuse ? hull : hull - (ENEMY_MINES.damage - 10));
            assert.equal(
                sim.events.filter((event) => event.kind === 'explosion').length,
                defuse ? 0 : 1,
            );
        } finally {
            sim.dispose();
        }
    }
});

test('heavy pressure fires a charged three-shot fan while interception anticipates lateral motion', () => {
    const sim = mission();
    try {
        sim.ship.setTranslation({ x: 35, y: 0 }, true);
        sim.enemies.add([
            { id: 9999, kind: 'heavy', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
        ]);
        const heavy = sim.enemies.enemies.get(9999)!;
        heavy.state = 'chase';
        heavy.charge = heavy.config.windup;
        sim.step(idle);
        const shots = [...sim.bullets.values()].filter((bullet) => bullet.shooterId === 9999);
        assert.equal(shots.length, 3);
        assert.equal(new Set(shots.map((shot) => Math.atan2(shot.vy, shot.vx).toFixed(2))).size, 3);
        sim.enemies.remove(9999);
        sim.enemies.add([
            { id: 10000, kind: 'interceptor', x: 3000, y: 0, home: { x: 3000, y: 0 }, phase: 0 },
        ]);
        const interceptor = sim.enemies.enemies.get(10000)!;
        sim.enemies.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 0 },
            () => false,
            () => false,
        );
        const withoutLead = interceptor.body.linvel().y;
        interceptor.body.setLinvel({ x: 0, y: 0 }, true);
        sim.enemies.update(
            GAME.step,
            { x: 3500, y: 0 },
            { x: 0, y: 300 },
            () => false,
            () => false,
        );
        assert.ok(interceptor.body.linvel().y > withoutLead);
    } finally {
        sim.dispose();
    }
});

test('lasers, explosive rounds, Harpoon jaws and phase blades safely defuse real mines', () => {
    for (const hull of ['prospector', 'atlas', 'harpoon', 'widmo'] as const) {
        const sim = mission(hull);
        try {
            const mine = lay(sim);
            sim.ship.setTranslation(
                {
                    x:
                        (mine.x - (hull === 'harpoon' ? 160 : hull === 'prospector' ? 180 : 220)) /
                        GAME.pixelsPerMeter,
                    y: 0,
                },
                true,
            );
            const input = {
                ...idle,
                target: { x: mine.x, y: mine.y },
                mine: hull === 'prospector' || hull === 'harpoon',
                fire: hull !== 'prospector',
            };
            if (hull === 'harpoon')
                for (let frame = 0; frame < 35; frame++) sim.step({ ...input, fire: false });
            for (let frame = 0; frame < 180 && sim.mines.mines.size; frame++) sim.step(input);
            assert.equal(sim.mines.mines.size, 0, hull);
            assert.ok(
                sim.events.some((event) => event.kind === 'break'),
                `${hull} must destroy, not expire the mine`,
            );
            assert.equal(
                sim.events.filter(
                    (event) =>
                        event.kind === 'explosion' && event.strength === ENEMY_MINES.blastRadius,
                ).length,
                0,
                hull,
            );
            assert.equal(sim.hull, sim.maxHull, hull);
        } finally {
            sim.dispose();
        }
    }
});

test('physical walls block both mine proximity detection and blast damage', () => {
    const sim = mission();
    try {
        const mine = lay(sim);
        sim.ship.setTranslation({ x: (mine.x + 80) / GAME.pixelsPerMeter, y: 0 }, true);
        sim.kineticShield.charge = 0;
        sim.kineticShield.cooldown = 100;
        const hull = sim.hull;
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.05, 1).setTranslation(
                (mine.x + 40) / GAME.pixelsPerMeter,
                0,
            ),
        );
        sim.fortressColliders.add(wall.handle);
        for (let frame = 0; frame < 110; frame++) sim.step(idle);
        assert.equal(sim.mines.mines.size, 1);
        assert.equal(sim.hull, hull);
        sim.salvage.add(9998, 'patrol', { x: mine.x, y: mine.y + 25 }, { x: 0, y: 0 });
        sim.step(idle);
        assert.equal(sim.mines.mines.size, 0);
        assert.equal(sim.hull, hull);
        assert.equal(sim.events.filter((event) => event.kind === 'explosion').length, 1);
    } finally {
        sim.dispose();
    }
});

test('mixed sandbox exposes all four roles with four real kills and a return required; silhouettes are distinct', () => {
    const run = new SandboxRun({
        ...defaultSandboxConfig(),
        scenario: 'combinedArms',
        hull: 'fighter',
    });
    try {
        assert.deepEqual(
            new Set([...run.simulation.enemies.enemies.values()].map((enemy) => enemy.kind)),
            new Set(['interceptor', 'heavy', 'support', 'minelayer']),
        );
        assert.equal(run.objectives().find((goal) => goal.id === 'kills')?.progress, '0/4');
        assert.equal(run.report('stopped').completed, false);
        const dimensions = [];
        for (const kind of ['interceptor', 'heavy', 'support', 'minelayer'] as const) {
            const view = new DroneView(kind);
            try {
                assert.ok(view.width > 30 && view.height > 20);
                dimensions.push(`${view.width}:${view.height}`);
            } finally {
                view.destroy({ children: true });
            }
        }
        assert.equal(new Set(dimensions).size, 4);
    } finally {
        run.simulation.dispose();
    }
});

test('factory cycles all roles without increasing its live cap or generating loot-farm units', () => {
    const world = new RAPIER.World({ x: 0, y: 0 }),
        fleet = new EnemyFleet(world, []),
        factory = new EnemyFactory(world);
    const kinds = new Set<string>();
    try {
        for (let index = 0; index < ENEMY_FACTORY.roster.length; index++) {
            factory.update(20, ENEMY_FACTORY.position, fleet, () => false);
            const enemy = [...fleet.enemies.values()][0];
            assert.ok(enemy.factorySpawn);
            kinds.add(enemy.kind);
            fleet.remove(enemy.id);
        }
        assert.deepEqual(kinds, new Set(ENEMY_FACTORY.roster));
        assert.equal(ENEMY_FACTORY.limit, 4);
    } finally {
        fleet.dispose();
        world.free();
    }
});
