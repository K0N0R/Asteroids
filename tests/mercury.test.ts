import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    emergencyKit,
    buyShip,
    hirePilot,
} from '../frontend/game/state/campaign';
import {
    STORY_TASKS,
    STORY_SECTORS,
    storySectorUnlocked,
    storyRadius,
    travelStory,
    beltTechnologyReady,
    storySectorComplete,
} from '../frontend/game/state/story';
import {
    SolarExposure,
    SOLAR,
    MERCURY_SHELTERS,
    inSolarShadow,
} from '../frontend/game/systems/solarExposure';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { enemyPosition } from '../frontend/game/systems/enemies';
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
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter((t) => t.act <= 3 && t.required)) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = 'venus';
    assert.ok(travelStory(c, 'mercury'));
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function report(c: ReturnType<typeof ready>, data: ('relay' | 'archive')[] = [], patrolKills = 0) {
    assert.ok(beginRun(c, 1));
    return finishRun(c, true, empty, 10, 'dock', c.activeRun!.repairKits, { data, patrolKills })!;
}
function replaceLost(c: ReturnType<typeof ready>) {
    emergencyKit(c);
    if (!c.ship) assert.ok(buyShip(c));
    emergencyKit(c);
    if (!c.pilots.length) assert.ok(hirePilot(c, 0));
}
test('Mercury needs both solar preparation and defended Venus; backtracking keeps earlier acts complete', () => {
    const c = ready();
    assert.equal(c.story!.progress['venus-reserve'], 0);
    travelStory(c, 'venus');
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'venus-defense');
    c.story!.progress['venus-defense'] = 0;
    assert.equal(storySectorUnlocked(c.story!, 'mercury'), false);
    assert.equal(travelStory(c, 'mercury'), false);
    c.story!.claimed.push('venus-defense');
    c.story!.progress['venus-defense'] = 1;
    c.story!.claimed = c.story!.claimed.filter((id) => id !== 'venus-shield');
    c.story!.progress['venus-shield'] = 0;
    assert.equal(travelStory(c, 'mercury'), false);
    c.story!.claimed.push('venus-shield');
    c.story!.progress['venus-shield'] = 12;
    for (const sector of ['earth', 'lunar', 'mars', 'mercury'] as const)
        assert.ok(travelStory(c, sector));
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('solar cycles warn before flares; expedition shielding reduces heat and cover cools it', () => {
    const protectedShip = new SolarExposure(),
        bare = new SolarExposure();
    let damageProtected = 0,
        damageBare = 0;
    for (let f = 0; f < 60 * 36; f++) {
        damageProtected += protectedShip.step(1 / 60, false, true);
        damageBare += bare.step(1 / 60, false, false);
    }
    assert.ok(damageBare > damageProtected);
    assert.equal(protectedShip.phase, 'flare');
    assert.equal(protectedShip.heat, 100);
    const previous = protectedShip.heat;
    assert.equal(protectedShip.step(1, true, true), 0);
    assert.equal(protectedShip.heat, previous - SOLAR.cooling);
    const warning = new SolarExposure();
    warning.elapsed = 23;
    assert.equal(warning.phase, 'warning');
    assert.equal(warning.remaining, 5);
    const frozen = { heat: warning.heat, elapsed: warning.elapsed };
    warning.step(0, true, true);
    assert.deepEqual({ heat: warning.heat, elapsed: warning.elapsed }, frozen);
    assert.ok(inSolarShadow({ x: 0, y: 0 }, { x: 240, y: 0, radius: 110 }));
    assert.equal(inSolarShadow({ x: 300, y: 0 }, { x: 240, y: 0, radius: 110 }), false);
    assert.equal(inSolarShadow({ x: 0, y: 100 }, { x: 240, y: 0, radius: 110 }), false);
    assert.equal(inSolarShadow({ x: 0, y: 0 }, { x: 240, y: 0, radius: 40 }), false);
});

test('actual live rocks provide shade; overheating bypasses kinetic shielding and interrupts scans', () => {
    const c = ready();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const target = MERCURY_SHELTERS[0];
        s.ship.setTranslation({ x: target.x / 100, y: target.y / 100 }, true);
        assert.equal(s.solarCovered, true);
        const rock = [...s.rocks.values()].find(
            (r) => r.radius === 110 && Math.abs(r.body.translation().y * 100 - target.y) < 1,
        )!;
        rock.body.setTranslation({ x: 50, y: 50 }, true);
        assert.equal(s.solarCovered, false);
        const hull = s.hull,
            shield = s.kineticShield.charge;
        s.solar.heat = 100;
        for (let f = 0; f < 180; f++) s.step({ ...idle, interact: true });
        assert.ok(s.hull < hull);
        assert.equal(s.kineticShield.charge, shield);
        assert.equal(s.surveyData.size, 0);
        assert.equal(s.scanProgress, 0);
        assert.ok(s.statistics.hullDamage > 0);
    } finally {
        s.dispose();
    }
    const classic = newCampaign();
    beginRun(classic, 1);
    const other = new MissionSimulation(classic, classic.activeRun!.seed);
    try {
        for (let f = 0; f < 180; f++) other.step(idle);
        assert.equal(other.solar.elapsed, 0);
        assert.equal(other.solar.heat, 0);
    } finally {
        other.dispose();
    }
});

test('survey and combat reports gate the technology; safe delivery grants the capability and reward only once', () => {
    const c = ready();
    report(c, ['archive'], 2);
    assert.equal(c.story!.progress['mercury-patrol'], 0);
    assert.equal(beltTechnologyReady(c.story!), false);
    report(c, ['relay']);
    assert.equal(storyRadius(c.story!), 4700);
    report(c, [], 1);
    assert.equal(generateStorySector(c.story!).enemies.length, 1);
    assert.equal(generateStorySector(c.story!).enemies[0].kind, 'lancer');
    report(c, [], 1);
    assert.ok(generateStorySector(c.story!).landmarks.some((l) => l.siteId === 'archive'));
    beginRun(c, 1);
    finishRun(c, false, empty, 1, 'lost', 0, { data: ['archive'] });
    assert.equal(beltTechnologyReady(c.story!), false);
    replaceLost(c);
    const result = report(c, ['archive']);
    assert.ok(beltTechnologyReady(c.story!));
    assert.ok(result.reason.includes('Akt IV ukończony'));
    assert.ok(storySectorComplete(c.story!, 'mercury'));
    assert.equal(c.story!.progress['mercury-reserve'], 0);
    const bank = { ...c.bank };
    report(c, ['archive'], 2);
    assert.deepEqual(c.bank, bank);
    assert.ok(travelStory(c, 'mars'));
    assert.ok(parseCampaign(JSON.stringify(c)));
});

test('Mercury rescue remains in its sector and an interrupted sortie loses only its unreported data', () => {
    const c = ready();
    report(c, ['relay']);
    while (!createRecoverySignal(c.ship!, c.pilots[0], STORY_SECTORS.mercury.seed, { x: 0, y: 0 }))
        c.ship!.id = c.nextShipId++;
    beginRun(c, 1);
    const next = parseCampaign(JSON.stringify(c))!;
    finishRun(next, false, empty, 1, 'refresh', 0, { lossPosition: { x: 15000, y: 0 } });
    const signal = next.recoverySignals[0];
    assert.equal(signal.seed, STORY_SECTORS.mercury.seed);
    assert.ok(Math.hypot(signal.x, signal.y) < storyRadius(next.story!));
    assert.equal(next.story!.progress['mercury-survey'], 1);
    replaceLost(next);
    travelStory(next, 'venus');
    assert.equal(beginRun(next, 1, signal.id), false);
    travelStory(next, 'mercury');
    assert.ok(beginRun(next, 1, signal.id));
});

function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y,
        distance = Math.hypot(dx, dy),
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
test('stock Prospector crosses Mercury, cools in live asteroid shadows, defeats AI and returns the technology', () => {
    const c = ready();
    let cooled = false,
        flared = false;
    for (const goal of ['relay', 'combat', 'combat', 'archive'] as const) {
        beginRun(c, 1);
        const s = new MissionSimulation(c, c.activeRun!.seed);
        let cooling = false;
        if (goal === 'combat') for (let f = 0; f < 60 * 24; f++) s.step(idle);
        try {
            for (let f = 0; f < 60 * 360 && !s.ended; f++) {
                const enemy = [...s.enemies.enemies.values()].sort((a, b) => {
                    const ap = enemyPosition(a),
                        bp = enemyPosition(b),
                        p = s.position;
                    return Math.hypot(ap.x - p.x, ap.y - p.y) - Math.hypot(bp.x - p.x, bp.y - p.y);
                })[0];
                const done = goal === 'combat' ? s.storyPatrolKills >= 1 : s.surveyData.has(goal);
                cooling = s.solar.heat > 60 || (cooling && s.solar.heat > 12);
                let input: FlightInput;
                if (cooling) {
                    const shelter = MERCURY_SHELTERS.slice(
                        0,
                        c.story!.claimed.includes('mercury-survey') ? 3 : 2,
                    ).reduce((a, b) =>
                        Math.hypot(a.x - s.position.x, a.y - s.position.y) <
                        Math.hypot(b.x - s.position.x, b.y - s.position.y)
                            ? a
                            : b,
                    );
                    input = steer(s, shelter, 25);
                    cooled ||= s.solar.sheltered;
                } else if (done) input = { ...steer(s, { x: 0, y: 0 }, 85), interact: true };
                else if (goal === 'combat' && enemy)
                    input = { ...steer(s, enemyPosition(enemy), 240), fire: true };
                else if (goal !== 'combat') {
                    const site = s.landmarks.find((l) => l.siteId === goal)!;
                    assert.ok(site);
                    input = { ...steer(s, site, 45), interact: true };
                } else input = idle;
                flared ||= s.solar.phase === 'flare';
                const heatBefore = s.solar.heat;
                s.step(input);
                cooled ||= s.solar.sheltered && s.solar.heat < heatBefore;
                s.events.length = 0;
            }
            assert.equal(
                s.ended,
                'returned',
                `${goal}: hull ${s.hull}, heat ${s.solar.heat}, kills ${s.storyPatrolKills}, position ${JSON.stringify(s.position)}`,
            );
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                data: [...s.surveyData],
                kills: s.enemyKills,
                patrolKills: s.storyPatrolKills,
            });
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.ok(cooled);
    assert.ok(flared);
    assert.ok(beltTechnologyReady(c.story!));
    assert.ok(storySectorComplete(c.story!, 'mercury'));
});
