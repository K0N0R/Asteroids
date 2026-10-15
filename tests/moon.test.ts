import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    buyUpgrade,
} from '../frontend/game/state/campaign';
import {
    contributeStory,
    syncStory,
    travelStory,
    constructionManifest,
    lunarBuildStage,
    deliverLunarCargo,
} from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { MOON, moonDistance } from '../frontend/game/worlds/moon';
import { salvagePosition } from '../frontend/game/systems/salvage';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function lunarReady() {
    const c = newStoryCampaign();
    c.bank.ore = 24;
    contributeStory(c, 'earth-supply');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 1, { data: ['relay'] });
    buyUpgrade(c, 'workshop');
    syncStory(c);
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 1, { data: ['archive'] });
    travelStory(c, 'lunar');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 1, { data: ['relay'] });
    return c;
}
function at(s: MissionSimulation, p: { x: number; y: number }) {
    s.ship.setTranslation({ x: p.x / 100, y: p.y / 100 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
}
function hold(s: MissionSimulation, frames = 125) {
    for (let i = 0; i < frames; i++) s.step({ ...idle, interact: true });
}
function enter(s: MissionSimulation) {
    at(s, MOON.entrance);
    s.step(idle);
    hold(s);
    assert.equal(s.area, 'surface');
}
function steer(s: MissionSimulation, target: { x: number; y: number }, radius = 85) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const distance = Math.hypot(dx, dy),
        stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function fly(s: MissionSimulation, target: { x: number; y: number }, action: () => boolean) {
    s.step(idle);
    for (let frame = 0; frame < 60 * 100 && !s.ended && !action(); frame++) {
        s.step({
            ...steer(s, target),
            interact: Math.hypot(target.x - s.position.x, target.y - s.position.y) < 160,
        });
        s.events.length = 0;
    }
    assert.ok(
        action(),
        `flight to ${JSON.stringify(target)} failed at ${JSON.stringify(s.position)}, area ${s.area}, hull ${s.hull}, angle ${s.ship.rotation()}, speed ${s.speed}, passage ${s.passageProgress}, stage ${s.buildStage}`,
    );
}

test('v19 journals migrate new building objectives without losing previous sector progress', () => {
    const c = lunarReady();
    const old = JSON.parse(JSON.stringify(c));
    old.version = 19;
    for (const key of Object.keys(old.story.progress))
        if (key.startsWith('mars-') || key.startsWith('venus-') || key === 'earth-debrief')
            delete old.story.progress[key];
    for (const key of Object.keys(old.story.progress))
        if (key.startsWith('mercury-')) delete old.story.progress[key];
    for (const key of Object.keys(old.story.progress))
        if (key.startsWith('mars-base-') || key === 'mars-corridor' || key === 'mars-route')
            delete old.story.progress[key];
    old.story.version = 1;
    for (const key of [
        'lunar-foundation',
        'lunar-installations',
        'lunar-commission',
        'lunar-defense',
        'lunar-attack',
    ])
        delete old.story.progress[key];
    const parsed = parseCampaign(JSON.stringify(old))!;
    assert.ok(parsed);
    assert.equal(parsed.version, 27);
    assert.deepEqual(parsed.story!.claimed, c.story!.claimed);
    assert.equal(parsed.story!.progress['lunar-foundation'], 0);
    old.story.progress.unknown = 0;
    assert.equal(parseCampaign(JSON.stringify(old)), null);
});

test('cargo manifests debit the bank once, respect capacity, and require a reachable construction project', () => {
    const c = lunarReady();
    c.bank.ore = 100;
    assert.deepEqual(constructionManifest(c), { ore: 40, parts: 0 });
    assert.ok(beginRun(c, 1, null, true));
    assert.equal(c.bank.ore, 60);
    assert.equal(beginRun(c, 1, null, true), false);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    assert.deepEqual(s.cargo, { ore: 40, parts: 0 });
    assert.deepEqual(parseCampaign(JSON.stringify(c)), c);
    s.dispose();
    const invalid = JSON.parse(JSON.stringify(c));
    invalid.activeRun.freight.ore = 41;
    assert.equal(parseCampaign(JSON.stringify(invalid)), null);
    const fresh = newStoryCampaign();
    fresh.bank.ore = 100;
    assert.equal(beginRun(fresh, 1, null, true), false);
    assert.equal(fresh.bank.ore, 100);
});

test('passages preserve damage, supplies, cargo, data and a physical tow; held E cannot bounce back', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.cargo.ore = 9;
        s.hull -= 10;
        const hull = s.hull;
        s.surveyData.add('relay');
        at(s, MOON.entrance);
        const tow = s.salvage.add(
            1001,
            'patrol',
            { x: MOON.entrance.x - 90, y: MOON.entrance.y },
            { x: 0, y: 0 },
        )!;
        assert.ok(s.salvage.attach(tow, s.ship));
        s.step(idle);
        hold(s);
        assert.equal(s.area, 'surface');
        assert.equal(s.ended, null);
        assert.equal(s.hull, hull);
        assert.equal(s.cargo.ore, 9);
        assert.ok(s.surveyData.has('relay'));
        assert.ok(
            Math.hypot(
                salvagePosition(tow).x - s.position.x,
                salvagePosition(tow).y - s.position.y,
            ) < 240,
        );
        hold(s, 150);
        assert.equal(s.area, 'surface');
        s.step(idle);
        hold(s);
        assert.equal(s.area, 'orbit');
        assert.equal(c.activeRun!.area, undefined);
        assert.ok(
            Math.hypot(
                salvagePosition(tow).x - s.position.x,
                salvagePosition(tow).y - s.position.y,
            ) < 240,
        );
        assert.equal(s.salvage.towing.size, 1);
    } finally {
        s.dispose();
    }
});

test('delivered cargo survives death or refresh, while undelivered freight is lost', () => {
    const c = lunarReady();
    c.bank.ore = 60;
    beginRun(c, 1, null, true);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        enter(s);
        at(s, MOON.construction);
        s.step(idle);
        hold(s);
        assert.equal(c.story!.progress['lunar-foundation'], 40);
        assert.equal(s.cargo.ore, 0);
        assert.equal(c.activeRun!.freight!.ore, 0);
        assert.equal(c.bank.ore, 20);
        assert.ok(s.deliveryRevision >= 2);
        const saved = parseCampaign(JSON.stringify(c))!;
        assert.ok(saved);
        finishRun(saved, false, { ore: 0, parts: 0 }, 0, 'refresh');
        assert.equal(saved.story!.progress['lunar-foundation'], 40);
        assert.equal(saved.bank.ore, 20);
        for (const signal of saved.recoverySignals) {
            assert.equal(signal.area, 'surface');
            assert.ok(moonDistance(signal) <= MOON.radius - 200);
        }
        assert.ok(parseCampaign(JSON.stringify(saved)));
    } finally {
        s.dispose();
    }
});

test('construction requires real surface deliveries and safe return of the final report; rewards settle once', () => {
    const c = lunarReady();
    c.bank = { ore: 60, parts: 20 };
    assert.equal(deliverLunarCargo(c, { ore: 48, parts: 12 }), null);
    for (let sortie = 0; sortie < 3; sortie++) {
        const manifest = constructionManifest(c);
        assert.ok(beginRun(c, 1, null, true));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            // Fly normally from Satuk 15 through both approaches and back.
            s.step(idle);
            fly(s, MOON.entrance, () => s.area === 'surface');
            assert.equal(s.cargo.ore + s.cargo.parts, manifest.ore + manifest.parts);
            const targetStage = sortie < 2 ? (sortie === 0 ? 0 : 1) : 2;
            fly(s, MOON.construction, () => s.cargo.ore + s.cargo.parts === 0);
            assert.equal(s.buildStage, targetStage);
            if (sortie === 2) {
                hold(s, 190);
                assert.ok(s.surveyData.has('archive'));
                assert.equal(c.story!.progress['lunar-commission'], 0);
            }
            fly(s, MOON.exit, () => s.area === 'orbit');
            fly(s, { x: 0, y: 0 }, () => s.ended === 'returned');
            finishRun(c, true, s.cargo, s.elapsed, 'dock', s.repairKits, {
                data: [...s.surveyData],
            });
            assert.ok(parseCampaign(JSON.stringify(c)));
        } finally {
            s.dispose();
        }
    }
    assert.equal(lunarBuildStage(c.story!), 3);
    assert.equal(c.bank.ore, 36);
    assert.equal(c.bank.parts, 14);
    const bank = { ...c.bank };
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 0, { data: ['archive'] });
    assert.deepEqual(c.bank, bank);
});

test('surface scan and transition reject missing prerequisites, thrust, high speed and active weapons', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        at(s, MOON.entrance);
        s.step(idle);
        for (let i = 0; i < 150; i++) s.step({ ...idle, interact: true, mine: true });
        assert.equal(s.area, 'orbit');
        for (const input of [{ fire: true }, { thrust: true }]) {
            at(s, MOON.entrance);
            s.step(idle);
            for (let i = 0; i < 125; i++) s.step({ ...idle, ...input, interact: true });
            assert.equal(s.area, 'orbit');
        }
        at(s, MOON.entrance);
        s.step(idle);
        for (let i = 0; i < 125; i++) {
            s.ship.setLinvel({ x: 2, y: 0 }, true);
            s.step({ ...idle, interact: true });
        }
        assert.equal(s.area, 'orbit');
        s.step(idle);
        at(s, MOON.entrance);
        hold(s);
        assert.equal(s.area, 'surface');
        at(s, MOON.construction);
        hold(s, 200);
        assert.equal(s.surveyData.has('archive'), false);
        assert.equal(s.dockable, false);
        assert.equal(c.story!.progress['lunar-foundation'], 0);
    } finally {
        s.dispose();
    }
});

test('surface quarry supports actual mining and collection with the starter ship', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.step(idle);
        fly(s, MOON.entrance, () => s.area === 'surface');
        fly(
            s,
            MOON.quarry,
            () => Math.hypot(s.position.x - MOON.quarry.x, s.position.y - MOON.quarry.y) < 350,
        );
        for (
            let frame = 0;
            frame < 60 * 100 && !s.ended && s.cargo.ore + s.cargo.parts < 20;
            frame++
        ) {
            const p = s.position;
            const loot = [...s.loot.values()].sort(
                (a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
            )[0];
            if (loot && Math.hypot(loot.x - p.x, loot.y - p.y) < 450) s.step(steer(s, loot, 45));
            else {
                const rock = [...s.rocks.values()]
                    .filter(
                        (r) =>
                            moonDistance({
                                x: r.body.translation().x * 100,
                                y: r.body.translation().y * 100,
                            }) < MOON.radius,
                    )
                    .sort((a, b) => {
                        const ap = a.body.translation(),
                            bp = b.body.translation();
                        return (
                            Math.hypot(ap.x * 100 - p.x, ap.y * 100 - p.y) -
                            Math.hypot(bp.x * 100 - p.x, bp.y * 100 - p.y)
                        );
                    })[0]!;
                const rp = rock.body.translation();
                s.step({
                    ...steer(s, { x: rp.x * 100, y: rp.y * 100 }, rock.radius + 70),
                    mine: true,
                });
            }
            s.events.length = 0;
        }
        assert.equal(s.ended, null);
        assert.ok(s.cargo.ore > 0);
        assert.ok(s.cargo.parts > 0);
        assert.ok(s.statistics.rocksDestroyed > 0);
        fly(s, MOON.construction, () => c.story!.progress['lunar-foundation'] > 0);
    } finally {
        s.dispose();
    }
});

test('surface journals reject impossible areas and unloaded freight does not generate mining experience', () => {
    const c = lunarReady();
    c.bank.ore = 50;
    beginRun(c, 1, null, true);
    const broken = JSON.parse(JSON.stringify(c));
    broken.activeRun.area = 'mars';
    assert.equal(parseCampaign(JSON.stringify(broken)), null);
    const control = lunarReady();
    beginRun(control, 1);
    finishRun(c, true, { ore: 40, parts: 0 }, 10, 'dock');
    finishRun(control, true, { ore: 0, parts: 0 }, 10, 'dock');
    assert.equal(c.pilots[0].xp, control.pilots[0].xp);
    assert.equal(c.bank.ore, 50);
});
