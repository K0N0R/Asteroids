import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { beginRun, newCampaign, newShip } from '../frontend/game/state/campaign';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { Hyperdrive } from '../frontend/game/systems/hyperdrive';
import { generateSector } from '../frontend/game/worlds/sector';
import type { HullId } from '../frontend/game/config';

before(async () => RAPIER.init());
const idle: FlightInput = {
    target: { x: 1000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function run(hull: HullId = 'prospector', handling = 0) {
    const c = newCampaign();
    c.ship = newShip(1, hull);
    c.ship.handling = handling;
    assert.ok(beginRun(c, 719));
    const sector = generateSector(719);
    sector.enemies = [];
    sector.fortress.guards = [];
    sector.hyperlanes = [{ name: 'Test', a: { x: 1000, y: 0 }, b: { x: 2000, y: 0 } }];
    const s = new MissionSimulation(c, 719, sector);
    for (const rock of s.rocks.values()) {
        s.asteroidColliders.delete(rock.collider.handle);
        s.world.removeRigidBody(rock.body);
    }
    s.rocks.clear();
    for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
    s.ship.setTranslation({ x: 10, y: 0 }, true);
    s.ship.setLinvel({ x: 0, y: 0 }, true);
    return s;
}
function advance(s: MissionSimulation, frames: number, input: Partial<FlightInput> = {}) {
    for (let i = 0; i < frames && !s.ended; i++) {
        s.step({ ...idle, ...input });
        s.events.length = 0;
    }
}

test('Prospector 0 opens a gate by holding F for one second, with no facility or fuel charge', () => {
    const s = run();
    try {
        const bank = structuredClone(s.campaign.bank);
        advance(s, 59, { interact: true });
        assert.equal(s.hyperdrive.active, false);
        advance(s, 1, { interact: true });
        assert.equal(s.hyperdrive.state, 'charging');
        advance(s, 210, { interact: true });
        assert.equal(s.hyperdrive.active, false);
        assert.ok(Math.hypot(s.position.x - 2000, s.position.y) < 1);
        assert.equal(s.speed, 0);
        assert.deepEqual(s.campaign.bank, bank);
        advance(s, 150, { interact: true });
        assert.ok(Math.abs(s.position.x - 2000) < 1);
        s.step(idle);
        advance(s, 330, { interact: true, target: { x: 2000, y: 0 } });
        assert.ok(Math.hypot(s.position.x - 1000, s.position.y) < 1);
    } finally {
        s.dispose();
    }
});

test('releasing F before the gate timer finishes resets progress and leaves collisions enabled', () => {
    const s = run();
    try {
        advance(s, 40, { interact: true });
        s.step(idle);
        assert.equal(s.gateInteractionProgress, 0);
        assert.equal(s.hyperdrive.active, false);
        assert.equal(s.shipCollider.isEnabled(), true);
        advance(s, 59, { interact: true });
        assert.equal(s.hyperdrive.active, false);
    } finally {
        s.dispose();
    }
});

test('removed jump input cannot initiate or cancel a gate transit and F outside a gate cannot jump', () => {
    const s = run();
    try {
        advance(s, 200, { hyperdrive: true });
        assert.equal(s.hyperdrive.active, false);
        s.ship.setTranslation({ x: 7, y: 0 }, true);
        advance(s, 200, { interact: true });
        assert.equal(s.hyperdrive.active, false);
        s.step(idle);
        s.ship.setTranslation({ x: 10, y: 0 }, true);
        advance(s, 60, { interact: true });
        advance(s, 210, { hyperdrive: true });
        assert.equal(s.hyperdrive.active, false);
        assert.ok(Math.abs(s.position.x - 2000) < 1);
    } finally {
        s.dispose();
    }
});

test('all five Manta tows cross an obstructed gate with stable identities, health and restored colliders', () => {
    const s = run('tug', 3);
    try {
        for (let i = 0; i < 5; i++) {
            const item = s.salvage.add(
                90001 + i,
                i === 0 ? 'shipment' : 'patrol',
                { x: 900, y: (i - 2) * 52 },
                { x: 0, y: 0 },
            )!;
            assert.ok(s.salvage.attach(item, s.ship));
        }
        const health = [...s.salvage.towing.values()].map((item) => item.health),
            hull = s.hull;
        advance(s, 60, { interact: true });
        assert.equal(s.shipCollider.isEnabled(), false);
        assert.ok([...s.salvage.towing.values()].every((item) => !item.collider.isEnabled()));
        s.world.createCollider(RAPIER.ColliderDesc.ball(1).setTranslation(15, 0));
        advance(s, 210);
        assert.equal(s.hull, hull);
        assert.equal(s.salvage.towing.size, 5);
        assert.deepEqual(
            [...s.salvage.towing.values()].map((item) => item.health),
            health,
        );
        assert.ok([...s.salvage.towing.values()].every((item) => item.collider.isEnabled()));
        assert.ok(
            [...s.salvage.towing.values()].every(
                (item) =>
                    Math.hypot(
                        item.body.translation().x * 100 - s.position.x,
                        item.body.translation().y * 100 - s.position.y,
                    ) < 350,
            ),
        );
        const selected = [...s.salvage.towing.keys()][2];
        s.selectTow(selected);
        s.releaseWreck();
        assert.equal(s.salvage.towing.has(selected), false);
        assert.equal(s.salvage.items.has(selected), true);
        assert.equal(s.salvage.towing.size, 4);
        s.releaseWreck(true);
        assert.equal(s.salvage.towing.size, 0);
    } finally {
        s.dispose();
    }
});

test('a Q press during transit is consumed and requires release before it can activate after arrival', () => {
    const s = run('atlas');
    try {
        advance(s, 60, { interact: true });
        advance(s, 210, { abilityQ: true });
        assert.equal(s.abilities.cooldowns.shockwave, 0);
        s.step({ ...idle, abilityQ: false });
        s.step({ ...idle, abilityQ: true });
        assert.equal(s.abilities.cooldowns.shockwave, 12);
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
