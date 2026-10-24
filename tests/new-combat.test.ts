import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    newCampaign,
    newShip,
    newStoryCampaign,
    beginRun,
    finishRun,
    parseCampaign,
    emergencyKit,
} from '../frontend/game/state/campaign';
import { HULLS, type HullId } from '../frontend/game/config';
import { MissionSimulation, type FlightInput } from '../frontend/game/systems/mission';
import { generateSector } from '../frontend/game/worlds/sector';
import { enemyPosition } from '../frontend/game/systems/enemies';
import { LUNAR_PROCESSING } from '../frontend/game/state/lunarConstruction';
import { grantStoryTasks } from './fleet-fixtures';
import { MOON } from '../frontend/game/worlds/moon';

before(async () => {
    await RAPIER.init();
});
const idle: FlightInput = {
    target: { x: 1500, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function run(hull: HullId, handling = 0) {
    const c = newCampaign();
    c.ship = newShip(1, hull);
    c.ship.handling = handling;
    c.station.workshopLevel = c.station.laboratoryLevel = 3;
    assert.ok(beginRun(c, 719));
    const sector = generateSector(719);
    sector.enemies = [];
    sector.fortress.guards = [];
    const sim = new MissionSimulation(c, 719, sector);
    sim.ship.setTranslation({ x: 10, y: 0 }, true);
    for (const enemy of [...sim.enemies.enemies.keys()]) sim.enemies.remove(enemy);
    return sim;
}
function advance(s: MissionSimulation, frames: number, extra: Partial<FlightInput> = {}) {
    for (let i = 0; i < frames && !s.ended; i++) {
        s.step({ ...idle, ...extra });
        s.events.length = 0;
    }
}
test('Widmo has a real bow cannon, PPM dash, and Q cloak', () => {
    const s = run('widmo');
    try {
        s.step({ ...idle, fire: true });
        assert.ok([...s.bullets.values()].some((bullet) => bullet.team === 'player'));
        assert.equal(s.dashTime, 0);
        s.step({ ...idle, mine: true });
        assert.ok(s.dashTime > 0);
        advance(s, 60);
        s.step({ ...idle, abilityQ: true });
        assert.equal(s.opticalCloak, true);
        s.step({ ...idle, fire: true });
        assert.equal(s.opticalCloak, false);
    } finally {
        s.dispose();
    }
});
test('Aegis shields are on Q, mining is on PPM, and no auxiliary drone is spawned', () => {
    const s = run('aegis');
    try {
        assert.equal(HULLS.aegis.grabbers.length, 2);
        assert.equal(s.aegis!.drone, null);
        s.step({ ...idle, mine: true });
        assert.equal(s.laserBeams.length, 2);
        assert.equal(s.aegis!.shields.has('player'), false);
        s.step({ ...idle, abilityQ: true });
        assert.ok(s.aegis!.shields.has('player'));
        advance(s, 370);
        assert.equal(s.aegis!.shields.has('player'), false);
    } finally {
        s.dispose();
    }
});
test('Feniks has two primary cannons, two secondary beams, and a Q rocket', () => {
    const s = run('phoenix');
    try {
        s.step({ ...idle, fire: true });
        assert.equal([...s.bullets.values()].filter((b) => b.team === 'player').length, 2);
        s.step({ ...idle, mine: true });
        assert.equal(s.laserBeams.length, 2);
        assert.equal(
            [...s.bullets.values()].some((b) => b.explosive === 'rocket'),
            false,
        );
        s.step({ ...idle, abilityQ: true });
        assert.ok([...s.bullets.values()].some((b) => b.explosive === 'rocket'));
    } finally {
        s.dispose();
    }
});
test('Manta throws an EMP that disables weapons and pushes a rock without damaging it', () => {
    const s = run('tug');
    try {
        assert.equal(s.hullConfig.lasers.length, 0);
        const rock = [...s.rocks.values()].find(
            (rock) => !rock.anchored && !rock.surface && !rock.defense,
        )!;
        rock.body.setTranslation({ x: 12.2, y: 0.8 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        const health = rock.health;
        s.enemies.add([
            { id: 99001, x: 1240, y: 0, home: { x: 1240, y: 0 }, phase: 0, kind: 'heavy' },
        ]);
        s.step({ ...idle, target: { x: 1240, y: 0 }, mine: true });
        assert.ok([...s.bullets.values()].some((b) => b.explosive === 'emp'));
        advance(s, 50, { target: { x: 1240, y: 0 } });
        assert.ok((s.enemies.enemies.get(99001)?.weaponDisabled ?? 0) > 0);
        assert.equal(rock.health, health);
        assert.ok(Math.hypot(rock.body.linvel().x, rock.body.linvel().y) > 0);
    } finally {
        s.dispose();
    }
});
test('shockwave damages hostile ships and changes asteroid velocity', () => {
    const s = run('atlas');
    try {
        const rock = [...s.rocks.values()].find(
            (rock) => !rock.anchored && !rock.surface && !rock.defense,
        )!;
        rock.body.setTranslation({ x: 11.5, y: 1.5 }, true);
        rock.body.setLinvel({ x: 0, y: 0 }, true);
        s.enemies.add([
            { id: 99002, x: 1190, y: -90, home: { x: 1190, y: -90 }, phase: 0, kind: 'heavy' },
        ]);
        const enemy = s.enemies.enemies.get(99002)!,
            before = enemy.health;
        s.step({ ...idle, abilityQ: true });
        assert.ok(enemy.health < before);
        assert.ok(Math.hypot(rock.body.linvel().x, rock.body.linvel().y) > 0);
        assert.equal(s.abilities.cooldowns.shockwave, 12);
    } finally {
        s.dispose();
    }
});

test('Stinger has independent rapid fire, rocket, Q cloak and E EMP', () => {
    const s = run('stinger');
    try {
        s.step({ ...idle, fire: true, mine: true });
        assert.equal(
            [...s.bullets.values()].filter((bullet) => bullet.stingerAmmo === 'light').length,
            4,
        );
        assert.equal(
            [...s.bullets.values()].filter((bullet) => bullet.explosive === 'rocket').length,
            1,
        );
        assert.equal(s.laserBeams.length, 0);
        s.step({ ...idle, abilityQ: true });
        assert.equal(s.opticalCloak, true);
        s.step({ ...idle, abilityE: true });
        assert.equal(s.opticalCloak, false);
        assert.ok([...s.bullets.values()].some((bullet) => bullet.explosive === 'emp'));
        assert.ok(s.abilities.cooldowns.emp > 0);
    } finally {
        s.dispose();
    }
});

test('Stinger ammunition and handling upgrades do not silently strengthen cloak or rocket abilities', () => {
    const s = run('stinger', 3);
    try {
        s.modules.drill = 3;
        s.step({ ...idle, abilityQ: true });
        assert.equal(s.abilities.cooldowns.cloak, 12);
        assert.equal(s.opticalCloakCooldown, 12);
        s.step({ ...idle, mine: true });
        assert.equal(
            [...s.bullets.values()].find((bullet) => bullet.explosive === 'rocket')!.damage,
            160,
        );
    } finally {
        s.dispose();
    }
});

test('Falcon keeps its secondary mining laser, gains EMP on Q and has no E ability', () => {
    const s = run('falcon');
    try {
        s.step({ ...idle, mine: true, abilityQ: true, abilityE: true });
        assert.equal(s.laserBeams.length, 1);
        assert.ok([...s.bullets.values()].some((bullet) => bullet.explosive === 'emp'));
        assert.equal(s.abilities.cooldowns.shockwave, 0);
        assert.equal(s.abilities.cooldowns.cloak, 0);
        assert.equal(s.abilities.cooldowns.rocket, 0);
    } finally {
        s.dispose();
    }
});
test('tier I Manta can tow five independent objects after three handling upgrades', () => {
    const s = run('tug', 3);
    try {
        assert.equal(s.salvage.capacity, 5);
        for (let i = 0; i < 5; i++) {
            const item = s.salvage.add(
                88000 + i,
                'patrol',
                { x: 900, y: -120 + i * 60 },
                { x: 0, y: 0 },
            )!;
            assert.ok(s.salvage.attach(item, s.ship));
        }
        assert.equal(s.salvage.towing.size, 5);
        assert.equal(
            new Set([...s.salvage.towing.values()].map((item) => s.salvage.towAnchor(item).y)).size,
            5,
        );
        const first = s.salvage.towed!;
        s.salvage.detach(first);
        assert.ok(s.salvage.attach(first, s.ship));
        assert.equal(
            new Set([...s.salvage.towing.values()].map((item) => s.salvage.towAnchor(item).y)).size,
            5,
        );
    } finally {
        s.dispose();
    }
});
test('gates accept a one-second F interaction and ignore the removed hyperdrive input', () => {
    const s = run('swift');
    try {
        s.sector.hyperlanes = [{ name: 'Próba', a: { x: 1000, y: 0 }, b: { x: 2000, y: 0 } }];
        for (const rock of [...s.rocks.values()]) {
            s.asteroidColliders.delete(rock.collider.handle);
            s.world.removeRigidBody(rock.body);
            s.rocks.delete(rock.id);
        }
        advance(s, 150, { hyperdrive: true });
        assert.equal(s.hyperdrive.active, false);
        advance(s, 59, { interact: true });
        assert.equal(s.hyperdrive.active, false);
        advance(s, 1, { interact: true });
        assert.equal(s.hyperdrive.state, 'charging');
        advance(s, 200, { interact: true });
        assert.ok(Math.hypot(s.position.x - 2000, s.position.y) < 2);
        assert.equal(s.hyperdrive.active, false);
        advance(s, 150, { interact: true });
        assert.equal(s.hyperdrive.active, false);
    } finally {
        s.dispose();
    }
});
test('fatal damage to lunar Mule is persisted before the next sortie', () => {
    const c = newStoryCampaign();
    c.station.laboratoryLevel = 1;
    c.story!.claimed.push('earth-relay', 'lunar-survey', ...LUNAR_PROCESSING.map((t) => t.id));
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.ok(s.miningEscort);
        (s as any).damageEscort(10000, s.miningEscort!.position);
        assert.equal(c.story!.lunarMule, 'destroyed');
    } finally {
        s.dispose();
    }
    const next = new MissionSimulation(c, c.activeRun!.seed);
    try {
        assert.equal(next.miningEscort, null);
    } finally {
        next.dispose();
    }
});
test('H alone attaches a wreck without invoking a second world interaction', () => {
    const s = run('tug');
    try {
        const wreck = s.salvage.add(88990, 'patrol', { x: 1080, y: 0 }, { x: 0, y: 0 })!;
        advance(s, 60, { tow: true, target: { x: 1080, y: 0 } });
        assert.equal(s.salvage.towing.has(wreck.id), true);
        assert.equal(s.hyperdrive.active, false);
    } finally {
        s.dispose();
    }
});

test('all five Manta tows land together and remain independently recoverable after loss and reload', () => {
    const c = newStoryCampaign();
    grantStoryTasks(c, ['lunar-survey']);
    c.station.laboratoryLevel = c.station.workshopLevel = 3;
    c.ship = newShip(1, 'tug');
    c.ship.handling = 3;
    assert.ok(beginRun(c, 1));
    const s = new MissionSimulation(c, c.activeRun!.seed);
    const ids = Array.from({ length: 5 }, () => c.nextSalvageId++);
    try {
        s.ship.setTranslation({ x: MOON.entrance.x / 100, y: MOON.entrance.y / 100 }, true);
        s.ship.setLinvel({ x: 0, y: 0 }, true);
        ids.forEach((id, i) => {
            const point = { x: MOON.entrance.x - 100, y: MOON.entrance.y + (i - 2) * 52 };
            c.worldSalvage.push({ id, seed: c.activeRun!.seed, ...point, source: 'patrol' });
            assert.ok(
                s.salvage.attach(s.salvage.add(id, 'patrol', point, { x: 0, y: 0 })!, s.ship),
            );
        });
        s.step(idle);
        advance(s, 125, { target: MOON.entrance, interact: true });
        assert.equal(s.area, 'surface');
        while (s.transferActive) s.step(idle);
        assert.deepEqual([...s.salvage.towing.keys()], ids);
        assert.ok(c.worldSalvage.every((item) => item.area === 'surface'));
        assert.ok(
            finishRun(c, false, s.cargo, s.elapsed, 'lost', s.repairKits, {
                lossPosition: s.position,
            }),
        );
    } finally {
        s.dispose();
    }
    const saved = parseCampaign(JSON.stringify(c));
    assert.ok(saved);
    assert.deepEqual(
        saved.worldSalvage.map((item) => item.id),
        ids,
    );
    emergencyKit(saved);
    assert.ok(beginRun(saved, 1));
    const retry = new MissionSimulation(saved, saved.activeRun!.seed);
    try {
        for (const id of ids) assert.ok(retry.salvage.items.has(id));
        assert.equal(retry.salvage.towing.size, 0);
    } finally {
        retry.dispose();
    }
});
