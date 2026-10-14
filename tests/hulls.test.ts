import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { HULLS, GAME, HullId, FLEET_LIMIT } from '../frontend/game/config';
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
function clean(sim: MissionSimulation) {
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    sim.enemies.dispose();
}
test('six distinct hulls have the requested gun, laser and gripper layouts and role statistics', () => {
    assert.equal(Object.keys(HULLS).length, 6);
    assert.deepEqual(
        Object.values(HULLS).map((h) => [h.guns.length, h.lasers.length, h.grabbers.length]),
        [
            [1, 1, 1],
            [1, 1, 1],
            [1, 2, 3],
            [2, 1, 1],
            [1, 1, 2],
            [2, 1, 2],
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
});
test('all six ships can be purchased, saved and reloaded; a seventh is rejected', () => {
    const c = newCampaign();
    c.station.workshop = 1;
    for (const hull of Object.keys(HULLS) as HullId[]) {
        if (hull === 'prospector') continue;
        c.bank = { ore: HULLS[hull].ore, parts: HULLS[hull].parts };
        assert.ok(buyShip(c, hull));
    }
    assert.equal(c.reserveShips.length, FLEET_LIMIT - 1);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    c.bank = { ore: 15, parts: 0 };
    assert.equal(buyShip(c), false);
});
test('maneuvering modules are purchased per ship, affect actual rotation and are included in scrap value', () => {
    const c = newCampaign();
    c.bank = { ore: 80, parts: 10 };
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
    assert.equal(loaded.version, 10);
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
