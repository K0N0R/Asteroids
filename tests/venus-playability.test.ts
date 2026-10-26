import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { beginRun, parseCampaign, newShip } from '../frontend/game/state/campaign';
import { completeVenusTask, venusStationAction } from '../frontend/game/state/venusActions';
import { VenusPower, VENUS_POWER_TILES } from '../frontend/game/systems/venusPower';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { VenusProbe } from '../frontend/game/systems/venusProbe';
import {
    V,
    VENUS_MAPS,
    VENUS_SAMPLES,
    venusLanes,
    venusStorms,
} from '../frontend/game/worlds/venusLayout';
import { enqueueRadio, pruneObsoleteVenusRadio } from '../frontend/game/state/communications';
import { Background } from '../frontend/core/containers/entities/background';
import { CelestialLayer } from '../frontend/game/graphics/celestialLayer';
import { VenusActView } from '../frontend/game/graphics/venusActView';
import { restoreVenusPower } from './venus-power-helper';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, fire: false, interact: false, thrust: false, brake: false };
function expedition() {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, 'venus-toxic-orbit');
    completeVenusTask(c, 'venus-dead-laboratory');
    assert.ok(venusStationAction(c, 'venus-probe-build'));
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    return s;
}
test('every Venus gate faces its destination at both map edges', () => {
    const p = createDevelopmentAct('act-3').story!;
    p.claimed.push('venus-toxic-orbit', 'venus-horizon-project');
    p.venus!.probeBuilt = true;
    for (const lane of venusLanes(p))
        for (const [a, b] of [
            [lane.a, lane.b],
            [lane.b, lane.a],
        ]) {
            const map = Object.values(VENUS_MAPS).find(
                (m) => Math.hypot(a.x - m.center.x, a.y - m.center.y) < m.radius,
            )!;
            assert.ok(map);
            const x = a.x - map.center.x,
                y = a.y - map.center.y,
                dx = b.x - a.x,
                dy = b.y - a.y;
            assert.ok(Math.abs(Math.hypot(x, y) - (map.radius - 120)) < 1e-6);
            assert.ok((x * dx + y * dy) / (Math.hypot(x, y) * Math.hypot(dx, dy)) > 0.99);
        }
});
test('power routing needs isolation and real connected circuits, without a hold-to-complete shortcut', () => {
    const puzzle = new VenusPower();
    assert.equal(puzzle.act({ confirm: true }), false);
    assert.equal(puzzle.act({ rotate: 5 }), false);
    assert.deepEqual(puzzle.systems, [false, false, false]);
    puzzle.act({ isolate: true });
    assert.equal(puzzle.act({ confirm: true }), false);
    for (let i = 0; i < VENUS_POWER_TILES.length; i++)
        if (VENUS_POWER_TILES[i] && VENUS_POWER_TILES[i] !== 15)
            while (puzzle.state.rotations[i]) puzzle.act({ rotate: i });
    assert.deepEqual(puzzle.systems, [true, true, true]);
    assert.ok(puzzle.act({ confirm: true }));
});
test('station power progress survives cancel, save and reopen; only correct confirmation boots the lab', () => {
    const c = createDevelopmentAct('act-3');
    completeVenusTask(c, 'venus-toxic-orbit');
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        s.venusAct!.area = 'station';
        s.ship.setTranslation({ x: V.power.x / 100, y: V.power.y / 100 }, true);
        for (let i = 0; i < 65; i++) s.step({ ...idle, target: V.power, interact: true });
        assert.ok(s.venusAct!.powerPuzzle);
        assert.equal(c.story!.venus!.powerRestored, false);
        s.venusAct!.powerAction({ isolate: true });
        s.venusAct!.powerAction({ rotate: 5 });
        const state = structuredClone(c.story!.venus!.powerGrid);
        s.venusAct!.powerAction({ cancel: true });
        assert.ok(parseCampaign(JSON.stringify(c)));
        s.step(idle);
        for (let i = 0; i < 65; i++) s.step({ ...idle, target: V.power, interact: true });
        assert.deepEqual(s.venusAct!.powerPuzzle!.state, state);
        restoreVenusPower(s);
        assert.equal(c.story!.venus!.powerRestored, true);
        assert.equal(s.venusAct!.powerPuzzle, null);
    } finally {
        s.dispose();
    }
});
test('a real hit during an atmospheric scan expires and the probe resumes without losing its sample', () => {
    const s = expedition();
    try {
        const probe = s.escort as VenusProbe;
        probe.launch();
        probe.body.setTranslation(
            { x: V.atmosphereApproach.x / 100, y: V.atmosphereApproach.y / 100 },
            true,
        );
        s.venusAct!.onGate(V.atmosphereApproach, V.atmosphereAscent);
        const target = probe.destination;
        probe.body.setTranslation({ x: target.x / 100, y: target.y / 100 }, true);
        s.ship.setTranslation({ x: (target.x + 200) / 100, y: target.y / 100 }, true);
        for (let f = 0; f < 90; f++) {
            s.step(idle);
            for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
        }
        assert.equal(probe.state, 'research');
        assert.ok(probe.sampleProgress > 0);
        const before = probe.sampleProgress,
            health = probe.health;
        const pos = probe.position;
        s.bullets.set(999999, {
            id: 999999,
            x: pos.x - 80,
            y: pos.y,
            vx: 8000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 12,
        });
        s.step(idle);
        assert.equal(probe.health, health - 12);
        assert.ok(probe.cooldown > 0);
        s.step(idle);
        assert.equal(probe.scanning, false);
        for (let f = 0; f < 60; f++) s.step(idle);
        assert.equal(probe.cooldown, 0);
        assert.equal(probe.scanning, true);
        assert.ok(probe.sampleProgress > before);
        const progress = probe.sampleProgress;
        s.ship.setTranslation({ x: (pos.x + 1000) / 100, y: pos.y / 100 }, true);
        s.step(idle);
        assert.equal(probe.scanning, false);
        assert.equal(probe.sampleProgress, progress);
        s.ship.setTranslation({ x: (pos.x + 200) / 100, y: pos.y / 100 }, true);
        s.step(idle);
        assert.equal(probe.scanning, true);
        probe.moveToSample(1);
        s.ship.setTranslation(
            { x: (probe.position.x + 1100) / 100, y: probe.position.y / 100 },
            true,
        );
        s.step(idle);
        assert.equal(probe.state, 'waiting');
        assert.match(s.venusAct!.status, /sonda czeka.*zbliż/);
    } finally {
        s.dispose();
    }
});
test('sample flight legs and entry stay clear of the visible storms', () => {
    const route = [
        V.atmosphereAscent,
        ...VENUS_SAMPLES.map((p) => ({ x: p.x - 150, y: p.y - 80 })),
    ];
    for (let i = 1; i < route.length; i++)
        for (let t = 0; t <= 1; t += 0.02)
            for (const time of [0, 30, 100, 300]) {
                const p = {
                    x: route[i - 1].x + (route[i].x - route[i - 1].x) * t,
                    y: route[i - 1].y + (route[i].y - route[i - 1].y) * t,
                };
                assert.ok(
                    venusStorms(time).every(
                        (h) => Math.hypot(p.x - h.x, p.y - h.y) > h.radius + 60,
                    ),
                );
            }
});
test('legacy Venus save moves recovery objects with the map and preserves completed science', () => {
    const c = createDevelopmentAct('act-3');
    delete c.story!.venus!.layoutVersion;
    c.story!.venus!.transmission = 2;
    c.story!.venus!.powerRestored = true;
    const id = c.nextShipId++;
    c.recoverySignals.push({
        id,
        seed: 150074,
        x: 40050,
        y: 60,
        ship: newShip(id, 'swift'),
        pilot: null,
    });
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.ok(loaded);
    assert.equal(loaded.story!.venus!.transmission, 2);
    assert.equal(loaded.story!.venus!.powerRestored, true);
    assert.equal(loaded.recoverySignals[0].x, VENUS_MAPS.atmosphere.center.x + 50);
    assert.equal(loaded.recoverySignals[0].y, VENUS_MAPS.atmosphere.center.y + 60);
    assert.deepEqual(parseCampaign(JSON.stringify(loaded)), loaded);
});
test('stale contact commentary cannot follow the player into the Venus dock', () => {
    const p = createDevelopmentAct('act-3').story!;
    const line = {
        speaker: 'operations' as const,
        text: 'Mamy kontakt w pobliżu. Uważaj na ostrzał — obserwujemy Twoją pozycję.',
    };
    assert.equal(enqueueRadio(p, line), false);
    p.radio = { pending: [line], acknowledged: [] };
    assert.ok(pruneObsoleteVenusRadio(p));
    assert.equal(p.radio.pending.length, 0);
});
test('Venus uses a distant parallax planet and its foreground has no giant planet', () => {
    const bg = new Background(),
        view = new VenusActView();
    try {
        bg.setRegion('venus');
        bg.setFlight(true);
        bg.camera = { x: 0, y: 3600 };
        bg.update(17);
        const celestial = bg.children.find((n) => n instanceof CelestialLayer)!;
        const planet = celestial.children[0];
        assert.ok(planet.scale.x < 2);
        const x = planet.x;
        bg.camera.x = 1000;
        bg.update(17);
        assert.ok(Math.abs(planet.x - x) > 10 && Math.abs(planet.x - x) < 100);
        assert.ok(!view.children.some((n) => n.label === 'world-planet'));
        bg.setVenusArea('atmosphere');
        bg.camera = VENUS_MAPS.atmosphere.center;
        for (let i = 0; i < 180; i++) bg.update(17);
        assert.ok(bg.children.find((n) => n.label === 'venus-cloud-deck')!.alpha > 0.99);
    } finally {
        bg.destroy({ children: true });
        view.destroy({ children: true });
    }
});
