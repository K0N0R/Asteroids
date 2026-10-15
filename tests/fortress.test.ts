import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { GAME, DRONES } from '../frontend/game/config';
import { generateSector, navigationWaypoint } from '../frontend/game/worlds/sector';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { newCampaign, beginRun, finishRun, parseCampaign } from '../frontend/game/state/campaign';
import { selectContract, contractReady } from '../frontend/game/state/contracts';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function ready() {
    const c = newCampaign();
    c.recovered = 1;
    c.contractCompletions[2] = 1;
    c.station.workshop = 1;
    assert.ok(selectContract(c, 6));
    return c;
}

test('Aegis has seven walls, a clear gate and five spaced defenders including two heavy drones', () => {
    for (let seed = 0; seed < 100; seed++) {
        const sector = generateSector(seed),
            f = sector.fortress;
        assert.equal(navigationWaypoint(sector.landmarks, 14).siteId, 'fortress');
        assert.equal(f.walls.length, 7);
        assert.equal(f.guards.length, 5);
        assert.equal(f.guards.filter((g) => g.kind === 'lancer').length, 2);
        assert.ok(Math.hypot(f.x, f.y) + f.radius + 16 < GAME.sectorRadius);
        for (const guard of f.guards) {
            for (const rock of sector.rocks)
                assert.ok(Math.hypot(guard.x - rock.x, guard.y - rock.y) > rock.radius + 32);
            for (const enemy of sector.enemies)
                assert.ok(Math.hypot(guard.x - enemy.x, guard.y - enemy.y) > 64);
            assert.ok(Math.hypot(guard.x, guard.y) > DRONES.safeRadius);
        }
    }
});

test('physical walls block line of sight and swept projectiles while the gate stays open', () => {
    const sim = new MissionSimulation(ready(), 71),
        f = sim.sector.fortress;
    try {
        sim.world.step();
        const wall = f.walls[0],
            mx = (wall.from.x + wall.to.x) / 2,
            my = (wall.from.y + wall.to.y) / 2;
        const length = Math.hypot(mx - f.x, my - f.y),
            nx = (mx - f.x) / length,
            ny = (my - f.y) / length;
        const from = { x: mx + nx * 100, y: my + ny * 100 },
            to = { x: mx - nx * 100, y: my - ny * 100 };
        assert.equal(
            sim.enemies.lineClear(from, to, (c) => sim.fortressColliders.has(c.handle)),
            false,
        );
        const gx = f.gate.x - f.x,
            gy = f.gate.y - f.y,
            d = Math.hypot(gx, gy);
        assert.equal(
            sim.enemies.lineClear(
                { x: f.gate.x + (gx / d) * 100, y: f.gate.y + (gy / d) * 100 },
                { x: f.gate.x - (gx / d) * 100, y: f.gate.y - (gy / d) * 100 },
                (c) => sim.fortressColliders.has(c.handle),
            ),
            true,
        );
        sim.bullets.set(999, {
            id: 999,
            ...from,
            vx: -nx * 15000,
            vy: -ny * 15000,
            life: 1,
            team: 'player',
            damage: 18,
        });
        sim.step(idle);
        assert.equal(sim.bullets.has(999), false);
        assert.ok(sim.events.some((e) => e.kind === 'hit' && Math.hypot(e.x - mx, e.y - my) < 60));
        sim.ship.setTranslation({ x: from.x / 100, y: from.y / 100 }, true);
        sim.ship.setLinvel({ x: -nx * 6, y: -ny * 6 }, true);
        for (let i = 0; i < 30; i++) sim.world.step();
        const p = sim.position;
        assert.ok((p.x - mx) * nx + (p.y - my) * ny > 0, 'ship cannot pass through a solid wall');
    } finally {
        sim.dispose();
    }
});

test('the fortress core is locked until every defender is gone and interrupted scans reset', () => {
    const sim = new MissionSimulation(ready(), 71),
        f = sim.sector.fortress;
    try {
        sim.ship.setTranslation({ x: (f.x + 145) / 100, y: f.y / 100 }, true);
        for (const e of sim.enemies.enemies.values())
            e.body.setTranslation({ x: (f.x + 3000) / 100, y: f.y / 100 }, true);
        for (let i = 0; i < 200; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.scanProgress, 0);
        assert.equal(sim.surveyData.has('fortress'), false);
        for (const e of [...sim.enemies.enemies.values()]) sim.enemies.damage(e.id, 10000);
        for (let i = 0; i < 60; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.scanProgress > 0);
        sim.step(idle);
        assert.equal(sim.scanProgress, 0);
        for (let i = 0; i < 181; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.surveyData.has('fortress'), true);
    } finally {
        sim.dispose();
    }
});

test('Aegis rewards require actual data and a safe return, and pay once', () => {
    assert.equal(contractReady(6, { ore: 0, parts: 0 }, [], 100), false);
    assert.equal(contractReady(6, { ore: 0, parts: 0 }, ['fortress']), true);
    const c = ready();
    beginRun(c, 71);
    const result = finishRun(c, true, { ore: 0, parts: 0 }, 60, 'dock', 0, { data: ['fortress'] });
    assert.deepEqual(result?.reward, { ore: 48, parts: 12 });
    assert.equal(c.contractCompletions[6], 1);
    assert.equal(
        finishRun(c, true, { ore: 0, parts: 0 }, 60, 'dock', 0, { data: ['fortress'] }),
        null,
    );
    const lost = ready();
    beginRun(lost, 71);
    const failure = finishRun(lost, false, { ore: 0, parts: 0 }, 60, 'death', 0, {
        data: ['fortress'],
    });
    assert.deepEqual(failure?.reward, { ore: 0, parts: 0 });
    assert.equal(lost.contractCompletions[6], 0);
});

test('v12 migration appends only the new contract without changing an active run or existing history', () => {
    const c = ready();
    c.contract = 3;
    beginRun(c, 71);
    const old = { ...c, version: 12, contractCompletions: c.contractCompletions.slice(0, 6) };
    assert.deepEqual(parseCampaign(JSON.stringify(old)), c);
    assert.equal(parseCampaign(JSON.stringify({ ...old, version: 13 })), null);
});
