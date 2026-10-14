import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { newCampaign } from '../frontend/game/state/campaign';
import { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import { GAME, HULLS } from '../frontend/game/config';
import {
    aimAngle,
    angleDifference,
    followCameraAngle,
    gunMount,
    rotateVector,
} from '../frontend/game/systems/flight';
import { TowBody } from '../frontend/game/systems/tow';

before(async () => {
    await RAPIER.init();
});
const idle: FlightInput = {
    target: { x: 10000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function clearSector(sim: MissionSimulation) {
    for (const rock of sim.rocks.values()) sim.world.removeRigidBody(rock.body);
    sim.rocks.clear();
    sim.enemies.dispose();
}
test('boost raises cruise speed only with forward thrust; reverse ignores boost', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clearSector(sim);
        for (let i = 0; i < 120; i++) sim.step({ ...idle, thrust: true, boost: true });
        assert.ok(Math.abs(sim.speed - GAME.maxSpeed * HULLS.prospector.boost) < 1);
        assert.equal(sim.boosting, true);
        for (let i = 0; i < 100; i++) sim.step({ ...idle, thrust: true });
        assert.ok(Math.abs(sim.speed - GAME.maxSpeed) < 1);
        for (let i = 0; i < 120; i++) sim.step({ ...idle, brake: true, boost: true });
        assert.equal(sim.boosting, false);
        assert.ok(sim.velocity.x < 0 && sim.speed <= GAME.maxSpeed * GAME.reverseSpeed + 1);
        for (let i = 0; i < 180; i++) sim.step({ ...idle, boost: true });
        assert.ok(sim.speed < 1);
    } finally {
        sim.dispose();
    }
});
test('both rotating gun muzzles fire toward the cursor while the hull points elsewhere', () => {
    const campaign = newCampaign();
    campaign.ship!.hull = 'fighter';
    const sim = new MissionSimulation(campaign, 7);
    try {
        clearSector(sim);
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        sim.ship.setRotation(Math.PI / 2, true);
        const target = { x: sim.position.x + 800, y: sim.position.y - 100 };
        for (let i = 0; i < 14; i++) sim.step({ ...idle, target, fire: true });
        assert.equal(sim.bullets.size, 2);
        assert.ok(Math.abs(sim.ship.rotation() - Math.PI / 2) < 1e-6);
        for (const [i, bullet] of [...sim.bullets.values()].entries()) {
            const mount = gunMount(
                sim.position,
                sim.ship.rotation(),
                sim.hullConfig.size,
                i === 0 ? -1 : 1,
            );
            assert.ok(
                Math.abs(
                    angleDifference(Math.atan2(bullet.vy, bullet.vx), aimAngle(mount, target, 0)),
                ) < 1e-5,
            );
            assert.ok(bullet.vx > 1000);
        }
    } finally {
        sim.dispose();
    }
});
test('guns barely damage rocks while the laser is powerful, range-limited and stops on first rock', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        sim.enemies.dispose();
        const rocks = [...sim.rocks.values()].slice(0, 2);
        for (const rock of sim.rocks.values())
            if (!rocks.includes(rock)) {
                sim.world.removeRigidBody(rock.body);
                sim.rocks.delete(rock.id);
            }
        rocks.forEach((rock, i) => {
            rock.body.setTranslation({ x: 20 + i * 0.9, y: 0 }, true);
            rock.body.setLinvel({ x: 0, y: 0 }, true);
            rock.health = 1000;
        });
        sim.ship.setTranslation({ x: 17, y: 0 }, true);
        for (let i = 0; i < 30; i++) sim.step({ ...idle, fire: i === 0 });
        assert.equal(1000 - rocks[0].health, GAME.shotRockDamage);
        const before = rocks[0].health;
        sim.ship.setTranslation({ x: 12, y: 0 }, true);
        for (let i = 0; i < 30; i++) sim.step({ ...idle, mine: true });
        assert.equal(rocks[0].health, before);
        // Rear-mounted laser needs a closer approach than the old nose-mounted one.
        sim.ship.setTranslation({ x: 18.5, y: 0 }, true);
        for (let i = 0; i < 30; i++) sim.step({ ...idle, mine: true });
        assert.ok(before - rocks[0].health > 70);
        assert.equal(rocks[1].health, 1000);
        assert.ok(
            sim.laserBeam &&
                Math.hypot(
                    sim.laserBeam.to.x - sim.laserBeam.from.x,
                    sim.laserBeam.to.y - sim.laserBeam.from.y,
                ) <= GAME.laserRange,
        );
        sim.step(idle);
        assert.equal(sim.laserBeam, null);
    } finally {
        sim.dispose();
    }
});
test('mining laser cannot bypass an enemy hull to mine an asteroid behind it', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        const rock = [...sim.rocks.values()].find((r) => r.radius < 40)!;
        for (const other of sim.rocks.values())
            if (other !== rock) {
                sim.world.removeRigidBody(other.body);
                sim.rocks.delete(other.id);
            }
        const enemy = [...sim.enemies.enemies.values()][0];
        for (const other of sim.enemies.enemies.values())
            if (other !== enemy) sim.enemies.damage(other.id, 1000);
        sim.ship.setTranslation({ x: 20, y: 0 }, true);
        enemy.body.setTranslation({ x: 21, y: 0 }, true);
        enemy.home = { x: 2100, y: 0 };
        enemy.phase = 0;
        rock.body.setTranslation({ x: 22, y: 0 }, true);
        rock.body.setLinvel({ x: 20, y: 0 }, true);
        rock.health = 1000;
        sim.step({ ...idle, mine: true });
        assert.equal(enemy.health, 54);
        assert.equal(rock.health, 1000);
        assert.ok(sim.laserBeam!.to.x < 2130);
    } finally {
        sim.dispose();
    }
});
test('short grabber collects a nearby unit without collecting a resource outside its reach', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clearSector(sim);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.loot.set(999, { id: 999, x: 100, y: 0, kind: 'ore', amount: 1 });
        sim.loot.set(1000, { id: 1000, x: 0, y: 280, kind: 'parts', amount: 1 });
        for (let i = 0; i < 120; i++) sim.step(idle);
        assert.equal(sim.cargo.ore, 1);
        assert.equal(sim.cargo.parts, 0);
        assert.ok(sim.loot.has(1000));
    } finally {
        sim.dispose();
    }
});
test('laser and reverse thrust interrupt repair and quiet interaction progress', () => {
    const sim = new MissionSimulation(newCampaign(), 7);
    try {
        clearSector(sim);
        sim.hull = 50;
        sim.repairKits = 1;
        for (let i = 0; i < 30; i++) sim.step({ ...idle, repair: true });
        assert.ok(sim.repairProgress > 0);
        sim.step({ ...idle, repair: true, mine: true });
        assert.equal(sim.repairProgress, 0);
        sim.step({ ...idle, repair: true, brake: true });
        assert.equal(sim.repairProgress, 0);
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        sim.step({ ...idle, interact: true });
        assert.ok(sim.dockProgress > 0);
        sim.step({ ...idle, interact: true, mine: true });
        assert.equal(sim.dockProgress, 0);
    } finally {
        sim.dispose();
    }
});
test('camera easing takes the short angle path and inverse rotation preserves screen-space aim', () => {
    for (const fps of [30, 60, 144]) {
        let angle = 0;
        for (let i = 0; i < fps / 2; i++) angle = followCameraAngle(angle, Math.PI / 2, 1 / fps);
        assert.ok(
            Math.abs(angle) > Math.PI * 0.55 && Math.abs(angle) < Math.PI * 0.65,
            'camera follows gradually with the same response at different frame rates',
        );
        for (let i = 0; i < fps * 10; i++) angle = followCameraAngle(angle, Math.PI / 2, 1 / fps);
        assert.ok(Math.abs(angleDifference(-Math.PI, angle)) < 1e-6);
        const screen = { x: 210, y: -125 };
        const world = rotateVector(screen, -angle),
            back = rotateVector(world, angle);
        assert.ok(Math.hypot(back.x - screen.x, back.y - screen.y) < 1e-6);
    }
    const current = Math.PI - 0.01;
    const next = followCameraAngle(current, Math.PI / 2 - 0.01, 1 / 60);
    assert.ok(next > current && next - current < 0.01);
});
test('a towed body drifts on slack rope, trails turns and stays within the maximum rope length', () => {
    const tow = new TowBody({ x: -100, y: 0 }, { x: 30, y: 40 });
    tow.step(GAME.step, { x: 0, y: 0 }, 0);
    assert.ok(tow.position.y > 0, 'cargo keeps sideways momentum on a slack rope');
    for (let i = 0; i < 600; i++) {
        const t = i * GAME.step,
            anchor = { x: t * 600, y: Math.sin(t) * 140 };
        tow.step(GAME.step, anchor, 0);
        assert.ok(Number.isFinite(tow.position.x) && Number.isFinite(tow.angle));
        assert.ok(Math.hypot(anchor.x - tow.position.x, anchor.y - tow.position.y) <= 230.00001);
        assert.ok(
            Math.hypot(anchor.x + 28 - tow.position.x, anchor.y - tow.position.y) >= 84.99999,
        );
    }
    const before = { ...tow.position };
    const lastTime = 599 * GAME.step;
    tow.step(GAME.step, { x: lastTime * 600, y: Math.sin(lastTime) * 140 }, Math.PI / 2);
    assert.ok(
        Math.hypot(tow.position.x - before.x, tow.position.y - before.y) < 40,
        'turn does not teleport cargo to a rigid rear offset',
    );
});
test('live rescue attaches a physical loose tow without contacts against the player', () => {
    const c = newCampaign();
    c.recoverySignals = [
        {
            id: 2,
            seed: 7,
            x: 650,
            y: 0,
            pilot: { ...c.pilots[0], id: 2 },
            ship: { ...c.ship!, id: 2 },
        },
    ];
    c.activeRun = { pilotId: 1, seed: 7, contract: 0, repairKits: 0, recoveryId: 2 };
    const sim = new MissionSimulation(c, 7);
    try {
        clearSector(sim);
        sim.ship.setTranslation({ x: 6.5, y: 0 }, true);
        for (let i = 0; i < 250; i++) sim.step({ ...idle, interact: true });
        assert.equal(sim.recoverySecured, true);
        assert.ok(sim.tow);
        for (let i = 0; i < 180; i++) {
            sim.step({ ...idle, thrust: i < 60, turn: i >= 60 && i < 100 ? 1 : 0 });
            assert.ok(Number.isFinite(sim.tow!.position.x));
            let contact = false;
            sim.world.contactPair(sim.shipCollider, sim.salvage.towed!.collider, (manifold) => {
                if (manifold.numSolverContacts()) contact = true;
            });
            assert.equal(contact, false);
        }
        const tow = { ...sim.tow!.position };
        sim.ended = 'returned';
        sim.step({ ...idle, thrust: true });
        assert.deepEqual(sim.tow!.position, tow);
    } finally {
        sim.dispose();
    }
});
