import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { Container, Text } from 'pixi.js';
import { HULLS, type HullId } from '../frontend/game/config';
import { SandboxRun, defaultSandboxConfig } from '../frontend/game/systems/sandbox';
import { ShipAbilityHud, shipHudSlots } from '../frontend/game/ui/shipAbilityHud';
import { MissionWorld } from '../frontend/game/worlds/missionWorld';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import { GameSettings } from '../frontend/core/systems/gameSettings';
import { flightHint } from '../frontend/game/ui/missionReadout';

GameSettings.soundEnabled = false;
before(async () => {
    await RAPIER.init();
});
const idle = {
    target: { x: 2200, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
const run = (hull: HullId) =>
    new SandboxRun({ ...defaultSandboxConfig(), hull, scenario: 'combat' });

test('HUD only binds abilities actually present on each playable or recovered hull', () => {
    for (const hull of Object.keys(HULLS) as HullId[]) {
        const r = run(hull),
            s = r.simulation;
        try {
            const active = shipHudSlots(s).filter((slot) => slot.key);
            assert.equal(new Set(active.map((slot) => slot.key)).size, active.length, hull);
            if (hull === 'lancer' || hull === 'raider')
                assert.deepEqual(
                    active.map((slot) => slot.key),
                    ['LPM'],
                    hull,
                );
            for (const slot of active)
                if (slot.icon === 'laser') assert.ok(s.hullConfig.lasers.length, hull);
            if (hull === 'mule')
                assert.deepEqual(
                    active.map((slot) => slot.key),
                    ['LPM'],
                );
        } finally {
            s.dispose();
        }
    }
});

test('ability keys appear once with centered compact badges and centered legible cooldowns', () => {
    const r = run('aegis'),
        s = r.simulation,
        hud = new ShipAbilityHud(s);
    try {
        s.abilities.cooldowns.shield = 12;
        s.abilities.cooldowns.shockwave = 9;
        hud.update();
        const texts: Text[] = [];
        const visit = (view: Container) => {
            if (view instanceof Text) texts.push(view);
            for (const child of view.children) visit(child);
        };
        visit(hud);
        for (const key of ['LPM', 'PPM', 'Q', 'E']) {
            const matches = texts.filter((text) => text.text === key);
            assert.equal(matches.length, 1, key);
            assert.equal(matches[0].anchor.x, 0.5);
            assert.equal(matches[0].anchor.y, 0.5);
        }
        assert.equal(
            texts.some((text) => text.text === 'PASYWNA'),
            false,
        );
        for (const value of ['12', '9']) {
            const counter = texts.find((text) => text.text === value)!;
            assert.ok(counter);
            assert.equal(counter.anchor.x, 0.5);
            assert.equal(counter.anchor.y, 0.5);
            assert.equal(counter.parent!.x, 0);
            assert.equal(counter.parent!.y, 0);
            assert.equal(counter.style.fontWeight, 'bold');
        }
    } finally {
        destroyDisplayTree(hud);
        s.dispose();
    }
});

test('Widmo cloak survives final camera presentation and leaves bounded fading silhouettes', () => {
    const r = run('widmo'),
        s = r.simulation,
        world = new MissionWorld(s, r.campaign.ship!, false);
    const view = world as unknown as {
        shipView: Container;
        dashGhosts: Container[];
        cloakTrail: unknown[];
    };
    try {
        for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
        world.update(1000 / 60, { ...idle, abilityQ: true });
        assert.equal(s.opticalCloak, true);
        assert.equal(view.shipView.alpha, 0.3);
        assert.doesNotMatch(
            flightHint(s),
            /PPM|Kamuflaż/,
            'flight hints do not duplicate ability bindings',
        );
        for (let i = 0; i < 120; i++) world.update(1000 / 60, { ...idle, thrust: true });
        assert.ok(view.dashGhosts.some((ghost) => ghost.visible && ghost.alpha > 0));
        assert.ok(view.cloakTrail.length <= view.dashGhosts.length);
        world.update(1000 / 60, { ...idle, fire: true });
        assert.equal(view.shipView.alpha, 1);
        for (let i = 0; i < 40; i++) world.update(1000 / 60, idle);
        assert.equal(
            view.dashGhosts.some((ghost) => ghost.visible),
            false,
        );
    } finally {
        world.dispose();
    }
});

test('Phoenix secondary beams keep rendering and damaging enemies through repeated slow frames', () => {
    const r = run('phoenix'),
        s = r.simulation,
        world = new MissionWorld(s, r.campaign.ship!, false);
    try {
        for (const id of [...s.enemies.enemies.keys()]) s.enemies.remove(id);
        s.enemies.add([
            {
                id: 99001,
                x: s.position.x + 220,
                y: s.position.y,
                home: { x: s.position.x + 220, y: s.position.y },
                phase: 0,
                kind: 'heavy',
            },
        ]);
        const enemy = s.enemies.enemies.get(99001)!;
        enemy.health = 10000;
        const health = enemy.health;
        let burned = false;
        for (let i = 0; i < 120; i++) {
            s.hull = s.maxHull;
            const target = { x: s.position.x + 220, y: s.position.y };
            enemy.body.setTranslation({ x: target.x / 100, y: target.y / 100 }, true);
            world.update(i % 2 ? 150 : 1000 / 60, { ...idle, target, mine: true });
            burned ||= s.burning.size > 0;
            assert.equal(s.laserBeams.length, 2);
            if (!s.enemies.enemies.has(99001)) break;
        }
        assert.ok(s.elapsed > 1);
        assert.ok(enemy.health < health);
        assert.ok(burned, 'both damage and burning render paths are exercised');
        assert.ok(
            (world as unknown as { particles: unknown[] }).particles.length < 100,
            'continuous damage does not flood the scene with spark graphics',
        );
    } finally {
        world.dispose();
    }
});
