import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Background } from '../frontend/core/containers/entities/background';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import {
    venusTransferPose,
    type VenusTransferPresentation,
} from '../frontend/game/graphics/venusTransfer';
import { lunarTransferPose } from '../frontend/game/graphics/lunarTransfer';
import { V, VENUS_MAPS } from '../frontend/game/worlds/venusLayout';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { completeVenusTask, venusStationAction } from '../frontend/game/state/venusActions';
import { beginRun } from '../frontend/game/state/campaign';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { MissionWorld } from '../frontend/game/worlds/missionWorld';
import { VenusProbe } from '../frontend/game/systems/venusProbe';
import { type Container } from 'pixi.js';
before(async () => RAPIER.init());
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test('Venus uses the lunar camera curve in both directions', () => {
    const state: VenusTransferPresentation = {
        progress: 0,
        descending: true,
        orbitalCamera: V.atmosphereApproach,
        atmospherePoint: V.atmosphereAscent,
    };
    for (const descending of [true, false])
        for (const progress of [0, 0.1, 0.25, 0.5, 0.75, 0.99, 1]) {
            const pose = venusTransferPose({ ...state, descending, progress }, 0.93);
            const reference = lunarTransferPose(progress, descending, 0.93, {
                center: VENUS_MAPS.atmosphere.center,
                exit: V.atmosphereAscent,
                radius: VENUS_MAPS.atmosphere.radius,
                globeRadius:
                    venusTransferPose({ ...state, progress: 0 }, 0.93).zoom *
                    VENUS_MAPS.atmosphere.radius,
                orbitalPivot: venusTransferPose({ ...state, progress: 0 }, 0.93).pivot,
            });
            close(pose.zoom, reference.zoom);
            close(pose.pivot.x, reference.pivot.x);
            close(pose.pivot.y, reference.pivot.y);
            close(pose.pitch, reference.pitch);
        }
});
test('the existing Venus stays visible and continuous through all frames, both endpoints and ascent', () => {
    const bg = new Background();
    bg.setRegion('venus');
    bg.setFlight(true);
    bg.cameraAngle = 0.71;
    bg.cameraZoom = 0.93;
    bg.camera = { x: V.atmosphereApproach.x + 90, y: V.atmosphereApproach.y };
    bg.setVenusArea('orbit');
    bg.update(0);
    const layer = bg.getChildByLabel('celestial-layer')!,
        planet = layer.getChildByLabel('celestial-venus')!;
    const deck = bg.getChildByLabel('venus-cloud-deck')!;
    const state: VenusTransferPresentation = {
        progress: 0,
        descending: true,
        orbitalCamera: { ...bg.camera },
        atmospherePoint: V.atmosphereAscent,
    };
    const snapshot = () => ({ x: planet.x, y: planet.y, scale: planet.scale.x, cloud: deck.alpha });
    const matches = (a: ReturnType<typeof snapshot>) => {
        close(a.x, planet.x);
        close(a.y, planet.y);
        close(a.scale, planet.scale.x);
        close(a.cloud, deck.alpha);
    };
    try {
        let before = snapshot();
        bg.surface = true;
        bg.setVenusArea('atmosphere');
        bg.setVenusTransfer(state);
        bg.camera = venusTransferPose(state, bg.cameraZoom).pivot;
        bg.update(0);
        matches(before);
        for (const descending of [true, false]) {
            state.descending = descending;
            state.orbitalCamera = descending ? state.orbitalCamera : V.atmosphereApproach;
            const stars = (bg as unknown as { stars: { view: Container }[] }).stars.slice(0, 12);
            let starPositions: { x: number; y: number }[] = [];
            for (let frame = 0; frame <= 600; frame++) {
                state.progress = frame / 600;
                bg.setVenusTransfer({ ...state });
                bg.camera = venusTransferPose(state, bg.cameraZoom).pivot;
                bg.update(0);
                assert.equal(layer.getChildByLabel('celestial-venus'), planet);
                assert.equal(layer.visible, true);
                assert.equal(planet.visible, true);
                if (frame === 0) starPositions = stars.map((s) => ({ x: s.view.x, y: s.view.y }));
                stars.forEach((s, i) => {
                    close(s.view.x, starPositions[i].x);
                    close(s.view.y, starPositions[i].y);
                });
                if (frame > 0) {
                    assert.ok(
                        Math.hypot(planet.x - before.x, planet.y - before.y) < 20,
                        'no background position cut',
                    );
                    assert.ok(Math.abs(planet.scale.x - before.scale) < 0.15, 'no scale cut');
                    assert.ok(
                        descending
                            ? deck.alpha + 1e-9 >= before.cloud
                            : deck.alpha - 1e-9 <= before.cloud,
                    );
                }
                before = snapshot();
            }
            bg.setVenusTransfer(null);
            bg.surface = false;
            bg.setVenusArea(descending ? 'atmosphere' : 'orbit');
            bg.camera = descending ? state.atmospherePoint : state.orbitalCamera;
            bg.update(0);
            matches(before);
        }
        close(deck.alpha, 0);
    } finally {
        destroyDisplayTree(bg);
    }
});
test('one real ship and probe keep their screen position and size through the lunar-style zoom', () => {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, 'venus-toxic-orbit');
    completeVenusTask(c, 'venus-dead-laboratory');
    venusStationAction(c, 'venus-probe-build');
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    let world: MissionWorld | null = null;
    try {
        const e = s.escort as VenusProbe;
        e.launch();
        e.state = 'complete';
        e.body.setTranslation(
            { x: V.atmosphereApproach.x / 100, y: V.atmosphereApproach.y / 100 },
            true,
        );
        s.ship.setTranslation(
            { x: (V.atmosphereApproach.x + 90) / 100, y: V.atmosphereApproach.y / 100 },
            true,
        );
        const idle = {
            target: V.atmosphereApproach,
            thrust: false,
            brake: false,
            fire: false,
            interact: false,
        };
        for (let i = 0; i < 65; i++) s.step({ ...idle, interact: true });
        assert.ok(s.venusAct!.transfer);
        world = new MissionWorld(s, c.ship!);
        const ship = world.shipView;
        const probe = (world as unknown as { researchView: Container }).researchView;
        let previous: { x: number; y: number } | null = null;
        for (const progress of [0, 0.25, 0.499999, 0.5, 0.500001, 0.75, 0.999999, 1]) {
            s.venusAct!.transfer!.elapsed = progress * 5;
            world.update(0, idle);
            const a = ship.getGlobalPosition(),
                b = probe.getGlobalPosition();
            close(a.x, 800);
            close(a.y, 450);
            assert.ok(probe.visible);
            close(probe.scale.x * world.camera.scale.x, 1);
            if (previous) {
                close(b.x, previous.x);
                close(b.y, previous.y);
            }
            previous = { x: b.x, y: b.y };
            assert.equal(world.shipView, ship);
            assert.ok(
                !world.getChildByLabel('venus-atmospheric-descent', true),
                'no second planet, ship or sky scene',
            );
        }
        s.venusAct!.transfer = null;
        world.update(0, idle);
        const end = probe.getGlobalPosition();
        close(end.x, previous!.x);
        close(end.y, previous!.y);
    } finally {
        world?.dispose();
        if (!world) s.dispose();
    }
});
