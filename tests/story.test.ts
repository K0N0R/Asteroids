import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newCampaign,
    newStoryCampaign,
    parseCampaign,
    SaveRepository,
    SAVE_KEY,
    buyUpgrade,
    emergencyKit,
    buyShip,
    hirePilot,
} from '../frontend/game/state/campaign';
import {
    contributeStory,
    storyRadius,
    storySectorUnlocked,
    travelStory,
    syncStory,
    STORY_SAVE_KEY,
    STORY_SECTORS,
    storyObjectives,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation } from '../frontend/game/systems/mission';
import type { ScanSiteId } from '../frontend/game/config';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function returning(c: ReturnType<typeof newStoryCampaign>, data: ScanSiteId[] = []) {
    assert.ok(beginRun(c, 999));
    return finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', c.activeRun!.repairKits, { data })!;
}
function earthReady() {
    const c = newStoryCampaign();
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    returning(c, ['relay']);
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    returning(c, ['archive']);
    return c;
}

test('parallel tasks support either order, partial contributions and one-time rewards', () => {
    for (const scanFirst of [true, false]) {
        const c = newStoryCampaign();
        if (scanFirst) returning(c, ['relay']);
        c.bank.ore = 10;
        assert.ok(contributeStory(c, 'earth-supply'));
        assert.equal(c.story!.progress['earth-supply'], 10);
        assert.equal(c.bank.ore, 0);
        assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
        c.bank.ore = 20;
        assert.ok(contributeStory(c, 'earth-supply'));
        assert.equal(c.bank.ore, 36);
        assert.equal(c.story!.progress['earth-supply'], 24);
        if (!scanFirst) returning(c, ['relay']);
        assert.equal(storyRadius(c.story!), 2450);
        const bank = { ...c.bank };
        assert.equal(contributeStory(c, 'earth-supply'), null);
        returning(c, ['relay']);
        assert.deepEqual(c.bank, bank);
        assert.deepEqual(c.contractCompletions, newCampaign().contractCompletions);
    }
});

test('required goals gate travel, optional work never blocks it, and backtracking preserves both sectors', () => {
    const c = newStoryCampaign();
    assert.equal(travelStory(c, 'lunar'), false);
    returning(c, ['archive']);
    assert.equal(c.story!.progress['earth-route'], 0);
    const ready = earthReady();
    assert.equal(ready.story!.progress['earth-reserve'], 0);
    assert.ok(storySectorUnlocked(ready.story!, 'lunar'));
    assert.ok(travelStory(ready, 'lunar'));
    returning(ready, ['relay']);
    assert.ok(travelStory(ready, 'earth'));
    assert.ok(ready.story!.claimed.includes('lunar-survey'));
    const before = JSON.stringify(ready.story);
    assert.ok(beginRun(ready, 123));
    assert.equal(travelStory(ready, 'lunar'), false);
    assert.equal(contributeStory(ready, 'earth-reserve'), null);
    finishRun(ready, false, { ore: 99, parts: 2 }, 5, 'lost', 0, { data: ['relay'] });
    assert.equal(JSON.stringify(ready.story), before);
    assert.deepEqual(parseCampaign(JSON.stringify(ready)), ready);
    assert.ok(buyShip(ready));
    assert.ok(hirePilot(ready, 0));
    assert.ok(beginRun(ready, 4));
});

test('data is not persistent until a real dock return and is lost on death', () => {
    const c = newStoryCampaign();
    assert.ok(beginRun(c, 42));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.stationName, 'Satuk 15');
        assert.equal(s.sectorRadius, 1450);
        assert.equal(s.sector.seed, STORY_SECTORS.earth.seed);
        assert.equal(s.enemies.enemies.size, 0);
        const site = s.sector.landmarks.find((l) => l.siteId === 'relay')!;
        s.ship.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
        for (let i = 0; i < 190; i++) s.step({ ...idle, interact: true });
        assert.ok(s.surveyData.has('relay'));
        assert.equal(c.story!.progress['earth-relay'], 0);
        s.ship.setTranslation({ x: 1, y: 0 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 90; i++) s.step({ ...idle, interact: true });
        assert.equal(s.ended, 'returned');
        const result = finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
            data: [...s.surveyData],
        })!;
        assert.equal(c.story!.progress['earth-relay'], 1);
        assert.equal(result.reward.ore, 12);
        assert.equal(finishRun(c, true, s.cargo, 20, 'again'), null);
    } finally {
        s.dispose();
    }
    const failed = newStoryCampaign();
    assert.ok(beginRun(failed, 2));
    finishRun(failed, false, { ore: 20, parts: 0 }, 10, 'lost', 0, { data: ['relay'] });
    assert.equal(failed.story!.progress['earth-relay'], 0);
});

test('v18 migration preserves the old campaign and independent repositories never overwrite each other', () => {
    const legacy = newCampaign();
    legacy.bank = { ore: 55, parts: 4 };
    const old = JSON.parse(JSON.stringify(legacy));
    old.version = 18;
    delete old.story;
    const values = new Map([[SAVE_KEY, JSON.stringify(old)]]);
    const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
            values.set(key, value);
        },
    };
    const story = new SaveRepository(storage, { key: STORY_SAVE_KEY, create: newStoryCampaign });
    const fresh = story.load();
    assert.equal(fresh.story!.sector, 'earth');
    assert.ok(story.save(fresh));
    assert.equal(values.get(SAVE_KEY), JSON.stringify(old));
    const migrated = new SaveRepository(storage).load();
    assert.equal(migrated.version, 25);
    assert.equal(migrated.story, null);
    assert.deepEqual(migrated.bank, legacy.bank);
    assert.deepEqual(parseCampaign(JSON.stringify(fresh)), fresh);
});

test('journals reject unknown tasks, impossible dependencies, duplicate rewards and mismatched active sectors', () => {
    const original = newStoryCampaign();
    const invalid = (edit: (c: any) => void) => {
        const c = JSON.parse(JSON.stringify(original));
        edit(c);
        assert.equal(parseCampaign(JSON.stringify(c)), null);
    };
    invalid((c) => {
        c.story.sector = 'pluto';
    });
    invalid((c) => {
        c.story.sector = 'lunar';
    });
    invalid((c) => {
        c.story.progress['unknown'] = 1;
    });
    invalid((c) => {
        c.story.progress['earth-supply'] = 25;
    });
    invalid((c) => {
        c.story.progress['earth-relay'] = 1;
    });
    invalid((c) => {
        c.story.progress['earth-route'] = 1;
        c.story.claimed = ['earth-route'];
    });
    invalid((c) => {
        c.story.claimed = ['earth-relay', 'earth-relay'];
    });
    invalid((c) => {
        c.story.searchedWrecks = ['lunar'];
    });
    assert.ok(beginRun(original, 123));
    const active = JSON.parse(JSON.stringify(original));
    active.activeRun.sector = 'lunar';
    assert.equal(parseCampaign(JSON.stringify(active)), null);
    active.activeRun.sector = 'earth';
    active.activeRun.seed = 888;
    assert.equal(parseCampaign(JSON.stringify(active)), null);
});

test('available regions and wreck interactions use semantic landmarks when the outer orbit appears', () => {
    const c = earthReady();
    const sector = generateStorySector(c.story!);
    assert.ok(sector.landmarks.some((l) => l.siteId === 'archive'));
    assert.equal(sector.landmarks[2].siteId, 'archive');
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const site = s.sector.landmarks.find((l) => l.kind === 'wreck')!;
        s.ship.setTranslation({ x: site.x / 100, y: site.y / 100 }, true);
        s.step({ ...idle, interact: true });
        assert.ok(s.wreckVisited);
        assert.ok(s.loot.size > 0);
        finishRun(c, true, s.cargo, 10, 'dock', s.repairKits, { wreckVisited: true });
        assert.ok(c.story!.searchedWrecks.includes('earth'));
    } finally {
        s.dispose();
    }
    assert.ok(beginRun(c, 1));
    const next = new MissionSimulation(c, c.activeRun!.seed);
    assert.ok(next.wreckVisited);
    next.dispose();
});

test('recovery signals cannot silently move between campaign sectors', () => {
    const c = earthReady();
    c.recoverySignals.push({
        id: 999,
        seed: STORY_SECTORS.earth.seed,
        x: 1000,
        y: 0,
        pilot: null,
        ship: { ...c.ship!, id: c.nextShipId++ },
    });
    travelStory(c, 'lunar');
    assert.equal(beginRun(c, 9, 999), false);
    travelStory(c, 'earth');
    assert.ok(beginRun(c, 9, 999));
    assert.equal(c.activeRun!.seed, STORY_SECTORS.earth.seed);
    assert.equal(storyObjectives(c).length, 5);
});

test('losing the starter ship without funds leaves a working emergency route and keeps campaign progress', () => {
    const c = newStoryCampaign();
    const progress = JSON.stringify(c.story);
    assert.ok(beginRun(c, 4));
    finishRun(c, false, { ore: 0, parts: 0 }, 5, 'lost');
    assert.equal(JSON.stringify(c.story), progress);
    assert.ok(emergencyKit(c));
    assert.ok(beginRun(c, 4));
});

test('a fresh starter can mine, scan, dock, build the workshop and unlock the lunar route through normal flight', () => {
    const c = newStoryCampaign();
    const steer = (s: MissionSimulation, target: { x: number; y: number }, radius: number) => {
        const dx = target.x - s.position.x,
            dy = target.y - s.position.y;
        const distance = Math.hypot(dx, dy);
        const error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
        const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
        return {
            ...idle,
            target,
            turn: Math.max(-1, Math.min(1, error * 2.5)),
            thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
            brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
        };
    };
    const sortie = (scan: ScanSiteId, mine: boolean) => {
        assert.ok(beginRun(c, 123));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            for (let frame = 0; frame < 60 * 300 && !s.ended; frame++) {
                let input;
                if (
                    mine &&
                    s.cargo.ore < 24 &&
                    s.cargo.ore + s.cargo.parts < s.hullConfig.cargo - 1
                ) {
                    const p = s.position;
                    const loot = [...s.loot.values()].sort(
                        (a, b) =>
                            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
                    )[0];
                    if (loot && Math.hypot(loot.x - p.x, loot.y - p.y) < 450)
                        input = steer(s, loot, 45);
                    else {
                        const rock = [...s.rocks.values()].sort((a, b) => {
                            const ap = a.body.translation(),
                                bp = b.body.translation();
                            return (
                                Math.hypot(ap.x * 100 - p.x, ap.y * 100 - p.y) -
                                Math.hypot(bp.x * 100 - p.x, bp.y * 100 - p.y)
                            );
                        })[0];
                        assert.ok(rock, 'starter mining field has resources');
                        const rp = rock.body.translation();
                        input = {
                            ...steer(s, { x: rp.x * 100, y: rp.y * 100 }, rock.radius + 70),
                            fire: true,
                            mine: true,
                        };
                    }
                } else if (!s.surveyData.has(scan)) {
                    const site = s.sector.landmarks.find((l) => l.siteId === scan)!;
                    input = { ...steer(s, site, 85), interact: true };
                } else input = { ...steer(s, { x: 0, y: 0 }, 85), interact: true };
                s.step(input);
                s.events.length = 0;
            }
            assert.equal(
                s.ended,
                'returned',
                `sortie ${scan}: cargo ${JSON.stringify(s.cargo)}, position ${JSON.stringify(s.position)}`,
            );
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                data: [...s.surveyData],
            });
        } finally {
            s.dispose();
        }
    };
    sortie('relay', true);
    assert.ok(c.bank.ore >= 24);
    contributeStory(c, 'earth-supply');
    assert.equal(storyRadius(c.story!), 2450);
    assert.ok(buyUpgrade(c, 'workshop'));
    syncStory(c);
    sortie('archive', false);
    assert.ok(travelStory(c, 'lunar'));
    sortie('relay', false);
    assert.ok(c.story!.claimed.includes('lunar-survey'));
    assert.ok(travelStory(c, 'earth'));
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
});
