import { resourceTotal } from '../frontend/game/state/resources';
import { grantLunarProcessing } from './fleet-fixtures';
import { fundEquipment } from './fleet-fixtures';
import { WORKSHOP_CONSTRUCTION } from '../frontend/game/state/stationConstruction';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    beginRun,
    finishRun,
    newStoryCampaign,
    parseCampaign,
    buyUpgrade,
    newShip,
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
import { MOON, moonDistance, moonOrbitPoint } from '../frontend/game/worlds/moon';
import { salvagePosition } from '../frontend/game/systems/salvage';
import { angleDifference } from '../frontend/game/systems/flight';
import { lunarTransferPose, lunarTransferPoint } from '../frontend/game/graphics/lunarTransfer';
import { ShapeLibrary } from '../frontend/game/graphics/shapes';
import { MoonSurfaceView } from '../frontend/game/graphics/moonSurface';
import { MissionWorld } from '../frontend/game/worlds/missionWorld';
import { RECOVERY } from '../frontend/game/config';
import type { Container, Graphics } from 'pixi.js';

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
    fundEquipment(c, WORKSHOP_CONSTRUCTION[c.station.workshop]);
    buyUpgrade(c, 'workshop');
    syncStory(c);
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 1, { data: ['archive'] });
    travelStory(c, 'lunar');
    beginRun(c, 1);
    finishRun(c, true, { ore: 0, parts: 0 }, 10, 'dock', 1, { data: ['relay'] });
    grantLunarProcessing(c);
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
    while (s.transferActive) s.step(idle);
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
        hold(s, Math.ceil(MOON.arrivalSeconds * 60) + 150);
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

test('construction requires real surface deliveries and radio confirmation; rewards settle once', () => {
    const c = lunarReady();
    c.station.storage = 1;
    c.bank = { ore: 172, parts: 20, carbon: 2 };
    assert.equal(deliverLunarCargo(c, { ore: 48, parts: 12 }), null);
    for (let sortie = 0; sortie < 5; sortie++) {
        const manifest = constructionManifest(c);
        assert.ok(beginRun(c, 1, null, true));
        const s = new MissionSimulation(c, c.activeRun!.seed);
        try {
            // Fly normally from Satuk 15 through both approaches and back.
            s.step(idle);
            fly(s, MOON.entrance, () => s.area === 'surface');
            assert.equal(resourceTotal(s.cargo), resourceTotal(manifest));
            const targetStage = sortie < 4 ? (sortie < 3 ? 0 : 1) : 2;
            fly(s, MOON.construction, () => resourceTotal(s.cargo) === 0);
            assert.equal(s.buildStage, targetStage);
            if (sortie === 4) {
                hold(s, 190);
                assert.ok(s.surveyData.has('archive'));
                assert.equal(c.story!.progress['lunar-commission'], 1);
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
    assert.equal(c.bank.parts, 26);
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
        assert.equal(s.cargo.parts, 0, 'natural rocks do not contain manufactured parts');
        assert.ok(s.statistics.rocksDestroyed > 0);
        // Leave the solid quarry around its northern edge before approaching construction.
        fly(
            s,
            { x: s.position.x, y: MOON.construction.y - 150 },
            () => Math.abs(s.position.y - (MOON.construction.y - 150)) < 120,
        );
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

test('distant lunar copper outcrops stay attached, break into loose fragments, and support a real return', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        const outcrops = [...s.rocks.values()].filter((r) => r.anchored && r.copper);
        assert.equal(outcrops.length, 12);
        assert.ok(outcrops.every((r) => r.body.isFixed()));
        assert.ok(
            outcrops.every(
                (r) => moonDistance({ x: r.previous.x, y: r.previous.y }) + r.radius < MOON.radius,
            ),
        );
        assert.ok(s.sector.landmarks.some((l) => l.key === 5 && l.area === 'surface'));
        fly(s, MOON.entrance, () => s.area === 'surface');
        fly(
            s,
            MOON.copperRidge,
            () =>
                Math.hypot(s.position.x - MOON.copperRidge.x, s.position.y - MOON.copperRidge.y) <
                420,
        );
        for (let frame = 0; frame < 60 * 160 && !s.ended && !(s.cargo.copperOre ?? 0); frame++) {
            const p = s.position;
            const loot = [...s.loot.values()]
                .filter((l) => l.kind === 'copperOre')
                .sort(
                    (a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
                )[0];
            if (loot) s.step(steer(s, loot, 35));
            else {
                const rock = [...s.rocks.values()]
                    .filter((r) => r.copper && moonDistance(r.previous) < MOON.radius)
                    .sort(
                        (a, b) =>
                            Math.hypot(a.previous.x - p.x, a.previous.y - p.y) -
                            Math.hypot(b.previous.x - p.x, b.previous.y - p.y),
                    )[0];
                assert.ok(rock);
                s.step({ ...steer(s, rock.previous, rock.radius + 85), mine: true });
            }
            s.events.length = 0;
        }
        assert.equal(s.ended, null);
        assert.ok((s.cargo.copperOre ?? 0) > 0, 'copper must be physically collected');
        assert.ok(
            [...s.rocks.values()].some(
                (r) =>
                    r.copper &&
                    !r.anchored &&
                    r.body.isDynamic() &&
                    moonDistance(r.previous) < MOON.radius,
            ),
            'broken outcrops release movable fragments',
        );
        for (const rock of outcrops.filter((r) => s.rocks.has(r.id))) {
            assert.equal(rock.body.translation().x * 100, rock.previous.x);
            assert.equal(rock.body.translation().y * 100, rock.previous.y);
        }
        fly(s, MOON.exit, () => s.area === 'orbit');
        fly(s, { x: 0, y: 0 }, () => s.ended === 'returned');
        const cargo = { ...s.cargo };
        const before = c.bank.copperOre ?? 0;
        finishRun(c, true, cargo, s.elapsed, 'dock');
        assert.equal(c.bank.copperOre, before + cargo.copperOre!);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('lunar cinematic locks actions and world time in both directions, preserving supplies and held-E protection', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    try {
        s.cargo.ore = 9;
        s.hull -= 10;
        at(s, MOON.entrance);
        s.step(idle);
        hold(s);
        assert.equal(s.area, 'surface');
        assert.ok(s.transferActive);
        const snapshot = () => ({
            elapsed: s.elapsed,
            position: { ...s.position },
            hull: s.hull,
            shield: s.shield,
            cargo: { ...s.cargo },
            kits: s.repairKits,
            shots: s.bullets.size,
            ore: s.miningEscort!.cargoOre,
            health: s.miningEscort!.health,
        });
        const before = snapshot();
        const hostile = {
            ...idle,
            thrust: true,
            turn: 1,
            fire: true,
            mine: true,
            interact: true,
            repair: true,
            sabotage: true,
            boost: true,
        };
        for (let i = 0; i < 50; i++) s.step(hostile);
        assert.ok(s.transferActive);
        assert.deepEqual(snapshot(), before);
        for (let i = 0; i < Math.ceil(MOON.arrivalSeconds * 60) && s.transferActive; i++)
            s.step(hostile);
        assert.equal(s.transferActive, false);
        assert.deepEqual(snapshot(), before);
        hold(s, 130);
        assert.equal(s.area, 'surface', 'held E cannot immediately reverse the transfer');
        s.step(idle);
        hold(s);
        assert.equal(s.area, 'orbit');
        assert.ok(s.transferActive);
        const back = snapshot();
        while (s.transferActive) s.step(hostile);
        assert.deepEqual(snapshot(), back);
        assert.equal(c.activeRun!.area, undefined);
        assert.ok(parseCampaign(JSON.stringify(c)));
    } finally {
        s.dispose();
    }
});

test('releasing E during approach cancels the passage without transferring or locking controls', () => {
    const c = lunarReady();
    beginRun(c, 1);
    const s = new MissionSimulation(c, 1);
    try {
        at(s, MOON.entrance);
        s.step(idle);
        hold(s, 105);
        assert.ok(s.passageProgress > 1.6);
        assert.equal(s.area, 'orbit');
        assert.equal(s.transferActive, false);
        s.step(idle);
        assert.equal(s.passageProgress, 0);
        for (let i = 0; i < 90; i++) s.step({ ...idle, thrust: true });
        assert.equal(s.area, 'orbit');
        assert.ok(s.speed > 60);
    } finally {
        s.dispose();
    }
});

test('lunar approach grows the actual map continuously from globe LOD to the landing camera', () => {
    assert.deepEqual(moonOrbitPoint(MOON.exit), MOON.entrance);
    assert.deepEqual(moonOrbitPoint({ x: MOON.exit.x + 90, y: MOON.exit.y - 40 }), {
        x: MOON.entrance.x + 90,
        y: MOON.entrance.y - 40,
    });
    const zoom = 1.15;
    const start = lunarTransferPose(0, true, zoom);
    const end = lunarTransferPose(1, true, zoom);
    assert.equal(start.zoom * MOON.radius, 126 * 0.95);
    assert.deepEqual(start.pivot, MOON.center);
    assert.equal(start.detail, 0);
    assert.equal(start.pitch, 0);
    assert.ok(Math.abs(end.zoom - zoom) < 1e-12);
    assert.deepEqual(end.pivot, MOON.exit);
    assert.equal(end.detail, 1);
    let previousZoom = start.zoom;
    for (let frame = 1; frame <= 100; frame++) {
        const pose = lunarTransferPose(frame / 100, true, zoom);
        const departure = lunarTransferPose(1 - frame / 100, false, zoom);
        assert.ok(pose.zoom > previousZoom);
        assert.ok(Math.abs(pose.zoom - departure.zoom) < 1e-12);
        assert.ok(Math.abs(pose.pivot.x - departure.pivot.x) < 1e-9);
        previousZoom = pose.zoom;
    }
    assert.equal(lunarTransferPose(0.4, true, zoom).detail, 1);
    assert.equal(lunarTransferPose(0.5, true, zoom).pitch, 1);
    assert.deepEqual(lunarTransferPose(-1, true, zoom), start);
    assert.deepEqual(lunarTransferPose(2, true, zoom), end);
});

test('lunar transfer keeps the ship centered and its tow at a stable screen offset in both directions', () => {
    const zoom = 1.15;
    for (const surface of [true, false]) {
        const anchor = surface ? MOON.exit : MOON.entrance;
        const ship = { x: anchor.x + 23, y: anchor.y - 31 };
        const tow = { x: ship.x - 120, y: ship.y + 50 };
        for (const progress of [0, 0.25, 0.5, 0.75, 0.999999, 1]) {
            const pose = lunarTransferPose(progress, surface, zoom);
            const shipView = lunarTransferPoint(ship, ship, pose, zoom);
            const towView = lunarTransferPoint(tow, ship, pose, zoom);
            assert.deepEqual(shipView, pose.pivot);
            assert.ok(
                Math.abs((towView.x - shipView.x) * pose.zoom - (tow.x - ship.x) * zoom) < 1e-8,
            );
            assert.ok(
                Math.abs((towView.y - shipView.y) * pose.zoom - (tow.y - ship.y) * zoom) < 1e-8,
            );
            assert.ok(Math.abs(pose.zoom * (zoom / pose.zoom) - zoom) < 1e-12);
        }
        assert.deepEqual(lunarTransferPoint(ship, ship, null, zoom), ship);
        assert.deepEqual(lunarTransferPoint(tow, ship, null, zoom), tow);
    }
});

test('renderer keeps the physical tow visible and has no endpoint jump in either lunar transfer direction', () => {
    for (const surface of [false, true]) {
        const campaign = lunarReady();
        beginRun(campaign, 1);
        const simulation = new MissionSimulation(campaign, 1);
        let world: MissionWorld | null = null;
        try {
            simulation.area = surface ? 'surface' : 'orbit';
            const anchor = surface ? MOON.exit : MOON.entrance;
            at(simulation, anchor);
            simulation.previous = simulation.position;
            const item = simulation.salvage.add(
                1001,
                'patrol',
                { x: anchor.x - 90, y: anchor.y },
                { x: 0, y: 0 },
            )!;
            assert.ok(simulation.salvage.attach(item, simulation.ship));
            const timing = simulation as unknown as { transferRemaining: number };
            timing.transferRemaining = MOON.arrivalSeconds;
            world = new MissionWorld(simulation, campaign.ship!);
            const views = (world as unknown as { salvageViews: Map<number, Container> })
                .salvageViews;
            let previousTow: { x: number; y: number } | null = null;
            for (const progress of [0, 0.25, 0.5, 0.75, 0.999999, 1]) {
                timing.transferRemaining = MOON.arrivalSeconds * (1 - progress);
                world.update(0, idle);
                const tow = views.get(item.id)!;
                assert.ok(tow.visible, `tow hidden at ${progress}, surface ${surface}`);
                const shipScreen = world.shipView.getGlobalPosition();
                const towScreen = tow.getGlobalPosition();
                assert.ok(Math.abs(shipScreen.x - 800) < 1e-7);
                assert.ok(Math.abs(shipScreen.y - 450) < 1e-7);
                assert.ok(Math.abs(tow.scale.x * world.camera.scale.x - 1) < 1e-12);
                if (previousTow)
                    assert.ok(
                        Math.hypot(towScreen.x - previousTow.x, towScreen.y - previousTow.y) < 1e-7,
                    );
                previousTow = { x: towScreen.x, y: towScreen.y };
            }
        } finally {
            world?.destroy({ children: true });
            simulation.dispose();
        }
    }
});

test('recovery outlines and attachment progress do not inherit other signals or tow paths', () => {
    for (const surface of [false, true]) {
        const campaign = lunarReady();
        beginRun(campaign, 1);
        const anchor = surface ? MOON.construction : MOON.entrance;
        campaign.recoverySignals = [2, 3, 4].map((id) => ({
            id,
            seed: campaign.activeRun!.seed,
            x: anchor.x + (id - 4) * 100,
            y: anchor.y + 30,
            ship: newShip(id),
            pilot: null,
            ...(surface ? { area: 'surface' as const } : {}),
        }));
        const simulation = new MissionSimulation(campaign, campaign.activeRun!.seed);
        let world: MissionWorld | null = null;
        try {
            simulation.area = surface ? 'surface' : 'orbit';
            at(simulation, anchor);
            simulation.previous = simulation.position;
            const item =
                simulation.salvage.items.get(-2) ??
                simulation.salvage.add(-2, 'recovery', campaign.recoverySignals[0], {
                    x: 0,
                    y: 0,
                })!;
            assert.ok(simulation.salvage.attach(item, simulation.ship));
            const target = campaign.recoverySignals[2];
            simulation.recoverySignal = target;
            world = new MissionWorld(simulation, campaign.ship!);
            const ring = (world as unknown as { recoveryRing: Graphics }).recoveryRing;
            for (const fraction of [0.25, 0.6]) {
                simulation.recoveryProgress = simulation.recoverySeconds * fraction;
                world.update(0, idle);
                const strokes = ring.context.instructions.filter(
                    (instruction) => instruction.action === 'stroke',
                );
                assert.equal(strokes.length, 4);
                assert.deepEqual(
                    strokes[0].data.path.instructions.map((instruction) => instruction.action),
                    ['moveTo', 'lineTo'],
                );
                for (const index of [1, 2]) {
                    const path = strokes[index].data.path.instructions;
                    assert.deepEqual(
                        path.map((instruction) => instruction.action),
                        ['circle'],
                    );
                    assert.deepEqual(path[0].data.slice(0, 3), [
                        campaign.recoverySignals[index].x,
                        campaign.recoverySignals[index].y,
                        RECOVERY.radius,
                    ]);
                }
                const progress = strokes[3].data.path.instructions;
                assert.ok(
                    progress.every((instruction) => ['arc', 'moveTo'].includes(instruction.action)),
                );
                const arc = progress.find((instruction) => instruction.action === 'arc')!;
                assert.deepEqual(arc.data.slice(0, 5), [
                    target.x,
                    target.y,
                    RECOVERY.radius,
                    -Math.PI / 2,
                    -Math.PI / 2 + fraction * Math.PI * 2,
                ]);
            }
            simulation.recoveryProgress = 0;
            world.update(0, idle);
            assert.equal(ring.context.instructions.length, 3);
        } finally {
            world?.destroy({ children: true });
            simulation.dispose();
        }
    }
});

test('holding E draws an isolated passage progress arc and releasing E clears it', () => {
    const view = new MoonSurfaceView(true);
    try {
        const progress = view.getChildByLabel('lunar-passage-progress') as Graphics;
        for (const surface of [false, true]) {
            const anchor = surface ? MOON.exit : MOON.entrance;
            view.update(surface, 0, 0.7, 1, MOON.transferSeconds / 2);
            const strokes = progress.context.instructions.filter(
                (instruction) => instruction.action === 'stroke',
            );
            assert.equal(strokes.length, 1);
            const instructions = strokes[0].data.path.instructions;
            assert.ok(
                instructions.every((instruction) => ['arc', 'moveTo'].includes(instruction.action)),
            );
            const arc = instructions.find((instruction) => instruction.action === 'arc')!;
            assert.deepEqual(arc.data.slice(0, 5), [
                anchor.x,
                anchor.y,
                155,
                -Math.PI / 2,
                Math.PI / 2,
            ]);
            view.update(surface, 0, 0.7, 1, 0);
            assert.equal(progress.context.instructions.length, 0);
        }
    } finally {
        view.destroy({ children: true });
    }
});

test('lunar passage marker strokes do not inherit the filled approach circle', () => {
    const view = new MoonSurfaceView(true);
    try {
        for (const gate of [view.children[0].children[4], view.children[1].children[0]]) {
            const marker = gate.children[0] as Graphics;
            const strokes = marker.context.instructions.filter(
                (instruction) => instruction.action === 'stroke',
            );
            assert.equal(strokes.length, 1);
            assert.deepEqual(
                strokes[0].data.path.instructions.map((instruction) => instruction.action),
                ['poly'],
            );
            assert.deepEqual(
                strokes[0].data.path.instructions[0].data[0],
                [-40, 15, 0, -25, 40, 15],
            );
        }
    } finally {
        view.destroy({ children: true });
    }
});

test('lunar outcrops use their own cached faceted shapes rather than orbital asteroid silhouettes', () => {
    const shapes = new ShapeLibrary();
    const first = shapes.lunarRock(17, true);
    const second = shapes.lunarRock(17, true);
    const orbital = shapes.rock(17, true);
    const copper = shapes.lunarRock(17, true, true);
    assert.equal(first.context, second.context);
    assert.notEqual(first.context, orbital.context);
    assert.notEqual(first.context, copper.context);
    first.destroy();
    second.destroy();
    orbital.destroy();
    copper.destroy();
});
