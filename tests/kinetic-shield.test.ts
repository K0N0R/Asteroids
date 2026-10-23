import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { HULLS, type HullId } from '../frontend/game/config';
import { KineticShield, shieldProfile } from '../frontend/game/systems/kineticShield';
import { MissionSimulation } from '../frontend/game/systems/mission';
import {
    newCampaign,
    newShip,
    buyUpgrade,
    parseCampaign,
    scrapRefund,
    upgradePrice,
} from '../frontend/game/state/campaign';

before(async () => RAPIER.init());
const idle = { target: { x: 0, y: 0 }, thrust: false, brake: false, fire: false, interact: false };
function arena(hull: HullId = 'prospector') {
    const c = newCampaign();
    c.ship!.hull = hull;
    const sim = new MissionSimulation(c, 71);
    sim.enemies.dispose();
    for (const r of sim.rocks.values()) sim.world.removeRigidBody(r.body);
    sim.rocks.clear();
    sim.ship.setTranslation({ x: 30, y: 0 }, true);
    return sim;
}
function hit(sim: MissionSimulation, damage: number) {
    sim.bullets.set(9999, {
        id: 9999,
        x: 2900,
        y: 0,
        vx: 10000,
        vy: 0,
        life: 1,
        team: 'enemy',
        damage,
    });
    sim.step(idle);
}

test('all hulls have distinct shield profiles and modules improve capacity and recovery', () => {
    const profiles = (Object.keys(HULLS) as HullId[]).map((h) => shieldProfile(h));
    assert.equal(new Set(profiles.map((p) => p.capacity)).size, profiles.length);
    assert.ok(shieldProfile('fighter').capacity > shieldProfile('swift').capacity);
    assert.ok(shieldProfile('swift').delay < shieldProfile('mule').delay);
    for (const hull of Object.keys(HULLS) as HullId[]) {
        const base = shieldProfile(hull),
            up = shieldProfile(hull, 3);
        assert.ok(up.capacity > base.capacity && up.regen > base.regen);
        assert.equal(up.delay, base.delay);
    }
});

test('shield absorbs first, passes only overflow to hull and resets the regeneration delay', () => {
    const s = new KineticShield({ capacity: 25, regen: 5, delay: 5 });
    assert.deepEqual(s.absorb(12), { absorbed: 12, hull: 0 });
    assert.equal(s.charge, 13);
    s.update(4);
    assert.equal(s.charge, 13);
    assert.deepEqual(s.absorb(20), { absorbed: 13, hull: 7 });
    assert.equal(s.cooldown, 5);
    s.update(5);
    assert.equal(s.charge, 0);
    s.update(1);
    assert.equal(s.charge, 5);
    s.update(100);
    assert.equal(s.charge, 25);
    for (const damage of [-1, 0, NaN, Infinity])
        assert.deepEqual(s.absorb(damage), { absorbed: 0, hull: 0 });
});

test('regeneration is timestep independent, pauses with the simulation and recharges quickly at Aurora', () => {
    const a = new KineticShield(shieldProfile('fighter')),
        b = new KineticShield(shieldProfile('fighter'));
    a.absorb(100);
    b.absorb(100);
    a.update(7);
    for (let i = 0; i < 420; i++) b.update(1 / 60);
    assert.ok(Math.abs(a.charge - b.charge) < 0.00001);
    const sim = arena();
    try {
        hit(sim, 25);
        const charge = sim.kineticShield.charge;
        sim.ended = 'returned';
        for (let i = 0; i < 400; i++) sim.step(idle);
        assert.equal(sim.kineticShield.charge, charge);
        sim.ended = null;
        sim.ship.setTranslation({ x: 0, y: 0 }, true);
        for (let i = 0; i < 121; i++) sim.step(idle);
        assert.equal(sim.kineticShield.charge, 25);
    } finally {
        sim.dispose();
    }
});

test('actual hostile rounds emit shield sparks at contact and only overflow damages the hull', () => {
    const sim = arena();
    try {
        hit(sim, 12);
        assert.equal(sim.hull, 65);
        assert.equal(sim.kineticShield.charge, 13);
        const blue = sim.events.find((e) => e.kind === 'shield')!;
        assert.ok(blue);
        assert.equal(blue.strength, 12);
        assert.ok(blue.x < 3000 && blue.x > 2940);
        hit(sim, 20);
        assert.equal(sim.hull, 58);
        assert.equal(sim.kineticShield.charge, 0);
        assert.ok(sim.events.some((e) => e.kind === 'hit' && e.strength === 7));
    } finally {
        sim.dispose();
    }
});

test('a protected collision does not cause hull damage or engine failure; sector radiation bypasses shielding', () => {
    const sim = arena('fighter');
    try {
        sim.world.createCollider(RAPIER.ColliderDesc.ball(0.5).setTranslation(31, 0));
        sim.ship.setLinvel({ x: 8, y: 0 }, true);
        for (let i = 0; i < 5; i++) sim.step(idle);
        assert.ok(sim.kineticShield.charge < 100);
        assert.equal(sim.hull, 100);
        assert.equal(sim.engineFault, false);
        sim.ship.setTranslation({ x: 90, y: 0 }, true);
        sim.ship.setLinvel({ x: 0, y: 0 }, true);
        const charge = sim.kineticShield.charge;
        sim.step(idle);
        assert.ok(sim.hull < 100);
        assert.equal(sim.kineticShield.charge, charge);
    } finally {
        sim.dispose();
    }
});

test('shield upgrades charge exact tiers atomically, respect workshop levels and retain their tiers in refunds', () => {
    const c = newCampaign(); c.ship!.hull = 'swift';
    c.station.workshopLevel = c.station.laboratoryLevel = 1;
    c.bank = {ore:100,parts:0,electronics:1,powerModules:2};
    assert.ok(buyUpgrade(c,'shield')); assert.equal(c.ship!.shield,1);
    const before=structuredClone(c.bank); assert.equal(buyUpgrade(c,'shield'),false);
    assert.deepEqual(c.bank,before);
    c.station.workshopLevel = c.station.laboratoryLevel = 2;
    assert.deepEqual(upgradePrice(c,'shield'),{ore:0,parts:0,electronicsII:1,powerModulesII:2});
    c.bank.electronicsII=1; c.bank.powerModulesII=2;
    assert.ok(buyUpgrade(c,'shield')); assert.equal(c.ship!.shield,2);
    const refund=scrapRefund(c.ship!);
    assert.equal(refund.powerModulesII,1);
    assert.equal(refund.electronicsII??0,0);
    assert.deepEqual(parseCampaign(JSON.stringify(c)),c);
});
