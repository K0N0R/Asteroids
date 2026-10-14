import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { HULLS, GAME, HullId, FLEET_LIMIT, shipUpgradeDefinition } from '../frontend/game/config';
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
before(async () => {
    await RAPIER.init();
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
    assert.ok(arms.poses.every((arm) => arm.tip.x < 0));
    assert.ok(arms.poses.every((arm) => Math.abs(arm.elbow.y) < 35));
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
        assert.ok(sim.loot.size > 0 || sim.cargoUsed > 0);
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
        enemy.health = 130;
        for (let frame = 0; frame < 60; frame++) sim.step(armInput);
        squeeze(sim);
        assert.equal(enemy.health, 65);
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
        c.bank = { ore: 350, parts: 40, crystals: 20 };
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
test('eight distinct hulls have the requested gun, laser and gripper layouts and role statistics', () => {
    assert.equal(Object.keys(HULLS).length, 8);
    assert.deepEqual(
        Object.values(HULLS).map((h) => [h.guns.length, h.lasers.length, h.grabbers.length]),
        [
            [1, 1, 1],
            [1, 1, 1],
            [1, 2, 3],
            [2, 1, 1],
            [1, 1, 2],
            [2, 1, 2],
            [1, 2, 4],
            [0, 0, 4],
        ],
    );
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
    c.bank = { ore: 80, parts: 10, crystals: 3 };
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
test('cloak reduces actual AI detection, shooting reveals the ship and starter has no cloak', () => {
    const c = newCampaign();
    c.ship!.hull = 'swift';
    const sim = new MissionSimulation(c, 7);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        const enemy = [...sim.enemies.enemies.values()][0];
        for (const other of sim.enemies.enemies.values())
            if (other !== enemy) sim.enemies.damage(other.id, 1000);
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        enemy.body.setTranslation({ x: 26, y: 0 }, true);
        enemy.home = { x: 2600, y: 0 };
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
