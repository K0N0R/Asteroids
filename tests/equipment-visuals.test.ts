import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graphics } from 'pixi.js';
import { newShip } from '../frontend/game/state/campaign';
import { fittedEquipment, maneuveringFlame } from '../frontend/game/graphics/shipEquipment';
import { shipHull } from '../frontend/game/graphics/shipHull';
import { ShipView } from '../frontend/game/graphics/shapes';
import { drawKineticShield } from '../frontend/game/graphics/kineticShieldView';
import { KineticShield, shieldProfile } from '../frontend/game/systems/kineticShield';

test('Atlas aims its forward missile launcher independently beneath the deck', () => {
    const view = new ShipView(newShip(1, 'atlas'));
    try {
        assert.ok(view.rocketLauncher);
        assert.ok(view.rocketLauncher.x > 0);
        view.aimAt({ x: view.rocketLauncher.x, y: 500 });
        assert.ok(Math.abs(view.rocketLauncher.rotation - Math.PI / 2) < 0.001);
        assert.ok(view.getChildIndex(view.rocketLauncher) < view.children.length - 5);
        assert.equal(view.guns.length, 0);
    } finally {
        view.destroy({ children: true });
    }
});

test('Manta reinforcement additions stay inside its deck bounds', () => {
    const modules = { ...newShip(1, 'tug'), cargo: 3, armor: 3 };
    const hull = shipHull('tug', modules),
        gear = fittedEquipment('tug', modules);
    try {
        const h = hull.getLocalBounds(),
            g = gear.getLocalBounds();
        assert.ok(g.minX >= h.minX && g.maxX <= h.maxX);
        assert.ok(g.minY >= h.minY && g.maxY <= h.maxY);
    } finally {
        hull.destroy();
        gear.destroy();
    }
});

test('maneuvering thrusters exhaust on the opposite side of the turn and stop when idle', () => {
    const g = new Graphics();
    const opposite = new Graphics();
    try {
        maneuveringFlame(g, 'tug', 3, 1, 0);
        assert.ok(g.getLocalBounds().maxY < 0);
        maneuveringFlame(opposite, 'tug', 3, -1, 0);
        assert.ok(opposite.getLocalBounds().minY > 0);
        maneuveringFlame(g, 'tug', 3, 0, 0);
        assert.equal(g.context.instructions.length, 0);
    } finally {
        g.destroy();
        opposite.destroy();
    }
});

test('laser upgrades extend the barrel while camouflage and ammunition do not add hull ornaments', () => {
    const base = new ShipView(newShip(1, 'tug'));
    const upgraded = new ShipView({ ...newShip(1, 'tug'), drill: 3 });
    try {
        assert.ok(upgraded.lasers[0].width > base.lasers[0].width);
    } finally {
        base.destroy({ children: true });
        upgraded.destroy({ children: true });
    }
    for (const id of ['widmo', 'stinger', 'fighter', 'atlas'] as const) {
        const a = fittedEquipment(id, newShip(1, id));
        const b = fittedEquipment(id, { ...newShip(1, id), drill: 3 });
        try {
            assert.equal(a.context.instructions.length, b.context.instructions.length);
        } finally {
            a.destroy();
            b.destroy();
        }
    }
});

test('shield upgrades visibly enlarge the protective ring and its hexes', () => {
    const a = new Graphics(),
        b = new Graphics();
    try {
        drawKineticShield(a, new KineticShield(shieldProfile('aegis')), 80, 0);
        drawKineticShield(b, new KineticShield(shieldProfile('aegis', 3)), 80, 0, 3);
        assert.ok(b.width > a.width * 1.2);
    } finally {
        a.destroy();
        b.destroy();
    }
});
