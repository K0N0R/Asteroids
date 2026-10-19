import { Container, Graphics } from 'pixi.js';
import { ELEMENT_IDS, RESOURCES, type ResourceId } from '../state/resources';
import { label } from '../ui/primitives';

/** Shared, code-native artwork for inventory, recipes and world transfers. */
export function itemIllustration(id: ResourceId | 'kit') {
    const root = new Container(),
        g = new Graphics();
    root.addChild(g);
    const color = id === 'kit' ? 0x8edabc : RESOURCES[id].color;
    const atom = (x: number, y: number, symbol: string, c: number, r = 25) => {
        g.circle(x, y, r).fill(c);
        const text = label(root, symbol, x, y, 19, 0x172139);
        text.setHorizontalAlign('center');
        text.y -= 9;
    };
    if (id !== 'kit' && ELEMENT_IDS.some((element) => element === id)) {
        atom(0, 0, RESOURCES[id].short, color, 43);
    } else if (id === 'water') {
        g.moveTo(-48, 31).lineTo(0, -7).lineTo(48, 31).stroke({ color: 0xabc6da, width: 12 });
        atom(0, -7, 'O', RESOURCES.oxygen.color, 30);
        atom(-48, 31, 'H', RESOURCES.hydrogen.color, 22);
        atom(48, 31, 'H', RESOURCES.hydrogen.color, 22);
    } else if (id === 'oxygenGas') {
        g.roundRect(-32, -5, 64, 10, 5).fill(0xabc6da);
        atom(-29, 0, 'O', color);
        atom(29, 0, 'O', color);
    } else if (id === 'silica') {
        g.moveTo(-94, 0).lineTo(94, 0).stroke({ color: 0xabc6da, width: 7 });
        atom(0, 0, 'Si', RESOURCES.crystals.color, 24);
        atom(-55, 0, 'O', RESOURCES.oxygen.color, 24);
        atom(55, 0, 'O', RESOURCES.oxygen.color, 24);
        for (const x of [-105, 105]) {
            const dots = label(root, '…', x, -13, 22, 0xabc6da);
            dots.setHorizontalAlign('center');
        }
    } else if (id === 'steel' || id === 'aluminiumAlloy') {
        const metal = id === 'steel' ? 'ore' : 'aluminium';
        const additive = id === 'steel' ? 'carbon' : 'magnesium';
        g.moveTo(-35, -35)
            .lineTo(35, -35)
            .lineTo(35, 35)
            .lineTo(-35, 35)
            .closePath()
            .stroke({ color: 0xabc6da, width: 7 });
        for (const x of [-35, 35])
            for (const y of [-35, 35])
                atom(x, y, RESOURCES[metal].short, RESOURCES[metal].color, 24);
        atom(0, 0, RESOURCES[additive].short, RESOURCES[additive].color, id === 'steel' ? 13 : 24);
    } else if (id === 'pureCopper' || id === 'pureSilicon') {
        const element = id === 'pureCopper' ? 'copperOre' : 'crystals';
        atom(0, 0, RESOURCES[element].short, RESOURCES[element].color, 43);
        g.roundRect(18, -29, 12, 5, 2.5).fill(0xf5fafb);
    } else if (id === 'electronics' || id === 'conductors') {
        g.roundRect(-60, -43, 120, 86, 17).fill(0x328b88);
        for (let i = 0; i < 4; i++) {
            g.roundRect(-47, -28 + i * 17, 94, 7, 3).fill(0xe8bf80);
        }
        g.roundRect(-20, -22, 40, 44, 8).fill(0x263654);
        g.circle(39, 27, 7).fill(0x8ee7d3);
    } else if (id === 'storageFrames' || id === 'propulsion') {
        g.roundRect(-60, -28, 95, 56, 19).fill(color);
        for (let i = 0; i < 5; i++) g.roundRect(-45 + i * 16, -35, 9, 70, 4).fill(0x718ba2);
        g.roundRect(23, -38, 38, 76, 15).fill(0x384d70);
        g.roundRect(39, -25, 19, 50, 9).fill(id === 'propulsion' ? 0x7ee3f4 : 0xeac28b);
    } else if (id === 'lifeSupport' || id === 'powerModules' || id === 'kineticModules') {
        for (const x of [-30, 30]) {
            g.roundRect(x - 21, -49, 42, 98, 20).fill(color);
            g.roundRect(x - 15, -25, 30, 38, 12).fill(0x344765);
            g.roundRect(x - 11, -19, 22, 26, 8).fill(0x89e2e4);
        }
        g.roundRect(-50, 25, 100, 14, 7).fill(0x758ca4);
    } else if (id === 'kit') {
        g.roundRect(-57, -40, 114, 82, 18).fill(color);
        g.roundRect(-25, -56, 50, 16, 7).fill(0x8da5b9);
        g.roundRect(-8, -23, 16, 46, 5).roundRect(-23, -8, 46, 16, 5).fill(0xe7f7ef);
    } else {
        for (let i = 2; i >= 0; i--)
            g.roundRect(-55 + i * 9, -36 - i * 7, 100, 68, 18).fill({ color, alpha: 1 - i * 0.2 });
        g.roundRect(-36, -17, 60, 10, 5).fill(0xe2ebf2);
    }
    return root;
}

/** Uncombined ingredients for one batch; output art is rendered separately. */
export function ingredientIllustration(inputs: import('../state/resources').ResourceStore) {
    const root = new Container();
    const items = Object.entries(inputs).flatMap(([id, count]) =>
        Array.from({ length: count }, () => id as ResourceId),
    );
    const columns = Math.min(4, items.length),
        rows = Math.ceil(items.length / columns);
    items.forEach((id, i) => {
        const art = itemIllustration(id);
        const size = Math.max(art.width, art.height, 1);
        art.scale.set(64 / size);
        art.position.set(
            ((i % columns) - (columns - 1) / 2) * 82,
            (Math.floor(i / columns) - (rows - 1) / 2) * 82,
        );
        root.addChild(art);
    });
    return root;
}
