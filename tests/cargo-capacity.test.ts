import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HULLS, cargoCapacity, type HullId } from '../frontend/game/config';
import { newCampaign, newShip, capacity } from '../frontend/game/state/campaign';
import { moduleComparison } from '../frontend/game/ui/modulePreview';
const previous: Record<HullId, number> = {
    prospector: 40,
    swift: 24,
    mule: 110,
    fighter: 30,
    tug: 60,
    falcon: 60,
    widmo: 24,
    atlas: 150,
    harpoon: 75,
    aegis: 60,
    stinger: 20,
    phoenix: 55,
    raider: 30,
    lancer: 30,
};
test('all fourteen hulls gain 25 percent base cargo and UI shares the non-compounding upgrade progression', () => {
    const c = newCampaign();
    for (const hull of Object.keys(previous) as HullId[]) {
        const base = Math.ceil(previous[hull] * 1.25);
        assert.equal(HULLS[hull].cargo, base);
        c.ship = newShip(1, hull);
        for (const [level, multiplier] of [1, 1.25, 1.5, 2].entries()) {
            c.ship.cargo = level;
            const expected = Math.ceil(base * multiplier);
            assert.equal(capacity(c), expected);
            assert.equal(cargoCapacity(hull, level), expected);
            assert.equal(
                moduleComparison({ ...c.ship, cargo: 0 }, 'cargo', level).after,
                `${expected}`,
            );
        }
    }
});
