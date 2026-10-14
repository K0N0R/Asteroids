import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREW } from '../frontend/game/config';
import {
    beginRun,
    finishRun,
    newCampaign,
    parseCampaign,
    storageUsed,
} from '../frontend/game/state/campaign';
import {
    advanceCrew,
    cancelJob,
    hireMechanic,
    hireQuartermaster,
    queueJob,
    workerJobs,
} from '../frontend/game/state/crew';

function staffed() {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 12 };
    c.station.workshop = 1;
    assert.ok(hireMechanic(c));
    assert.ok(hireQuartermaster(c));
    return c;
}
test('quartermaster recruitment enforces workshop, cost, duplicate and active sortie locks atomically', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 10 };
    assert.equal(hireQuartermaster(c), false);
    assert.deepEqual(c.bank, { ore: 100, parts: 10 });
    c.station.workshop = 1;
    c.bank.parts = 1;
    assert.equal(hireQuartermaster(c), false);
    c.bank.parts = 10;
    assert.ok(hireQuartermaster(c));
    assert.deepEqual(c.bank, { ore: 80, parts: 8 });
    assert.equal(hireQuartermaster(c), false);
    beginRun(c, 7);
    assert.equal(hireMechanic(c), false);
});
test('each profession owns a queue of three jobs with globally unique IDs and correct recipe permissions', () => {
    const c = newCampaign();
    c.bank = { ore: 100, parts: 12 };
    c.station.workshop = 1;
    hireQuartermaster(c);
    assert.equal(queueJob(c, 'kit'), false);
    assert.ok(queueJob(c, 'recycle'));
    hireMechanic(c);
    for (let i = 0; i < 3; i++) assert.ok(queueJob(c, 'refine'));
    for (let i = 0; i < 2; i++) assert.ok(queueJob(c, 'recycle'));
    assert.equal(c.crew.jobs.length, 6);
    assert.equal(new Set(c.crew.jobs.map((j) => j.id)).size, 6);
    const bank = { ...c.bank };
    assert.equal(queueJob(c, 'kit'), false);
    assert.equal(queueJob(c, 'recycle'), false);
    assert.deepEqual(c.bank, bank);
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
test('workers advance in parallel while preserving per-worker order and excess simulation time', () => {
    const c = staffed();
    queueJob(c, 'refine');
    queueJob(c, 'recycle');
    queueJob(c, 'kit');
    queueJob(c, 'recycle');
    assert.equal(advanceCrew(c, 90), 0);
    beginRun(c, 7);
    assert.equal(advanceCrew(c, 50), 1);
    assert.equal(workerJobs(c, 'mechanic')[0].remaining, 25);
    assert.equal(workerJobs(c, 'quartermaster')[0].remaining, 10);
    assert.equal(advanceCrew(c, 25), 2);
    assert.equal(workerJobs(c, 'mechanic').length, 0);
    assert.equal(workerJobs(c, 'quartermaster')[0].remaining, 45);
    assert.equal(c.crew.completed, 3);
    for (const seconds of [NaN, Infinity, -1, 0]) assert.equal(advanceCrew(c, seconds), 0);
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.ok(loaded);
    finishRun(loaded, false, { ore: 0, parts: 0 }, 75, 'loss');
    assert.equal(loaded.crew.quartermaster, true);
    assert.equal(advanceCrew(loaded, 500), 0);
    assert.equal(workerJobs(loaded, 'quartermaster')[0].remaining, 45);
});
test('recycling reserves output space before charging, cannot overflow after extraction, and refunds once', () => {
    const c = staffed();
    c.bank = { ore: 147, parts: 3 };
    const before = { ...c.bank };
    assert.equal(queueJob(c, 'recycle'), false);
    assert.deepEqual(c.bank, before);
    c.bank.ore = 143;
    assert.ok(queueJob(c, 'recycle'));
    assert.equal(storageUsed(c), 150);
    const id = c.crew.jobs[0].id;
    beginRun(c, 7);
    finishRun(c, true, { ore: 10, parts: 10 }, 1, 'dock');
    assert.equal(storageUsed(c), 150);
    assert.ok(cancelJob(c, id));
    assert.equal(storageUsed(c), 146);
    assert.equal(cancelJob(c, id), false);
    assert.ok(queueJob(c, 'recycle'));
    beginRun(c, 8);
    assert.equal(advanceCrew(c, 60), 1);
    assert.equal(storageUsed(c), 150);
    assert.equal(c.bank.ore, 148);
    assert.equal(c.bank.parts, 2);
});
test('a blocked mechanic does not block quartermaster work; conversion cannot create profitable resource loops', () => {
    const c = staffed();
    queueJob(c, 'kit');
    queueJob(c, 'recycle');
    beginRun(c, 7);
    c.repairKits = CREW.kitLimit - c.activeRun!.repairKits;
    const ore = c.bank.ore;
    assert.equal(advanceCrew(c, 60), 1);
    assert.equal(c.bank.ore, ore + 5);
    assert.equal(workerJobs(c, 'mechanic')[0].remaining, 30);
    const loop = staffed();
    const initial = loop.bank.ore;
    queueJob(loop, 'refine');
    beginRun(loop, 8);
    advanceCrew(loop, 45);
    finishRun(loop, true, { ore: 0, parts: 0 }, 45, 'dock');
    queueJob(loop, 'recycle');
    beginRun(loop, 9);
    advanceCrew(loop, 60);
    assert.equal(loop.bank.ore, initial - 3);
});
test('v9 migration preserves ongoing production and initializes an unowned quartermaster', () => {
    const c = staffed();
    c.crew.quartermaster = false;
    queueJob(c, 'refine');
    beginRun(c, 7);
    advanceCrew(c, 12);
    const old = JSON.parse(JSON.stringify(c));
    old.version = 9;
    delete old.crew.quartermaster;
    assert.deepEqual(parseCampaign(JSON.stringify(old)), c);
    const bad = JSON.parse(JSON.stringify(c));
    delete bad.crew.quartermaster;
    assert.equal(parseCampaign(JSON.stringify(bad)), null);
});
test('save validation rejects orphan jobs, overloaded worker queues and recycling without reserved output room', () => {
    const c = staffed();
    queueJob(c, 'recycle');
    const orphan = JSON.parse(JSON.stringify(c));
    orphan.crew.quartermaster = false;
    assert.equal(parseCampaign(JSON.stringify(orphan)), null);
    const overflow = JSON.parse(JSON.stringify(c));
    overflow.bank = { ore: 149, parts: 0 };
    assert.equal(parseCampaign(JSON.stringify(overflow)), null);
    const crowded = JSON.parse(JSON.stringify(c));
    crowded.crew.jobs = Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        kind: 'recycle',
        remaining: 60,
    }));
    crowded.crew.nextJobId = 5;
    assert.equal(parseCampaign(JSON.stringify(crowded)), null);
});
