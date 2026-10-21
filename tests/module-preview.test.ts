import { fundEquipment } from './fleet-fixtures';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCampaign, newShip, buyUpgrade, upgradePrice } from '../frontend/game/state/campaign';
import { MODULE_KEYS, previewModules, moduleComparison } from '../frontend/game/ui/modulePreview';

test('comparing one module preserves the campaign and every other installed module', () => {
    const c = newCampaign();
    c.ship!.engine = 2;
    c.ship!.cargo = 1;
    c.ship!.armor = 1;
    const saved = JSON.stringify(c);
    for (const key of MODULE_KEYS) {
        const preview = previewModules(c.ship!, 'single', key, 3);
        assert.notEqual(preview, c.ship);
        assert.equal(preview[key], 3);
        for (const other of MODULE_KEYS)
            if (other !== key) assert.equal(preview[other], c.ship![other]);
    }
    assert.equal(JSON.stringify(c), saved);
});

test('reset and complete preview preserve hull identity and clamp individual levels', () => {
    const ship = { ...newShip(7, 'widmo'), armor: 2, handling: 1 };
    assert.deepEqual(previewModules(ship, 'current', 'armor', 0), ship);
    const all = previewModules(ship, 'all', 'engine', 0);
    for (const key of MODULE_KEYS) assert.equal(all[key], 3);
    assert.equal(all.id, 7);
    assert.equal(all.hull, 'widmo');
    assert.equal(previewModules(ship, 'single', 'armor', -2).armor, 0);
    assert.equal(previewModules(ship, 'single', 'armor', 9).armor, 3);
    assert.equal(ship.armor, 2);
});

test('a maximum preview never changes the price or level of a real upgrade', () => {
    const c = newCampaign();
    c.ship!.armor = 1;
    c.station.workshop = 2;
    c.bank = { ore: 1000, parts: 1000, crystals: 100 };
    const price = upgradePrice(c, 'armor');
    const visual = previewModules(c.ship!, 'all', 'armor', 3);
    assert.equal(visual.armor, 3);
    assert.deepEqual(upgradePrice(c, 'armor'), price);
    fundEquipment(c, upgradePrice(c, 'armor'));
    assert.ok(buyUpgrade(c, 'armor'));
    assert.equal(c.ship!.armor, 2);
    assert.equal(c.bank.ore, 1000 - price.ore);
    assert.equal(c.bank.parts, 1000);
    assert.equal(c.bank.storageFramesII, 0);
});

test('comparison uses the selected hull specialization including cooldown reductions', () => {
    assert.deepEqual(moduleComparison(newShip(1, 'prospector'), 'armor', 2), {
        title: 'Kadłub',
        before: '65',
        after: '115',
    });
    assert.equal(moduleComparison(newShip(1, 'atlas'), 'drill', 3).after, '4');
    assert.equal(moduleComparison(newShip(1, 'widmo'), 'drill', 3).after, '7.5 s');
    assert.equal(moduleComparison(newShip(1, 'widmo'), 'handling', 2).after, '97.5');
    assert.equal(moduleComparison(newShip(1, 'aegis'), 'handling', 2).after, '75');
    assert.equal(
        moduleComparison(newShip(1, 'swift'), 'engine', 3).after,
        `${Number((1500 * 1.45).toFixed(2))}`,
    );
});
