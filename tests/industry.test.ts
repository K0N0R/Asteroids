import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    storageCapacity,
    storageUsed,
} from '../frontend/game/state/campaign';
import {
    advanceCrew,
    canQueueJob,
    cancelJob,
    installCargoBay,
    jobInputs,
    jobStorage,
    queueJob,
} from '../frontend/game/state/crew';
import { resourceTotal } from '../frontend/game/state/resources';
import { JOBS, type JobKind } from '../frontend/game/config';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const empty = { ore: 0, parts: 0 };
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    c.crew.mechanic = true;
    return c;
}
function produce(c: ReturnType<typeof ready>, kind: JobKind) {
    assert.ok(queueJob(c, kind));
    assert.ok(beginRun(c, 1));
    assert.equal(advanceCrew(c, JOBS[kind].seconds), 1);
    assert.ok(finishRun(c, true, empty, 1, 'dock', c.activeRun!.repairKits));
    assert.ok(parseCampaign(JSON.stringify(c)));
}
function hold(s: MissionSimulation, input: FlightInput, frames = 180) {
    for (let f = 0; f < frames && !s.ended; f++) {
        s.step(input);
        s.events.length = 0;
    }
}
function fly(
    s: MissionSimulation,
    destination: { x: number; y: number } | (() => { x: number; y: number }),
) {
    for (let f = 0; f < 60 * 150 && !s.ended; f++) {
        const target = typeof destination === 'function' ? destination() : destination;
        const dx = target.x - s.position.x,
            dy = target.y - s.position.y,
            d = Math.hypot(dx, dy),
            e = angleDifference(Math.atan2(dy, dx), s.ship.rotation()),
            stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
        s.step({
            ...idle,
            target,
            turn: Math.max(-1, Math.min(1, e * 2.5)),
            thrust: Math.abs(e) < 0.3 && d > 75 + stop,
            brake: s.speed > 20 && (d < 60 + stop || Math.abs(e) > 0.6),
            mine: true,
        });
        s.events.length = 0;
        if (d < 100 && s.speed < 25) return;
    }
    assert.fail(`flight ${s.hull} ${JSON.stringify(s.position)}`);
}

test('industrial recipes enforce workforce, workshop and every input, share the mechanic queue and charge atomically', () => {
    const c = ready();
    c.bank = { ore: 30, parts: 10, copperOre: 8 };
    c.crew.mechanic = false;
    assert.equal(queueJob(c, 'smeltCopper'), false);
    c.crew.mechanic = true;
    c.station.workshop = 0;
    assert.equal(queueJob(c, 'smeltCopper'), false);
    c.station.workshop = 1;
    const before = structuredClone(c);
    assert.equal(queueJob(c, 'powerModule'), false);
    assert.deepEqual(c, before);
    assert.deepEqual(jobInputs('smeltCopper'), { ore: 0, parts: 0, copperOre: 4 });
    assert.equal(jobStorage('smeltCopper'), 4);
    assert.ok(queueJob(c, 'smeltCopper'));
    assert.equal(c.bank.copperOre, 4);
    assert.ok(queueJob(c, 'smeltCopper'));
    assert.ok(queueJob(c, 'refine'));
    const full = structuredClone(c);
    assert.equal(canQueueJob(c, 'kit'), false);
    assert.equal(queueJob(c, 'kit'), false);
    assert.deepEqual(c, full);
});

test('reservations protect full-storage refunds for all resource types and cancellation refunds exactly once', () => {
    const c = ready();
    c.bank = { ore: 140, parts: 0, copperOre: 8 };
    assert.ok(queueJob(c, 'smeltCopper'));
    assert.equal(storageUsed(c), 148);
    beginRun(c, 1);
    finishRun(c, true, { ore: 100, parts: 0 }, 1, 'dock', c.activeRun!.repairKits);
    assert.equal(storageUsed(c), 150);
    const id = c.crew.jobs[0].id;
    assert.ok(cancelJob(c, id));
    assert.equal(c.bank.copperOre, 8);
    assert.equal(storageUsed(c), 150);
    const bank = { ...c.bank };
    assert.equal(cancelJob(c, id), false);
    assert.deepEqual(c.bank, bank);
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('manufacturing advances only in a flight, conserves excess work and never repeats outputs after save/reload', () => {
    const c = ready();
    c.bank = { ore: 20, parts: 10, copperOre: 8 };
    queueJob(c, 'smeltCopper');
    queueJob(c, 'smeltCopper');
    assert.equal(advanceCrew(c, 500), 0);
    assert.equal(c.bank.conductors, undefined);
    beginRun(c, 1);
    assert.equal(advanceCrew(c, 50), 1);
    assert.equal(c.bank.conductors, 2);
    assert.equal(c.crew.jobs[0].remaining, 40);
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.ok(restored);
    assert.equal(advanceCrew(restored, 40), 1);
    assert.equal(restored.bank.conductors, 4);
    assert.equal(advanceCrew(restored, 100), 0);
    assert.equal(restored.bank.conductors, 4);
});

test('copper and manufactured inventory count toward storage and are discarded by death or mission abort', () => {
    const c = ready();
    c.bank = { ore: 0, parts: 0, copperOre: 5, conductors: 2, powerModules: 1, storageFrames: 1 };
    assert.equal(storageUsed(c), 9);
    beginRun(c, 1);
    const r = finishRun(c, false, { ore: 0, parts: 0, copperOre: 10 }, 5, 'lost')!;
    assert.equal(r.success, false);
    assert.equal(c.bank.copperOre, 5);
    const d = ready();
    beginRun(d, 1, null, false, 'earth-relay');
    d.activeRun!.mission!.aborted = true;
    const aborted = finishRun(
        d,
        true,
        { ore: 0, parts: 0, copperOre: 10 },
        1,
        'dock',
        d.activeRun!.repairKits,
    )!;
    assert.deepEqual(aborted.cargo, empty);
    assert.equal(d.bank.copperOre, undefined);
});

test('overflow accounts for every resource and reserves valuable products ahead of common ore', () => {
    const c = ready();
    c.bank = { ore: 148, parts: 0 };
    beginRun(c, 1);
    const r = finishRun(
        c,
        true,
        { ore: 4, parts: 0, copperOre: 2, powerModules: 1 },
        1,
        'dock',
        c.activeRun!.repairKits,
    )!;
    assert.equal(c.bank.powerModules, 1);
    assert.equal(c.bank.copperOre, 1);
    assert.equal(c.bank.ore, 148);
    assert.equal(r.overflow, 1);
    assert.equal(
        c.story!.progress['earth-supply'],
        4,
        'the delivery first funds its active supply task',
    );
    assert.equal(storageUsed(c), 150);
});

test('cargo bay consumes its actual construction and mounting cost, expands storage and enforces limit and active-run lock', () => {
    const c = ready();
    c.bank = { ore: 60, parts: 6, storageFrames: 3 };
    assert.ok(installCargoBay(c));
    assert.equal(storageCapacity(c), 350);
    assert.equal(c.bank.storageFrames, 2);
    assert.equal(c.bank.ore, 40);
    beginRun(c, 1);
    const before = structuredClone(c);
    assert.equal(installCargoBay(c), false);
    assert.deepEqual(c, before);
    finishRun(c, true, empty, 1, 'dock', c.activeRun!.repairKits);
    assert.ok(installCargoBay(c));
    assert.ok(installCargoBay(c));
    assert.equal(storageCapacity(c), 750);
    assert.equal(installCargoBay(c), false);
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('current save validates all material quantities and cargo-bay bounds and rejects the previous campaign format', () => {
    for (const field of ['copperOre', 'conductors', 'powerModules', 'storageFrames'])
        for (const n of [-1, 0.5, '1', null]) {
            const c = ready();
            (c.bank as Record<string, unknown>)[field] = n;
            assert.equal(parseCampaign(JSON.stringify(c)), null);
        }
    const c = ready();
    c.station.cargoBays = 4;
    assert.equal(parseCampaign(JSON.stringify(c)), null);
    assert.equal(parseCampaign(JSON.stringify({ ...ready(), version: 37 })), null);
    assert.equal(resourceTotal({ ore: 2, parts: 3, copperOre: 4, powerModules: 1 }), 10);
});

test('stock Prospector mines real copper, returns it and feeds the complete component-module-construction-storage chain', () => {
    const c = ready();
    c.bank = { ore: 70, parts: 12 };
    for (let sortie = 0; sortie < 6 && (c.bank.copperOre ?? 0) < 8; sortie++) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            const veins = [...s.rocks.values()]
                .filter((r) => r.copper && r.radius === 34)
                .slice(0, 2);
            assert.equal(veins.length, 2);
            for (const rock of veins) {
                fly(s, () =>
                    s.rocks.has(rock.id)
                        ? { x: rock.body.translation().x * 100, y: rock.body.translation().y * 100 }
                        : rock.previous,
                );
                for (let f = 0; f < 1800 && s.rocks.has(rock.id) && !s.ended; f++) {
                    s.step({
                        ...idle,
                        target: {
                            x: rock.body.translation().x * 100,
                            y: rock.body.translation().y * 100,
                        },
                        mine: true,
                    });
                    s.events.length = 0;
                }
                assert.equal(s.rocks.has(rock.id), false);
                hold(s, idle);
            }
            assert.ok((s.cargo.copperOre ?? 0) >= 2);
            assert.ok(s.cargoUsed <= s.cargoCapacity);
            fly(s, { x: 0, y: 0 });
            hold(s, { ...idle, interact: true });
            assert.equal(s.ended, 'returned');
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, s.missionReport);
        } finally {
            s.dispose();
        }
    }
    assert.ok((c.bank.copperOre ?? 0) >= 8);
    produce(c, 'smeltCopper');
    produce(c, 'smeltCopper');
    assert.equal(c.bank.conductors, 4);
    produce(c, 'powerModule');
    produce(c, 'powerModule');
    assert.equal(c.bank.powerModules, 2);
    produce(c, 'storageFrame');
    assert.equal(c.bank.storageFrames, 1);
    assert.ok(installCargoBay(c));
    assert.equal(storageCapacity(c), 350);
    assert.ok(parseCampaign(JSON.stringify(c)));
});
