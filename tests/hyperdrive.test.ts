import { TerminalPuzzle } from '../frontend/game/systems/terminalPuzzle';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newStoryCampaign,
    newShip,
    beginRun,
    finishRun,
    parseCampaign,
    selectShip,
} from '../frontend/game/state/campaign';
import { STORY_TASKS, storyRadius } from '../frontend/game/state/story';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { Hyperdrive, HYPERDRIVE, segmentDistance } from '../frontend/game/systems/hyperdrive';
import { generateStorySector } from '../frontend/game/worlds/storySector';
import { angleDifference } from '../frontend/game/systems/flight';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 4000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function ready() {
    const c = newStoryCampaign();
    c.station.workshop = 1;
    for (const t of STORY_TASKS.filter(
        (t) => t.sector === 'earth' && t.required && t.id !== 'earth-expansion',
    )) {
        if (t.dependencies.every((id) => c.story!.claimed.includes(id))) {
            c.story!.progress[t.id] = t.target;
            c.story!.claimed.push(t.id);
        }
    }
    // These tasks open the distant Earth region; the drive itself needs no unlock.
    for (const id of ['earth-supply', 'earth-relay', 'earth-workshop']) {
        const t = STORY_TASKS.find((t) => t.id === id)!;
        c.story!.progress[id] = t.target;
        if (!c.story!.claimed.includes(id)) c.story!.claimed.push(id);
    }
    c.bank = { ore: 60, parts: 8, hydrogen: 6 };
    assert.ok(parseCampaign(JSON.stringify(c)));
    return c;
}
function run() {
    const c = ready();
    beginRun(c, 1);
    return new MissionSimulation(c, c.activeRun!.seed);
}
function advance(s: MissionSimulation, frames = 180, hyperdrive = false) {
    for (let i = 0; i < frames && !s.ended; i++) {
        s.step({ ...idle, hyperdrive });
        s.events.length = 0;
    }
}
function clear(s: MissionSimulation) {
    for (const r of s.rocks.values()) {
        s.world.removeRigidBody(r.body);
        s.asteroidColliders.delete(r.collider.handle);
    }
    s.rocks.clear();
    for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
}
function fly(s: MissionSimulation, target: { x: number; y: number }) {
    for (let i = 0; i < 60 * 60 && !s.ended; i++) {
        const distance = Math.hypot(target.x - s.position.x, target.y - s.position.y);
        if (distance < 30 && s.speed < 20) return;
        const error = angleDifference(
            Math.atan2(target.y - s.position.y, target.x - s.position.x),
            s.ship.rotation(),
        );
        const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
        s.step({
            ...idle,
            target,
            turn: Math.max(-1, Math.min(1, error * 2.5)),
            thrust: Math.abs(error) < 0.3 && distance > stop + 25,
            brake: s.speed > 15 && (distance < stop + 35 || Math.abs(error) > 0.6),
        });
    }
    assert.fail(`navigation failed: ${JSON.stringify(s.position)}, hull ${s.hull}`);
}

test('expanded Earth has three distinct regions, two bidirectional cleared lanes and a useful distant mining field', () => {
    const c = ready(),
        sector = generateStorySector(c.story!);
    assert.equal(storyRadius(c.story!), 5500);
    assert.equal(sector.regions.length, 3);
    assert.equal(sector.hyperlanes.length, 2);
    assert.ok(sector.landmarks.some((l) => l.y === -4500 && l.key === 5));
    for (const lane of sector.hyperlanes) {
        assert.ok(Math.hypot(lane.a.x - lane.b.x, lane.a.y - lane.b.y) <= HYPERDRIVE.range);
        assert.ok(sector.rocks.every((r) => segmentDistance(r, lane.a, lane.b) > r.radius + 110));
    }
    assert.ok(sector.rocks.filter((r) => r.y < -4000 && r.copper).length >= 4);
    const fresh = newStoryCampaign();
    assert.equal(generateStorySector(fresh.story!).hyperlanes.length, 0);
});

test('stock Prospector flies to a gate, crosses the full lane and returns repeatedly without fuel charges', () => {
    const s = run();
    try {
        fly(s, s.sector.hyperlanes[0].a);
        clear(s); // Moving hazards are exercised separately; this checks gate navigation.
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.state, 'charging');
        advance(s, 120, true);
        assert.equal(s.ended, null);
        assert.equal(s.hyperdrive.state, 'idle');
        assert.ok(Math.hypot(s.position.x, s.position.y + 4100) < 1);
        assert.equal(s.speed, 0);
        advance(s, 120, true);
        s.step(idle);
        s.step({ ...idle, hyperdrive: true });
        advance(s, 120);
        assert.ok(Math.hypot(s.position.x, s.position.y + 1300) < 1);
        assert.ok(parseCampaign(JSON.stringify(s.campaign)));
    } finally {
        s.dispose();
    }
});

test('swept hyperflight collision with a thin off-axis physical obstacle destroys a shielded ship and stops all later mission work', () => {
    const s = run();
    try {
        clear(s);
        const gate = s.sector.hyperlanes[0];
        s.ship.setTranslation({ x: gate.a.x / 100, y: gate.a.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        const shield = s.kineticShield.charge;
        s.step({ ...idle, hyperdrive: true });
        for (let frame = 0; frame < 60 && s.hyperdrive.state === 'charging' && !s.ended; frame++)
            advance(s, 1);
        assert.equal(s.hyperdrive.state, 'transit');
        const point = { x: (gate.a.x + gate.b.x) / 200, y: (gate.a.y + gate.b.y) / 200 };
        s.world.createCollider(
            RAPIER.ColliderDesc.ball(0.02).setTranslation(point.x + 0.25, point.y),
        );
        advance(s, 180);
        assert.equal(s.ended, 'destroyed');
        assert.equal(s.hull, 0);
        assert.equal(
            s.kineticShield.charge,
            shield,
            'ordinary shielding cannot save a hyperspeed collision',
        );
        assert.ok(Math.hypot(s.position.x - gate.b.x, s.position.y - gate.b.y) > 1);
        assert.match(s.deathReason, /hiperskoku/);
        const time = s.elapsed,
            data = [...s.surveyData],
            cargo = structuredClone(s.cargo);
        advance(s);
        s.step({ ...idle, interact: true, fire: true });
        assert.equal(s.elapsed, time);
        assert.deepEqual([...s.surveyData], data);
        assert.deepEqual(s.cargo, cargo);
    } finally {
        s.dispose();
    }
});

test('hyperflight refuses towing, surface transitions, excess speed and unfinished terminal work', () => {
    const s = run();
    try {
        clear(s);
        s.area = 'surface';
        assert.ok(s.hyperdriveLock);
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.state, 'idle');
        s.area = 'orbit';
        s.ship.setLinvel({ x: 2, y: 0 }, true);
        s.step(idle);
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.state, 'idle');
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        const item = s.salvage.add(90001, 'patrol', { x: 100, y: 0 }, { x: 0, y: 0 })!;
        assert.ok(s.salvage.attach(item, s.ship));
        assert.match(s.hyperdriveLock!, /hol/);
        s.salvage.detach();
        s.terminalPuzzle = new TerminalPuzzle('breach', 'prospector', 1);
        assert.match(s.hyperdriveLock!, /interakcję/);
    } finally {
        s.dispose();
    }
});

test('hyperdrive charge and route stepping depend on simulation time and cap the endpoint without overshooting', () => {
    const d = new Hyperdrive();
    assert.ok(d.start({ x: 0, y: 0 }, { x: 1000, y: 0 }));
    assert.equal(d.charge(0), false);
    assert.equal(d.charge(0.7), true);
    assert.deepEqual(d.next({ x: 0, y: 0 }, 10), { point: { x: 1000, y: 0 }, complete: true });
});

test('gates reject an obstructed route and recheck before departure, without consuming fuel', () => {
    for (const late of [false, true]) {
        const s = run();
        try {
            const gate = s.sector.hyperlanes[0];
            s.ship.setTranslation({ x: gate.a.x / 100, y: gate.a.y / 100 }, true);
            s.step(idle);
            if (late) {
                s.step({ ...idle, hyperdrive: true });
                advance(s, 10);
                assert.equal(s.hyperdrive.state, 'charging');
            }
            s.world.createCollider(RAPIER.ColliderDesc.ball(0.1).setTranslation(0, -20));
            s.world.step();
            if (!late) s.step({ ...idle, hyperdrive: true });
            advance(s, 100);
            assert.equal(s.ended, null);
            assert.equal(s.hyperdrive.state, 'idle');
            assert.match(s.notice, /zablokowana/);
        } finally {
            s.dispose();
        }
    }
});

test('a fresh Prospector uses an available gate with no workshop, story unlock, parts or fuel', () => {
    const c = newStoryCampaign();
    assert.equal(c.station.workshop, 0);
    assert.deepEqual(c.story!.claimed, []);
    assert.deepEqual(c.bank, { ore: 0, parts: 0 });
    beginRun(c, 1);
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        clear(s);
        s.sector.hyperlanes.push({
            name: 'Test gate',
            a: { ...s.position },
            b: { x: 240, y: 1000 },
        });
        assert.equal(s.hyperdriveLock, null);
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.state, 'charging');
        advance(s, 120);
        assert.equal(s.ended, null);
        assert.ok(Math.hypot(s.position.x - 240, s.position.y - 1000) < 1);
        assert.deepEqual(c.bank, { ore: 0, parts: 0 });
        assert.deepEqual(c.story!.claimed, []);
    } finally {
        s.dispose();
    }
});
