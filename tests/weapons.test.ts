import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { WEAPONS, GAME } from '../frontend/game/config';
import {
    newCampaign,
    newShip,
    parseCampaign,
    beginRun,
    finishRun,
    emergencyKit,
    selectShip,
    scrapRefund,
} from '../frontend/game/state/campaign';
import { equipWeapon } from '../frontend/game/state/weapons';
import { createRecoverySignal } from '../frontend/game/state/recovery';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
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
function ready() {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 20 };
    c.station.workshop = 1;
    return c;
}

test('weapon purchases require the workshop and enough resources, charge once and switch freely', () => {
    const c = ready();
    c.station.workshop = 0;
    assert.equal(equipWeapon(c, 'rail'), false);
    c.station.workshop = 1;
    c.bank.parts = 5;
    assert.equal(equipWeapon(c, 'rail'), false);
    assert.equal(c.bank.ore, 100);
    c.bank.parts = 20;
    assert.ok(equipWeapon(c, 'rail'));
    assert.deepEqual(c.bank, { ore: 76, parts: 14 });
    assert.equal(equipWeapon(c, 'rail'), false);
    assert.ok(equipWeapon(c, 'standard'));
    assert.ok(equipWeapon(c, 'rail'));
    assert.deepEqual(c.bank, { ore: 76, parts: 14 });
    assert.deepEqual(c.ship!.weapons, ['standard', 'rail']);
    beginRun(c, 71);
    assert.equal(equipWeapon(c, 'pulse'), false);
    assert.equal(equipWeapon(c, 'standard'), false);
    assert.equal(equipWeapon(c, 'bad' as 'rail'), false);
});

test('mounts are per hull and their purchase value is included in scrapping once', () => {
    const c = ready(),
        base = scrapRefund(c.ship!);
    equipWeapon(c, 'rail');
    equipWeapon(c, 'pulse');
    const upgraded = scrapRefund(c.ship!);
    assert.equal(upgraded.ore - base.ore, 20);
    assert.equal(upgraded.parts - base.parts, 4);
    c.reserveShips = [newShip(2, 'swift')];
    c.nextShipId = 3;
    assert.ok(selectShip(c, 2));
    assert.equal(c.ship!.weapon, 'standard');
    assert.deepEqual(c.ship!.weapons, ['standard']);
    assert.ok(selectShip(c, 1));
    assert.equal(c.ship!.weapon, 'pulse');
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('legacy saves migrate every hull and interrupted run without granting new weapons', () => {
    const c = ready();
    c.reserveShips = [newShip(2, 'swift')];
    c.nextShipId = 4;
    c.recoverySignals = [{ id: 3, seed: 71, x: 1800, y: 0, pilot: null, ship: newShip(3, 'mule') }];
    beginRun(c, 71);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 10;
    for (const ship of [old.ship, ...old.reserveShips, old.recoverySignals[0].ship]) {
        delete ship.weapon;
        delete ship.weapons;
    }
    const migrated = parseCampaign(JSON.stringify(old))!;
    assert.ok(migrated);
    assert.equal(migrated.version, 15);
    for (const ship of [
        migrated.ship!,
        ...migrated.reserveShips,
        migrated.recoverySignals[0].ship!,
    ]) {
        assert.equal(ship.weapon, 'standard');
        assert.deepEqual(ship.weapons, ['standard']);
    }
    assert.equal(migrated.activeRun!.seed, 71);
    assert.deepEqual(migrated.bank, c.bank);
});

test('new saves reject unknown, duplicate, missing and unowned mount selections including wrecks', () => {
    for (const mutate of [
        (s: any) => {
            s.weapon = 'bad';
        },
        (s: any) => {
            s.weapon = 'rail';
        },
        (s: any) => {
            s.weapons = ['standard', 'standard'];
        },
        (s: any) => {
            delete s.weapons;
        },
        (s: any) => {
            s.weapons = ['bad', 'standard'];
        },
    ]) {
        const c = ready();
        mutate(c.ship);
        assert.equal(parseCampaign(JSON.stringify(c)), null);
        const r = ready();
        r.nextShipId = 3;
        r.recoverySignals = [{ id: 2, seed: 71, x: 1800, y: 0, pilot: null, ship: newShip(2) }];
        mutate(r.recoverySignals[0].ship);
        assert.equal(parseCampaign(JSON.stringify(r)), null);
    }
});

test('all weapon profiles drive actual damage, flight speed, muzzle and firing cadence', () => {
    const counts: number[] = [];
    for (const id of ['standard', 'pulse', 'rail'] as const) {
        const c = ready();
        if (id !== 'standard') equipWeapon(c, id);
        const sim = new MissionSimulation(c, 71);
        try {
            for (const r of sim.rocks.values()) sim.world.removeRigidBody(r.body);
            sim.rocks.clear();
            sim.enemies.dispose();
            sim.ship.setTranslation({ x: 25, y: 0 }, true);
            sim.step({ ...idle, fire: true });
            const bullet = [...sim.bullets.values()][0];
            assert.ok(bullet);
            assert.equal(bullet.damage, WEAPONS[id].damage);
            assert.ok(Math.abs(Math.hypot(bullet.vx, bullet.vy) - WEAPONS[id].speed) < 1e-6);
            assert.ok(Math.abs(bullet.life - (WEAPONS[id].life - GAME.step)) < 0.001);
            assert.equal(Boolean(bullet.heavy), id === 'rail');
            for (let i = 1; i < 60; i++) sim.step({ ...idle, fire: true });
            counts.push(sim.events.filter((e) => e.kind === 'shot').length);
        } finally {
            sim.dispose();
        }
    }
    assert.ok(counts[1] > counts[0]);
    assert.ok(counts[0] > counts[2]);
    assert.equal(counts[2], 2);
});

test('loss and rescue preserve purchased weapons while the replacement hull starts with basic armament', () => {
    const c = ready();
    equipWeapon(c, 'rail');
    let seed = 0;
    while (
        seed < 1000 &&
        !createRecoverySignal(c.ship!, c.pilots[0], seed, { x: 1800, y: 0 })?.ship
    )
        seed++;
    assert.ok(seed < 1000);
    beginRun(c, seed);
    finishRun(c, false, { ore: 0, parts: 0 }, 2, 'loss', 0, { lossPosition: { x: 1800, y: 0 } });
    const wreck = c.recoverySignals[0];
    assert.equal(wreck.ship!.weapon, 'rail');
    c.bank = { ore: 0, parts: 0 };
    assert.ok(emergencyKit(c));
    assert.equal(c.ship!.weapon, 'standard');
    beginRun(c, seed, wreck.id);
    finishRun(c, true, { ore: 0, parts: 0 }, 2, 'return', 0, { securedId: wreck.id });
    assert.equal(c.reserveShips[0].weapon, 'rail');
    assert.deepEqual(c.reserveShips[0].weapons, ['standard', 'rail']);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
