import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { ResearchEscort, ESCORT } from '../frontend/game/systems/escort';
import { MissionSimulation } from '../frontend/game/systems/mission';
import {
    beginRun,
    newCampaign,
    parseCampaign,
    deliverSalvage,
} from '../frontend/game/state/campaign';
import { ENEMY_PROFILES, GAME, type EnemyKind } from '../frontend/game/config';
import { cargoLoad, isComponent, resourceTotal } from '../frontend/game/state/resources';
import { droneComponentTier, leavesWreck } from '../frontend/game/systems/salvage';
import { researchShipView, updateResearchDrive } from '../frontend/game/graphics/researchView';
import { RenderContextJournal } from '../frontend/core/systems/renderContextDiagnostics';

before(async () => RAPIER.init());
const idle = {
    target: { x: 4000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function arena(
    hull: 'prospector' | 'atlas' | 'fighter' = 'prospector',
    seed = 71,
    escort = false,
    upgraded = false,
) {
    const c = newCampaign();
    c.ship!.hull = hull;
    if (upgraded) {
        c.ship!.drill = 3;
        c.ship!.weapon = 'pulse';
    }
    if (escort) {
        c.contract = 7;
        c.contractCompletions[2] = 1;
        c.station.workshopLevel = c.station.laboratoryLevel = 1;
        c.recovered = 1;
    }
    assert.ok(beginRun(c, seed));
    const s = new MissionSimulation(c, seed);
    for (const r of s.rocks.values()) s.world.removeRigidBody(r.body);
    s.rocks.clear();
    s.ship.setTranslation({ x: 30, y: 0 }, true);
    return s;
}
test('Kepler repairs exactly 25% max hull below 40%, stops moving and resumes its mission', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const e = new ResearchEscort(world, { x: 4000, y: 0 });
    try {
        e.body.setTranslation({ x: 30, y: 0 }, true);
        e.state = 'travel';
        e.health = ESCORT.health * 0.4;
        e.update(GAME.step, e.position, [], false);
        assert.equal(e.repairing, false);
        e.health = 40;
        e.body.setLinvel({ x: 1, y: 0 }, true);
        e.update(GAME.step, e.position, [], false);
        assert.ok(e.repairing);
        assert.deepEqual(e.velocity, { x: 0, y: 0 });
        assert.equal(e.thrusting, false);
        for (let i = 1; i < 300; i++) e.update(GAME.step, e.position, [], false);
        assert.equal(e.health, 75);
        assert.equal(e.repairs, 1);
        e.update(GAME.step, e.position, [], false);
        assert.equal(e.state, 'travel');
        e.update(GAME.step, e.position, [], false);
        assert.ok(e.thrusting);
    } finally {
        e.dispose();
        world.free();
    }
});
test('hostile presence and hits interrupt repair; repair pauses the analysis clock', () => {
    const world = new RAPIER.World({ x: 0, y: 0 });
    const e = new ResearchEscort(world, { x: 3000, y: 0 });
    try {
        e.body.setTranslation({ x: 30, y: 0 }, true);
        e.state = 'research';
        e.health = 45;
        e.researchProgress = 3;
        for (let i = 0; i < 120; i++) e.update(GAME.step, e.position, [], false);
        assert.equal(e.researchProgress, 3);
        assert.equal(e.scanning, false);
        e.update(GAME.step, e.position, [], true);
        assert.equal(e.repairProgress, 0);
        e.update(GAME.step, e.position, [], false);
        assert.ok(e.repairing);
        e.damage(1, 0);
        assert.equal(e.repairProgress, 0);
        e.update(GAME.step, e.position, [], false);
        assert.equal(e.repairProgress, 0);
        e.damage(1000, 0);
        for (let i = 0; i < 400; i++) e.update(GAME.step, e.position, [], false);
        assert.equal(e.state, 'destroyed');
        assert.equal(e.health, 0);
    } finally {
        e.dispose();
        world.free();
    }
});
test('actual escort repair emits the same welding particles as player repairs', () => {
    const s = arena('prospector', 71, true);
    try {
        s.enemies.dispose();
        const e = s.escort!;
        e.body.setTranslation({ x: 33, y: 0 }, true);
        e.state = 'travel';
        e.health = 40;
        Object.assign(e.destination, { x: 4000, y: 0 });
        for (let i = 0; i < 300; i++) s.step(idle);
        const welds = s.events.filter((event) => event.kind === 'weld');
        assert.ok(welds.length >= 55 && welds.length <= 60, `${welds.length} weld events`);
        assert.ok(welds.every((event) => Math.hypot(event.x - 3300, event.y) < 60));
        assert.ok(welds.every((event) => event.strength === 3));
        assert.equal(e.health, 75);
        assert.equal(e.repairs, 1);
    } finally {
        s.dispose();
    }
});
test('research engine plumes animate only during flight without creating new display nodes', () => {
    const view = researchShipView();
    try {
        const plume = view.getChildByLabel('kepler-exhaust')!;
        const count = view.children.length;
        assert.equal(plume.visible, false);
        updateResearchDrive(view, true, 1);
        const scale = plume.scale.x;
        assert.equal(plume.visible, true);
        updateResearchDrive(view, true, 1.1);
        assert.notEqual(plume.scale.x, scale);
        assert.equal(view.children.length, count);
        updateResearchDrive(view, false, 2);
        assert.equal(plume.visible, false);
    } finally {
        view.destroy({ children: true });
    }
});
test('all enemy classes drop only finished components of their tier', () => {
    let seed = 1;
    while (leavesWreck(seed, 1)) seed++;
    for (const kind of Object.keys(ENEMY_PROFILES) as EnemyKind[]) {
        const s = arena('prospector', seed);
        try {
            const enemy = s.enemies.enemies.get(1)!;
            for (const other of [...s.enemies.enemies.values()])
                if (other !== enemy) s.enemies.damage(other.id, 10000);
            enemy.kind = kind;
            enemy.config = ENEMY_PROFILES[kind];
            enemy.body.setTranslation({ x: 34, y: 0 }, true);
            enemy.home = { x: 3400, y: 0 };
            enemy.cooldown = 999;
            s.bullets.set(99999, {
                id: 99999,
                x: 3300,
                y: 0,
                vx: 10000,
                vy: 0,
                life: 1,
                team: 'player',
                damage: 1000,
            });
            s.step(idle);
            assert.equal(s.enemyKills, 1);
            assert.equal(s.loot.size, ENEMY_PROFILES[kind].partsLoot);
            const tier = droneComponentTier(kind);
            for (const item of s.loot.values()) {
                assert.ok(isComponent(item.kind), `${kind}: ${item.kind}`);
                assert.ok(
                    tier === 1
                        ? !/II/.test(item.kind)
                        : item.kind.endsWith(tier === 2 ? 'II' : 'III'),
                );
            }
        } finally {
            s.dispose();
        }
    }
});
test('parts can be collected with full cargo while ore waits, and never consume cargo slots', () => {
    const s = arena();
    try {
        s.enemies.dispose();
        s.cargo.ore = s.cargoCapacity;
        s.loot.set(1, { id: 1, x: 3050, y: 0, kind: 'partsII', amount: 3 });
        s.loot.set(2, { id: 2, x: 3060, y: 10, kind: 'electronicsIII', amount: 2 });
        s.loot.set(3, { id: 3, x: 3040, y: -10, kind: 'ore', amount: 1 });
        for (let i = 0; i < 240; i++) s.step(idle);
        assert.equal(s.cargo.partsII, 3);
        assert.equal(s.cargo.electronicsIII, 2);
        assert.equal(s.cargo.ore, s.cargoCapacity);
        assert.equal(s.cargoUsed, s.cargoCapacity);
        assert.equal(resourceTotal(s.cargo), s.cargoCapacity + 5);
        assert.equal(s.loot.get(3)?.amount, 1);
        assert.equal(cargoLoad({ ore: 1, parts: 999, kineticModules: 20, propulsionIII: 20 }), 1);
        s.campaign.activeRun!.freight = { ore: s.cargoCapacity, parts: 1000, partsIII: 1000 };
        assert.ok(parseCampaign(JSON.stringify(s.campaign)));
    } finally {
        s.dispose();
    }
});
test('lasers, rounds and explosive missiles dismantle wrecks into parts exactly once', () => {
    for (const weapon of ['laser', 'round', 'rocket'] as const) {
        const s = arena();
        try {
            s.enemies.dispose();
            const item = s.salvage.add(
                1,
                'lancer',
                { x: 3180, y: 0 },
                { x: 0, y: 0 },
                0,
                false,
                3,
            )!;
            if (weapon === 'laser') {
                for (let i = 0; i < 150 && s.salvage.items.size; i++)
                    s.step({ ...idle, mine: true, target: { x: 3200, y: 0 } });
            } else {
                s.bullets.set(99999, {
                    id: 99999,
                    x: 3080,
                    y: 0,
                    vx: 10000,
                    vy: 0,
                    life: 1,
                    team: 'player',
                    damage: 1000,
                    ...(weapon === 'rocket' ? { explosive: 'rocket' as const } : {}),
                });
                s.step(idle);
            }
            assert.equal(s.salvage.items.size, 0, weapon);
            assert.equal(
                [...s.loot.values()].reduce((sum, item) => sum + item.amount, 0) +
                    resourceTotal(s.cargo) +
                    s.grippers.arms.filter((arm) => arm.held).length,
                7,
                weapon,
            );
            assert.ok([...s.loot.values()].every((loot) => loot.kind.endsWith('III')));
            assert.equal(s.cargo.ore, 0);
        } finally {
            s.dispose();
        }
    }
});
test('player fire preserves quest probes, rescue targets and shipments', () => {
    const s = arena();
    try {
        s.enemies.dispose();
        for (const [id, source] of [
            [-73003, 'patrol'],
            [-73002, 'satellite'],
            [-1, 'recovery'],
            [2, 'shipment'],
        ] as const) {
            const item = s.salvage.add(id, source, { x: 3180, y: 0 }, { x: 0, y: 0 })!;
            s.bullets.set(99999, {
                id: 99999,
                x: 3080,
                y: 0,
                vx: 10000,
                vy: 0,
                life: 1,
                team: 'player',
                damage: 1000,
            });
            s.step(idle);
            assert.equal(item.health, item.maxHealth, source);
            assert.equal(s.loot.size, 0);
            s.salvage.remove(item);
            s.bullets.clear();
        }
    } finally {
        s.dispose();
    }
});
test('wreck tiers survive save/reload and towing refunds components instead of raw ore', () => {
    const c = newCampaign();
    beginRun(c, 71);
    c.nextSalvageId++;
    c.worldSalvage.push({
        id: 100000,
        seed: 71,
        x: 3000,
        y: 0,
        source: 'lancer',
        componentTier: 3,
    });
    const loaded = parseCampaign(JSON.stringify(c))!;
    assert.ok(loaded);
    const s = new MissionSimulation(loaded, 71);
    try {
        assert.equal(s.salvage.items.get(100000)?.componentTier, 3);
    } finally {
        s.dispose();
    }
    const delivery = deliverSalvage(loaded, 100000, 'lancer')!;
    assert.equal(delivery.materials.ore, 0);
    assert.equal(delivery.materials.partsIII, 2);
    assert.equal(resourceTotal(delivery.materials), 7);
    assert.equal(deliverSalvage(loaded, 100000, 'lancer'), null);
});
test('holding grenade fire, including upgraded salvos, always respects a short cooldown', () => {
    for (const hull of ['atlas', 'fighter'] as const)
        for (const upgraded of [false, true]) {
            const s = arena(hull, 71, false, upgraded);
            try {
                s.enemies.dispose();
                assert.equal(s.grenadeCount, upgraded ? 4 : 1);
                const shots: number[] = [];
                for (let frame = 0; frame < 240; frame++) {
                    s.events.length = 0;
                    s.step({ ...idle, mine: true });
                    if (s.events.some((e) => e.kind === 'shot')) shots.push(frame);
                }
                assert.ok(shots.length >= 2 && shots.length <= (upgraded ? 4 : 3), hull);
                for (let i = 1; i < shots.length; i++)
                    assert.ok(shots[i] - shots[i - 1] >= (upgraded ? 60 : 90));
            } finally {
                s.dispose();
            }
        }
});
test('GPU diagnostics keeps only one minute of samples and a bounded error trace', () => {
    const journal = new RenderContextJournal();
    for (let i = 0; i < 100; i++) {
        journal.sample({ i });
        journal.event('test', 'x'.repeat(5000));
    }
    assert.equal(journal.samples.length, 30);
    assert.deepEqual(journal.samples[0].data, { i: 70 });
    assert.equal(journal.events.length, 40);
    assert.equal(journal.events[0].detail.length, 4000);
});
