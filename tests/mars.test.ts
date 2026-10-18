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
    storySectorUnlocked,
    storySectorComplete,
    storyRadius,
    travelStory,
    storyObjectives,
} from '../frontend/game/state/story';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { angleDifference } from '../frontend/game/systems/flight';
import { enemyPosition } from '../frontend/game/systems/enemies';

before(async () => RAPIER.init());
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const task of STORY_TASKS.filter((t) => t.act === 1 && t.required)) {
        c.story!.progress[task.id] = task.target;
        c.story!.claimed.push(task.id);
    }
    assert.ok(travelStory(c, 'mars'));
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
const empty = { ore: 0, parts: 0 };
function report(c: ReturnType<typeof ready>, patrolKills = 0, data: ('relay' | 'archive')[] = []) {
    assert.ok(beginRun(c, 999));
    return finishRun(c, true, empty, 30, 'dock', c.activeRun!.repairKits, { patrolKills, data })!;
}

test('Mars requires the final Act I report, preserves optional tasks and supports backtracking', () => {
    const c = newStoryCampaign();
    assert.equal(storySectorUnlocked(c.story!, 'mars'), false);
    assert.equal(travelStory(c, 'mars'), false);
    const p = ready();
    assert.equal(p.story!.progress['earth-reserve'], 0);
    assert.equal(p.story!.progress['mars-reserve'], 0);
    report(p, 1, ['relay']);
    const progress = { ...p.story!.progress };
    assert.ok(travelStory(p, 'earth'));
    assert.ok(travelStory(p, 'lunar'));
    assert.ok(travelStory(p, 'mars'));
    assert.deepEqual(p.story!.progress, progress);
    assert.equal(beginRun(p, 4), true);
    assert.equal(p.activeRun!.seed, STORY_SECTORS.mars.seed);
    assert.equal(travelStory(p, 'earth'), false);
});

test('parallel reports expand Mars once; the belt scan and optional reserve remain independent', () => {
    for (const first of ['scan', 'combat']) {
        const c = ready();
        report(c, 0, ['archive']); // Hidden coordinates cannot complete a locked scan.
        assert.equal(c.story!.progress['mars-belt'], 0);
        const bank = { ...c.bank };
        report(c, first === 'combat' ? 1 : 0, first === 'scan' ? ['relay'] : []);
        assert.equal(storyRadius(c.story!), 3000);
        report(c, first === 'combat' ? 1 : 2, first === 'combat' ? ['relay'] : []);
        assert.equal(storyRadius(c.story!), 4600);
        assert.deepEqual(c.bank, { ore: bank.ore + 40, parts: bank.parts + 10 });
        assert.equal(generateStorySector(c.story!).enemies.length, 0);
        assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.key === 8));
        assert.ok(report(c, 0, ['archive']).reason.includes('Pas asteroid blokuje pościg'));
        assert.ok(storySectorComplete(c.story!, 'mars'));
        assert.equal(c.story!.progress['mars-reserve'], 0);
        const earned = { ...c.bank };
        report(c, 2, ['archive', 'relay']);
        assert.deepEqual(c.bank, earned);
        assert.ok(parseCampaign(JSON.stringify(c)));
    }
});

test('combat reports are provisional, only tagged patrols count, and losses retain earlier reports', () => {
    const c = ready();
    report(c, 1);
    assert.equal(generateStorySector(c.story!).enemies.length, 1);
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(s.surfaceUnlocked, false);
        assert.ok(s.landmarks.every((l) => !l.area && l.kind !== 'passage'));
        assert.equal(s.enemies.enemies.size, 1);
        assert.ok([...s.enemies.enemies.values()].every((e) => e.storyPatrol));
        assert.ok(
            storyObjectives(c, [], false, 1)
                .find((t) => t.id === 'mars-patrol')!
                .progress.includes('wysyłanie raportu'),
        );
        finishRun(c, false, empty, 5, 'lost', 0, { patrolKills: 1, data: ['relay'] });
        assert.equal(c.story!.progress['mars-patrol'], 1);
        assert.equal(c.story!.progress['mars-trail'], 0);
        assert.equal(generateStorySector(c.story!).enemies.length, 1);
        assert.ok(emergencyKit(c));
        report(c, 0); // Unrelated kills do not become story patrol reports.
        assert.equal(c.story!.progress['mars-patrol'], 1);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('Mars recovery stays in its sector and an interrupted sortie loses unreported scans and combat', () => {
    const c = ready();
    report(c, 1);
    beginRun(c, 1);
    const restored = parseCampaign(JSON.stringify(c))!;
    assert.ok(restored.activeRun);
    finishRun(restored, false, empty, 4, 'interrupted', 0, { lossPosition: { x: 9000, y: 0 } });
    const signal = restored.recoverySignals[0];
    assert.equal(signal.seed, STORY_SECTORS.mars.seed);
    assert.equal(signal.area, undefined);
    assert.ok(Math.hypot(signal.x, signal.y) < storyRadius(restored.story!));
    assert.equal(restored.story!.progress['mars-patrol'], 1);
    assert.equal(restored.story!.progress['mars-trail'], 0);
    assert.ok(emergencyKit(restored));
    travelStory(restored, 'earth');
    assert.equal(beginRun(restored, 1, signal.id), false);
    travelStory(restored, 'mars');
    assert.ok(beginRun(restored, 1, signal.id));
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
test('stock Prospector flies the pursuit, defeats real patrol AI, returns reports and scans the blocked belt', () => {
    const c = ready();
    for (const siteId of ['relay', 'archive'] as const) {
        assert.ok(beginRun(c, 1));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            const site = s.landmarks.find((l) => l.siteId === siteId)!;
            assert.ok(site);
            for (let f = 0; f < 60 * 360 && !s.ended; f++) {
                const enemy = [...s.enemies.enemies.values()].sort((a, b) => {
                    const ap = enemyPosition(a),
                        bp = enemyPosition(b),
                        p = s.position;
                    return Math.hypot(ap.x - p.x, ap.y - p.y) - Math.hypot(bp.x - p.x, bp.y - p.y);
                })[0];
                let input: FlightInput;
                if (enemy)
                    input = { ...steer(s, enemyPosition(enemy), 240), fire: true, mine: true };
                else if (s.hull < s.maxHull && s.repairKits) input = { ...idle, repair: true };
                else if (!s.surveyData.has(siteId))
                    input = { ...steer(s, site, 85), interact: true };
                else input = { ...steer(s, { x: 0, y: 0 }, 85), interact: true };
                s.step(input);
                s.events.length = 0;
            }
            assert.equal(
                s.ended,
                'returned',
                `${siteId}: hull ${s.hull}, kills ${s.enemyKills}, position ${JSON.stringify(s.position)}`,
            );
            if (siteId === 'relay') {
                assert.equal(s.storyPatrolKills, 2);
                assert.equal(c.story!.progress['mars-patrol'], 2);
            }
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                patrolKills: s.storyPatrolKills,
                kills: s.enemyKills,
                data: [...s.surveyData],
            });
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.ok(storySectorComplete(c.story!, 'mars'));
    assert.ok(travelStory(c, 'earth'));
});
