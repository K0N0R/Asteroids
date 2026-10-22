import { TerminalPuzzle } from '../frontend/game/systems/terminalPuzzle';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { newStoryCampaign, beginRun, parseCampaign } from '../frontend/game/state/campaign';
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

test('Earth satellite opens distinct Moon and satellite regions with two cleared lanes', () => {
    const c = ready(),
        sector = generateStorySector(c.story!);
    assert.equal(storyRadius(c.story!), 12000);
    assert.equal(sector.regions.length, 4);
    assert.equal(sector.hyperlanes.length, 2);
    assert.ok(sector.landmarks.some((l) => l.siteId === 'lunarProbe'));
    for (const lane of sector.hyperlanes) {
        assert.ok(Math.hypot(lane.a.x - lane.b.x, lane.a.y - lane.b.y) <= HYPERDRIVE.gateRange);
        assert.ok(sector.rocks.every((r) => segmentDistance(r, lane.a, lane.b) > r.radius + 110));
    }
    assert.equal(
        sector.landmarks.some((l) => l.key === 5),
        false,
    );
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
        advance(s, 180, true);
        assert.equal(s.ended, null);
        assert.equal(s.hyperdrive.state, 'idle');
        assert.ok(
            Math.hypot(
                s.position.x - s.sector.hyperlanes[0].b.x,
                s.position.y - s.sector.hyperlanes[0].b.y,
            ) < 1,
        );
        assert.equal(s.speed, 0);
        advance(s, 120, true);
        s.step(idle);
        s.step({ ...idle, hyperdrive: true });
        advance(s, 180);
        assert.ok(Math.hypot(s.position.x, s.position.y + 1200) < 1);
        assert.ok(parseCampaign(JSON.stringify(s.campaign)));
    } finally {
        s.dispose();
    }
});

test('hyperflight ignores a late physical obstacle and restores ship and tow colliders on arrival', () => {
    const s = run();
    try {
        clear(s);
        const gate = s.sector.hyperlanes[0];
        s.ship.setTranslation({ x: gate.a.x / 100, y: gate.a.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        const item = s.salvage.add(
            90001,
            'satellite',
            { x: gate.a.x - 100, y: gate.a.y },
            { x: 0, y: 0 },
        )!;
        assert.ok(s.salvage.attach(item, s.ship));
        const hull = s.hull,
            shield = s.kineticShield.charge;
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.shipCollider.isEnabled(), false);
        assert.equal(item.collider.isEnabled(), false);
        while (s.hyperdrive.state === 'charging') advance(s, 1);
        const point = { x: (gate.a.x + gate.b.x) / 200, y: (gate.a.y + gate.b.y) / 200 };
        s.world.createCollider(RAPIER.ColliderDesc.ball(1).setTranslation(point.x, point.y));
        advance(s, 180);
        assert.equal(s.ended, null);
        assert.equal(s.hull, hull);
        assert.equal(s.kineticShield.charge, shield);
        assert.ok(Math.hypot(s.position.x - gate.b.x, s.position.y - gate.b.y) < 1);
        assert.equal(s.shipCollider.isEnabled(), true);
        assert.equal(item.collider.isEnabled(), true);
        assert.ok(s.salvage.towing.has(item.id));
    } finally {
        s.dispose();
    }
});

test('hyperflight accepts satellite towing but refuses surface transitions, excess speed and unfinished terminal work', () => {
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
        const item = s.salvage.add(90001, 'satellite', { x: 100, y: 0 }, { x: 0, y: 0 })!;
        assert.ok(s.salvage.attach(item, s.ship));
        assert.equal(s.hyperdriveLock, null);
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

test('gates cross obstructed routes even when an obstacle appears during charging', () => {
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
            advance(s, 180);
            assert.equal(s.ended, null);
            assert.equal(s.hyperdrive.state, 'idle');
            assert.ok(Math.hypot(s.position.x - gate.b.x, s.position.y - gate.b.y) < 1);
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

test('cancelling a charged jump immediately restores normal collisions for ship and tow', () => {
    const s = run();
    try {
        clear(s);
        const gate = s.sector.hyperlanes[0];
        s.ship.setTranslation({ x: gate.a.x / 100, y: gate.a.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        const item = s.salvage.add(
            90001,
            'satellite',
            { x: gate.a.x - 100, y: gate.a.y },
            { x: 0, y: 0 },
        )!;
        assert.ok(s.salvage.attach(item, s.ship));
        s.step({ ...idle, hyperdrive: true });
        s.step(idle);
        s.step({ ...idle, hyperdrive: true });
        assert.equal(s.hyperdrive.active, false);
        assert.equal(s.shipCollider.isEnabled(), true);
        assert.equal(item.collider.isEnabled(), true);
    } finally {
        s.dispose();
    }
});

test('inter-area hyperspace follows a continuous timed route instead of teleporting', () => {
    const d = new Hyperdrive(),
        from = { x: 10500, y: -9500 },
        to = { x: 30000, y: 2200 };
    assert.ok(d.start(from, to, true, true));
    assert.ok(d.charge(0.7));
    let last = from,
        total = 0;
    for (let i = 0; i < 144; i++) {
        const next = d.next(last, 1 / 60);
        total += Math.hypot(next.point.x - last.x, next.point.y - last.y);
        assert.ok(Math.hypot(next.point.x - last.x, next.point.y - last.y) < 300);
        if (i < 140) assert.equal(next.complete, false);
        last = next.point;
    }
    const end = d.next(last, 1 / 60);
    assert.equal(end.complete, true);
    assert.deepEqual(end.point, to);
    assert.ok(Math.abs(total - Math.hypot(to.x - from.x, to.y - from.y)) < 1);
});
