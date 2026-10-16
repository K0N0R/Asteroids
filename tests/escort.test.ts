import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { generateSector } from '../frontend/game/worlds/sector';
import { researchPath, clearResearchLeg } from '../frontend/game/systems/escort';
import { MissionSimulation } from '../frontend/game/systems/mission';
import { newCampaign, beginRun, finishRun, parseCampaign } from '../frontend/game/state/campaign';
import { selectContract, contractReady } from '../frontend/game/state/contracts';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function campaign() {
    const c = newCampaign();
    c.contractCompletions[2] = 1;
    c.station.workshop = 1;
    c.recovered = 1;
    assert.ok(selectContract(c, 7));
    beginRun(c, 71);
    return c;
}

test('seeded anomalies have clear research space and convoy routes avoid deposits', () => {
    for (let seed = 0; seed < 80; seed++) {
        const s = generateSector(seed),
            rocks = [
                ...s.rocks.map((r) => {
                    const distance = Math.hypot(r.x, r.y),
                        boundary = 850 + r.radius + 2;
                    return distance < boundary
                        ? { ...r, x: (r.x / distance) * boundary, y: (r.y / distance) * boundary }
                        : r;
                }),
                { ...s.outpost, radius: 100 },
            ];
        assert.deepEqual(s.researchSite, generateSector(seed).researchSite);
        assert.ok(Math.hypot(s.researchSite.x, s.researchSite.y) >= 2400);
        for (const r of s.rocks)
            assert.ok(Math.hypot(s.researchSite.x - r.x, s.researchSite.y - r.y) > r.radius + 200);
        const path = researchPath({ x: 380, y: 0 }, s.researchSite, rocks);
        assert.ok(path.length > 0, `seed ${seed}`);
        let previous = { x: 380, y: 0 };
        for (const point of path) {
            assert.ok(clearResearchLeg(previous, point, rocks));
            previous = point;
        }
    }
});

test('escort launches only after a calm continuous hold and waits when the player abandons it', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        for (let i = 0; i < 60; i++) sim.step({ ...idle, interact: true });
        assert.ok(sim.escort!.startProgress > 0);
        sim.step({ ...idle, interact: true, fire: true });
        assert.equal(sim.escort!.startProgress, 0);
        for (let i = 0; i < 125; i++) sim.step({ ...idle, interact: true });
        assert.notEqual(sim.escort!.state, 'idle');
        assert.equal(sim.ended, null);
        sim.ship.setTranslation({ x: -30, y: 0 }, true);
        for (let i = 0; i < 120; i++) sim.step(idle);
        assert.equal(sim.escort!.state, 'waiting');
        assert.equal(sim.escort!.waitingReason, 'player');
        const p = sim.escort!.position;
        sim.ship.setTranslation({ x: (p.x - 100) / 100, y: p.y / 100 }, true);
        for (let i = 0; i < 30; i++) sim.step(idle);
        assert.equal(sim.escort!.state, 'travel');
    } finally {
        sim.dispose();
    }
});

test('live convoy navigation reaches the seeded research site through actual moving asteroids', () => {
    for (const seed of [1, 7, 71]) {
        const sim = new MissionSimulation(campaign(), seed);
        try {
            sim.enemies.dispose();
            const e = sim.escort!;
            e.ambushed = true;
            e.state = 'travel';
            for (let i = 0; i < 6500 && e.state !== 'complete' && e.state !== 'destroyed'; i++) {
                const p = e.position;
                sim.ship.setTranslation({ x: (p.x - 150) / 100, y: p.y / 100 }, true);
                sim.ship.setLinvel({ x: 0, y: 0 }, true);
                sim.step(idle);
            }
            assert.equal(
                e.state,
                'complete',
                `seed ${seed}: ${e.waitingReason} at ${JSON.stringify(e.position)}`,
            );
            assert.ok(sim.surveyData.has('escort'));
        } finally {
            sim.dispose();
        }
    }
});

test('enemy AI can shoot the convoy even while the player stays inside Aurora; friendly fire is ignored', () => {
    const sim = new MissionSimulation(campaign(), 71);
    try {
        for (const r of sim.rocks.values()) sim.world.removeRigidBody(r.body);
        sim.rocks.clear();
        const e = sim.escort!;
        e.body.setTranslation({ x: 34, y: 0 }, true);
        e.state = 'research';
        e.ambushed = true;
        const enemy = sim.enemies.enemies.get(1)!;
        for (const other of [...sim.enemies.enemies.values()])
            if (other !== enemy) sim.enemies.damage(other.id, 1000);
        enemy.body.setTranslation({ x: 30, y: 0 }, true);
        enemy.home = { x: 3000, y: 0 };
        enemy.body.setRotation(0, true);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        for (let i = 0; i < 240 && e.health === 140; i++) sim.step(idle);
        assert.equal(enemy.target, 'escort');
        assert.ok(e.health < 140);
        sim.enemies.dispose();
        sim.bullets.clear();
        e.body.setTranslation({ x: 34, y: 0 }, true);
        e.body.setLinvel({ x: 0, y: 0 }, true);
        const health = e.health;
        sim.bullets.set(9999, {
            id: 9999,
            x: 3300,
            y: 0,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'player',
            damage: 1000,
        });
        sim.step(idle);
        assert.equal(e.health, health);
        sim.bullets.set(9999, {
            id: 9999,
            x: 3300,
            y: 0,
            vx: 10000,
            vy: 0,
            life: 1,
            team: 'enemy',
            damage: 1000,
        });
        sim.step(idle);
        assert.equal(e.state, 'destroyed');
        assert.equal(sim.surveyData.has('escort'), false);
        assert.equal(sim.ended, null);
    } finally {
        sim.dispose();
    }
});

test('research pauses around hostiles, completes only with the escort present, and pays once after return', () => {
    const c = campaign(),
        sim = new MissionSimulation(c, 71);
    try {
        sim.enemies.dispose();
        const e = sim.escort!;
        e.ambushed = true;
        e.state = 'travel';
        e.body.setTranslation({ x: e.destination.x / 100, y: e.destination.y / 100 }, true);
        sim.ship.setTranslation({ x: e.destination.x / 100 - 0.5, y: e.destination.y / 100 }, true);
        for (let i = 0; i < 120; i++) e.update(1 / 60, sim.position, [], true);
        assert.equal(e.researchProgress, 0);
        for (let i = 0; i < 725; i++) sim.step(idle);
        assert.equal(e.state, 'complete');
        assert.ok(contractReady(7, sim.cargo, [...sim.surveyData]));
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
        const result = finishRun(c, true, sim.cargo, sim.elapsed, 'dock', 0, {
            data: [...sim.surveyData],
        })!;
        assert.deepEqual(result.reward, { ore: 36, parts: 8 });
        assert.equal(c.contractCompletions[7], 1);
        assert.equal(finishRun(c, true, sim.cargo, sim.elapsed, 'dock'), null);
    } finally {
        sim.dispose();
    }
});
