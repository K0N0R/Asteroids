import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    ATLAS_WEAPONS,
    AEGIS,
    HULLS,
    GAME,
    JOBS,
    WIDMO,
    STINGER_AMMO,
    PHOENIX,
    HullId,
    FLEET_LIMIT,
    shipUpgradeDefinition,
} from '../frontend/game/config';
import {
    newCampaign,
    newShip,
    parseCampaign,
    buyShip,
    buyUpgrade,
    scrapRefund,
    beginRun,
} from '../frontend/game/state/campaign';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import { GripperSystem, Resource } from '../frontend/game/systems/grippers';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { flightHint } from '../frontend/game/ui/missionReadout';
import { HarpoonArms, HARPOON_ARMS } from '../frontend/game/systems/harpoonArms';
import { equipWeapon } from '../frontend/game/state/weapons';
import { AegisSupport } from '../frontend/game/systems/aegisSupport';
import { selectContract } from '../frontend/game/state/contracts';
import { salvagePosition } from '../frontend/game/systems/salvage';
before(async () => {
    await RAPIER.init();
});
test('Phoenix purchase preserves a central laser, two short grabbers and medium cargo in saves', () => {
    const campaign = newCampaign();
    campaign.bank = { ore: HULLS.phoenix.ore, parts: HULLS.phoenix.parts };
    campaign.station.workshop = 1;
    assert.equal(buyShip(campaign, 'phoenix'), false);
    assert.deepEqual(campaign.bank, { ore: HULLS.phoenix.ore, parts: HULLS.phoenix.parts });
    campaign.station.workshop = 2;
    assert.ok(buyShip(campaign, 'phoenix'));
    assert.deepEqual(campaign.bank, { ore: 0, parts: 0 });
    assert.deepEqual(parseCampaign(JSON.stringify(campaign)), campaign);
    assert.deepEqual(HULLS.phoenix.lasers, [{ x: 42, y: 0 }]);
    assert.equal(HULLS.phoenix.grabbers.length, 2);
    assert.equal(HULLS.phoenix.grabberRange, 140);
    assert.equal(HULLS.phoenix.cargo, 55);
});
function phoenixArena() {
    const campaign = newCampaign();
    campaign.ship!.hull = 'phoenix';
    const sim = new MissionSimulation(campaign, 71);
    clean(sim, true);
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return sim;
}
test('Phoenix combat laser burns without stacking, continues after release and expires', () => {
    const sim = phoenixArena();
    try {
        sim.enemies.add([
            { id: 990, kind: 'lancer', x: 3400, y: 0, home: { x: 3400, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(990)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        sim.step({ ...idle, fire: true });
        assert.equal(sim.bullets.size, 0);
        assert.equal(sim.laserBeams.length, 1);
        assert.ok(Math.abs(enemy.health - (90 - PHOENIX.laserDamage * GAME.step)) < 1e-8);
        assert.equal(sim.burning.size, 1);
        for (let frame = 0; frame < 10; frame++) sim.step({ ...idle, fire: true });
        assert.equal(sim.burning.size, 1);
        assert.equal(sim.burning.get(990)!.remaining, PHOENIX.burnSeconds);
        const health = enemy.health;
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.ok(Math.abs(health - enemy.health - PHOENIX.burnDamage) < 1e-8);
        assert.equal(sim.laserBeams.length, 0);
        for (let frame = 0; frame < 130; frame++) sim.step(idle);
        assert.equal(sim.burning.size, 0);
        assert.ok(
            Math.abs(health - enemy.health - PHOENIX.burnDamage * PHOENIX.burnSeconds) < 1e-8,
        );
    } finally {
        sim.dispose();
    }
});
test('Phoenix burn kills once, releases loot or a wreck and clears the effect', () => {
    const sim = phoenixArena();
    try {
        sim.enemies.add([
            { id: 991, kind: 'patrol', x: 3400, y: 0, home: { x: 3400, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(991)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        enemy.health = PHOENIX.laserDamage * GAME.step + (PHOENIX.burnDamage * GAME.step) / 2;
        sim.step({ ...idle, fire: true });
        assert.equal(sim.enemyKills, 0);
        sim.step(idle);
        assert.equal(sim.enemyKills, 1);
        assert.equal(sim.burning.size, 0);
        assert.ok(sim.loot.size > 0 || sim.salvage.items.size > 0);
        sim.step(idle);
        assert.equal(sim.enemyKills, 1);
    } finally {
        sim.dispose();
    }
});
test('Phoenix PPM launches Atlas rockets and shares three-second locking and target-death cleanup', () => {
    const sim = phoenixArena();
    try {
        sim.enemies.add([
            { id: 992, kind: 'lancer', x: 3600, y: 0, home: { x: 3600, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(992)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        const target = { x: 3600, y: 0 };
        for (let frame = 0; frame < 179; frame++) sim.step({ ...idle, target });
        assert.equal(sim.atlasLock.locked, null);
        sim.step({ ...idle, target });
        assert.equal(sim.atlasLock.locked, 992);
        sim.step({ ...idle, target: { x: 2000, y: 0 }, mine: true });
        assert.equal(sim.laserBeams.length, 0);
        assert.equal(sim.bullets.size, 1);
        const rocket = [...sim.bullets.values()][0];
        assert.equal(rocket.explosive, 'rocket');
        assert.equal(rocket.damage, ATLAS_WEAPONS.rocket.damage);
        assert.equal(rocket.targetId, 992);
        assert.ok(rocket.vx < 0);
        for (let frame = 0; frame < 30; frame++) sim.step({ ...idle, target });
        assert.ok(Math.abs(rocket.vy) > 1);
        sim.enemies.damage(992, 10000);
        sim.step(idle);
        assert.equal(sim.atlasLock.locked, null);
        assert.equal(rocket.targetId, undefined);
    } finally {
        sim.dispose();
    }
});
test('Phoenix beam stops at rocks and walls, mines normal loot and its short grabbers collect cargo', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'phoenix';
    const sim = new MissionSimulation(campaign, 71);
    try {
        const rock = [...sim.rocks.values()].find((item) => item.radius < 40)!;
        for (const item of [...sim.rocks.values()])
            if (item !== rock) {
                sim.world.removeRigidBody(item.body);
                sim.rocks.delete(item.id);
            }
        for (const enemy of [...sim.enemies.enemies.values()]) sim.enemies.damage(enemy.id, 10000);
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        rock.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        rock.body.setTranslation({ x: 32, y: 0 }, true);
        rock.health = 100;
        sim.enemies.add([
            { id: 993, kind: 'lancer', x: 3400, y: 0, home: { x: 3400, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(993)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        enemy.cooldown = 1000;
        sim.step({ ...idle, fire: true });
        assert.ok(Math.abs(100 - rock.health - PHOENIX.rockDamage * GAME.step) < 1e-8);
        assert.equal(enemy.health, 90);
        assert.equal(sim.burning.size, 0);
        assert.ok(sim.laserBeams[0].to.x < 3200);
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.1, 1).setTranslation(31, 0),
        );
        sim.fortressColliders.add(wall.handle);
        const health = rock.health;
        sim.step({ ...idle, fire: true });
        assert.equal(rock.health, health);
        sim.fortressColliders.delete(wall.handle);
        sim.world.removeCollider(wall, true);
        rock.health = 0.1;
        sim.step({ ...idle, fire: true });
        assert.equal(sim.rocks.has(rock.id), false);
        assert.ok(sim.loot.size > 0);
        sim.loot.clear();
        sim.loot.set(9990, { id: 9990, x: 3010, y: 40, kind: 'ore', amount: 1 });
        sim.loot.set(9991, { id: 9991, x: 3010, y: -40, kind: 'parts', amount: 1 });
        for (let frame = 0; frame < 120; frame++) sim.step(idle);
        assert.equal(sim.cargo.ore, 1);
        assert.equal(sim.cargo.parts, 1);
    } finally {
        sim.dispose();
    }
});
test('Phoenix saved projector and rocket upgrades affect both weapons and completed runs freeze burns', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'phoenix';
    campaign.station.workshop = 2;
    campaign.bank = { ore: 80, parts: 40, crystals: 3 };
    assert.ok(buyUpgrade(campaign, 'drill'));
    assert.ok(buyUpgrade(campaign, 'drill'));
    assert.ok(buyUpgrade(campaign, 'handling'));
    const loaded = parseCampaign(JSON.stringify(campaign))!;
    assert.ok(loaded);
    assert.equal(equipWeapon(loaded, 'rail'), false);
    assert.equal(shipUpgradeDefinition('phoenix', 'drill').title, 'Projektor bojowy');
    const sim = new MissionSimulation(loaded, 71);
    try {
        clean(sim, true);
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        sim.enemies.add([
            { id: 994, kind: 'lancer', x: 3400, y: 0, home: { x: 3400, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(994)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        sim.step({ ...idle, fire: true, mine: true });
        assert.equal(sim.laserBeams.length, 1);
        assert.equal(sim.bullets.size, 1);
        assert.equal(sim.burning.get(994)!.damage, PHOENIX.burnDamage * 1.5);
        assert.ok(Math.abs(90 - enemy.health - PHOENIX.laserDamage * 1.5 * GAME.step) < 1e-8);
        assert.equal([...sim.bullets.values()][0].damage, ATLAS_WEAPONS.rocket.damage * 1.25);
        const remaining = sim.burning.get(994)!.remaining;
        const health = enemy.health;
        sim.ended = 'returned';
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.equal(enemy.health, health);
        assert.equal(sim.burning.get(994)!.remaining, remaining);
    } finally {
        sim.dispose();
        assert.equal(sim.burning.size, 0);
    }
});
test('Stinger requires workshop II, persists its identity and fires four guns without a laser', () => {
    const campaign = newCampaign();
    campaign.bank = { ore: HULLS.stinger.ore, parts: HULLS.stinger.parts };
    campaign.station.workshop = 1;
    assert.equal(buyShip(campaign, 'stinger'), false);
    assert.deepEqual(campaign.bank, { ore: HULLS.stinger.ore, parts: HULLS.stinger.parts });
    campaign.station.workshop = 2;
    assert.equal(buyShip(campaign, 'stinger'), true);
    assert.deepEqual(campaign.bank, { ore: 0, parts: 0 });
    assert.deepEqual(parseCampaign(JSON.stringify(campaign)), campaign);
    campaign.ship!.hull = 'stinger';
    const sim = new MissionSimulation(campaign, 71);
    try {
        clean(sim);
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        sim.step({ ...idle, fire: true });
        assert.equal(sim.bullets.size, 4);
        assert.ok([...sim.bullets.values()].every((bullet) => bullet.stingerAmmo === 'light'));
        assert.equal(new Set([...sim.bullets.values()].map((bullet) => bullet.y)).size, 4);
        assert.equal(sim.laserBeams.length, 0);
        assert.ok(HULLS.stinger.maxSpeed > HULLS.swift.maxSpeed);
        assert.ok(HULLS.stinger.turnSpeed > HULLS.swift.turnSpeed);
        assert.ok(HULLS.stinger.shield.capacity < HULLS.fighter.shield.capacity);
        assert.ok(HULLS.stinger.cargo < HULLS.swift.cargo);
        assert.equal(HULLS.stinger.cloak, 0);
        assert.equal(equipWeapon(campaign, 'rail'), false);
        assert.equal(shipUpgradeDefinition('stinger', 'drill').title, 'Układ amunicji');
    } finally {
        sim.dispose();
    }
});
test('Stinger ammunition favors light patrols or armored Lancers and PPM wins combined input', () => {
    for (const mode of ['light', 'armor'] as const) {
        const campaign = newCampaign();
        campaign.ship!.hull = 'stinger';
        const sim = new MissionSimulation(campaign, 71);
        try {
            clean(sim, true);
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            sim.step({ ...idle, fire: true, mine: mode === 'armor' });
            assert.equal(sim.bullets.size, 4);
            assert.ok([...sim.bullets.values()].every((bullet) => bullet.stingerAmmo === mode));
            assert.equal(sim.laserBeams.length, 0);
            sim.bullets.clear();
            for (const [index, kind] of ['patrol', 'lancer'].entries()) {
                const id = 990 + index;
                const enemyKind = kind as 'patrol' | 'lancer';
                sim.enemies.add([
                    {
                        id,
                        kind: enemyKind,
                        x: 3400,
                        y: index * 200,
                        home: { x: 3400, y: index * 200 },
                        phase: 0,
                    },
                ]);
                const enemy = sim.enemies.enemies.get(id)!;
                enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
                const health = enemy.health;
                sim.bullets.set(id, {
                    id,
                    x: 3350,
                    y: index * 200,
                    vx: 3000,
                    vy: 0,
                    life: 1,
                    team: 'player',
                    damage: STINGER_AMMO[mode].damage,
                    stingerAmmo: mode,
                });
                sim.step(idle);
                assert.ok(
                    Math.abs(
                        health -
                            enemy.health -
                            STINGER_AMMO[mode].damage * STINGER_AMMO[mode][enemyKind],
                    ) < 1e-8,
                );
            }
        } finally {
            sim.dispose();
        }
    }
});
test('Stinger saved ammunition upgrades boost both modes and held buttons respect their shared cycle', () => {
    for (const mode of ['light', 'armor'] as const) {
        const campaign = newCampaign();
        campaign.ship!.hull = 'stinger';
        campaign.ship!.drill = 2;
        const loaded = parseCampaign(JSON.stringify(campaign))!;
        const sim = new MissionSimulation(loaded, 71);
        try {
            clean(sim);
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            const input = { ...idle, fire: mode === 'light', mine: mode === 'armor' };
            sim.step(input);
            assert.equal(sim.bullets.size, 4);
            assert.ok(
                [...sim.bullets.values()].every(
                    (bullet) => bullet.damage === STINGER_AMMO[mode].damage * 1.5,
                ),
            );
            sim.bullets.clear();
            sim.step({ ...idle, fire: true, mine: true });
            assert.equal(sim.bullets.size, 0);
            for (let frame = 0; frame < Math.ceil(STINGER_AMMO[mode].interval / GAME.step); frame++)
                sim.step(idle);
            sim.step(input);
            assert.equal(sim.bullets.size, 4);
            assert.equal(sim.laserBeams.length, 0);
        } finally {
            sim.dispose();
        }
    }
});
test('Aegis support shields absorb damage temporarily, enforce cooldown and rebuild a destroyed drone', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    try {
        const support = new AegisSupport(world, 1, 1);
        support.rebuild({ x: 3000, y: 0 });
        assert.equal(support.drone!.hull, 62.5);
        assert.equal(support.droneDamage, 15);
        assert.ok(
            support.pulse({ x: 3000, y: 0 }, [
                { id: 'drone', x: 3110, y: 0 },
                { id: 'far', x: 4000, y: 0 },
            ]),
        );
        assert.equal(support.absorb('drone', 50), 0);
        assert.equal(support.absorb('far', 50), 50);
        assert.equal(support.pulse({ x: 3000, y: 0 }, []), false);
        support.update(6.1, { x: 3000, y: 0 });
        assert.equal(support.shields.size, 0);
        assert.equal(support.damageDrone(100), true);
        assert.equal(support.drone, null);
        assert.equal(support.rebuild({ x: 3000, y: 0 }), true);
        assert.equal(support.rebuild({ x: 3000, y: 0 }), false);
        support.dispose();
        assert.equal(support.drone, null);
        assert.equal(world.colliders.len(), 0);
    } finally {
        world.free();
    }
});
test('Harpoon articulated jaws extend toward aim, fold to attached shoulders and strike once per click', () => {
    const arms = new HarpoonArms();
    const target = { x: 150, y: 0 };
    assert.deepEqual(
        arms.poses.map((arm) => arm.shoulder),
        [
            { x: 8, y: -18 },
            { x: 8, y: 18 },
        ],
    );
    assert.deepEqual(
        arms.poses.map((arm) => [arm.elbow, arm.tip, arm.angle]),
        [
            [{ x: -14, y: -32 }, { x: 12, y: -40 }, 0],
            [{ x: -14, y: 32 }, { x: 12, y: 40 }, 0],
        ],
    );
    for (let frame = 0; frame < 60; frame++) arms.update(GAME.step, target, true, false);
    assert.equal(arms.extension, 1);
    assert.ok(arms.poses.every((arm) => arm.tip.x === HARPOON_ARMS.reach));
    let strikes = 0;
    for (let frame = 0; frame < 120; frame++)
        if (arms.update(GAME.step, target, true, true)) strikes++;
    assert.equal(strikes, 1);
    arms.update(GAME.step, target, true, false);
    for (let frame = 0; frame < 60; frame++)
        if (arms.update(GAME.step, target, true, true)) strikes++;
    assert.equal(strikes, 2);
    for (let frame = 0; frame < 60; frame++) arms.update(GAME.step, target, false, false);
    assert.equal(arms.extension, 0);
    const upgraded = new HarpoonArms(2, 2);
    assert.ok(upgraded.reach > arms.reach);
    assert.equal(upgraded.damageMultiplier, 1.5);
});
test('Harpoon rear aiming preserves arm sides throughout extension and retraction', () => {
    for (const target of [
        { x: -150, y: 0 },
        { x: -150, y: -60 },
        { x: -150, y: 60 },
    ]) {
        const arms = new HarpoonArms();
        for (const extend of [true, false])
            for (let frame = 0; frame < 60; frame++) {
                arms.update(GAME.step, target, extend, false);
                const [left, right] = arms.poses;
                assert.ok(left.tip.y < right.tip.y);
                assert.ok(left.elbow.y < right.elbow.y);
                for (let sample = 0; sample <= 10; sample++) {
                    const t = sample / 10;
                    for (const [start, end] of [
                        ['shoulder', 'elbow'],
                        ['elbow', 'tip'],
                    ] as const)
                        assert.ok(
                            left[start].y * (1 - t) + left[end].y * t <
                                right[start].y * (1 - t) + right[end].y * t,
                        );
                }
            }
    }
});
test('Harpoon jaws close rapidly and reopen within a shortened attack cycle', () => {
    const arms = new HarpoonArms();
    const target = { x: 150, y: 0 };
    assert.ok(HARPOON_ARMS.jawOpen > 12);
    assert.ok(HARPOON_ARMS.rockDamage > 28);
    assert.ok(HARPOON_ARMS.shipDamage > 65);
    assert.equal(arms.update(HARPOON_ARMS.contactTime / 2, target, true, true), false);
    assert.equal(arms.closure, 0.5);
    assert.equal(arms.update(HARPOON_ARMS.contactTime / 2, target, true, true), true);
    assert.equal(arms.closure, 1);
    assert.equal(arms.update(HARPOON_ARMS.releaseTime, target, true, true), false);
    assert.ok(arms.closure < 1e-8);
    arms.update(HARPOON_ARMS.cycle, target, true, false);
    assert.equal(arms.update(HARPOON_ARMS.contactTime, target, true, true), true);
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function clean(sim: MissionSimulation, keepEnemySystem = false) {
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    if (keepEnemySystem)
        for (const enemy of [...sim.enemies.enemies.values()]) sim.enemies.damage(enemy.id, 10000);
    else sim.enemies.dispose();
}
function harpoonArena() {
    const campaign = newCampaign();
    campaign.ship!.hull = 'harpoon';
    const sim = new MissionSimulation(campaign, 71);
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return sim;
}
const armInput: FlightInput = { ...idle, target: { x: 3200, y: 0 }, mine: true };
function aegisArena(escort = false) {
    const campaign = newCampaign();
    campaign.ship!.hull = 'aegis';
    if (escort) {
        campaign.contractCompletions[2] = 1;
        campaign.station.workshop = 2;
        campaign.recovered = 1;
        assert.ok(selectContract(campaign, 7));
        beginRun(campaign, 71);
    }
    const sim = new MissionSimulation(campaign, 71);
    clean(sim, true);
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    sim.aegis!.drone!.body.setTranslation({ x: 31.1, y: 0 }, true);
    return sim;
}
test('Aegis drone stays neutral, then retaliates only against a target hit by the energy cannon', () => {
    const sim = aegisArena();
    try {
        const target = atlasEnemy(sim, 999, 3400, 0);
        const neutral = atlasEnemy(sim, 998, 3400, 180);
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.equal(sim.bullets.size, 0);
        assert.equal(sim.aegis!.hostiles.size, 0);
        sim.step({ ...idle, target: { x: 3400, y: 0 }, fire: true });
        assert.ok([...sim.bullets.values()].some((bullet) => bullet.energy));
        for (let frame = 0; frame < 35; frame++) sim.step(idle);
        assert.ok(target.weaponDisabled! > 0);
        assert.equal(target.health, 500 - AEGIS.damage);
        assert.ok(sim.aegis!.hostiles.has(999));
        assert.equal(sim.aegis!.hostiles.has(998), false);
        assert.equal(neutral.health, 500);
        assert.ok([...sim.bullets.values()].some((bullet) => bullet.source === 'drone'));
        assert.equal(sim.laserBeams.length, 0);
    } finally {
        sim.dispose();
    }
});
test('Aegis suppression stops actual enemy firing temporarily and hostile fire engages the helper', () => {
    const sim = aegisArena();
    try {
        const enemy = atlasEnemy(sim, 999, 3300, 0);
        enemy.cooldown = 0;
        enemy.body.setRotation(Math.PI, true);
        enemy.weaponDisabled = 0.6;
        for (let frame = 0; frame < 25; frame++) sim.step(idle);
        assert.equal(
            [...sim.bullets.values()].filter((bullet) => bullet.team === 'enemy').length,
            0,
        );
        assert.equal(sim.aegis!.hostiles.size, 0);
        for (let frame = 0; frame < Math.ceil((enemy.config.windup + 1) / GAME.step); frame++)
            sim.step(idle);
        assert.ok(sim.aegis!.hostiles.has(999));
        assert.ok(
            enemy.health < 500 ||
                [...sim.bullets.values()].some((bullet) => bullet.source === 'drone'),
        );
    } finally {
        sim.dispose();
    }
});
test('Aegis pulse refills the mother, shields allies in range, expires and cannot repeat while held', () => {
    const sim = aegisArena(true);
    try {
        const escort = sim.escort!;
        escort.state = 'travel';
        escort.ambushed = true;
        escort.body.setTranslation({ x: 30, y: 2 }, true);
        const wreck = sim.salvage.add(999, 'patrol', { x: 3000, y: -200 }, { x: 0, y: 0 })!;
        sim.salvage.attach(wreck, sim.ship);
        const far = sim.salvage.add(998, 'patrol', { x: 4000, y: 0 }, { x: 0, y: 0 })!;
        sim.kineticShield.charge = 0;
        sim.step({ ...idle, mine: true });
        assert.equal(sim.kineticShield.charge, sim.kineticShield.profile.capacity);
        for (const id of ['player', 'drone', 'escort', `salvage:${wreck.id}`])
            assert.ok(sim.aegis!.shields.has(id));
        assert.equal(sim.aegis!.shields.has(`salvage:${far.id}`), false);
        const escortHull = escort.health,
            wreckHull = wreck.health;
        for (const [id, position] of [
            [910, escort.position],
            [911, salvagePosition(wreck)],
        ] as const)
            sim.bullets.set(id, {
                id,
                ...position,
                vx: 0,
                vy: 0,
                life: 1,
                team: 'enemy',
                damage: 30,
            });
        sim.step({ ...idle, mine: true });
        assert.equal(escort.health, escortHull);
        assert.equal(wreck.health, wreckHull);
        sim.kineticShield.charge = 30;
        sim.step({ ...idle, mine: true });
        assert.ok(sim.kineticShield.charge < 31);
        for (let frame = 0; frame < 365; frame++) sim.step(idle);
        assert.equal(sim.aegis!.shields.size, 0);
        assert.ok(sim.aegis!.cooldown > 0);
    } finally {
        sim.dispose();
    }
});
test('Aegis helper takes real projectile damage, temporary shields protect it and repair kits rebuild it', () => {
    const sim = aegisArena();
    try {
        sim.step({ ...idle, mine: true });
        let position = sim.aegis!.dronePosition!;
        sim.bullets.set(910, {
            id: 910,
            ...position,
            vx: 0,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 30,
        });
        sim.step(idle);
        assert.equal(sim.aegis!.drone!.hull, AEGIS.droneHull);
        position = sim.aegis!.dronePosition!;
        sim.bullets.set(911, {
            id: 911,
            ...position,
            vx: 0,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 200,
        });
        sim.step(idle);
        assert.equal(sim.aegis!.drone, null);
        assert.equal(sim.aegis!.shields.has('drone'), false);
        for (let frame = 0; frame < 310; frame++) sim.step({ ...idle, repair: true });
        assert.equal(sim.aegis!.drone, null);
        sim.repairKits = 1;
        for (let frame = 0; frame < 100; frame++) sim.step({ ...idle, repair: true });
        sim.step({ ...idle, repair: true, fire: true });
        assert.equal(sim.repairProgress, 0);
        for (let frame = 0; frame < 310; frame++) sim.step({ ...idle, repair: true });
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.aegis!.drone!.hull, AEGIS.droneHull);
        assert.equal(sim.hull, sim.maxHull);
    } finally {
        sim.dispose();
    }
});
test('Aegis specialized upgrades survive saves and strengthen energy shots, drone and pulse', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'aegis';
    campaign.station.workshop = 2;
    campaign.station.storage = 3;
    campaign.bank = { ore: 350, parts: 40, crystals: 20 };
    for (const upgrade of ['drill', 'handling', 'shield'] as const)
        assert.ok(buyUpgrade(campaign, upgrade));
    assert.deepEqual(parseCampaign(JSON.stringify(campaign)), campaign);
    assert.equal(equipWeapon(campaign, 'rail'), false);
    const sim = new MissionSimulation(campaign, 71);
    try {
        assert.equal(sim.energyDamage, AEGIS.damage * 1.25);
        assert.equal(sim.aegis!.droneDamage, AEGIS.droneDamage * 1.25);
        assert.equal(sim.aegis!.drone!.hull, AEGIS.droneHull * 1.25);
        assert.equal(sim.aegis!.pulseCooldown, AEGIS.cooldown / 1.2);
    } finally {
        sim.dispose();
    }
});
test('Aegis energy cannon damages rocks more than ordinary bullets and collects normal loot', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'aegis';
    campaign.ship!.drill = 1;
    const sim = new MissionSimulation(campaign, 71);
    try {
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        sim.aegis!.drone!.body.setTranslation({ x: 31.1, y: 0 }, true);
        sim.enemies.dispose();
        const rock = [...sim.rocks.values()].find((rock) => rock.radius > 25 && rock.radius < 40)!;
        for (const other of [...sim.rocks.values()])
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        rock.orbit = undefined;
        rock.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        rock.body.setTranslation({ x: 34, y: 0 }, true);
        rock.health = 100;
        const fire = { ...idle, target: { x: 3400, y: 0 }, fire: true };
        sim.step(fire);
        for (let frame = 0; frame < 40; frame++) sim.step(idle);
        const damage = AEGIS.rockDamage * 1.25 * sim.pilot.mining;
        assert.ok(damage > GAME.shotRockDamage);
        assert.ok(Math.abs(rock.health - (100 - damage)) < 1e-8);
        rock.health = 1;
        sim.step(fire);
        for (let frame = 0; frame < 100; frame++) sim.step(idle);
        assert.equal(sim.rocks.has(rock.id), false);
        assert.ok(
            sim.cargoUsed > 0 || sim.loot.size > 0 || sim.grippers.arms.some((arm) => arm.held),
        );
    } finally {
        sim.dispose();
    }
});
test('Aegis pulse absorbs mother damage, pauses with the mission and is reusable after cooldown', () => {
    const sim = aegisArena();
    try {
        sim.kineticShield.charge = 20;
        sim.step({ ...idle, mine: true });
        const full = sim.kineticShield.charge;
        sim.bullets.set(910, {
            id: 910,
            x: 3060,
            y: 0,
            vx: -300,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 40,
        });
        for (let frame = 0; frame < 5; frame++) sim.step(idle);
        assert.equal(sim.kineticShield.charge, full);
        assert.equal(sim.hull, sim.maxHull);
        assert.equal(sim.aegis!.shields.get('player')!.charge, AEGIS.buffer - 40);
        const cooldown = sim.aegis!.cooldown,
            position = sim.aegis!.dronePosition;
        sim.ended = 'returned';
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.equal(sim.aegis!.cooldown, cooldown);
        assert.deepEqual(sim.aegis!.dronePosition, position);
        sim.ended = null;
        for (let frame = 0; frame < 1100; frame++) sim.step(idle);
        assert.equal(sim.aegis!.cooldown, 0);
        sim.kineticShield.charge = 0;
        sim.step({ ...idle, mine: true });
        assert.equal(sim.kineticShield.charge, full);
        assert.ok(sim.aegis!.cooldown > 0);
    } finally {
        sim.dispose();
    }
});
function atlasArena() {
    const campaign = newCampaign();
    campaign.ship!.hull = 'atlas';
    const sim = new MissionSimulation(campaign, 71);
    clean(sim, true);
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return sim;
}
function atlasEnemy(sim: MissionSimulation, id: number, x: number, y: number) {
    sim.enemies.add([{ id, x, y, kind: 'lancer', home: { x, y }, phase: 0 }]);
    const enemy = sim.enemies.enemies.get(id)!;
    enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
    enemy.cooldown = 999;
    enemy.health = 500;
    return enemy;
}
test('Atlas locks after continuous three-second hover and steers a rocket launched away from the target', () => {
    const sim = atlasArena();
    try {
        atlasEnemy(sim, 999, 3500, 0);
        const target = { x: 3500, y: 0 };
        for (let frame = 0; frame < 179; frame++) sim.step({ ...idle, target });
        assert.equal(sim.atlasLock.locked, null);
        sim.step({ ...idle, target });
        assert.equal(sim.atlasLock.locked, 999);
        sim.step({ ...idle, target: { x: 3000, y: -1000 }, fire: true });
        const rocket = [...sim.bullets.values()].find((bullet) => bullet.explosive === 'rocket')!;
        assert.equal(rocket.targetId, 999);
        for (let frame = 0; frame < 70; frame++) sim.step(idle);
        assert.ok(rocket.vx > 0);
        assert.ok(rocket.vy > 0);
        sim.enemies.damage(999, 10000);
        sim.step(idle);
        assert.equal(sim.atlasLock.locked, null);
        assert.equal(sim.atlasLock.target, null);
        assert.equal(sim.atlasLock.progress, 0);
        assert.equal(rocket.targetId, undefined);
    } finally {
        sim.dispose();
    }
});
test('Atlas rockets launched backwards reach the lock and its death clears other guided rockets', () => {
    const sim = atlasArena();
    try {
        const target = atlasEnemy(sim, 999, 3500, 0);
        target.health = ATLAS_WEAPONS.rocket.damage;
        const hover = { ...idle, target: { x: 3500, y: 0 } };
        for (let frame = 0; frame < 180; frame++) sim.step(hover);
        sim.step({ ...idle, target: { x: 2000, y: 0 }, fire: true });
        for (let frame = 0; frame < 110; frame++) sim.step(idle);
        assert.equal(sim.enemies.enemies.has(999), true);
        sim.step({ ...idle, target: { x: 2000, y: 0 }, fire: true });
        const rockets = [...sim.bullets.values()].filter((bullet) => bullet.explosive === 'rocket');
        assert.equal(rockets.length, 2);
        for (let frame = 0; frame < 600 && sim.enemies.enemies.has(999); frame++) sim.step(idle);
        assert.equal(sim.enemyKills, 1);
        assert.equal(sim.atlasLock.locked, null);
        assert.ok([...sim.bullets.values()].every((bullet) => bullet.targetId === undefined));
    } finally {
        sim.dispose();
    }
});
test('Atlas rockets apply splash once to nearby ships and grenades detonate quickly without laser beams', () => {
    const sim = atlasArena();
    try {
        const direct = atlasEnemy(sim, 999, 3400, 0);
        const nearby = atlasEnemy(sim, 998, 3400, 100);
        const distant = atlasEnemy(sim, 997, 3400, 300);
        sim.step({ ...idle, target: { x: 4000, y: 0 }, fire: true });
        for (let frame = 0; frame < 100; frame++) sim.step(idle);
        assert.equal(direct.health, 500 - ATLAS_WEAPONS.rocket.damage);
        assert.equal(nearby.health, 500 - ATLAS_WEAPONS.rocket.damage);
        assert.equal(distant.health, 500);
        sim.step({ ...idle, target: { x: 4000, y: 0 }, mine: true });
        assert.equal(sim.laserBeams.length, 0);
        for (let frame = 0; frame < 45; frame++) sim.step(idle);
        assert.equal(
            [...sim.bullets.values()].filter((bullet) => bullet.explosive === 'grenade').length,
            0,
        );
        assert.ok(
            sim.events.some(
                (event) =>
                    event.kind === 'explosion' && event.strength === ATLAS_WEAPONS.grenade.radius,
            ),
        );
    } finally {
        sim.dispose();
    }
});
test('Atlas hover interruptions and target death reset incomplete locks without granting guidance', () => {
    const sim = atlasArena();
    try {
        atlasEnemy(sim, 999, 3500, 0);
        atlasEnemy(sim, 998, 3500, 200);
        for (let frame = 0; frame < 100; frame++) sim.step({ ...idle, target: { x: 3500, y: 0 } });
        sim.step(idle);
        assert.equal(sim.atlasLock.progress, 0);
        for (let frame = 0; frame < 100; frame++) sim.step({ ...idle, target: { x: 3500, y: 0 } });
        sim.step({ ...idle, target: { x: 3500, y: 200 } });
        assert.equal(sim.atlasLock.target, 998);
        assert.equal(sim.atlasLock.progress, GAME.step);
        assert.equal(sim.atlasLock.locked, null);
        sim.enemies.damage(998, 10000);
        sim.step({ ...idle, target: { x: 3500, y: 200 }, fire: true });
        assert.equal(sim.atlasLock.progress, 0);
        const rocket = [...sim.bullets.values()].find((bullet) => bullet.explosive === 'rocket')!;
        assert.equal(rocket.targetId, undefined);
        assert.ok(rocket.life > 10);
        assert.ok(Math.abs(Math.hypot(rocket.vx, rocket.vy) - ATLAS_WEAPONS.rocket.speed) < 1e-8);
    } finally {
        sim.dispose();
    }
});
test('Atlas saved grenade upgrades launch symmetric cone salvos and block ordinary gun fitting', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'atlas';
    campaign.station.workshop = 2;
    campaign.station.storage = 3;
    campaign.bank = { ore: 300, parts: 80, crystals: 20 };
    for (let level = 0; level < 3; level++) assert.ok(buyUpgrade(campaign, 'drill'));
    assert.ok(buyUpgrade(campaign, 'handling'));
    assert.deepEqual(parseCampaign(JSON.stringify(campaign)), campaign);
    const bank = { ...campaign.bank };
    assert.equal(equipWeapon(campaign, 'rail'), false);
    assert.deepEqual(campaign.bank, bank);
    const sim = new MissionSimulation(campaign, 71);
    try {
        clean(sim, true);
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        sim.step({ ...idle, target: { x: 4000, y: 0 }, mine: true, fire: true });
        const grenades = [...sim.bullets.values()].filter(
            (bullet) => bullet.explosive === 'grenade',
        );
        assert.equal(grenades.length, 4);
        assert.ok(
            grenades[0].vy < grenades[1].vy &&
                grenades[1].vy < grenades[2].vy &&
                grenades[2].vy < grenades[3].vy,
        );
        assert.ok(Math.abs(grenades[0].vy + grenades[3].vy) < 1e-8);
        assert.equal(sim.rocketDamage, ATLAS_WEAPONS.rocket.damage * 1.25);
        assert.equal(sim.laserBeams.length, 0);
        assert.equal(sim.hull, sim.maxHull);
    } finally {
        sim.dispose();
    }
});
test('Atlas splash damages rocks and preserves normal breakup and resource collection', () => {
    for (const kind of ['rocket', 'grenade'] as const) {
        const campaign = newCampaign();
        campaign.ship!.hull = 'atlas';
        const sim = new MissionSimulation(campaign, 71);
        try {
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            sim.enemies.dispose();
            const rocks = [...sim.rocks.values()]
                .filter((rock) => rock.radius > 25 && rock.radius < 40)
                .slice(0, 2);
            assert.equal(rocks.length, 2);
            for (const rock of [...sim.rocks.values()])
                if (!rocks.includes(rock)) {
                    sim.world.removeRigidBody(rock.body);
                    sim.rocks.delete(rock.id);
                }
            for (const [index, rock] of rocks.entries()) {
                rock.orbit = undefined;
                rock.health = 1000;
                rock.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
                rock.body.setTranslation(
                    { x: kind === 'rocket' ? 34 : 33, y: index * (kind === 'rocket' ? 1 : 0.6) },
                    true,
                );
            }
            const input = {
                ...idle,
                target: { x: 4000, y: 0 },
                fire: kind === 'rocket',
                mine: kind === 'grenade',
            };
            sim.step(input);
            for (let frame = 0; frame < 120; frame++) sim.step(idle);
            for (const rock of rocks)
                assert.ok(
                    Math.abs(rock.health - (1000 - ATLAS_WEAPONS[kind].damage * sim.pilot.mining)) <
                        1e-8,
                );
            rocks[0].health = 1;
            sim.step(input);
            for (let frame = 0; frame < 120; frame++) sim.step(idle);
            assert.equal(sim.rocks.has(rocks[0].id), false);
            assert.ok(
                sim.cargoUsed > 0 || sim.loot.size > 0 || sim.grippers.arms.some((arm) => arm.held),
            );
        } finally {
            sim.dispose();
        }
    }
});
test('Atlas explosions are blocked by fortress walls and do not damage friendly hull or shield', () => {
    const sim = atlasArena();
    try {
        const enemy = atlasEnemy(sim, 999, 3220, 0);
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.1, 2).setTranslation(31.8, 0),
        );
        sim.fortressColliders.add(wall.handle);
        sim.step({ ...idle, target: { x: 4000, y: 0 }, mine: true });
        for (let frame = 0; frame < 45; frame++) sim.step(idle);
        assert.equal(enemy.health, 500);
        assert.equal(sim.hull, sim.maxHull);
        assert.equal(sim.kineticShield.charge, sim.kineticShield.profile.capacity);
    } finally {
        sim.dispose();
    }
});
function squeeze(sim: MissionSimulation) {
    sim.step(armInput);
    for (let frame = 0; frame < 34; frame++) sim.step({ ...armInput, fire: true });
}
test('Harpoon crushes rocks once per click without bullets or a mining beam and releases normal loot', () => {
    const sim = harpoonArena();
    try {
        sim.enemies.dispose();
        const rock = [...sim.rocks.values()].find((rock) => rock.radius > 25 && rock.radius < 40)!;
        for (const other of [...sim.rocks.values()])
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        rock.orbit = undefined;
        rock.body.setTranslation({ x: 31.6, y: 0 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        rock.health = 200;
        for (let frame = 0; frame < 60; frame++) sim.step(armInput);
        assert.equal(rock.health, 200);
        squeeze(sim);
        assert.ok(
            Math.abs(rock.health - (200 - HARPOON_ARMS.rockDamage * sim.pilot.mining)) < 1e-8,
        );
        for (let frame = 0; frame < 120; frame++) sim.step({ ...armInput, fire: true });
        assert.ok(
            Math.abs(rock.health - (200 - HARPOON_ARMS.rockDamage * sim.pilot.mining)) < 1e-8,
        );
        assert.equal(sim.bullets.size, 0);
        assert.equal(sim.laserBeams.length, 0);
        assert.equal(sim.hull, 110);
        assert.equal(sim.kineticShield.charge, 70);
        rock.health = 1;
        squeeze(sim);
        assert.equal(sim.rocks.has(rock.id), false);
        assert.ok(
            sim.loot.size > 0 || sim.cargoUsed > 0 || sim.grippers.arms.some((arm) => arm.held),
        );
    } finally {
        sim.dispose();
    }
});
test('Harpoon jaws deal high ship damage, count kills once and cannot be fitted with guns', () => {
    const sim = harpoonArena();
    try {
        clean(sim, true);
        sim.enemies.add([
            { id: 999, x: 3160, y: 0, kind: 'lancer', home: { x: 3160, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(999)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        enemy.cooldown = 999;
        enemy.health = HARPOON_ARMS.shipDamage * 2;
        for (let frame = 0; frame < 60; frame++) sim.step(armInput);
        squeeze(sim);
        assert.equal(enemy.health, HARPOON_ARMS.shipDamage);
        assert.equal(sim.enemyKills, 0);
        squeeze(sim);
        assert.equal(sim.enemyKills, 1);
        assert.equal(sim.enemies.enemies.has(999), false);
        squeeze(sim);
        assert.equal(sim.enemyKills, 1);
        const c = newCampaign();
        c.ship!.hull = 'harpoon';
        c.station.workshop = 2;
        c.bank = { ore: 100, parts: 20 };
        assert.equal(equipWeapon(c, 'rail'), false);
        assert.deepEqual(c.bank, { ore: 100, parts: 20 });
    } finally {
        sim.dispose();
    }
});
test('Harpoon arm contacts stop at walls without draining shields or damaging the ship or targets behind them', () => {
    const sim = harpoonArena();
    try {
        clean(sim, true);
        sim.enemies.add([
            { id: 999, x: 3160, y: 0, kind: 'lancer', home: { x: 3160, y: 0 }, phase: 0 },
        ]);
        const enemy = sim.enemies.enemies.get(999)!;
        enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        enemy.cooldown = 999;
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.1, 2).setTranslation(31, 0),
        );
        sim.fortressColliders.add(wall.handle);
        const count = sim.world.colliders.len();
        for (let frame = 0; frame < 60; frame++) sim.step(armInput);
        squeeze(sim);
        assert.ok(
            sim.harpoonArms!.poses.every((pose) => pose.tip.x * sim.hullConfig.size <= 90.01),
        );
        assert.equal(enemy.health, 90);
        assert.equal(sim.hull, 110);
        assert.equal(sim.kineticShield.charge, 70);
        assert.equal(sim.engineFault, false);
        assert.equal(sim.world.colliders.len(), count);
        sim.ended = 'returned';
        const extension = sim.harpoonArms!.extension;
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.equal(sim.harpoonArms!.extension, extension);
        sim.ended = null;
        for (let frame = 0; frame < 90; frame++) sim.step(idle);
        assert.equal(sim.harpoonArms!.extension, 0);
        sim.ship.setLinvel({ x: 8, y: 0 }, true);
        for (let frame = 0; frame < 20; frame++) sim.step({ ...idle, thrust: true });
        assert.ok(sim.kineticShield.charge < 70);
    } finally {
        sim.dispose();
    }
});
test('Harpoon joint and jaw upgrades persist and improve actual reach and crushing damage on a rotated hull', () => {
    for (const upgraded of [false, true]) {
        const c = newCampaign();
        c.ship!.hull = 'harpoon';
        c.station.workshop = 2;
        c.station.storage = 3;
        c.bank = { ore: 300, parts: 110, crystals: 20 };
        if (upgraded)
            for (let level = 0; level < 3; level++) {
                assert.ok(buyUpgrade(c, 'handling'));
                assert.ok(buyUpgrade(c, 'drill'));
            }
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        const sim = new MissionSimulation(c, 71);
        try {
            clean(sim, true);
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            sim.ship.setRotation(Math.PI / 2, true);
            sim.enemies.add([
                { id: 999, x: 3000, y: 260, kind: 'lancer', home: { x: 3000, y: 260 }, phase: 0 },
            ]);
            const enemy = sim.enemies.enemies.get(999)!;
            enemy.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
            enemy.cooldown = 999;
            enemy.health = 200;
            const input = { ...idle, target: { x: 3000, y: 350 }, mine: true };
            for (let frame = 0; frame < 60; frame++) sim.step(input);
            for (let frame = 0; frame < 34; frame++) sim.step({ ...input, fire: true });
            assert.equal(enemy.health, upgraded ? 200 - HARPOON_ARMS.shipDamage * 1.75 : 200);
            assert.equal(sim.harpoonArms!.reach, HARPOON_ARMS.reach * (upgraded ? 1.45 : 1));
        } finally {
            sim.dispose();
        }
    }
    assert.equal(shipUpgradeDefinition('harpoon', 'handling').title, 'Przeguby ramion');
    assert.equal(shipUpgradeDefinition('harpoon', 'drill').title, 'Siłowniki szczęk');
    assert.equal(shipUpgradeDefinition('prospector', 'drill').title, 'Laser wydobywczy');
});
test('eleven distinct hulls have the requested gun, laser and gripper layouts and role statistics', () => {
    assert.equal(Object.keys(HULLS).length, 11);
    assert.deepEqual(
        Object.values(HULLS).map((h) => [h.guns.length, h.lasers.length, h.grabbers.length]),
        [
            [1, 1, 1],
            [1, 0, 1],
            [0, 2, 3],
            [2, 0, 1],
            [1, 1, 2],
            [2, 1, 2],
            [0, 0, 4],
            [0, 0, 4],
            [1, 0, 1],
            [4, 0, 1],
            [0, 1, 2],
        ],
    );
    assert.equal(HULLS.swift.name, 'Widmo');
    for (const hull of [HULLS.prospector, HULLS.tug]) {
        assert.ok(hull.guns[0].x > 0 && hull.guns[0].y < 0);
        assert.ok(hull.lasers[0].x > 0 && hull.lasers[0].y > 0);
    }
    assert.ok(
        HULLS.swift.turnSpeed > HULLS.fighter.turnSpeed &&
            HULLS.fighter.turnSpeed > HULLS.mule.turnSpeed,
    );
    assert.ok(
        HULLS.swift.maxSpeed > HULLS.fighter.maxSpeed &&
            HULLS.fighter.maxSpeed > HULLS.mule.maxSpeed,
    );
    assert.ok(HULLS.falcon.boost > HULLS.fighter.boost && HULLS.mule.boost < HULLS.fighter.boost);
    assert.ok(HULLS.tug.health > HULLS.mule.health && HULLS.mule.cargo > HULLS.tug.cargo);
    assert.equal(HULLS.prospector.cloak, 0);
    assert.equal(HULLS.mule.cloak, 0);
    assert.ok(HULLS.atlas.cargo > HULLS.mule.cargo);
    assert.ok(HULLS.atlas.maxSpeed < HULLS.mule.maxSpeed);
    assert.ok(HULLS.atlas.miningPower < HULLS.mule.miningPower);
    assert.ok(HULLS.harpoon.health < HULLS.tug.health);
    assert.ok(HULLS.harpoon.brake > HULLS.tug.brake);
});
test('all hull types can be purchased and saved while the hangar remains limited to six ships', () => {
    for (const hull of Object.keys(HULLS) as HullId[]) {
        const campaign = newCampaign();
        campaign.station.workshop = 2;
        campaign.bank = { ore: HULLS[hull].ore, parts: HULLS[hull].parts };
        assert.ok(buyShip(campaign, hull));
        assert.deepEqual(parseCampaign(JSON.stringify(campaign)), campaign);
    }
    const c = newCampaign();
    c.station.workshop = 1;
    for (const hull of (Object.keys(HULLS) as HullId[]).slice(0, FLEET_LIMIT)) {
        if (hull === 'prospector') continue;
        c.bank = { ore: HULLS[hull].ore, parts: HULLS[hull].parts };
        assert.ok(buyShip(c, hull));
    }
    assert.equal(c.reserveShips.length, FLEET_LIMIT - 1);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    c.bank = { ore: 15, parts: 0 };
    assert.equal(buyShip(c), false);
});
test('utility hulls require workshop II and charge their full cost only once on purchase', () => {
    for (const hull of ['atlas', 'harpoon'] as const) {
        const c = newCampaign();
        c.station.workshop = 1;
        c.bank = { ore: HULLS[hull].ore, parts: HULLS[hull].parts };
        const bank = { ...c.bank };
        assert.equal(buyShip(c, hull), false);
        assert.deepEqual(c.bank, bank);
        c.station.workshop = 2;
        c.bank.parts--;
        assert.equal(buyShip(c, hull), false);
        c.bank.parts++;
        assert.ok(buyShip(c, hull));
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
        assert.equal(c.ship!.hull, hull);
        assert.equal(c.reserveShips[0].hull, 'prospector');
    }
});
test('maneuvering modules are purchased per ship, affect actual rotation and are included in scrap value', () => {
    const c = newCampaign();
    c.bank = { ore: 80, parts: 20, crystals: 3 };
    c.station.workshop = 2;
    const initial = scrapRefund(c.ship!);
    assert.ok(buyUpgrade(c, 'handling'));
    assert.ok(buyUpgrade(c, 'handling'));
    assert.ok(scrapRefund(c.ship!).ore > initial.ore);
    const sim = new MissionSimulation(c, 7),
        base = new MissionSimulation(newCampaign(), 7);
    try {
        clean(sim);
        clean(base);
        for (let i = 0; i < 60; i++) {
            sim.step({ ...idle, turn: 1 });
            base.step({ ...idle, turn: 1 });
        }
        assert.ok(sim.ship.rotation() > base.ship.rotation() * 1.3);
        assert.ok(sim.turnSpeed > base.turnSpeed);
        beginRun(c, 7);
        assert.equal(buyUpgrade(c, 'handling'), false);
    } finally {
        sim.dispose();
        base.dispose();
    }
});
test('Harpoon halves wreck and rescue pickup time without changing calm-flight requirements', () => {
    for (const hull of ['prospector', 'atlas', 'harpoon'] as const) {
        const c = newCampaign();
        c.ship!.hull = hull;
        const sim = new MissionSimulation(c, 71);
        try {
            clean(sim);
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            const wreck = sim.salvage.add(999, 'patrol', { x: 3100, y: 0 }, { x: 0, y: 0 })!;
            const seconds = hull === 'harpoon' ? 1.5 : 3;
            assert.equal(sim.salvageSeconds, seconds);
            assert.equal(sim.recoverySeconds, hull === 'harpoon' ? 2 : 4);
            assert.ok(flightHint(sim).includes(`${seconds} s`));
            for (let frame = 0; frame < seconds * 30; frame++)
                sim.step({ ...idle, interact: true });
            assert.equal(sim.salvage.towed, null);
            assert.ok(Math.abs(sim.salvageProgress - seconds / 2) < 1e-8);
            assert.match(flightHint(sim), /(?:49|50)%/);
            sim.step({ ...idle, interact: true, fire: true });
            assert.equal(sim.salvageProgress, 0);
            for (let frame = 0; frame < seconds * 60 - 1; frame++)
                sim.step({ ...idle, interact: true });
            assert.equal(sim.salvage.towed, null);
            sim.step({ ...idle, interact: true });
            assert.equal(sim.salvage.towed, wreck);
        } finally {
            sim.dispose();
        }
        c.nextShipId = 3;
        c.recoverySignals = [{ id: 2, seed: 71, x: 3100, y: 0, pilot: null, ship: newShip(2) }];
        beginRun(c, 71, 2);
        const rescue = new MissionSimulation(c, 71);
        try {
            clean(rescue);
            rescue.ship.setTranslation({ x: 30, y: 0 }, true);
            for (let frame = 0; frame < rescue.recoverySeconds * 30; frame++)
                rescue.step({ ...idle, interact: true });
            assert.equal(rescue.recoverySecured, false);
            assert.ok(Math.abs(rescue.recoveryProgress - rescue.recoverySeconds / 2) < 1e-8);
            assert.match(flightHint(rescue), /(?:49|50)%/);
            rescue.step({ ...idle, interact: true, mine: true });
            assert.equal(rescue.recoveryProgress, 0);
            for (let frame = 0; frame < rescue.recoverySeconds * 60 - 1; frame++)
                rescue.step({ ...idle, interact: true });
            assert.equal(rescue.recoverySecured, false);
            rescue.step({ ...idle, interact: true });
            assert.equal(rescue.recoverySecured, true);
            assert.equal(rescue.salvage.towed?.source, 'recovery');
        } finally {
            rescue.dispose();
        }
    }
});
test('v6 migration preserves identities and modules, converting old Prospectors including wrecks into fighters', () => {
    const c = newCampaign();
    c.ship!.engine = 2;
    c.ship!.armor = 1;
    c.nextShipId = 4;
    c.reserveShips = [newShip(2, 'swift')];
    c.recoverySignals = [{ id: 3, seed: 7, x: 1000, y: 0, pilot: null, ship: newShip(3) }];
    const old = JSON.parse(JSON.stringify(c));
    old.version = 6;
    delete old.ship.handling;
    delete old.reserveShips[0].handling;
    delete old.recoverySignals[0].ship.handling;
    const loaded = parseCampaign(JSON.stringify(old))!;
    assert.ok(loaded);
    assert.equal(loaded.version, 15);
    assert.equal(loaded.ship!.hull, 'fighter');
    assert.equal(loaded.ship!.id, 1);
    assert.equal(loaded.ship!.engine, 2);
    assert.equal(loaded.ship!.armor, 1);
    assert.equal(loaded.recoverySignals[0].ship!.hull, 'fighter');
    assert.equal(loaded.reserveShips[0].hull, 'swift');
    assert.deepEqual(parseCampaign(JSON.stringify(loaded)), loaded);
    const invalid = JSON.parse(JSON.stringify(loaded));
    invalid.ship.handling = 4;
    assert.equal(parseCampaign(JSON.stringify(invalid)), null);
});
test('each grabber must extend, capture one unit and retract before crediting cargo', () => {
    const arms = new GripperSystem([{ x: 0, y: 0 }], 140),
        loot = new Map<number, Resource>([[1, { id: 1, x: 100, y: 0, kind: 'ore', amount: 2 }]]);
    let collected = 0;
    const step = () =>
        arms.update(
            GAME.step,
            { x: 0, y: 0 },
            0,
            1,
            5 - collected,
            loot,
            () => collected++,
            () => true,
        );
    step();
    assert.equal(collected, 0);
    assert.equal(loot.get(1)!.x, 100);
    assert.ok(arms.arms[0].tip.x > 0);
    for (let i = 0; i < 20; i++) step();
    assert.equal(collected, 0);
    assert.equal(arms.arms[0].held, 'ore');
    assert.equal(loot.get(1)!.amount, 1);
    for (let i = 0; i < 12; i++) step();
    assert.equal(collected, 1);
    for (let i = 0; i < 60; i++) step();
    assert.equal(collected, 2);
    assert.equal(loot.size, 0);
});
test('three grippers cannot double claim a crystal or overfill the last cargo slot', () => {
    const arms = new GripperSystem(HULLS.mule.grabbers, 300),
        loot = new Map<number, Resource>();
    for (let id = 1; id <= 4; id++)
        loot.set(id, { id, x: 80 + id * 20, y: 0, kind: 'parts', amount: 1 });
    let collected = 0;
    for (let i = 0; i < 180; i++)
        arms.update(
            GAME.step,
            { x: 0, y: 0 },
            0,
            1,
            1 - collected,
            loot,
            () => collected++,
            () => true,
        );
    assert.equal(collected, 1);
    assert.equal(loot.size, 3);
    assert.ok(arms.arms.every((arm) => !arm.held));
});
test('blocked or out-of-range resources remain in space, and escaping an extending arm cancels capture', () => {
    const arms = new GripperSystem([{ x: 0, y: 0 }], 140),
        loot = new Map<number, Resource>([[1, { id: 1, x: 100, y: 0, kind: 'ore', amount: 1 }]]);
    let collected = 0;
    arms.update(
        GAME.step,
        { x: 0, y: 0 },
        0,
        1,
        5,
        loot,
        () => collected++,
        () => false,
    );
    assert.equal(arms.arms[0].phase, 'idle');
    arms.update(
        GAME.step,
        { x: 0, y: 0 },
        0,
        1,
        5,
        loot,
        () => collected++,
        () => true,
    );
    for (let i = 0; i < 80; i++)
        arms.update(
            GAME.step,
            { x: -500, y: 0 },
            0,
            1,
            5,
            loot,
            () => collected++,
            () => true,
        );
    assert.equal(collected, 0);
    assert.equal(loot.get(1)!.amount, 1);
    assert.equal(arms.arms[0].phase, 'idle');
});
test('loss or disposal cannot credit a resource still carried by a gripper', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clean(sim);
        sim.loot.set(900, { id: 900, x: sim.position.x + 90, y: 0, kind: 'ore', amount: 1 });
        for (let i = 0; i < 17; i++) sim.step(idle);
        assert.ok(sim.grippers.arms[0].held);
        assert.equal(sim.cargoUsed, 0);
        sim.ended = 'destroyed';
        for (let i = 0; i < 90; i++) sim.step(idle);
        assert.equal(sim.cargoUsed, 0);
    } finally {
        sim.dispose();
    }
});
test('passive cloak reduces actual AI detection, shooting reveals the ship and starter has no cloak', () => {
    const c = newCampaign();
    c.ship!.hull = 'falcon';
    const sim = new MissionSimulation(c, 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        const enemy = [...sim.enemies.enemies.values()][0];
        for (const other of sim.enemies.enemies.values())
            if (other !== enemy) sim.enemies.damage(other.id, 1000);
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        enemy.body.setTranslation({ x: 27, y: 0 }, true);
        enemy.home = { x: 2700, y: 0 };
        sim.toggleCloak();
        sim.step(idle);
        assert.ok(sim.cloaked);
        assert.equal(enemy.state, 'patrol');
        sim.step({ ...idle, fire: true, target: enemyPosition(enemy) });
        assert.equal(sim.cloaked, false);
        assert.equal(enemy.state, 'chase');
        assert.ok(sim.revealTime > 2.9);
    } finally {
        sim.dispose();
    }
    const starter = new MissionSimulation(newCampaign(), 7);
    try {
        starter.toggleCloak();
        assert.equal(starter.cloakEnabled, false);
    } finally {
        starter.dispose();
    }
});
function roleArena(hull: HullId) {
    const campaign = newCampaign();
    campaign.ship!.hull = hull;
    const sim = new MissionSimulation(campaign, 71);
    clean(sim, true);
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return sim;
}
test('mining lasers deal small ship damage without interrupting charge, respect cover and award kills', () => {
    const sim = roleArena('prospector');
    try {
        const enemy = atlasEnemy(sim, 999, 3150, 0);
        enemy.state = 'chase';
        enemy.cooldown = 0;
        enemy.charge = 0.4;
        enemy.body.setRotation(Math.PI, true);
        const input = { ...idle, target: enemyPosition(enemy), mine: true };
        sim.step(input);
        assert.ok(enemy.health < 500 && enemy.health > 499);
        assert.ok(enemy.charge > 0.4);
        enemy.cooldown = 999;
        const wall = sim.world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.1, 1).setTranslation(30.9, 0),
        );
        sim.fortressColliders.add(wall.handle);
        const health = enemy.health;
        sim.step(input);
        assert.equal(enemy.health, health);
        sim.fortressColliders.delete(wall.handle);
        sim.world.removeCollider(wall, true);
        enemy.health = 0.1;
        sim.step(input);
        assert.equal(sim.enemies.enemies.has(enemy.id), false);
        assert.equal(sim.enemyKills, 1);
        assert.ok(sim.loot.size > 0);
    } finally {
        sim.dispose();
    }
});
test('Widmo optical cloak lasts three seconds, prevents targeting and cannot refresh while held', () => {
    const sim = roleArena('swift');
    try {
        const enemy = atlasEnemy(sim, 999, 3300, 0);
        enemy.cooldown = 0;
        enemy.state = 'chase';
        enemy.charge = 1;
        enemy.lastSeen = { x: 3000, y: 0 };
        enemy.body.setRotation(Math.PI, true);
        const input = { ...idle, mine: true, target: { x: 3000, y: 1000 } };
        sim.step(input);
        assert.equal(sim.enemySignature, 0);
        assert.ok(sim.cloaked);
        assert.equal(enemy.charge, 0);
        sim.ship.setTranslation({ x: 30, y: 1 }, true);
        sim.step({ ...input, fire: true, thrust: true, boost: true });
        assert.ok(sim.cloaked);
        for (let frame = 0; frame < 120; frame++) sim.step(input);
        assert.deepEqual(enemy.lastSeen, { x: 3000, y: 0 });
        assert.equal(sim.laserBeams.length, 0);
        assert.equal(
            [...sim.bullets.values()].some((bullet) => bullet.team === 'enemy'),
            false,
        );
        sim.step(idle);
        assert.equal(sim.cloaked, true);
        sim.step(input);
        assert.ok(sim.opticalCloakTime < 1);
        for (let frame = 0; frame < 60; frame++) sim.step(input);
        assert.equal(sim.cloaked, false);
        assert.equal(sim.enemySignature, 1);
        assert.deepEqual(enemy.lastSeen, sim.previous);
        enemy.body.setRotation(
            Math.atan2(
                sim.position.y - enemyPosition(enemy).y,
                sim.position.x - enemyPosition(enemy).x,
            ),
            true,
        );
        for (let frame = 0; frame < 180; frame++) sim.step(idle);
        assert.ok(sim.events.some((event) => event.kind === 'shot' && event.sound === 'lancer'));
        for (let frame = 0; frame < Math.ceil(WIDMO.cooldown / GAME.step); frame++) sim.step(input);
        assert.equal(sim.opticalCloak, false);
        assert.equal(sim.opticalCloakCooldown, 0);
        sim.step(idle);
        sim.step(input);
        assert.equal(sim.opticalCloakTime, WIDMO.duration);
        assert.equal(sim.opticalCloakCooldown, WIDMO.cooldown);
    } finally {
        sim.dispose();
    }
});
test('Mule mines with LPM and repeatedly fabricates one kit at zero stock for twice the station cost', () => {
    const sim = roleArena('mule');
    try {
        sim.repairKits = 0;
        sim.step({ ...idle, fire: true });
        assert.equal(sim.laserBeams.length, 2);
        assert.equal(sim.bullets.size, 0);
        sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 0);
        sim.cargo.ore = JOBS.kit.ore * 2 - 1;
        sim.cargo.parts = JOBS.kit.parts * 2;
        sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.cargo.parts, JOBS.kit.parts * 2);
        sim.cargo.ore = JOBS.kit.ore * 4;
        sim.cargo.parts = JOBS.kit.parts * 2 - 1;
        sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.cargo.ore, JOBS.kit.ore * 4);
        sim.cargo.parts = JOBS.kit.parts * 4;
        sim.cargo.crystals = 1;
        sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 1);
        assert.equal(sim.laserBeams.length, 0);
        assert.equal(sim.cargo.ore, JOBS.kit.ore * 2);
        assert.equal(sim.cargo.parts, JOBS.kit.parts * 2);
        for (let frame = 0; frame < 60; frame++) sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 1);
        assert.equal(sim.cargo.ore, JOBS.kit.ore * 2);
        assert.equal(sim.cargo.parts, JOBS.kit.parts * 2);
        sim.hull -= GAME.repairHull;
        for (let frame = 0; frame < 301; frame++) sim.step({ ...idle, repair: true });
        assert.equal(sim.repairKits, 0);
        assert.equal(sim.hull, sim.maxHull);
        sim.step(idle);
        sim.step({ ...idle, mine: true });
        assert.equal(sim.repairKits, 1);
        assert.equal(sim.cargo.ore, 0);
        assert.equal(sim.cargo.parts, 0);
        assert.equal(sim.cargo.crystals, 1);
    } finally {
        sim.dispose();
    }
    const next = roleArena('mule');
    try {
        next.repairKits = 1;
        next.cargo.ore = JOBS.kit.ore * 2;
        next.cargo.parts = JOBS.kit.parts * 2;
        next.step({ ...idle, mine: true });
        assert.equal(next.repairKits, 1);
        assert.equal(next.cargo.ore, JOBS.kit.ore * 2);
        assert.equal(next.cargo.parts, JOBS.kit.parts * 2);
    } finally {
        next.dispose();
    }
});
test('Bastion retains guns while PPM throws timed splash grenades instead of mining', () => {
    const sim = roleArena('fighter');
    try {
        const enemy = atlasEnemy(sim, 999, 3250, 0);
        sim.step({ ...idle, target: enemyPosition(enemy), fire: true, mine: true });
        assert.ok([...sim.bullets.values()].some((bullet) => bullet.explosive === 'grenade'));
        assert.ok([...sim.bullets.values()].some((bullet) => !bullet.explosive));
        assert.equal(sim.laserBeams.length, 0);
        for (let frame = 0; frame < 60; frame++) sim.step(idle);
        assert.ok(enemy.health <= 500 - ATLAS_WEAPONS.grenade.damage);
        assert.ok(sim.events.some((event) => event.kind === 'explosion'));
        assert.equal(shipUpgradeDefinition('fighter', 'drill').title, 'Salwa granatów');
    } finally {
        sim.dispose();
    }
});
test('saved Widmo projector upgrades shorten cooldown without extending its three-second camouflage', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'swift';
    campaign.ship!.drill = 2;
    const saved = parseCampaign(JSON.stringify(campaign))!;
    assert.ok(saved);
    const sim = new MissionSimulation(saved, 71);
    try {
        sim.step({ ...idle, mine: true });
        assert.equal(sim.opticalCloakTime, 3);
        assert.equal(sim.opticalCloakCooldown, WIDMO.cooldown / 1.4);
        assert.equal(shipUpgradeDefinition('swift', 'drill').title, 'Projektor kamuflażu');
    } finally {
        sim.dispose();
    }
});
test('laser and boost reveal camouflage and returning to quiet flight restores it', () => {
    const c = newCampaign();
    c.ship!.hull = 'falcon';
    const sim = new MissionSimulation(c, 7);
    try {
        clean(sim);
        sim.toggleCloak();
        sim.step({ ...idle, mine: true });
        assert.equal(sim.cloaked, false);
        for (let i = 0; i < 190; i++) sim.step(idle);
        assert.equal(sim.cloaked, true);
        sim.step({ ...idle, thrust: true, boost: true });
        assert.equal(sim.cloaked, false);
        sim.toggleCloak();
        assert.equal(sim.cloakEnabled, false);
    } finally {
        sim.dispose();
    }
});
