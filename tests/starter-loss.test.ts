import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newCampaign,
    newShip,
    beginRun,
    finishRun,
    emergencyKit,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { createRecoverySignal, recoveryChances } from '../frontend/game/state/recovery';

test('Prospector is always destroyed at every armor tier while pilot survival stays independent', () => {
    const c = newCampaign();
    let capsules = 0,
        none = 0;
    for (const armor of [0, 1, 2, 3])
        for (let seed = 0; seed < 200; seed++) {
            const ship = { ...newShip(1, 'prospector'), armor };
            assert.equal(recoveryChances(ship, c.pilots[0]).ship, 0);
            const signal = createRecoverySignal(ship, c.pilots[0], seed, { x: 1000, y: 0 });
            if (signal) {
                assert.equal(signal.ship, null);
                assert.ok(signal.pilot);
                capsules++;
            } else none++;
        }
    assert.ok(capsules > 0 && none > 0);
    assert.ok(recoveryChances(newShip(1, 'swift'), c.pilots[0]).ship > 0);
});
test('repeated free starter losses never leave a recyclable hull or award parts', () => {
    const c = newCampaign();
    for (let i = 0; i < 8; i++) {
        if (!c.ship || !c.pilots.length) emergencyKit(c);
        const parts = c.bank.parts;
        assert.equal(c.ship!.hull, 'prospector');
        assert.ok(beginRun(c, 17 + i));
        const result = finishRun(c, false, { ore: 0, parts: 0 }, 1, 'signal lost');
        assert.ok(result);
        assert.equal(c.ship, null);
        assert.ok(c.recoverySignals.every((s) => s.ship === null));
        assert.equal(c.bank.parts, parts);
        assert.equal(result.reward.parts, 0);
        assert.ok(parseCampaign(JSON.stringify(c)));
    }
});
test('saved Prospector wrecks lose the hull but keep surviving capsules', () => {
    const c = newCampaign(),
        ship = structuredClone(c.ship!);
    let seed = 0;
    while (!createRecoverySignal(ship, c.pilots[0], seed, { x: 1000, y: 0 })?.pilot) seed++;
    beginRun(c, seed);
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost', 0, { lossPosition: { x: 1000, y: 0 } });
    c.recoverySignals[0].ship = ship;
    const json = JSON.stringify(c),
        loaded = parseCampaign(json);
    assert.ok(loaded);
    assert.equal(loaded.recoverySignals.length, 1);
    assert.equal(loaded.recoverySignals[0].ship, null);
    assert.ok(loaded.recoverySignals[0].pilot);
    assert.equal(loaded.bank.parts, c.bank.parts);
    assert.equal(parseCampaign(JSON.stringify(loaded))!.recoverySignals[0].ship, null);
});
test('saved empty starter wreck beacons disappear without leaving a dangling active recovery target', () => {
    const c = newCampaign(),
        ship = structuredClone(c.ship!);
    let seed = 0;
    while (createRecoverySignal(ship, c.pilots[0], seed, { x: 1000, y: 0 })?.pilot) seed++;
    beginRun(c, seed);
    finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost');
    c.recoverySignals.push({ id: ship.id, seed, x: 1000, y: 0, pilot: null, ship });
    emergencyKit(c);
    assert.ok(beginRun(c, seed, ship.id));
    const loaded = parseCampaign(JSON.stringify(c));
    assert.ok(loaded);
    assert.equal(loaded.recoverySignals.length, 0);
    assert.equal(loaded.activeRun!.recoveryId, null);
});
