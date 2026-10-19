import { ShapeLibrary } from '../frontend/game/graphics/shapes';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import {
    mineralDeposit,
    mineralSample,
    MINERAL_SCAN_RANGE,
    type MineralDeposit,
} from '../frontend/game/worlds/mineralDeposits';
import {
    ELEMENT_IDS,
    RESOURCE_IDS,
    resourceTotal,
    type ResourceStore,
} from '../frontend/game/state/resources';
import { MissionSimulation, type Rock } from '../frontend/game/systems/mission';
import { beginRun, newCampaign } from '../frontend/game/state/campaign';
import { generateSector } from '../frontend/game/worlds/sector';

before(async () => RAPIER.init());
function add(to: ResourceStore, from: Readonly<ResourceStore>) {
    for (const id of RESOURCE_IDS) if (from[id]) to[id] = (to[id] ?? 0) + from[id]!;
}
function finalYield(deposit: MineralDeposit): ResourceStore {
    const result = { ...deposit.loose };
    for (const child of deposit.fragments) add(result, finalYield(child.deposit));
    return result;
}
function simulation() {
    const c = newCampaign();
    beginRun(c, 71);
    const s = new MissionSimulation(c, 71);
    s.grippers.enabled = false;
    return s;
}
const access = (s: MissionSimulation) =>
    s as unknown as { breakRock: (rock: Rock, limit?: number) => void };
function liveYield(s: MissionSimulation) {
    const result: ResourceStore = {};
    for (const item of s.loot.values()) result[item.kind] = (result[item.kind] ?? 0) + item.amount;
    return result;
}

test('every generated rock has a deterministic elemental budget matching all fracture descendants', () => {
    for (let variant = 0; variant < 128; variant++)
        for (const radius of [16, 32, 44, 44.1, 76, 120, 240])
            for (const crystal of [false, true]) {
                const spec = { radius, variant, rich: true, crystal };
                const d = mineralDeposit(spec);
                assert.deepEqual(d, mineralDeposit(spec));
                assert.deepEqual(d.total, finalYield(d));
                for (const id of RESOURCE_IDS)
                    if (d.total[id]) {
                        assert.ok(ELEMENT_IDS.some((element) => element === id));
                        assert.ok(Number.isSafeInteger(d.total[id]) && d.total[id]! > 0);
                    }
            }
});
test('silicon and hydrogen appear in silicon deposits; defensive threats produce no resources', () => {
    const d = mineralDeposit({ radius: 32, variant: 12, rich: true, crystal: true });
    assert.equal(d.total.crystals, 1);
    assert.equal(d.total.hydrogen, 3);
    assert.equal(d.total.parts, undefined);
    assert.equal(
        resourceTotal(mineralDeposit({ radius: 76, variant: 12, rich: true, defense: true }).total),
        0,
    );
});
test('the existing sector sources cover all nine basic elements before adding later-act materials', () => {
    const found = new Set<string>();
    for (let seed = 0; seed < 10; seed++)
        for (const rock of generateSector(seed).rocks)
            for (const id of ELEMENT_IDS) if (mineralDeposit(rock).total[id]) found.add(id);
    for (const id of ELEMENT_IDS.filter((id) => id !== 'mercuryOre')) assert.ok(found.has(id), id);
});
test('instructor samples are limited to two iron portions and preserve all unmined minerals', () => {
    const deposit = mineralDeposit({ radius: 76, variant: 12, rich: true, copper: true });
    const sample = mineralSample(deposit, 2);
    assert.equal(sample.count, 2);
    const combined = { ...sample.rest.total };
    combined.ore = (combined.ore ?? 0) + sample.count;
    assert.deepEqual(combined, deposit.total);
    assert.equal(sample.rest.fragments.length, 0);
    assert.ok(Object.isFrozen(deposit.total));
});
test('breaking a live rock tree releases exactly the scanned budget and cannot be repeated', () => {
    const s = simulation();
    try {
        const root = [...s.rocks.values()].find((r) => r.radius > 60 && !r.defense)!;
        assert.ok(root);
        for (const rock of [...s.rocks.values()])
            if (rock !== root) {
                s.world.removeRigidBody(rock.body);
                s.rocks.delete(rock.id);
            }
        const expected = root.deposit.total;
        let rounds = 0;
        while (s.rocks.size && rounds++ < 20)
            for (const rock of [...s.rocks.values()]) access(s).breakRock(rock);
        assert.equal(s.rocks.size, 0);
        assert.deepEqual(liveYield(s), expected);
        access(s).breakRock(root);
        assert.deepEqual(liveYield(s), expected);
    } finally {
        s.dispose();
    }
});
test('instructor extraction keeps the remaining mineral budget in a real fragment', () => {
    const s = simulation();
    try {
        const root = [...s.rocks.values()].find((r) => r.radius > 60 && !r.crystal && !r.defense)!;
        for (const rock of [...s.rocks.values()])
            if (rock !== root) {
                s.world.removeRigidBody(rock.body);
                s.rocks.delete(rock.id);
            }
        const expected = root.deposit.total;
        access(s).breakRock(root, 2);
        assert.equal(liveYield(s).ore, 2);
        assert.equal(s.rocks.size, 1);
        for (const rock of [...s.rocks.values()]) access(s).breakRock(rock);
        assert.deepEqual(liveYield(s), expected);
    } finally {
        s.dispose();
    }
});
test('sensor only reveals a local rock under the cursor and clears after destruction', () => {
    const s = simulation();
    try {
        const root = [...s.rocks.values()].find((r) => !r.surface)!;
        s.ship.setTranslation({ x: 30, y: 0 }, true);
        root.body.setTranslation({ x: 33, y: 0 }, true);
        s.aimTarget = { x: 3300, y: 0 };
        assert.equal(s.mineralTarget?.id, root.id);
        s.aimTarget = { x: 3300, y: root.radius + 20 };
        assert.notEqual(s.mineralTarget?.id, root.id);
        root.body.setTranslation(
            { x: (3000 + MINERAL_SCAN_RANGE + root.radius + 1) / 100, y: 0 },
            true,
        );
        s.aimTarget = { x: root.body.translation().x * 100, y: 0 };
        assert.notEqual(s.mineralTarget?.id, root.id);
        root.body.setTranslation({ x: 33, y: 0 }, true);
        s.aimTarget = { x: 3300, y: 0 };
        access(s).breakRock(root);
        assert.notEqual(s.mineralTarget?.id, root.id);
    } finally {
        s.dispose();
    }
});
test('crowded loot does not discard a destroyed deposit', () => {
    const s = simulation();
    try {
        const root = [...s.rocks.values()].find((r) => r.radius <= 44 && r.crystal)!;
        for (let id = 100000; id < 100400; id++)
            s.loot.set(id, { id, x: -9000, y: -9000, kind: 'parts', amount: 1 });
        access(s).breakRock(root);
        const recovered = liveYield(s);
        delete recovered.parts;
        assert.deepEqual(recovered, root.deposit.total);
    } finally {
        s.dispose();
    }
});

test('a full physics pool releases the unspawned fragment budget without duplication', () => {
    const s = simulation();
    try {
        const root = [...s.rocks.values()].find((r) => r.radius > 60 && !r.defense)!;
        const spawn = s as unknown as {
            addRock: (spec: {
                x: number;
                y: number;
                radius: number;
                variant: number;
                rich: boolean;
                vx: number;
                vy: number;
            }) => Rock | undefined;
        };
        for (let i = 0; s.rocks.size < 600 && i < 1000; i++)
            spawn.addRock({
                x: 10000 + i * 30,
                y: 10000,
                radius: 6,
                variant: 0,
                rich: false,
                vx: 5,
                vy: 0,
            });
        assert.equal(s.rocks.size, 600);
        const previous = new Set(s.rocks.keys());
        access(s).breakRock(root);
        assert.ok(s.rocks.size <= 600);
        const recovered = liveYield(s);
        for (const rock of s.rocks.values())
            if (!previous.has(rock.id)) add(recovered, rock.deposit.total);
        assert.deepEqual(recovered, root.deposit.total);
    } finally {
        s.dispose();
    }
});

test('asteroid artwork cache distinguishes actual elements for identical geometry and sample fragments', () => {
    const shapes = new ShapeLibrary();
    try {
        const iron = shapes.rock(17, true, false, { ore: 3 });
        const copper = shapes.rock(17, true, false, { ore: 3, copperOre: 1 });
        const sameKinds = shapes.rock(17, true, false, { ore: 300 });
        const ground = shapes.lunarRock(17, true, false, { ore: 3 });
        const groundCopper = shapes.lunarRock(17, true, false, { copperOre: 1 });
        assert.notEqual(iron.context, copper.context);
        assert.equal(iron.context, sameKinds.context);
        assert.notEqual(ground.context, groundCopper.context);
        assert.notEqual(iron.context, ground.context);
        for (const view of [iron, copper, sameKinds, ground, groundCopper]) view.destroy();
    } finally {
        shapes.dispose();
    }
});
