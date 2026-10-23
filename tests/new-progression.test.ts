import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    newStoryCampaign,
    newCampaign,
    newShip,
    buyShip,
    buyUpgrade,
    emergencyKit,
    scrapRefund,
    parseCampaign,
    beginRun,
    finishRun,
    deliverSalvage,
} from '../frontend/game/state/campaign';
import {
    installStationProject,
    stationProjectLock,
} from '../frontend/game/state/stationProgression';
import { manufacture, productionLock } from '../frontend/game/state/production';
import { RECIPES, RECIPE_IDS, type ProcessRecipe } from '../frontend/game/state/chemistry';
import { RESOURCE_IDS } from '../frontend/game/state/resources';
import { PART_FAMILIES } from '../frontend/game/state/partTiers';
import { HULLS, type HullId } from '../frontend/game/config';
import { hullUnlocked } from '../frontend/game/state/fleetUnlocks';
import { syncStory, STORY_TASKS } from '../frontend/game/state/story';
import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import { packLunarShipment } from '../frontend/game/state/lunarShipment';
import { ShipAbilities } from '../frontend/game/systems/shipAbilities';
import { AnomalyExtraction } from '../frontend/game/systems/anomalyExtraction';
import { InteractionLatch } from '../frontend/game/systems/interactionTarget';

function fund(c: ReturnType<typeof newCampaign>) {
    for (const id of RESOURCE_IDS) c.bank[id] = 100000;
}
test('the first mission needs actual laboratory installation, not merely raw stock', () => {
    const c = newStoryCampaign();
    fund(c);
    assert.equal(c.station.laboratoryLevel, 0);
    assert.equal(c.station.workshopLevel, 0);
    syncStory(c);
    assert.equal(c.story!.claimed.includes('earth-supply'), false);
    const bank = structuredClone(c.bank);
    assert.equal(manufacture(c, 'water'), false);
    assert.deepEqual(c.bank, bank);
    assert.ok(installStationProject(c, 'laboratory'));
    syncStory(c);
    assert.ok(c.story!.claimed.includes('earth-supply'));
    assert.equal(c.bank.ore, bank.ore - 8);
    assert.ok(manufacture(c, 'water'));
    assert.equal(manufacture(c, 'electronics'), false);
    assert.match(stationProjectLock(c, 'workshop')!, /księżyc/);
});
test('the lunar equipment is producible from laboratory materials without a workshop', () => {
    const c = newStoryCampaign();
    c.station.laboratoryLevel = 1;
    c.bank = { ore: 8, parts: 0, carbon: 2, crystals: 4, oxygen: 10, hydrogen: 4 };
    assert.ok(manufacture(c, 'steel'));
    assert.ok(manufacture(c, 'steel'));
    assert.ok(manufacture(c, 'silica'));
    assert.ok(manufacture(c, 'water'));
    assert.deepEqual(
        LUNAR_PROCESSING.map((t) => c.bank[t.resource]),
        [8, 4, 2],
    );
    assert.equal(c.station.workshopLevel, 0);
    c.story!.claimed.push('lunar-survey');
    assert.ok(packLunarShipment(c));
    assert.equal(packLunarShipment(c), null);
    assert.deepEqual(
        LUNAR_PROCESSING.map((t) => c.bank[t.resource]),
        [0, 0, 0],
    );
});
test('surviving lunar Mule is awarded exactly once, and destroyed Mule never is', () => {
    for (const fate of ['active', 'destroyed'] as const) {
        const c = newStoryCampaign();
        c.story!.lunarMule = fate;
        c.story!.claimed.push('lunar-attack');
        syncStory(c);
        syncStory(c);
        assert.equal(
            c.reserveShips.filter((ship) => ship.hull === 'mule').length,
            fate === 'active' ? 1 : 0,
        );
        assert.equal(c.station.workshopLevel, 0);
        assert.equal(hullUnlocked(c, 'mule'), false);
        c.station.laboratoryLevel = 1;
        fund(c);
        assert.ok(installStationProject(c, 'workshop'));
        assert.equal(hullUnlocked(c, 'mule'), true);
    }
});
test('all projects follow tier and have no independent quest locks', () => {
    const c = newStoryCampaign();
    for (let tier = 0; tier <= 3; tier++) {
        c.station.workshopLevel = c.station.laboratoryLevel = tier;
        const actual = (Object.keys(HULLS) as HullId[]).filter((hull) => hullUnlocked(c, hull));
        assert.equal(actual.length, [0, 5, 8, 11][tier]);
        assert.ok(actual.every((hull) => HULLS[hull].workshop <= tier));
    }
});
test('Prospector is never manufactured, upgraded, switched to a paid variant, or recycled for profit', () => {
    const c = newStoryCampaign();
    c.station.workshopLevel = c.station.laboratoryLevel = 3;
    fund(c);
    const bank = structuredClone(c.bank);
    assert.equal(buyShip(c, 'prospector'), false);
    assert.equal(buyUpgrade(c, 'engine'), false);
    assert.deepEqual(scrapRefund(c.ship!), { ore: 0, parts: 0 });
    assert.deepEqual(c.bank, bank);
    c.ship = null;
    assert.ok(emergencyKit(c));
    assert.equal(c.ship!.hull, 'prospector');
    assert.equal(emergencyKit(c), false);
});
test('laboratory II requires Mercury, the adapter and a delivered sample; III requires Jupiter', () => {
    const c = newStoryCampaign();
    c.station.laboratoryLevel = c.station.workshopLevel = 1;
    fund(c);
    assert.equal(installStationProject(c, 'laboratory'), false);
    c.story!.claimed.push('mercury-technology');
    assert.equal(installStationProject(c, 'laboratory'), false);
    assert.ok(installStationProject(c, 'extraction'));
    assert.equal(installStationProject(c, 'laboratory'), false);
    c.station.anomalySampleDelivered = true;
    assert.ok(installStationProject(c, 'laboratory'));
    assert.equal(c.station.workshopLevel, 1);
    assert.ok(installStationProject(c, 'workshop'));
    assert.equal(installStationProject(c, 'laboratory'), false);
    c.story!.claimed.push('jupiter-observations');
    assert.ok(installStationProject(c, 'laboratory'));
    assert.ok(installStationProject(c, 'workshop'));
    const before = structuredClone(c);
    assert.equal(installStationProject(c, 'workshop'), false);
    assert.deepEqual(c, before);
});
test('twenty-one part recipes use direct materials and require their exact facility tier', () => {
    let count = 0;
    for (const ids of Object.values(PART_FAMILIES))
        for (let index = 0; index < 3; index++) {
            const recipeId = RECIPE_IDS.find((id) => RECIPES[id].output === ids[index])!;
            const recipe: ProcessRecipe = RECIPES[recipeId];
            const c = newCampaign();
            fund(c);
            c.station.laboratoryLevel = 3;
            c.station.workshopLevel = index;
            assert.equal(manufacture(c, recipeId), false);
            c.station.workshopLevel++;
            assert.ok(manufacture(c, recipeId));
            assert.equal(recipe.level, index + 1);
            assert.equal(
                Object.keys(recipe.inputs).some((id) =>
                    Object.values(PART_FAMILIES).some((family) =>
                        (family as readonly string[]).includes(id),
                    ),
                ),
                false,
            );
            if (index)
                assert.equal(
                    recipe.inputs[index === 1 ? 'stabilizedAnomaly' : 'resonantComposite'],
                    1,
                );
            count++;
        }
    assert.equal(count, 21);
    for (const removed of ['pureCopper', 'pureSilicon', 'oxygenGas', 'conductors'])
        assert.equal((RESOURCE_IDS as readonly string[]).includes(removed), false);
});
test('new saves validate the independent facility state and reject previous formats', () => {
    const c = newStoryCampaign();
    assert.ok(parseCampaign(JSON.stringify(c)));
    c.version = 66 as never;
    assert.equal(parseCampaign(JSON.stringify(c)), null);
    const d = newStoryCampaign();
    d.station.workshopLevel = 1;
    assert.equal(parseCampaign(JSON.stringify(d)), null);
});

test('salvage bonuses and recovered weapons cannot upgrade a starter through side paths', () => {
    const c = newCampaign();
    c.station.workshopLevel = c.station.laboratoryLevel = 3;
    c.reserveShips = Array.from({ length: 5 }, (_, i) => newShip(i + 2, 'prospector'));
    c.nextShipId = 7;
    assert.ok(beginRun(c, 719));
    for (let id = 1; id <= 40; id++) assert.ok(deliverSalvage(c, id, 'patrol'));
    assert.ok(
        c.reserveShips.every((ship) =>
            ['engine', 'handling', 'cargo', 'drill', 'armor', 'shield'].every(
                (key) => ship[key as keyof typeof ship] === 0,
            ),
        ),
    );
    assert.ok(
        finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, {
            data: ['outpost'],
            equipment: 'rail',
        }),
    );
    assert.deepEqual(c.ship!.weapons, ['standard']);
    assert.equal(c.ship!.weapon, 'standard');
    assert.ok(parseCampaign(JSON.stringify(c)));
});
test('keyboard abilities fire on rising edges, not on cooldown expiry while held', () => {
    const controller = new ShipAbilities('atlas');
    let fired = 0;
    const effect = () => {
        fired++;
        return true;
    };
    controller.tick(1 / 60, true, false, effect);
    for (let i = 0; i < 20; i++) controller.tick(1, true, false, effect);
    assert.equal(fired, 1);
    controller.tick(0, false, false, effect);
    controller.tick(0, true, false, effect);
    assert.equal(fired, 2);
    const tierOne = new ShipAbilities('tug');
    tierOne.tick(1, true, true, effect);
    assert.equal(fired, 2);
});
test('extraction requires active work, range, aim, room, and two seconds; stock regenerates per sortie', () => {
    const c = newStoryCampaign();
    c.story!.sector = 'mars';
    c.station.extraction = true;
    assert.equal(new AnomalyExtraction(c).nodes.length, 0);
    c.story!.claimed.push('mercury-technology');
    const extraction = new AnomalyExtraction(c),
        node = extraction.nodes[0];
    assert.equal(extraction.step(2, node, node, 180, false, 10), 0);
    assert.equal(extraction.step(2, node, node, 180, true, 3), 0);
    assert.equal(extraction.step(2, { x: node.x + 500, y: node.y }, node, 180, true, 10), 0);
    assert.equal(extraction.step(1, node, node, 180, true, 10), 0);
    assert.equal(extraction.step(1, node, node, 180, true, 10), 4);
    assert.equal(node.remaining, 28);
    assert.equal(new AnomalyExtraction(c).nodes[0].remaining, 32);
});
test('F keeps its initial target, and losing it never activates a neighbouring gate', () => {
    const latch = new InteractionLatch();
    const gate = { id: 'gate', kind: 'gate' as const, name: 'Śluza', x: 0, y: 0 };
    const wreck = { id: 'wreck', kind: 'tow' as const, name: 'Wrak', x: 30, y: 0 };
    assert.equal(latch.resolve(true, [gate, wreck], wreck)?.id, 'wreck');
    assert.equal(latch.resolve(true, [gate, wreck], gate)?.id, 'wreck');
    assert.equal(latch.resolve(true, [gate], gate), null);
    assert.equal(latch.resolve(true, [gate], gate), null);
    latch.resolve(false, [gate], gate);
    assert.equal(latch.resolve(true, [gate], gate)?.id, 'gate');
});
