import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    SalvageFleet,
    SALVAGE,
    leavesWreck,
    salvagePosition,
} from '../frontend/game/systems/salvage';
import { MissionSimulation } from '../frontend/game/systems/mission';
import {
    newCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    storageCapacity,
} from '../frontend/game/state/campaign';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function arena(seed = 71, hull: 'prospector' | 'tug' = 'prospector') {
    const c = newCampaign();
    c.ship!.hull = hull;
    beginRun(c, seed);
    const sim = new MissionSimulation(c, seed);
    sim.enemies.dispose();
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return { c, sim };
}
function shot(sim: MissionSimulation, x: number, team: 'player' | 'enemy', damage = 18) {
    sim.bullets.set(9999, { id: 9999, x, y: 0, vx: 10000, vy: 0, life: 1, team, damage });
}

test('wreck chance is stable per enemy, varies between seeds and stays near 35 percent', () => {
    let count = 0;
    for (let seed = 0; seed < 1000; seed++) {
        assert.equal(leavesWreck(seed, 1), leavesWreck(seed, 1));
        if (leavesWreck(seed, 1)) count++;
    }
    assert.ok(count > 300 && count < 400);
});
test('dual towing owns separate ropes and removing one leaves the other attached', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const fleet = new SalvageFleet(world, 2);
    try {
        const ship = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
        world.createCollider(RAPIER.ColliderDesc.ball(0.3), ship);
        const first = fleet.add(1, 'patrol', { x: -140, y: -50 }, { x: 0, y: 0 })!;
        const second = fleet.add(2, 'lancer', { x: -140, y: 50 }, { x: 0, y: 0 })!;
        const third = fleet.add(3, 'patrol', { x: -160, y: 0 }, { x: 0, y: 0 })!;
        assert.ok(fleet.attach(first, ship));
        assert.equal(fleet.attach(first, ship), false);
        assert.ok(fleet.attach(second, ship));
        assert.equal(fleet.attach(third, ship), false);
        assert.equal(world.impulseJoints.len(), 2);
        assert.notEqual(fleet.towAnchor(first).y, fleet.towAnchor(second).y);
        fleet.damage(first, 1000);
        assert.equal(fleet.towed, second);
        assert.equal(world.impulseJoints.len(), 1);
        assert.ok(fleet.attach(third, ship));
        assert.notEqual(fleet.towAnchor(second).y, fleet.towAnchor(third).y);
        fleet.detach(second);
        assert.equal(fleet.towed, third);
        fleet.dispose();
        assert.equal(world.impulseJoints.len(), 0);
        assert.equal(fleet.towing.size, 0);
    } finally {
        fleet.dispose();
        world.free();
    }
});

test('actual drone destruction gives either a wreck or loose resources, never both', () => {
    for (const wreck of [true, false]) {
        let seed = 1;
        while (leavesWreck(seed, 1) !== wreck) seed++;
        const sim = new MissionSimulation(newCampaign(), seed);
        try {
            for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
            sim.rocks.clear();
            const enemy = sim.enemies.enemies.get(1)!;
            for (const other of [...sim.enemies.enemies.values()])
                if (other !== enemy) sim.enemies.damage(other.id, 1000);
            enemy.body.setTranslation({ x: 34, y: 0 }, true);
            enemy.home = { x: 3400, y: 0 };
            enemy.cooldown = 999;
            sim.ship.setTranslation({ x: 30, y: 0 }, true);
            shot(sim, 3300, 'player', 1000);
            sim.step(idle);
            assert.equal(sim.enemyKills, 1);
            assert.equal(sim.salvage.items.size, wreck ? 1 : 0);
            assert.equal(sim.loot.size, wreck ? 0 : 5);
            sim.step(idle);
            assert.equal(sim.enemyKills, 1);
        } finally {
            sim.dispose();
        }
    }
});

test('pickup requires a calm continuous hold, permits full cargo and supports one releasable tow', () => {
    const { sim } = arena();
    try {
        const item = sim.salvage.add(1, 'patrol', { x: 3120, y: 0 }, { x: 0, y: 0 })!;
        sim.salvage.add(2, 'lancer', { x: 3100, y: 100 }, { x: 0, y: 0 });
        sim.cargo.ore = sim.cargoCapacity;
        for (let i = 0; i < 90; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.salvageProgress > 1.4);
        sim.step({ ...idle, interact: true, fire: true });
        assert.equal(sim.salvageProgress, 0);
        for (let i = 0; i < 181; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.salvage.towed, item);
        assert.equal(sim.recycledWreck, 'patrol');
        assert.equal(sim.salvage.attach(sim.salvage.items.get(2)!, sim.ship), false);
        sim.releaseWreck();
        assert.equal(sim.salvage.towed, null);
        assert.ok(sim.salvage.items.has(1));
        assert.equal(sim.recycledWreck, undefined);
    } finally {
        sim.dispose();
    }
});

test('Manta picks up two wrecks with E, rejects a third and delivers both only once', () => {
    const { c, sim } = arena(71, 'tug');
    try {
        const first = sim.salvage.add(1, 'patrol', { x: 3120, y: -50 }, { x: 0, y: 0 })!;
        const second = sim.salvage.add(2, 'lancer', { x: 3120, y: 50 }, { x: 0, y: 0 })!;
        for (let frame = 0; frame < 361; frame++) sim.step({ ...idle, interact: true });
        assert.equal(sim.salvage.towing.size, 2);
        const third = sim.salvage.add(3, 'patrol', { x: 3000, y: 140 }, { x: 0, y: 0 })!;
        assert.equal(sim.salvage.attach(third, sim.ship), false);
        assert.equal(sim.nearbyWreck, undefined);
        for (let frame = 0; frame < 60; frame++) sim.step({ ...idle, thrust: true, turn: 1 });
        for (const item of [first, second])
            assert.ok(
                Math.hypot(
                    salvagePosition(item).x - sim.position.x,
                    salvagePosition(item).y - sim.position.y,
                ) < 300,
            );
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        first.body.setTranslation({ x: -1.4, y: -0.4 }, true);
        second.body.setTranslation({ x: -1.4, y: 0.4 }, true);
        for (const item of [first, second]) item.body.setLinvel({ x: 0, y: 0 }, true);
        sim.step(idle);
        assert.equal(sim.salvage.towing.size, 0);
        assert.equal(sim.deliveryRevision, 2);
        assert.deepEqual(c.bank, { ore: 20, parts: 11, crystals: 1 });
        sim.step(idle);
        assert.equal(c.activeRun!.deliveries!.length, 2);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        sim.dispose();
    }
});
test('Manta can tow a rescue and wreck together, releases only the wreck and waits for both at docking', () => {
    const c = newCampaign();
    c.ship!.hull = 'tug';
    c.nextPilotId = 3;
    c.recoverySignals = [
        { id: 2, seed: 71, x: 3000, y: 0, ship: null, pilot: { ...c.pilots[0], id: 2 } },
    ];
    beginRun(c, 71, 2);
    const sim = new MissionSimulation(c, 71);
    try {
        sim.enemies.dispose();
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        for (let frame = 0; frame < 241; frame++) sim.step({ ...idle, interact: true });
        const rescue = sim.salvage.towed!;
        const wreck = sim.salvage.add(10, 'patrol', { x: 3120, y: 80 }, { x: 0, y: 0 })!;
        for (let frame = 0; frame < 181; frame++) sim.step({ ...idle, interact: true });
        assert.equal(sim.salvage.towing.size, 2);
        sim.releaseWreck();
        assert.equal(sim.salvage.towed, rescue);
        assert.ok(sim.salvage.items.has(wreck.id));
        assert.ok(sim.recoverySecured);
        assert.ok(sim.salvage.attach(wreck, sim.ship));
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        rescue.body.setTranslation({ x: -1.4, y: 0 }, true);
        wreck.body.setTranslation({ x: -5, y: 0 }, true);
        assert.equal(sim.dockable, false);
        wreck.body.setTranslation({ x: -2.5, y: 0.5 }, true);
        assert.equal(sim.dockable, true);
        for (const item of [rescue, wreck]) item.body.setLinvel({ x: 0, y: 0 }, true);
        for (let frame = 0; frame < 100; frame++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        assert.equal(c.activeRun!.deliveries!.length, 2);
        assert.equal(sim.salvage.towing.size, 0);
        assert.ok(c.pilots.some((pilot) => pilot.id === 2));
    } finally {
        sim.dispose();
    }
});
test('player rounds and physical contacts ignore salvage while enemy rounds can destroy it', () => {
    const { sim } = arena();
    try {
        const item = sim.salvage.add(1, 'patrol', { x: 3300, y: 0 }, { x: 0, y: 0 })!;
        sim.world.step();
        shot(sim, 3200, 'player', 1000);
        sim.step(idle);
        assert.equal(item.health, 70);
        assert.ok(sim.bullets.has(9999));
        sim.ship.setTranslation({ x: 33, y: 0 }, true);
        sim.world.step();
        let contact = false;
        sim.world.contactPair(sim.shipCollider, item.collider, (m) => {
            if (m.numSolverContacts()) contact = true;
        });
        assert.equal(contact, false);
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        shot(sim, 3200, 'enemy', 1000);
        sim.step(idle);
        assert.equal(sim.salvage.items.size, 0);
        assert.ok(sim.events.some((e) => e.kind === 'break'));
    } finally {
        sim.dispose();
    }
});

test('asteroid impacts hurt the tow at the contact and Aurora shields salvage from damage', () => {
    const { sim } = arena();
    try {
        const item = sim.salvage.add(1, 'patrol', { x: 3300, y: 0 }, { x: 0, y: 0 })!;
        sim.world.createCollider(RAPIER.ColliderDesc.ball(0.5).setTranslation(34, 0));
        item.body.setLinvel({ x: 5, y: 0 }, true);
        for (let i = 0; i < 20; i++) sim.step(idle);
        assert.ok(item.health < 70);
        assert.ok(sim.events.some((e) => e.kind === 'hit' && e.x > 3300));
        item.body.setTranslation({ x: 5, y: 0 }, true);
        item.body.setLinvel({ x: 0, y: 0 }, true);
        const health = item.health;
        shot(sim, 400, 'enemy', 1000);
        sim.step(idle);
        assert.equal(item.health, health);
    } finally {
        sim.dispose();
    }
});

test('recycling pays only after a safe return, respects storage and cannot pay twice', () => {
    const c = newCampaign();
    beginRun(c, 71);
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 60, 'dock', 0, {
        recycledWreck: 'lancer',
    });
    assert.deepEqual(result?.reward, { ore: 12, parts: 7, crystals: 1 });
    assert.deepEqual(c.bank, { ore: 12, parts: 7, crystals: 1 });
    assert.equal(
        finishRun(c, true, { ore: 0, parts: 0 }, 60, 'dock', 0, { recycledWreck: 'lancer' }),
        null,
    );
    const lost = newCampaign();
    beginRun(lost, 71);
    assert.deepEqual(
        finishRun(lost, false, { ore: 0, parts: 0 }, 60, 'death', 0, { recycledWreck: 'lancer' })
            ?.reward,
        { ore: 0, parts: 0 },
    );
    const full = newCampaign();
    full.bank.ore = storageCapacity(full) - 2;
    beginRun(full, 71);
    const overflow = finishRun(full, true, { ore: 0, parts: 0 }, 60, 'dock', 0, {
        recycledWreck: 'lancer',
    })!;
    assert.equal(full.bank.crystals, 1);
    assert.equal(full.bank.parts, 1);
    assert.equal(overflow.overflow, 18);
});

test('a destroyed rescue tow cannot be rescued again and its missing pilot is lost only once', () => {
    const c = newCampaign();
    c.nextPilotId = 3;
    c.recoverySignals = [
        { id: 2, seed: 71, x: 3000, y: 0, ship: null, pilot: { ...c.pilots[0], id: 2 } },
    ];
    beginRun(c, 71, 2);
    const sim = new MissionSimulation(c, 71);
    try {
        sim.enemies.dispose();
        for (const r of sim.rocks.values()) sim.world.removeRigidBody(r.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        for (let i = 0; i < 241; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.recoverySecured);
        const item = sim.salvage.towed!;
        sim.salvage.detach();
        item.body.setTranslation({ x: 33, y: 0 }, true);
        item.body.setLinvel({ x: 0, y: 0 }, true);
        shot(sim, 3200, 'enemy', 1000);
        sim.step(idle);
        assert.equal(sim.recoveryDestroyed, true);
        assert.equal(sim.recoverySecured, false);
        for (let i = 0; i < 241; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.recoverySecured, false);
        finishRun(c, true, { ore: 0, parts: 0 }, 60, 'dock', 0, {
            destroyedRecoveryId: 2,
            securedId: 2,
        });
        assert.equal(c.recoverySignals.length, 0);
        assert.equal(c.lostPilots, 1);
        assert.equal(c.pilots.length, 1);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    } finally {
        sim.dispose();
    }
});

test('a physical rope swings behind the ship, freezes when paused and requires cargo to reach the dock', () => {
    const { sim } = arena();
    try {
        const item = sim.salvage.add(1, 'patrol', { x: 2860, y: 0 }, { x: 0, y: 0 })!;
        sim.salvage.attach(item, sim.ship);
        for (let i = 0; i < 180; i++)
            sim.step({ ...idle, thrust: i < 60, turn: i > 60 && i < 100 ? 1 : 0 });
        const p = salvagePosition(item);
        assert.ok(Math.hypot(p.x - sim.position.x, p.y - sim.position.y) < 280);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        assert.equal(sim.dockable, false);
        item.body.setTranslation({ x: -1.4, y: 0 }, true);
        item.body.setLinvel({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 100; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        assert.equal(sim.salvage.items.size, 0);
        const frozen = { ...sim.position };
        sim.step({ ...idle, thrust: true });
        assert.deepEqual(sim.position, frozen);
    } finally {
        sim.dispose();
    }
});

test('bounded derelicts leave space for the selected rescue capsule', () => {
    const { sim } = arena();
    try {
        for (let id = 1; id <= SALVAGE.limit; id++)
            assert.ok(sim.salvage.add(id, 'patrol', { x: 3000 + id * 100, y: 0 }, { x: 0, y: 0 }));
        assert.equal(sim.salvage.add(50, 'patrol', { x: 3000, y: 0 }, { x: 0, y: 0 }), null);
        assert.ok(sim.salvage.add(-1, 'recovery', { x: 2800, y: 0 }, { x: 0, y: 0 }, 0, true));
    } finally {
        sim.dispose();
    }
});

test('multiple automatic deliveries free the tow, keep the sortie running and survive later death or refresh', () => {
    const { c, sim } = arena();
    try {
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        for (const [id, source] of [
            [1, 'patrol'],
            [2, 'lancer'],
        ] as const) {
            const item = sim.salvage.add(id, source, { x: 150, y: 0 }, { x: 0, y: 0 })!;
            sim.salvage.attach(item, sim.ship);
            sim.step(idle);
            assert.equal(sim.salvage.towed, null);
            assert.equal(sim.ended, null);
        }
        assert.deepEqual(c.bank, { ore: 20, parts: 11, crystals: 1 });
        assert.equal(c.activeRun!.deliveries!.length, 2);
        const reload = parseCampaign(JSON.stringify(c))!;
        assert.ok(reload);
        const result = finishRun(reload, false, { ore: 0, parts: 0 }, 60, 'refresh')!;
        assert.deepEqual(
            result.deliveries.map((d) => d.id),
            [1, 2],
        );
        assert.deepEqual(reload.bank, { ore: 20, parts: 11, crystals: 1 });
        assert.deepEqual(result.reward, { ore: 0, parts: 0 });
    } finally {
        sim.dispose();
    }
});

test('holding E at the dock also settles a tow still outside the automatic delivery radius', () => {
    const { c, sim } = arena();
    try {
        sim.ship.setTranslation({ x: 1.5, y: 0 }, true);
        const item = sim.salvage.add(1, 'patrol', { x: 250, y: 0 }, { x: 0, y: 0 })!;
        sim.salvage.attach(item, sim.ship);
        sim.step(idle);
        assert.equal(sim.salvage.towed, item);
        for (let i = 0; i < 100; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        assert.equal(c.activeRun!.deliveries!.length, 1);
        const result = finishRun(c, true, sim.cargo, sim.elapsed, 'dock')!;
        assert.equal(result.deliveries.length, 1);
        assert.deepEqual(c.bank, { ore: 8, parts: 4 });
        assert.deepEqual(result.reward, { ore: 0, parts: 0 });
    } finally {
        sim.dispose();
    }
});

test('delivered pilots and ships are restored immediately and remain safe if the current pilot later dies', () => {
    const c = newCampaign();
    c.nextPilotId = 3;
    c.nextShipId = 3;
    c.recoverySignals = [
        {
            id: 2,
            seed: 71,
            x: 3000,
            y: 0,
            pilot: { ...c.pilots[0], id: 2 },
            ship: { ...c.ship!, id: 2 },
        },
    ];
    beginRun(c, 71, 2);
    const sim = new MissionSimulation(c, 71);
    try {
        sim.enemies.dispose();
        for (const r of sim.rocks.values()) sim.world.removeRigidBody(r.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: 30, y: 0 }, true);
        for (let i = 0; i < 241; i++) sim.step({ ...idle, interact: true });
        const item = sim.salvage.towed!;
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        item.body.setTranslation({ x: -1.4, y: 0 }, true);
        item.body.setLinvel({ x: 0, y: 0 }, true);
        sim.step(idle);
        assert.equal(sim.ended, null);
        assert.equal(sim.recoveryDelivered, true);
        assert.equal(c.recoverySignals.length, 0);
        assert.equal(c.activeRun!.recoveryId, null);
        assert.ok(c.pilots.some((p) => p.id === 2));
        assert.ok(c.reserveShips.some((s) => s.id === 2));
        const reload = parseCampaign(JSON.stringify(c))!;
        assert.ok(reload);
        const result = finishRun(reload, false, { ore: 0, parts: 0 }, 60, 'death')!;
        assert.equal(result.deliveries.length, 1);
        assert.ok(reload.pilots.some((p) => p.id === 2));
        assert.ok(reload.reserveShips.some((s) => s.id === 2));
    } finally {
        sim.dispose();
    }
});

test('delivery journals reject duplicate identities and malformed credits without reapplying saved rewards', () => {
    const { c, sim } = arena();
    try {
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        const item = sim.salvage.add(1, 'patrol', { x: 100, y: 0 }, { x: 0, y: 0 })!;
        sim.salvage.attach(item, sim.ship);
        sim.step(idle);
        for (const mutation of [
            (p: any) => p.activeRun.deliveries.push({ ...p.activeRun.deliveries[0] }),
            (p: any) => (p.activeRun.deliveries[0].materials.ore = -1),
            (p: any) => (p.activeRun.deliveries[0].id = -1),
            (p: any) => (p.activeRun.deliveries[0].rescueXp = 15),
        ]) {
            const bad = JSON.parse(JSON.stringify(c));
            mutation(bad);
            assert.equal(parseCampaign(JSON.stringify(bad)), null);
        }
        const loaded = parseCampaign(JSON.stringify(c))!;
        assert.deepEqual(loaded.bank, c.bank);
        finishRun(loaded, true, { ore: 0, parts: 0 }, 60, 'dock');
        assert.deepEqual(loaded.bank, c.bank);
    } finally {
        sim.dispose();
    }
});
