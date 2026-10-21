import { GameSettings } from '../frontend/core/systems/gameSettings';
GameSettings.soundEnabled = false;
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from 'pixi.js';
import { Button } from '../frontend/core/containers/components/button';
import { destroyDisplayTree } from '../frontend/core/systems/destroyDisplayTree';
import {
    hangarScreen,
    newHangarState,
    moduleOffer,
    variantStats,
} from '../frontend/game/ui/hangar';
import { newCampaign, newShip } from '../frontend/game/state/campaign';
import { RESOURCE_IDS, type ResourceId } from '../frontend/game/state/resources';
import { HULLS, ARMAMENT_KITS, type HullId, type WeaponId } from '../frontend/game/config';
import { moduleParts } from '../frontend/game/state/equipmentCosts';
import { MODULE_KEYS } from '../frontend/game/ui/modulePreview';
import { RECIPES, type RecipeId } from '../frontend/game/state/chemistry';

function walk(root: Container): Container[] {
    return [root, ...root.children.flatMap((child) => walk(child))];
}
function ready() {
    const c = newCampaign();
    c.station.workshop = 2;
    for (const id of RESOURCE_IDS) c.bank[id] = 1000;
    return c;
}
function setup(project = false) {
    const c = ready(),
        state = newHangarState(),
        ui = new Container();
    state.shipId = c.ship!.id;
    const calls = {
        refresh: 0,
        buy: 0,
        upgrade: 0,
        variant: 0,
        selected: 0,
        recipes: [] as RecipeId[],
    };
    const actions = {
        refresh: () => {
            calls.refresh++;
        },
        openRecipe: (id: RecipeId) => calls.recipes.push(id),
        openStation: () => {},
        openFleet: () => {},
        buyShip: () => {
            calls.buy++;
        },
        selectShip: () => {
            calls.selected++;
        },
        scrapShip: () => {},
        upgrade: () => {
            calls.upgrade++;
        },
        equipWeapon: () => {
            calls.variant++;
        },
    };
    const render = () => {
        for (const child of ui.removeChildren()) destroyDisplayTree(child);
        hangarScreen(ui, c, state, project, actions);
    };
    return { c, state, ui, calls, render };
}
function click(root: Container, name: string) {
    const target = walk(root).find((child) => child.label === name)!;
    assert.ok(target, name);
    if (target instanceof Button) target.config.onClick();
    else target.emit('pointertap');
}

test('all hull-specific module offers use real tier costs, compare the next level and leave the campaign untouched', () => {
    const c = ready();
    for (const hull of Object.keys(HULLS) as HullId[])
        for (const key of MODULE_KEYS)
            for (const level of [0, 1, 2, 3]) {
                c.ship = newShip(1, hull);
                c.ship[key] = level;
                const before = structuredClone(c);
                const offer = moduleOffer(c, c.ship, key);
                assert.equal(offer.next, Math.min(3, level + 1));
                assert.deepEqual(offer.cost, level === 3 ? {} : moduleParts(key, level));
                assert.equal(!!offer.reason, level === 3);
                assert.deepEqual(c, before);
            }
});

test('every hull preview fits below the tier selector and above the parts list', () => {
    const t = setup(true);
    t.state.tab = 'upgrades';
    try {
        for (const hull of Object.keys(HULLS) as HullId[])
            for (const key of MODULE_KEYS)
                for (const level of [1, 2, 3]) {
                    t.state.hull = hull;
                    t.state.module = key;
                    t.state.previewLevel = level;
                    t.render();
                    const art = walk(t.ui).find((child) => child.label === 'module-ship-preview')!;
                    const local = art.getLocalBounds();
                    art.updateLocalTransform();
                    const corners = [
                        { x: local.minX, y: local.minY },
                        { x: local.maxX, y: local.minY },
                        { x: local.minX, y: local.maxY },
                        { x: local.maxX, y: local.maxY },
                    ].map((point) => art.localTransform.apply(point));
                    const bounds = {
                        minX: Math.min(...corners.map((point) => point.x)),
                        maxX: Math.max(...corners.map((point) => point.x)),
                        minY: Math.min(...corners.map((point) => point.y)),
                        maxY: Math.max(...corners.map((point) => point.y)),
                    };
                    const context = JSON.stringify({ hull, key, level, bounds });
                    assert.ok(bounds.minY >= 493 - 0.01, context);
                    assert.ok(bounds.maxY <= 595 + 0.01, context);
                    assert.ok(bounds.minX >= 1360 - 0.01, context);
                    assert.ok(bounds.maxX <= 1530 + 0.01, context);
                }
    } finally {
        destroyDisplayTree(t.ui);
    }
});

test('six module tabs show one offer; activation, facility, missing parts and maximum level block a purchase', () => {
    const t = setup();
    t.state.tab = 'upgrades';
    try {
        t.render();
        assert.equal(
            walk(t.ui).filter((child) => child.label?.startsWith('module-tab:')).length,
            6,
        );
        assert.equal(
            walk(t.ui).some((child) => child.label === 'hangar-build'),
            false,
        );
        click(t.ui, 'module-tab:armor');
        assert.equal(t.state.module, 'armor');
        t.render();
        click(t.ui, 'hangar-upgrade');
        assert.equal(t.calls.upgrade, 1);
        t.c.bank = { ore: 0, parts: 0 };
        t.render();
        click(t.ui, 'hangar-upgrade');
        assert.equal(t.calls.upgrade, 1);
        t.c.ship!.armor = 1;
        t.c.station.workshop = 0;
        assert.match(moduleOffer(t.c, t.c.ship!, 'armor').reason!, /zaplecze/);
        t.c.ship!.armor = 3;
        t.render();
        click(t.ui, 'hangar-upgrade');
        assert.equal(t.calls.upgrade, 1);
        const reserve = newShip(2);
        assert.match(moduleOffer(t.c, reserve, 'engine').reason!, /aktywny/);
    } finally {
        destroyDisplayTree(t.ui);
    }
});

test('project module and variant previews never purchase or mutate owned ships', () => {
    const t = setup(true);
    const before = structuredClone(t.c);
    try {
        for (const tab of ['stats', 'upgrades', 'variants'] as const) {
            t.state.tab = tab;
            t.state.previewLevel = 3;
            t.render();
            assert.equal(
                walk(t.ui).some((child) =>
                    ['hangar-build', 'hangar-upgrade', 'hangar-variant'].includes(child.label),
                ),
                false,
            );
            assert.deepEqual(t.c, before);
        }
        assert.deepEqual([t.calls.buy, t.calls.upgrade, t.calls.variant], [0, 0, 0]);
    } finally {
        destroyDisplayTree(t.ui);
    }
});

test('all six construction requirements link to the recipe for that exact tier, preserving project selection', () => {
    const t = setup(true);
    t.state.hull = 'widmo';
    t.state.tab = 'construction';
    try {
        t.render();
        const links = walk(t.ui).filter((child) => child.label?.startsWith('craft:'));
        assert.equal(links.length, 6);
        for (const link of links) {
            const resource = link.label.slice(6) as ResourceId;
            click(t.ui, link.label);
            assert.equal(RECIPES[t.calls.recipes.at(-1)!].output, resource);
        }
        assert.equal(t.state.hull, 'widmo');
        assert.equal(t.state.tab, 'construction');
        assert.equal(
            walk(t.ui).some((child) => child.label === 'hangar-build'),
            true,
        );
    } finally {
        destroyDisplayTree(t.ui);
    }
});

test('variants expose the three real directions and cannot modify a different active ship', () => {
    const t = setup();
    t.state.tab = 'variants';
    try {
        t.render();
        click(t.ui, 'variant-tab:rail');
        t.render();
        click(t.ui, 'hangar-variant');
        assert.equal(t.calls.variant, 1);
        const reserve = newShip(2, 'mule');
        t.c.reserveShips.push(reserve);
        t.state.shipId = 2;
        t.render();
        assert.equal(
            walk(t.ui).some((child) => child.label === 'hangar-variant'),
            false,
        );
        assert.equal(t.calls.variant, 1);
        for (const id of ['standard', 'pulse', 'rail'] as WeaponId[]) {
            const stats = variantStats(reserve, id);
            assert.ok(stats.special);
            assert.ok(stats.metrics.includes(`×${ARMAMENT_KITS[id].range}`));
        }
    } finally {
        destroyDisplayTree(t.ui);
    }
});
