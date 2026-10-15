import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    emergencyKit,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    STORY_SECTORS,
    EARTH_BRIEFING,
    acknowledgeStoryBriefing,
    actOneComplete,
    actTwoComplete,
    storySectorComplete,
    venusPreparationComplete,
    storySectorUnlocked,
    storyVisibleTasks,
    storyNextStep,
    storyAct,
    storyRadius,
    travelStory,
    contributeStory,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';
import { createRecoverySignal } from '../frontend/game/state/recovery';

before(async () => RAPIER.init());
const empty = { ore: 0, parts: 0 };
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function marsReported() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) => t.required && (t.act === 1 || (t.sector === 'mars' && t.act === 2)),
    )) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'mars';
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function venusReady() {
    const c = marsReported();
    travelStory(c, 'earth');
    assert.ok(acknowledgeStoryBriefing(c));
    assert.ok(travelStory(c, 'venus'));
    return c;
}
function report(c: ReturnType<typeof venusReady>, data: ('relay' | 'archive')[] = []) {
    assert.ok(beginRun(c, 999));
    return finishRun(c, true, empty, 10, 'dock', c.activeRun!.repairKits, { data });
}

test('the Earth briefing requires the Mars report, the correct sector and a docked station', () => {
    const fresh = newStoryCampaign();
    assert.equal(acknowledgeStoryBriefing(fresh), null);
    assert.equal(storyVisibleTasks(fresh.story!).length, 5);
    const c = marsReported();
    assert.ok(actOneComplete(c.story!));
    assert.equal(actTwoComplete(c.story!), false);
    assert.equal(storySectorUnlocked(c.story!, 'venus'), false);
    assert.equal(travelStory(c, 'venus'), false);
    assert.equal(acknowledgeStoryBriefing(c), null);
    assert.ok(storyNextStep(c.story!).includes('Wróć do sektora Ziemi'));
    travelStory(c, 'earth');
    assert.equal(storyAct(c.story!), 'AKT II');
    assert.equal(storyVisibleTasks(c.story!).length, 6);
    assert.equal(c.story!.progress['earth-debrief'], 0); // Visiting does not accept the plan.
    assert.ok(beginRun(c, 1));
    assert.equal(acknowledgeStoryBriefing(c), null);
    finishRun(c, true, empty, 1, 'dock', c.activeRun!.repairKits);
    const bank = { ...c.bank };
    assert.ok(acknowledgeStoryBriefing(c));
    assert.ok(actTwoComplete(c.story!));
    assert.ok(storySectorUnlocked(c.story!, 'venus'));
    assert.equal(acknowledgeStoryBriefing(c), null);
    assert.deepEqual(c.bank, bank);
    assert.ok(EARTH_BRIEFING.includes('Merkurym') && EARTH_BRIEFING.includes('Wenus'));
    assert.ok(storyNextStep(c.story!).includes('Akt II ukończony'));
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('Venus survey opens the area; site measurements and partial material contributions run in either order', () => {
    for (const supplyFirst of [true, false]) {
        const c = venusReady();
        assert.equal(storyAct(c.story!), 'AKT III');
        assert.equal(storyRadius(c.story!), 2800);
        assert.equal(contributeStory(c, 'venus-stockpile'), null);
        report(c, ['archive']);
        assert.equal(c.story!.progress['venus-site'], 0);
        report(c, ['relay']);
        assert.equal(storyRadius(c.story!), 3900);
        assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
        if (!supplyFirst) report(c, ['archive']);
        c.bank.ore = 10;
        contributeStory(c, 'venus-stockpile');
        assert.equal(c.story!.progress['venus-stockpile'], 10);
        c.bank.ore = 22;
        contributeStory(c, 'venus-stockpile');
        assert.equal(c.story!.progress['venus-stockpile'], 32);
        if (supplyFirst) report(c, ['archive']);
        assert.ok(venusPreparationComplete(c.story!));
        assert.equal(storySectorComplete(c.story!, 'venus'), false);
        assert.equal(c.story!.progress['venus-reserve'], 0);
        const earned = { ...c.bank };
        report(c, ['archive', 'relay']);
        assert.equal(contributeStory(c, 'venus-stockpile'), null);
        assert.deepEqual(c.bank, earned);
        assert.ok(storyNextStep(c.story!).includes('aby ją zbudować'));
        for (const sector of ['earth', 'lunar', 'mars', 'venus'] as const)
            assert.ok(travelStory(c, sector));
        assert.ok(parseCampaign(JSON.stringify(c)));
    }
});

test('v23 saves preserve Mars reports and active runs while adding an unaccepted briefing', () => {
    for (const active of [false, true]) {
        const c = marsReported();
        if (active) beginRun(c, 1);
        const old = JSON.parse(JSON.stringify(c));
        old.version = 23;
        for (const key of Object.keys(old.story.progress))
            if (key.startsWith('mercury-')) delete old.story.progress[key];
        for (const key of Object.keys(old.story.progress))
            if (key.startsWith('mars-base-') || key === 'mars-corridor' || key === 'mars-route')
                delete old.story.progress[key];
        old.story.version = 5;
        for (const t of STORY_TASKS.filter((t) => t.id === 'earth-debrief' || t.sector === 'venus'))
            delete old.story.progress[t.id];
        const next = parseCampaign(JSON.stringify(old))!;
        assert.ok(next);
        assert.equal(next.version, 27);
        assert.equal(next.story!.version, 9);
        assert.deepEqual(next.story!.claimed, c.story!.claimed);
        assert.deepEqual(next.bank, c.bank);
        assert.deepEqual(next.activeRun, c.activeRun);
        assert.equal(next.story!.progress['earth-debrief'], 0);
        assert.equal(storySectorUnlocked(next.story!, 'venus'), false);
        old.story.progress.unknown = 0;
        assert.equal(parseCampaign(JSON.stringify(old)), null);
    }
    const forged = marsReported();
    forged.story!.sector = 'venus';
    assert.equal(parseCampaign(JSON.stringify(forged)), null);
    forged.story!.sector = 'earth';
    forged.story!.progress['earth-debrief'] = 1;
    forged.story!.claimed.push('earth-debrief');
    forged.story!.progress['mars-belt'] = 0;
    forged.story!.claimed = forged.story!.claimed.filter((id) => id !== 'mars-belt');
    assert.equal(parseCampaign(JSON.stringify(forged)), null);
});

test('Venus has no lunar surface or Mars patrols; failure keeps contributions and rescue remains sector-specific', () => {
    const c = venusReady();
    report(c, ['relay']);
    c.bank.ore = 8;
    contributeStory(c, 'venus-stockpile');
    // Survival is deterministic; choose a fixture identity that leaves a rescue signal.
    while (!createRecoverySignal(c.ship!, c.pilots[0], STORY_SECTORS.venus.seed, { x: 0, y: 0 }))
        c.ship!.id = c.nextShipId++;
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.surfaceUnlocked, false);
        assert.equal(s.enemies.enemies.size, 0);
        assert.ok(s.landmarks.every((l) => !l.area && l.kind !== 'passage'));
        finishRun(c, false, empty, 10, 'lost', 0, {
            data: ['archive'],
            lossPosition: { x: 15000, y: 20000 },
        });
        assert.equal(c.story!.progress['venus-stockpile'], 8);
        assert.equal(c.story!.progress['venus-site'], 0);
        const signal = c.recoverySignals[0];
        assert.equal(signal.seed, STORY_SECTORS.venus.seed);
        assert.ok(Math.hypot(signal.x, signal.y) < storyRadius(c.story!));
        assert.ok(emergencyKit(c));
        travelStory(c, 'earth');
        assert.equal(beginRun(c, 1, signal.id), false);
        travelStory(c, 'venus');
        assert.ok(beginRun(c, 1, signal.id));
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const distance = Math.hypot(dx, dy),
        error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
test('a stock Prospector can scan Venus, mine the needed supply, survey the future site and dock normally', () => {
    const c = venusReady();
    for (const scan of ['relay', 'archive'] as const) {
        assert.ok(beginRun(c, 1));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            const site = s.landmarks.find((l) => l.siteId === scan)!;
            assert.ok(site);
            for (let f = 0; f < 60 * 360 && !s.ended; f++) {
                let input: FlightInput;
                if (scan === 'relay' && s.cargo.ore < 20 && s.cargo.ore + s.cargo.parts < 39) {
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
                        assert.ok(rock);
                        const rp = rock.body.translation();
                        input = {
                            ...steer(s, { x: rp.x * 100, y: rp.y * 100 }, rock.radius + 70),
                            fire: true,
                            mine: true,
                        };
                    }
                } else if (!s.surveyData.has(scan))
                    input = { ...steer(s, site, 85), interact: true };
                else input = { ...steer(s, { x: 0, y: 0 }, 85), interact: true };
                s.step(input);
                s.events.length = 0;
            }
            assert.equal(
                s.ended,
                'returned',
                `${scan}: ore ${s.cargo.ore}, hull ${s.hull}, position ${JSON.stringify(s.position)}`,
            );
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                data: [...s.surveyData],
            });
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.ok(c.bank.ore >= 32);
    assert.ok(contributeStory(c, 'venus-stockpile'));
    assert.ok(venusPreparationComplete(c.story!));
    assert.equal(storySectorComplete(c.story!, 'venus'), false);
    assert.ok(actTwoComplete(c.story!));
});
