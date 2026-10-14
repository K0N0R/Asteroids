import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { CONTRACTS, GAME, SCAN } from '../frontend/game/config';
import {
    beginRun,
    finishRun,
    newCampaign,
    newShip,
    parseCampaign,
} from '../frontend/game/state/campaign';
import {
    contractLockReason,
    contractReady,
    selectContract,
} from '../frontend/game/state/contracts';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import { generateSector, navigationWaypoint } from '../frontend/game/worlds/sector';

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

function surveyCampaign() {
    const c = newCampaign();
    c.recovered = 1;
    assert.ok(selectContract(c, 2));
    return c;
}

test('new navigation keys preserve recovery at 6 and find both science sites even if the list changes order', () => {
    const sector = generateSector(31),
        sites = [...sector.landmarks].reverse();
    assert.equal(navigationWaypoint(sites, 7).name, 'Przekaźnik Lumen');
    assert.equal(navigationWaypoint(sites, 8).name, 'Obserwatorium Mnemos');
    assert.equal(navigationWaypoint(sites, 4).name, 'Wrak Echa');
    assert.equal(navigationWaypoint(sites, 6).x, 0);
    assert.deepEqual(navigationWaypoint(sites, 6, { id: 4, x: 1000, y: 500 }), {
        id: 4,
        x: 1000,
        y: 500,
        name: 'Sygnał #4',
    });
    assert.deepEqual(navigationWaypoint(sites, 1), { x: 0, y: 0, name: 'Aurora' });
});

test('new survey sites are deterministic, reachable and have a clear initial scan area', () => {
    for (let seed = 0; seed < 50; seed++) {
        const sector = generateSector(seed);
        assert.deepEqual(sector, generateSector(seed));
        const sites = sector.landmarks.filter((l) => l.siteId);
        assert.deepEqual(
            sites.map((l) => l.siteId),
            ['relay', 'archive'],
        );
        for (const site of sites) {
            const radius = Math.hypot(site.x, site.y);
            assert.ok(radius > 1499 && radius < GAME.sectorRadius - SCAN.radius);
            for (const rock of sector.rocks)
                assert.ok(Math.hypot(rock.x - site.x, rock.y - site.y) >= rock.radius + 220);
        }
    }
    assert.notEqual(
        Math.hypot(generateSector(1).landmarks[4].x, generateSector(1).landmarks[4].y),
        Math.hypot(generateSector(2).landmarks[4].x, generateSector(2).landmarks[4].y),
    );
});

test('contract selection and launch enforce progression, IDs and active mission locks', () => {
    const c = newCampaign();
    assert.equal(selectContract(c, 2), false);
    assert.match(contractLockReason(c, 2), /Wróć/);
    for (const id of [-1, 0.5, 999, NaN]) assert.equal(selectContract(c, id), false);
    assert.equal(c.contract, 0);
    c.contract = 2;
    assert.equal(beginRun(c, 1), false);
    assert.equal(c.repairKits, 1);
    c.contract = 0;
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock');
    assert.ok(selectContract(c, 2));
    assert.equal(selectContract(c, 3), false);
    beginRun(c, 2);
    assert.equal(selectContract(c, 1), false);
    assert.equal(c.contract, 2);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, { data: ['relay'] });
    assert.equal(c.contractCompletions[2], 1);
    assert.equal(selectContract(c, 3), false);
    assert.match(contractLockReason(c, 3), /warsztat/);
    c.station.workshop = 1;
    assert.ok(selectContract(c, 3));
});

test('survey contracts require the specific sites; duplicate or wrong data cannot replace them', () => {
    const c = surveyCampaign();
    assert.equal(contractReady(2, { ore: 100, parts: 100 }, []), false);
    assert.equal(contractReady(2, { ore: 0, parts: 0 }, ['archive']), false);
    assert.ok(contractReady(2, { ore: 0, parts: 0 }, ['relay']));
    assert.equal(contractReady(3, { ore: 0, parts: 0 }, ['relay', 'relay']), false);
    beginRun(c, 3);
    finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, { data: ['archive'] });
    assert.deepEqual(c.bank, { ore: 0, parts: 0 });
    assert.equal(c.contractCompletions[2], 0);
    beginRun(c, 4);
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 1, 'dock', 0, {
        data: ['relay', 'relay'],
    });
    assert.deepEqual(result!.reward, { ore: 18, parts: 3 });
    assert.deepEqual(c.bank, result!.reward);
    assert.equal(c.contractCompletions[2], 1);
    assert.equal(
        finishRun(c, true, { ore: 0, parts: 0 }, 1, 'again', 0, { data: ['relay'] }),
        null,
    );
    assert.equal(c.contractCompletions[2], 1);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('survey data is lost on death and on refresh and cannot complete the next mission', () => {
    const c = surveyCampaign();
    beginRun(c, 6);
    const loaded = parseCampaign(JSON.stringify(c))!;
    finishRun(loaded, false, { ore: 0, parts: 0 }, 2, 'reload', 0, { data: ['relay'] });
    assert.equal(loaded.contractCompletions[2], 0);
    assert.deepEqual(loaded.bank, { ore: 0, parts: 0 });
    const fresh = surveyCampaign();
    beginRun(fresh, 6);
    finishRun(fresh, true, { ore: 0, parts: 0 }, 1, 'early dock');
    assert.equal(fresh.contractCompletions[2], 0);
    beginRun(fresh, 7);
    const sim = new MissionSimulation(fresh, 7);
    try {
        assert.equal(sim.surveyData.size, 0);
    } finally {
        sim.dispose();
    }
});

test('survey payouts preserve cargo and obey station overflow without losing the completion', () => {
    const c = surveyCampaign();
    c.bank.ore = 148;
    beginRun(c, 1);
    const result = finishRun(c, true, { ore: 4, parts: 1 }, 1, 'dock', 0, { data: ['relay'] });
    assert.deepEqual(c.bank, { ore: 148, parts: 2 });
    assert.equal(result!.overflow, 24);
    assert.equal(c.contractCompletions[2], 1);
});

test('the advanced contract pays for both distinct sites and completed missions persist after a later death', () => {
    const c = surveyCampaign();
    c.contractCompletions[2] = 1;
    c.station.workshop = 1;
    assert.ok(selectContract(c, 3));
    beginRun(c, 27);
    finishRun(c, true, { ore: 4, parts: 0 }, 10, 'dock', 0, { data: ['archive'] });
    assert.deepEqual(c.bank, { ore: 4, parts: 0 });
    assert.equal(c.contractCompletions[3], 0);
    beginRun(c, 28);
    const result = finishRun(c, true, { ore: 2, parts: 1 }, 10, 'dock', 0, {
        data: ['archive', 'relay'],
    });
    assert.deepEqual(result!.reward, { ore: 30, parts: 5 });
    assert.deepEqual(c.bank, { ore: 36, parts: 6 });
    assert.equal(c.contractCompletions[3], 1);
    beginRun(c, 29);
    finishRun(c, false, { ore: 20, parts: 4 }, 1, 'loss', 0, { data: ['archive', 'relay'] });
    assert.deepEqual(c.contractCompletions, [0, 0, 1, 1, 0, 0]);
    assert.deepEqual(c.bank, { ore: 36, parts: 6 });
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});

test('v4 migration preserves campaign and recovery targets while starting a truthful mission journal', () => {
    const c = newCampaign();
    c.bank = { ore: 25, parts: 3 };
    c.ship!.engine = 1;
    c.crew.mechanic = true;
    c.recovered = 10;
    c.nextShipId = 3;
    c.recoverySignals = [{ id: 2, seed: 15, x: 1000, y: 500, ship: newShip(2), pilot: null }];
    beginRun(c, 15, 2);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 4;
    delete old.contractCompletions;
    const loaded = parseCampaign(JSON.stringify(old))!;
    assert.equal(loaded.version, 11);
    assert.deepEqual(loaded.bank, c.bank);
    assert.deepEqual(loaded.ship, { ...c.ship, hull: 'fighter' });
    assert.deepEqual(loaded.crew, c.crew);
    assert.deepEqual(loaded.activeRun, c.activeRun);
    assert.deepEqual(
        loaded.recoverySignals,
        c.recoverySignals.map((signal) => ({
            ...signal,
            ship: { ...signal.ship, hull: 'fighter' },
        })),
    );
    assert.equal(loaded.recovered, 10);
    assert.deepEqual(
        loaded.contractCompletions,
        CONTRACTS.map(() => 0),
    );
    assert.equal(contractLockReason(loaded, 2), '');
});

test('save validation accepts new active contracts and rejects malformed journal or contract IDs', () => {
    const c = surveyCampaign();
    beginRun(c, 15);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    for (const counts of [[0], [0, 0, -1, 0], [0, 0, 1.5, 0], [0, 0, '1', 0], null]) {
        const bad = JSON.parse(JSON.stringify(c));
        bad.contractCompletions = counts;
        assert.equal(parseCampaign(JSON.stringify(bad)), null);
    }
    const bad = JSON.parse(JSON.stringify(c));
    bad.activeRun.contract = 9;
    assert.equal(parseCampaign(JSON.stringify(bad)), null);
});

test('live scans reset when interrupted, do not use cargo space and secure each site once', () => {
    const c = surveyCampaign();
    beginRun(c, 19);
    const sim = new MissionSimulation(c, 19);
    try {
        // Isolate scanner rules; guarded scanning is covered by the combat integration tests.
        sim.enemies.dispose();
        for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
        sim.rocks.clear();
        const relay = sim.sector.landmarks.find((s) => s.siteId === 'relay')!;
        sim.ship.setTranslation({ x: relay.x / 100, y: relay.y / 100 }, true);
        sim.cargo.ore = sim.cargoCapacity;
        for (let i = 0; i < 100; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.scanProgress > 1.5);
        assert.equal(sim.surveyData.size, 0);
        for (const input of [
            { ...idle, interact: true, fire: true },
            { ...idle, interact: true, thrust: true },
            { ...idle, interact: true, repair: true },
            idle,
        ]) {
            sim.scanProgress = 1;
            sim.step(input);
            assert.equal(sim.scanProgress, 0);
        }
        sim.ship.setLinvel({ x: 2, y: 0 }, true);
        sim.step({ ...idle, interact: true });
        assert.equal(sim.scanProgress, 0);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 181; i++) sim.step({ ...idle, interact: true });
        assert.deepEqual([...sim.surveyData], ['relay']);
        assert.equal(c.contractCompletions[2], 0);
        assert.equal(c.bank.ore, 0);
        const events = sim.events.filter((e) => e.kind === 'collect').length;
        for (let i = 0; i < 181; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.events.filter((e) => e.kind === 'collect').length, events);
        const archive = sim.sector.landmarks.find((s) => s.siteId === 'archive')!;
        sim.ship.setTranslation({ x: archive.x / 100, y: archive.y / 100 }, true);
        for (let i = 0; i < 181; i++) sim.step({ ...idle, interact: true });
        assert.deepEqual([...sim.surveyData].sort(), ['archive', 'relay']);
        assert.equal(sim.cargoUsed, sim.cargoCapacity);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        for (let i = 0; i < 80; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.ended, 'returned');
        finishRun(c, true, sim.cargo, sim.elapsed, 'dock', sim.repairKits, {
            data: [...sim.surveyData],
        });
        assert.equal(c.contractCompletions[2], 1);
        assert.equal(c.bank.parts, 3);
    } finally {
        sim.dispose();
    }
});
