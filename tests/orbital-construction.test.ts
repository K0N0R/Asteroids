import { grantStoryTasks } from './fleet-fixtures';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    type Cargo,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    MARS_BASE,
    VENUS_OUTPOST,
    constructionManifest,
    deliverOrbitalCargo,
    pendingOrbitalDeliveries,
    marsBaseReady,
    solarShieldReady,
} from '../frontend/game/state/story';
import {
    MARS_CONSTRUCTION,
    VENUS_CONSTRUCTION,
    VENUS_SHIELD,
} from '../frontend/game/state/orbitalConstruction';
import { resourceTotal } from '../frontend/game/state/resources';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { grantOrbitalSupplies } from './fleet-fixtures';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(sector: 'mars' | 'venus') {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    for (const t of STORY_TASKS.filter(
        (t) => t.required && (sector === 'mars' ? t.act < 5 : t.act < 3 || t.id === 'venus-survey'),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    grantStoryTasks(c, c.story!.claimed);
    if (sector === 'mars') grantStoryTasks(c, ['mars-workshop-ii']);
    c.story!.sector = sector;
    const entries = sector === 'mars' ? MARS_CONSTRUCTION : VENUS_CONSTRUCTION;
    c.bank = { ore: 999, parts: 0 };
    for (const t of entries) c.bank[t.resource] = t.target + 1;
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function hold(s: MissionSimulation, input: FlightInput, frames = 150) {
    for (let i = 0; i < frames; i++) {
        s.step(input);
        s.events.length = 0;
    }
}

test('orbital manifests load five named part families once, preserve freight and reject old saves', () => {
    for (const sector of ['mars'] as const) {
        const c = ready(sector);
        const entries = sector === 'mars' ? MARS_CONSTRUCTION : VENUS_CONSTRUCTION;
        const manifest = constructionManifest(c);
        assert.equal(resourceTotal(manifest), sector === 'mars' ? 30 : 21);
        assert.equal(manifest.ore, 0);
        for (const t of entries) assert.equal(manifest[t.resource], t.target);
        assert.ok(beginRun(c, 1, null, true));
        assert.equal(beginRun(c, 1, null, true), false);
        for (const t of entries) assert.equal(c.bank[t.resource], 1);
        const cargo = { ...c.activeRun!.freight! };
        assert.ok(deliverOrbitalCargo(c, cargo));
        assert.equal(resourceTotal(cargo), 0);
        assert.equal(resourceTotal(c.activeRun!.freight!), 0);
        assert.equal(resourceTotal(c.activeRun!.unloaded!), 0);
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.equal(parseCampaign(JSON.stringify({ ...c, version: 55 })), null);
        finishRun(c, false, { ore: 0, parts: 0 }, 1, 'lost');
        for (const t of entries) assert.equal(c.story!.progress[t.id], t.target);
    }
});

test('orbital manifests respect missing stock, hold capacity and unfinished quantities', () => {
    const c = ready('mars');
    c.bank.electronics = 0;
    c.ship!.hull = 'swift';
    const manifest = constructionManifest(c);
    assert.equal(manifest.electronics ?? 0, 0);
    assert.equal(resourceTotal(manifest), 24);
    c.ship!.hull = 'prospector';
    beginRun(c, 1);
    const cargo: Cargo = { ore: 999, parts: 3, storageFrames: 2 };
    deliverOrbitalCargo(c, cargo);
    assert.equal(cargo.ore, 999);
    assert.equal(c.story!.progress['mars-base-ore'], 3);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
    assert.equal(constructionManifest(c).parts, 9);
    assert.equal(marsBaseReady(c.story!), false);
});

test('orbital deliveries reject wrong sectors, lunar surface, aborted sorties and missing technology', () => {
    const c = ready('mars');
    const cargo: Cargo = { ore: 0, parts: 12 };
    assert.equal(deliverOrbitalCargo(c, cargo), null);
    beginRun(c, 1);
    c.activeRun!.area = 'surface';
    assert.equal(deliverOrbitalCargo(c, cargo), null);
    delete c.activeRun!.area;
    c.activeRun!.sector = 'venus';
    assert.equal(deliverOrbitalCargo(c, cargo), null);
    c.activeRun!.sector = 'mars';
    c.activeRun!.mission = { task: 'mars-base-ore', aborted: true };
    assert.equal(deliverOrbitalCargo(c, cargo), null);
    delete c.activeRun!.mission;
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'mercury-technology');
    assert.equal(pendingOrbitalDeliveries(c, cargo).length, 0);
    assert.equal(cargo.parts, 12);
});

for (const sector of ['mars'] as const)
    test(`${sector}: C transfer is physical, interruptible and leaves surplus aboard`, () => {
        const c = ready(sector);
        beginRun(c, 1, null, true);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            const target = sector === 'mars' ? MARS_BASE : VENUS_OUTPOST;
            at(s, { x: target.x + 400, y: target.y });
            assert.equal(s.canTransferCargo, false);
            at(s, target);
            s.step(idle);
            assert.equal(s.canTransferCargo, true);
            const bank = { ...c.bank };
            const cargo = { ...s.cargo };
            s.step({ ...idle, unload: true });
            hold(s, idle, 50);
            s.step({ ...idle, thrust: true });
            assert.equal(s.cargoTransferRemaining, 0);
            assert.deepEqual(s.cargo, cargo);
            at(s, target);
            hold(s, idle, 20);
            s.cargo.ore = 2;
            s.step({ ...idle, unload: true });
            hold(s, idle);
            assert.equal(s.cargo.ore, 2);
            assert.equal(resourceTotal(s.cargo), 2);
            assert.deepEqual(c.bank, bank);
            assert.ok(s.deliveryRevision > 0);
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    });
