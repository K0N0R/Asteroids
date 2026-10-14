import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    buyShip,
    emergencyKit,
    finishRun,
    hirePilot,
    newCampaign,
    parseCampaign,
    pilotSlots,
    scrapRefund,
} from '../frontend/game/state/campaign';
import { createRecoverySignal, recoveryChances } from '../frontend/game/state/recovery';
import { GAME, RECOVERY } from '../frontend/game/config';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';

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

function lostCampaign() {
    const c = newCampaign();
    c.ship!.engine = 1;
    c.ship!.armor = 1;
    const pilot = c.pilots[0],
        ship = c.ship!;
    const position = { x: 1200, y: -700 };
    let seed = 0;
    for (; seed < 1000; seed++) {
        const signal = createRecoverySignal(ship, pilot, seed, position);
        if (signal?.pilot && signal.ship) break;
    }
    assert.ok(seed < 1000);
    beginRun(c, seed);
    finishRun(c, false, { ore: 20, parts: 3 }, 5, 'loss', 0, { lossPosition: position });
    return c;
}

test('survival is deterministic and improved by pilot training, hull quality and armor', () => {
    const c = newCampaign(),
        ship = c.ship!,
        pilot = c.pilots[0];
    const base = recoveryChances(ship, pilot);
    assert.ok(recoveryChances({ ...ship, armor: 1 }, pilot).pilot > base.pilot);
    assert.ok(recoveryChances({ ...ship, hull: 'mule' }, pilot).ship > base.ship);
    assert.ok(recoveryChances(ship, { ...pilot, archetype: 2 }).pilot > base.pilot);
    assert.ok(recoveryChances(ship, { ...pilot, archetype: 3 }).pilot < base.pilot);
    let none = false,
        both = false;
    for (let seed = 0; seed < 100; seed++) {
        const first = createRecoverySignal(ship, pilot, seed, { x: 0, y: 0 });
        assert.deepEqual(createRecoverySignal(ship, pilot, seed, { x: 0, y: 0 }), first);
        if (!first) none = true;
        if (first?.pilot && first.ship) both = true;
        if (first) assert.ok(Math.abs(Math.hypot(first.x, first.y) - 650) < 1e-6);
        const far = createRecoverySignal(ship, pilot, seed, { x: -99999, y: 99999 });
        if (far) assert.ok(Math.hypot(far.x, far.y) <= GAME.sectorRadius - 299);
    }
    assert.ok(none && both);
});

test('loss preserves a recoverable identity and loadout but never deposits lost cargo', () => {
    const c = lostCampaign();
    assert.deepEqual(c.bank, { ore: 0, parts: 0 });
    assert.equal(c.ship, null);
    assert.equal(c.pilots.length, 0);
    assert.equal(c.lostPilots, 0);
    assert.equal(pilotSlots(c), 1);
    assert.equal(c.recoverySignals[0].ship!.engine, 1);
    assert.equal(c.recoverySignals[0].ship!.id, 1);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(finishRun(c, false, { ore: 0, parts: 0 }, 0, 'again'), null);
    assert.equal(c.recoverySignals.length, 1);
});

test('rescue uses the original seed and deposits the pilot and ship only on safe return once', () => {
    const c = lostCampaign(),
        signal = c.recoverySignals[0];
    emergencyKit(c);
    const bank = { ...c.bank },
        kits = c.repairKits;
    assert.equal(beginRun(c, 9999, 9999), false);
    assert.deepEqual(c.bank, bank);
    assert.equal(c.repairKits, kits);
    assert.ok(beginRun(c, 9999, signal.id));
    assert.equal(c.activeRun!.seed, signal.seed);
    assert.equal(c.reserveShips.length, 0);
    assert.equal(c.pilots.length, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 5, 'dock', 0, { securedId: signal.id });
    assert.equal(c.recoverySignals.length, 0);
    assert.deepEqual(c.reserveShips[0], signal.ship);
    assert.ok(c.pilots.some((p) => p.id === signal.pilot!.id));
    assert.equal(c.selectedPilot, 2);
    assert.equal(
        finishRun(c, true, { ore: 0, parts: 0 }, 5, 'dock', 0, { securedId: signal.id }),
        null,
    );
    assert.equal(c.reserveShips.length, 1);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('an early return or unrelated mission cannot claim the recovery target', () => {
    const c = lostCampaign(),
        signal = c.recoverySignals[0];
    emergencyKit(c);
    beginRun(c, 999);
    finishRun(c, true, { ore: 0, parts: 0 }, 5, 'dock', 0, { securedId: signal.id });
    assert.equal(c.recoverySignals.length, 1);
    assert.equal(c.reserveShips.length, 0);
    beginRun(c, 999, signal.id);
    finishRun(c, true, { ore: 0, parts: 0 }, 5, 'dock');
    assert.equal(c.recoverySignals.length, 1);
    assert.equal(c.pilots.length, 1);
});

test('a failed or refreshed rescue loses its target, including a pilot already secured on tow', () => {
    const c = lostCampaign(),
        target = c.recoverySignals[0];
    emergencyKit(c);
    beginRun(c, 1, target.id);
    c.activeRun!.lastPosition = { x: 800, y: -400 };
    const loaded = parseCampaign(JSON.stringify(c))!;
    const result = finishRun(loaded, false, { ore: 10, parts: 1 }, 0, 'reload', 0, {
        securedId: target.id,
    });
    assert.ok(!loaded.recoverySignals.some((s) => s.id === target.id));
    assert.ok(!loaded.pilots.some((p) => p.id === target.pilot!.id));
    assert.ok(!loaded.reserveShips.some((s) => s.id === target.id));
    assert.ok(loaded.lostPilots >= 1);
    assert.match(result!.recoveryText, /poprzedniej akcji/);
    assert.deepEqual(loaded.bank, { ore: 0, parts: 0 });
    assert.deepEqual(parseCampaign(JSON.stringify(loaded)), loaded);
});

test('full hangar converts the rescued hull to materials with storage overflow reported', () => {
    const c = lostCampaign(),
        signal = c.recoverySignals[0];
    emergencyKit(c);
    c.bank.ore = 100;
    while (c.reserveShips.length < 5) assert.ok(buyShip(c));
    const refund = scrapRefund(signal.ship!);
    c.bank = { ore: 149, parts: 0 };
    beginRun(c, 7, signal.id);
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 5, 'dock', 0, { securedId: signal.id });
    assert.equal(c.reserveShips.length, 5);
    assert.equal(c.recoverySignals.length, 0);
    assert.equal(c.bank.ore + c.bank.parts, 150);
    assert.equal(result!.overflow, refund.ore + refund.parts - 1);
    assert.deepEqual(result!.reward, refund);
    assert.ok(c.pilots.some((p) => p.id === signal.pilot!.id));
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('missing pilots reserve roster slots and oldest signals expire at the bounded limit', () => {
    const c = lostCampaign();
    emergencyKit(c);
    c.bank.ore = 100;
    for (let i = 0; i < 6; i++) assert.ok(hirePilot(c, 1));
    assert.equal(pilotSlots(c), 8);
    assert.equal(hirePilot(c, 1), false);
    const chain = lostCampaign();
    for (let i = 0; i < 3; i++) {
        emergencyKit(chain);
        const ship = chain.ship!,
            pilot = chain.pilots[0];
        let seed = 0;
        while (!createRecoverySignal(ship, pilot, seed, { x: 1000, y: 0 })?.pilot) seed++;
        beginRun(chain, seed);
        finishRun(chain, false, { ore: 0, parts: 0 }, 0, 'loss');
    }
    assert.equal(chain.recoverySignals.length, RECOVERY.signalLimit);
    assert.equal(chain.lostPilots, 1);
    assert.ok(!chain.recoverySignals.some((s) => s.id === 1));
    assert.deepEqual(parseCampaign(JSON.stringify(chain)), chain);
});

test('v3 migration keeps fleet, crew and interrupted marker without inventing past wrecks', () => {
    const c = newCampaign();
    c.bank.ore = 15;
    buyShip(c);
    c.crew.mechanic = true;
    beginRun(c, 123);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 3;
    delete old.recoverySignals;
    delete old.activeRun.recoveryId;
    delete old.activeRun.lastPosition;
    const loaded = parseCampaign(JSON.stringify(old))!;
    assert.ok(loaded);
    assert.equal(loaded.version, 15);
    assert.deepEqual(
        loaded.reserveShips,
        c.reserveShips.map((ship) => ({
            ...ship,
            hull: ship.hull === 'prospector' ? 'fighter' : ship.hull,
        })),
    );
    assert.deepEqual(loaded.crew, c.crew);
    assert.deepEqual(loaded.recoverySignals, []);
    assert.equal(loaded.activeRun!.seed, 123);
    assert.equal(loaded.activeRun!.recoveryId, null);
});

test('recovery save rejects duplicate identities, invalid positions and mismatched run targets', () => {
    const c = lostCampaign();
    emergencyKit(c);
    beginRun(c, 123, c.recoverySignals[0].id);
    const bad = (mutate: (p: any) => void) => {
        // Fixture mutations deliberately test malformed data.
        const p = JSON.parse(JSON.stringify(c));
        mutate(p);
        assert.equal(parseCampaign(JSON.stringify(p)), null);
    };
    bad((p) => p.recoverySignals.push(p.recoverySignals[0]));
    bad((p) => {
        p.recoverySignals[0].pilot.id = p.pilots[0].id;
    });
    bad((p) => {
        p.recoverySignals[0].ship.hull = '__proto__';
    });
    bad((p) => {
        p.recoverySignals[0].x = 99999;
    });
    bad((p) => {
        p.recoverySignals[0].ship = null;
        p.recoverySignals[0].pilot = null;
    });
    bad((p) => {
        p.activeRun.recoveryId = 999;
    });
    bad((p) => {
        p.activeRun.seed++;
    });
    bad((p) => {
        p.activeRun.lastPosition.x = '100';
    });
});

test('live pickup requires uninterrupted calm flight and remains possible with a full cargo hold', () => {
    const c = lostCampaign(),
        signal = c.recoverySignals[0];
    emergencyKit(c);
    beginRun(c, 999, signal.id);
    const sim = new MissionSimulation(c, c.activeRun!.seed);
    try {
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        sim.ship.setTranslation({ x: signal.x / 100, y: signal.y / 100 }, true);
        sim.cargo.ore = sim.cargoCapacity;
        for (let i = 0; i < 180; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.recoverySecured, false);
        assert.ok(sim.recoveryProgress > 2.9);
        sim.step({ ...idle, interact: true, fire: true });
        assert.equal(sim.recoveryProgress, 0);
        sim.ship.setLinvel({ x: 2, y: 0 }, true);
        sim.step({ ...idle, interact: true });
        assert.equal(sim.recoveryProgress, 0);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 241; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.recoverySecured, true);
        assert.equal(c.reserveShips.length, 0);
        assert.equal(c.pilots.length, 1);
        assert.match(sim.context, /Aurory/);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        // Move the whole tow to the dock in this fixture; teleporting only the ship now stretches a physical rope.
        sim.salvage.towed!.body.setTranslation({ x: -1.4, y: 0 }, true);
        sim.salvage.towed!.body.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 80; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits, {
            securedId: signal.id,
        });
        assert.equal(c.reserveShips[0].id, signal.id);
        assert.equal(c.pilots.length, 2);
    } finally {
        sim.dispose();
    }
});
