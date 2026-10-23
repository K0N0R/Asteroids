import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS } from '../frontend/game/state/story';
import {
    manufacture,
    productionLock,
    maxProduction,
    type ProductionScope,
} from '../frontend/game/state/production';
import { transferLunarResource } from '../frontend/game/state/lunarIndustry';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MOON } from '../frontend/game/worlds/moon';
before(async () => RAPIER.init());
const idle = {
    target: MOON.construction,
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(hull: 'prospector' | 'mule' = 'prospector') {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    c.repairKits = 0;
    c.ship!.hull = hull;
    for (const t of STORY_TASKS.filter(
        (t) =>
            (t.sector === 'earth' && t.act === 1 && t.required) ||
            t.id === 'lunar-survey' ||
            [
                'lunar-hull',
                'lunar-machinery',
                'lunar-electronics',
                'lunar-power',
                'lunar-life-support',
            ].includes(t.id),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'lunar';
    beginRun(c, 1);
    const sim = new MissionSimulation(c, c.activeRun!.seed);
    sim.area = 'surface';
    c.activeRun!.area = 'surface';
    sim.ship.setTranslation(
        { x: MOON.construction.x / 100, y: (MOON.construction.y + 100) / 100 },
        true,
    );
    sim.ship.setLinvel({ x: 0, y: 0 }, true);
    const scope: ProductionScope = { site: 'lunar', canAccess: () => sim.canUseLunarStationFor(c) };
    assert.ok(sim.canUseLunarStation);
    return { c, sim, scope };
}
test('local laboratory and workshop spend and store only the lunar inventory', () => {
    const { c, sim, scope } = ready();
    try {
        c.bank = { ore: 500, parts: 20, hydrogen: 20, oxygen: 20 };
        c.lunarStation.bank = { ore: 0, parts: 0, hydrogen: 4, oxygen: 2, steel: 2, conductors: 1 };
        const remote = { ...c.bank };
        assert.ok(manufacture(c, 'water', 2, scope));
        assert.equal(c.lunarStation.bank.water, 2);
        assert.ok(manufacture(c, 'plating', 1, scope));
        assert.ok(manufacture(c, 'kit', 1, scope));
        assert.equal(c.repairKits, 1);
        assert.equal(sim.repairKits, 1);
        assert.deepEqual(c.bank, remote);
        const before = structuredClone(c);
        assert.equal(manufacture(c, 'water'), false);
        assert.deepEqual(c, before);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    } finally {
        sim.dispose();
    }
});
test('production checks physical access on every action and never borrows remote ingredients', () => {
    const { c, sim, scope } = ready();
    try {
        c.bank = { ore: 999, parts: 999, hydrogen: 999, oxygen: 999 };
        const before = structuredClone(c);
        assert.equal(manufacture(c, 'water', 1, scope), false);
        assert.deepEqual(c, before);
        c.lunarStation.bank.hydrogen = 4;
        c.lunarStation.bank.oxygen = 2;
        assert.equal(maxProduction(c, 'water', scope), 2);
        for (const invalid of [0, -1, 0.5, Number.MAX_SAFE_INTEGER]) {
            const saved = structuredClone(c);
            assert.equal(manufacture(c, 'water', invalid, scope), false);
            assert.deepEqual(c, saved);
        }
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        const saved = structuredClone(c);
        assert.ok(productionLock(c, 'water', 1, scope));
        assert.equal(maxProduction(c, 'water', scope), 0);
        assert.equal(manufacture(c, 'water', 1, scope), false);
        assert.deepEqual(c, saved);
    } finally {
        sim.dispose();
    }
});
test('lunar technology cannot inherit the remote workshop tier or bypass research', () => {
    const { c, sim, scope } = ready();
    try {
        c.station.workshopLevel = 3;
        c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
        c.lunarStation.bank = {
            ore: 0,
            parts: 20,
            aluminium: 20,
            magnesium: 10,
            mercuryOre: 40,
            steel: 20,
        };
        assert.equal(manufacture(c, 'alloy', 1, scope), false);
        for (const id of ['lunar-foundation', 'lunar-installations']) {
            const t = STORY_TASKS.find((t) => t.id === id)!;
            c.story!.progress[id] = t.target;
            c.story!.claimed.push(id);
        }
        assert.ok(manufacture(c, 'alloy', 1, scope));
        assert.equal(manufacture(c, 'kineticPlate', 1, scope), false);
    } finally {
        sim.dispose();
    }
});
test('local transfers preserve capacity, freight ownership and deposited stock after loss', () => {
    const { c, sim } = ready();
    try {
        sim.cargo.ore = 10;
        assert.ok(transferLunarResource(c, sim, 'ore', 10));
        assert.equal(c.lunarStation.bank.ore, 10);
        assert.equal(c.activeRun!.unloaded!.ore, 10);
        assert.ok(transferLunarResource(c, sim, 'ore', 7, true));
        assert.equal(c.activeRun!.freight!.ore, 7);
        assert.ok(transferLunarResource(c, sim, 'ore', 7));
        assert.equal(c.activeRun!.unloaded!.ore, 10);
        const saved = structuredClone(c);
        assert.equal(transferLunarResource(c, sim, 'ore', 41, true), false);
        assert.deepEqual(c, saved);
        assert.equal(transferLunarResource(newStoryCampaign(), sim, 'ore', 1, true), false);
        assert.ok(transferLunarResource(c, sim, 'ore', 3, true));
        finishRun(c, false, sim.cargo, 1, 'loss');
        assert.equal(c.lunarStation.bank.ore, 7);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        assert.equal(parseCampaign(JSON.stringify({ ...c, version: 54 })), null);
    } finally {
        sim.dispose();
    }
});
test('withdrawals cannot overfill a ship or overflow a station quantity', () => {
    const { c, sim } = ready();
    try {
        c.lunarStation.bank.ore = 100;
        sim.cargo.parts = 39;
        const saved = structuredClone(c);
        assert.equal(transferLunarResource(c, sim, 'ore', 2, true), false);
        assert.deepEqual(c, saved);
        assert.ok(transferLunarResource(c, sim, 'ore', 1, true));
        c.lunarStation.bank.ore = Number.MAX_SAFE_INTEGER;
        const stock = { ...sim.cargo };
        assert.equal(transferLunarResource(c, sim, 'ore', 1), false);
        assert.deepEqual(sim.cargo, stock);
    } finally {
        sim.dispose();
    }
});
test('locally manufactured repair kits are immediately shared and Mule repair does not spend them', () => {
    const { c, sim, scope } = ready();
    try {
        c.lunarStation.bank.parts = 3;
        c.lunarStation.bank.conductors = 3;
        assert.ok(manufacture(c, 'kit', 3, scope));
        assert.equal(c.repairKits, 3);
        assert.equal(sim.repairKits, 3);
        assert.equal(Object.hasOwn(c.activeRun!, 'repairKits'), false);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        sim.dispose();
    }
    const mule = ready('mule');
    try {
        mule.c.repairKits = 1;
        mule.sim.hull = mule.sim.maxHull - 5;
        for (let i = 0; i < 330; i++) mule.sim.step({ ...idle, repair: true });
        assert.equal(mule.c.repairKits, 1);
        assert.equal(mule.sim.hull, mule.sim.maxHull);
    } finally {
        mule.sim.dispose();
    }
});

test('holding E requests the local station once and rejects access during movement or before modules', () => {
    const { c, sim } = ready();
    try {
        for (let i = 0; i < 125; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.lunarStationRequested, true);
        sim.lunarStationRequested = false;
        for (let i = 0; i < 125; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.lunarStationRequested, false);
        sim.step(idle);
        c.story!.claimed = c.story!.claimed.filter((id) => id !== 'lunar-power');
        c.story!.progress['lunar-power'] = 0;
        assert.equal(sim.canUseLunarStation, false);
        for (let i = 0; i < 125; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.lunarStationRequested, false);
    } finally {
        sim.dispose();
    }
});
