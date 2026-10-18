import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, travelStory, deliverLunarCargo } from '../frontend/game/state/story';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MOON, moonDistance } from '../frontend/game/worlds/moon';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function grant(c: ReturnType<typeof newStoryCampaign>, id: string) {
    const t = STORY_TASKS.find((t) => t.id === id)!;
    for (const d of t.dependencies) if (!c.story!.claimed.includes(d)) grant(c, d);
    if (!c.story!.claimed.includes(id)) {
        c.story!.claimed.push(id);
        c.story!.progress[id] = t.target;
    }
}
function ready(survey = false) {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    grant(c, 'earth-workshop');
    grant(c, 'earth-route');
    assert.ok(travelStory(c, 'lunar'));
    if (survey) grant(c, 'lunar-survey');
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function advance(s: MissionSimulation, n = 160) {
    for (let i = 0; i < n && !s.ended; i++) {
        s.step(idle);
        s.events.length = 0;
    }
}
function enter(s: MissionSimulation) {
    at(s, MOON.entrance);
    s.step(idle);
    for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
    while (s.transferActive) s.step(idle);
    assert.equal(s.area, 'surface');
}
function unload(s: MissionSimulation) {
    s.step(idle);
    s.step({ ...idle, unload: true });
    advance(s);
}

test('actual lunar scan unlocks the prepared surface and Mule once in the same selected sortie', () => {
    const c = ready();
    assert.ok(beginRun(c, 1, null, false, 'lunar-survey'));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.surfaceUnlocked, false);
        assert.equal(s.miningEscort, null);
        const relay = s.landmarks.find((l) => l.siteId === 'relay')!;
        at(s, relay);
        for (let i = 0; i < 190; i++) s.step({ ...idle, interact: true });
        assert.equal(s.surfaceUnlocked, true);
        assert.equal(c.story!.progress['lunar-survey'], 1);
        assert.equal(s.missionReturnBlocked, false);
        assert.ok(parseCampaign(JSON.stringify(c)));
        assert.ok(s.miningEscort);
        assert.ok(s.landmarks.some((l) => l.kind === 'passage'));
        assert.ok(
            [...s.rocks.values()].some((r) => r.anchored && moonDistance(r.previous) < MOON.radius),
        );
        const rocks = s.rocks.size,
            escort = s.miningEscort;
        advance(s);
        assert.equal(s.rocks.size, rocks);
        assert.equal(s.miningEscort, escort);
        enter(s);
        at(s, s.miningEscort!.position);
        s.step(idle);
        assert.ok(s.miningEscort!.body.isValid());
        assert.equal(s.miningEscort!.state, 'idle');
        assert.equal(s.radioMessages.filter((t) => t.includes('Zwiad')).length, 1);
    } finally {
        s.dispose();
    }
});

test('C delivers construction freight partially, returns excess to Satuk and never grants mining XP for loaded supplies', () => {
    const c = ready(true);
    c.bank = { ore: 60, parts: 0 };
    c.story!.progress['lunar-foundation'] = 120;
    assert.ok(beginRun(c, 1, null, true));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.cargo.ore, 40);
        enter(s);
        assert.equal(deliverLunarCargo(c, { ore: 30, parts: 0 }, false)!.amount, 30);
        at(s, MOON.construction);
        unload(s);
        assert.equal(c.story!.progress['lunar-foundation'], 160);
        assert.equal(s.cargo.ore, 30);
        assert.equal(c.activeRun!.freight!.ore, 30);
        assert.equal(c.activeRun!.unloaded!.ore, 0);
        assert.equal(s.ended, null);
        assert.ok(s.radioMessages.some((t) => t.includes('Fundamenty')));
        at(s, MOON.exit);
        s.step(idle);
        for (let i = 0; i < 125; i++) s.step({ ...idle, interact: true });
        while (s.transferActive) s.step(idle);
        at(s, { x: 400, y: 0 });
        unload(s);
        assert.equal(s.cargo.ore, 0);
        assert.equal(c.activeRun!.freight!.ore, 0);
        assert.equal(c.bank.ore, 50);
        assert.ok(parseCampaign(JSON.stringify(c)));
        const bank = structuredClone(c.bank);
        const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits)!;
        assert.equal(result.pilotProgress!.gainedXp, 0);
        assert.deepEqual(c.bank, bank);
    } finally {
        s.dispose();
    }
});

test('mined lunar materials delivered to construction count once for return XP and survive a later loss', () => {
    const c = ready(true);
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        at(s, MOON.construction);
        s.cargo.ore = 10;
        unload(s);
        assert.equal(c.story!.progress['lunar-foundation'], 10);
        assert.equal(c.activeRun!.unloaded!.ore, 10);
        const saved = parseCampaign(JSON.stringify(c))!;
        assert.ok(saved);
        finishRun(saved, false, { ore: 20, parts: 0 }, s.elapsed, 'lost');
        assert.equal(saved.story!.progress['lunar-foundation'], 10);
        // A successful return earns XP for already delivered ore without depositing it again.
        const result = finishRun(c, true, s.cargo, s.elapsed, 'return', s.repairKits)!;
        assert.equal(result.pilotProgress!.gainedXp, 10);
        assert.equal(c.story!.progress['lunar-foundation'], 10);
    } finally {
        s.dispose();
    }
});

test('technical commission confirms immediately after a real surface scan and remains after loss', () => {
    const c = ready(true);
    grant(c, 'lunar-installations');
    assert.ok(beginRun(c, 1, null, false, 'lunar-commission'));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        at(s, MOON.construction);
        for (let i = 0; i < 190; i++) s.step({ ...idle, interact: true });
        assert.equal(c.story!.progress['lunar-commission'], 1);
        assert.equal(s.buildStage, 3);
        assert.equal(s.missionReturnBlocked, false);
        const bank = structuredClone(c.bank),
            revision = s.deliveryRevision;
        advance(s);
        assert.equal(s.deliveryRevision, revision);
        assert.deepEqual(c.bank, bank);
        const saved = parseCampaign(JSON.stringify(c))!;
        assert.ok(saved);
        finishRun(saved, false, { ore: 0, parts: 0 }, s.elapsed, 'death');
        assert.equal(saved.story!.progress['lunar-commission'], 1);
        assert.deepEqual(saved.bank, bank);
    } finally {
        s.dispose();
    }
});

test('aborted lunar survey cannot transmit, unlock surface or transfer resources and previous format is rejected', () => {
    const c = ready();
    assert.ok(beginRun(c, 1, null, false, 'lunar-survey'));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.ok(s.abortMission());
        s.surveyData.add('relay');
        s.cargo.ore = 10;
        s.step({ ...idle, unload: true });
        advance(s);
        assert.equal(c.story!.progress['lunar-survey'], 0);
        assert.equal(s.miningEscort, null);
        assert.equal(s.surfaceUnlocked, false);
        assert.equal(s.radioMessages.length, 0);
        const old = JSON.parse(JSON.stringify(c));
        old.version = 44;
        assert.equal(parseCampaign(JSON.stringify(old)), null);
    } finally {
        s.dispose();
    }
});
