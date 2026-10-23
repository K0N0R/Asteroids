import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Container } from 'pixi.js';
import { assaultEntry } from '../frontend/game/systems/assaultEntry';
import {
    LunarAssault,
    ASSAULT_WAVES,
    type AssaultHost,
} from '../frontend/game/systems/lunarAssault';
import { MOON } from '../frontend/game/worlds/moon';
import { newStoryCampaign, beginRun, parseCampaign } from '../frontend/game/state/campaign';
import { STORY_TASKS, VENUS_OUTPOST } from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { enemyPosition } from '../frontend/game/systems/enemies';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready(theatre: 'lunar' | 'venus') {
    const c = newStoryCampaign();
    c.station.workshopLevel = 1;
    c.station.laboratoryLevel = Math.max(c.station.laboratoryLevel, c.station.workshopLevel);
    const completed = STORY_TASKS.filter(
        (t) =>
            t.required &&
            (theatre === 'lunar'
                ? t.act === 1 && t.id !== 'lunar-attack'
                : t.act < 3 || (t.sector === 'venus' && t.id !== 'venus-defense')),
    );
    for (const t of completed) {
        c.story!.progress[t.id] = t.target;
        c.story!.claimed.push(t.id);
    }
    c.story!.sector = theatre;
    assert.ok(parseCampaign(JSON.stringify(c)));
    beginRun(c, 1);
    return c;
}
function assertOutside(
    point: { x: number; y: number },
    radius: number,
    center: { x: number; y: number },
    angle: number,
    zoom: number,
) {
    const camera = new Container();
    camera.position.set(800, 450);
    camera.pivot.copyFrom(center);
    camera.rotation = angle;
    camera.scale.set(zoom);
    const pixel = camera.toGlobal(point),
        r = radius * zoom;
    assert.ok(
        pixel.x + r < 0 || pixel.x - r > 1600 || pixel.y + r < 0 || pixel.y - r > 900,
        `body at ${JSON.stringify(pixel)} is still visible`,
    );
    camera.destroy();
}

test('assault entries stay fully outside the renderer camera for rotations, zooms and displaced players', () => {
    for (const angle of [0, Math.PI / 3, -Math.PI / 2])
        for (const zoom of [0.64, 1, 1.4])
            for (const offset of [
                { x: 0, y: 0 },
                { x: 800, y: 0 },
                { x: 0, y: -1000 },
            ]) {
                const center = {
                    x: MOON.construction.x + offset.x,
                    y: MOON.construction.y + offset.y,
                };
                const p = assaultEntry(
                    MOON.construction,
                    40,
                    { center, angle, zoom },
                    MOON.center,
                    MOON.radius,
                    1,
                    () => false,
                );
                assert.ok(p);
                assertOutside(p, 40, center, angle, zoom);
                assert.ok(Math.hypot(p.x - MOON.center.x, p.y - MOON.center.y) + 40 < MOON.radius);
            }
    assert.equal(
        assaultEntry(
            MOON.construction,
            40,
            { center: MOON.construction, angle: 0, zoom: 1 },
            MOON.center,
            MOON.radius,
            1,
            () => true,
        ),
        null,
    );
});

test('theatres field mixed waves, wait for every survivor, and do not duplicate partial deployments', () => {
    for (const theatre of ['lunar', 'venus', 'mars'] as const) {
        const a = new LunarAssault(theatre),
            alive = new Set<number>(),
            kinds: string[] = [];
        let seq = 0,
            blocked = true;
        const host: AssaultHost = {
            spawn: (kind, _wave, slot) => {
                if (slot === 1 && blocked) return undefined;
                const id = ++seq;
                kinds.push(kind);
                alive.add(id);
                return id;
            },
            alive: (id) => alive.has(id),
            remove: (id) => alive.delete(id),
        };
        a.start();
        a.step(6, host);
        assert.equal(a.spawned.size, 1);
        a.step(0.1, host);
        assert.equal(a.spawned.size, 1);
        blocked = false;
        a.step(0.1, host);
        assert.equal(a.enemies.size, ASSAULT_WAVES[theatre][0].length);
        alive.delete([...alive][0]);
        a.step(0.1, host);
        assert.equal(a.state, 'battle', 'one kill cannot end a mixed wave');
        for (let wave = 0; wave < 3; wave++) {
            alive.clear();
            a.step(0.1, host);
            if (wave < 2) a.step(6, host);
        }
        assert.equal(a.state, 'complete');
        assert.equal(seq, a.totalEnemies);
        assert.deepEqual(kinds, ASSAULT_WAVES[theatre].flat());
    }
});

test('blocked deployments fail safely, remove partially deployed ships and allow retry', () => {
    const a = new LunarAssault('mars');
    const live = new Set<number>();
    let seq = 0;
    const host: AssaultHost = {
        spawn: (_kind, _wave, slot) => {
            if (slot) return undefined;
            live.add(++seq);
            return seq;
        },
        alive: (id) => live.has(id),
        remove: (id) => live.delete(id),
    };
    a.start();
    for (let i = 0; i < 1200 && a.active; i++) a.step(1 / 60, host);
    assert.equal(a.state, 'failed');
    assert.equal(live.size, 0);
    assert.equal(a.enemies.size, 0);
    assert.ok(a.start());
});

test('real mixed lunar arrivals honor the actual camera and do not overlap each other or terrain', () => {
    const c = ready('lunar'),
        s = new MissionSimulation(c, 1);
    try {
        s.area = 'surface';
        c.activeRun!.area = 'surface';
        s.ship.setTranslation({ x: MOON.construction.x / 100, y: MOON.construction.y / 100 }, true);
        s.setCombatCamera(Math.PI / 3, 0.64);
        for (let i = 0; i < 125; i++) s.step({ ...idle, sabotage: true });
        assert.ok(s.lunarAssault.active);
        const seen = new Set<number>();
        for (let i = 0; i < 380; i++) {
            s.step(idle);
            for (const e of s.enemies.enemies.values())
                if (e.assault && !seen.has(e.id)) {
                    seen.add(e.id);
                    assertOutside(enemyPosition(e), e.config.radius, s.position, Math.PI / 3, 0.64);
                    const p = enemyPosition(e);
                    assert.ok(
                        [...s.rocks.values()].every(
                            (r) =>
                                Math.hypot(r.previous.x - p.x, r.previous.y - p.y) >
                                r.radius + e.config.radius,
                        ),
                    );
                }
        }
        assert.equal(seen.size, ASSAULT_WAVES.lunar[0].length);
    } finally {
        s.dispose();
    }
});

test('failed defense removes only its own mines and permits a clean new attempt', () => {
    const c = ready('venus'),
        s = new MissionSimulation(c, 1);
    try {
        for (const [id, offset] of [
            [90010, -300],
            [90011, 300],
        ]) {
            const p = { x: VENUS_OUTPOST.x, y: VENUS_OUTPOST.y + offset };
            s.enemies.add([
                { ...p, id, kind: 'minelayer', phase: 0, home: p, assault: id === 90010 },
            ]);
            s.enemies.enemies.get(id)!.state = 'chase';
        }
        s.world.step();
        s.mines.update(
            5,
            s.enemies,
            s.stationSafeRadius,
            [],
            () => false,
            () => assert.fail('unexpected blast'),
        );
        assert.equal(s.mines.mines.size, 2);
        s.venusAssault.start();
        s.venusAssault.enemies.add(90010);
        s.venusAssault.spawned.add(90010);
        s.step(idle);
        assert.equal(s.venusAssault.state, 'failed');
        assert.deepEqual(
            [...s.mines.mines.values()].map((m) => m.owner),
            [90011],
        );
        assert.ok(!s.enemies.enemies.has(90010));
        assert.ok(s.enemies.enemies.has(90011));
        assert.ok(s.venusAssault.start());
    } finally {
        s.dispose();
    }
});
