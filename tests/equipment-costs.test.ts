import { HULL_CONSTRUCTION } from '../frontend/game/state/fleetConstruction';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newCampaign,
    buyUpgrade,
    newShip,
    scrapRefund,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { MODULE_PARTS, WEAPON_PARTS } from '../frontend/game/state/equipmentCosts';
import { RESOURCE_IDS, RESOURCES } from '../frontend/game/state/resources';
import { equipWeapon } from '../frontend/game/state/weapons';

test('every equipment recipe uses manufactured parts rather than raw elements or materials', () => {
    for (const bill of [...Object.values(MODULE_PARTS), WEAPON_PARTS.pulse, WEAPON_PARTS.rail]) {
        assert.ok(Object.keys(bill).length >= 2);
        for (const [id, count] of Object.entries(bill)) {
            assert.equal(RESOURCES[id as keyof typeof RESOURCES].category, 'CZĘŚCI');
            assert.ok(Number.isSafeInteger(count) && count > 0);
        }
    }
});
test('each missing weapon part prevents the whole payment; huge raw stocks cannot substitute', () => {
    for (const weapon of ['pulse', 'rail'] as const) {
        for (const id of Object.keys(WEAPON_PARTS[weapon])) {
            const c = newCampaign();
            c.station.workshop = 2;
            c.bank = {
                ore: 1_000_000,
                parts: 0,
                crystals: 1_000_000,
                ...WEAPON_PARTS[weapon],
                [id]: 0,
            };
            const before = JSON.stringify(c);
            assert.equal(equipWeapon(c, weapon), false);
            assert.equal(JSON.stringify(c), before);
        }
    }
});
test('equipment refunds sum investment before rounding and never refund raw elements', () => {
    const c = newCampaign();
    c.station.workshop = 2;
    c.bank = {
        ore: 0,
        parts: 100,
        electronics: 100,
        storageFrames: 100,
        propulsion: 100,
        powerModules: 100,
    };
    const initial = { ...c.bank };
    for (const module of Object.keys(MODULE_PARTS) as (keyof typeof MODULE_PARTS)[])
        for (let level = 0; level < 3; level++) assert.ok(buyUpgrade(c, module));
    assert.ok(equipWeapon(c, 'pulse'));
    assert.ok(equipWeapon(c, 'rail'));
    const bare = newShip(99);
    const zero = scrapRefund(bare);
    // Include the hull in the same sum to verify odd contributions round only once.
    const refund = scrapRefund(c.ship!);
    for (const id of RESOURCE_IDS) {
        const spent = (initial[id] ?? 0) - (c.bank[id] ?? 0);
        assert.equal(
            refund[id] ?? 0,
            Math.floor(((HULL_CONSTRUCTION.prospector[id] ?? 0) + spent) / 2),
            id,
        );
    }
    assert.equal(refund.ore, zero.ore);
    assert.equal(refund.crystals, undefined);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    assert.equal(parseCampaign(JSON.stringify({ ...c, version: 51 })), null);
});
