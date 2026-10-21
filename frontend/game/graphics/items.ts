import { partInfo } from '../state/partTiers';
import { advancedPartIllustration } from './tierParts';
import { Container, Graphics } from 'pixi.js';
import { ELEMENT_IDS, RESOURCES, type ResourceId } from '../state/resources';
import { label } from '../ui/primitives';

/** Shared, code-native artwork for inventory, recipes and world transfers. */
export function itemIllustration(id: ResourceId | 'kit') {
    const info = partInfo(id);
    if (id !== 'kit' && info && info.tier > 1)
        return advancedPartIllustration(id, info.family, info.tier);
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
    } else if (id === 'conductors') {
        // Exposed copper cable coil, distinct from an assembled circuit board.
        g.roundRect(-62, -32, 20, 64, 7).fill(0x596c88);
        g.roundRect(42, -32, 20, 64, 7).fill(0x596c88);
        for (let i = 0; i < 5; i++)
            g.ellipse(-32 + i * 16, 0, 13, 34).stroke({ color: 0xe6a16d, width: 9 });
        g.moveTo(56, 0).lineTo(76, 0).lineTo(76, 27).stroke({ color: 0xe6a16d, width: 7 });
    } else if (id === 'electronics') {
        g.roundRect(-60, -43, 120, 86, 17).fill(0x328b88);
        for (let i = 0; i < 4; i++) {
            g.roundRect(-47, -28 + i * 17, 94, 7, 3).fill(0xe8bf80);
        }
        g.roundRect(-20, -22, 40, 44, 8).fill(0x263654);
        g.circle(39, 27, 7).fill(0x8ee7d3);
    } else if (id === 'storageFrames') {
        const gear = (x: number, y: number, radius: number, teeth: number) => {
            const points = Array.from({ length: teeth * 4 }, (_, i) => {
                const angle = (i * Math.PI * 2) / (teeth * 4);
                const r = radius * (i % 4 === 1 || i % 4 === 2 ? 1 : 0.76);
                return [x + Math.cos(angle) * r, y + Math.sin(angle) * r];
            }).flat();
            g.poly(points).fill(color).stroke({ color: 0x536985, width: 4 });
            g.circle(x, y, radius * 0.35).fill(0x263654);
            g.circle(x, y, radius * 0.15).fill(0xeac28b);
        };
        gear(-20, 14, 42, 8);
        gear(34, -24, 28, 6);
    } else if (id === 'propulsion') {
        g.poly([-25, 30, 0, 76, 25, 30]).fill(0x63d7ef);
        g.poly([-12, 30, 0, 58, 12, 30]).fill(0xffe6a3);
        g.roundRect(-30, -55, 60, 43, 12).fill(0x718ba2);
        for (const y of [-46, -34, -22]) g.roundRect(-35, y, 70, 6, 3).fill(0xb6c8d5);
        g.rect(-17, -14, 34, 14).fill(0xeac28b);
        g.poly([-18, -6, 18, -6, 40, 32, -40, 32])
            .fill(0x384d70)
            .stroke({ color: 0x9eb6cc, width: 6 });
        g.ellipse(0, 32, 37, 9).fill(0x172139).stroke({ color: 0x83dbea, width: 5 });
    } else if (id === 'kineticModules') {
        // Shield generator: armored hexagon with a central energy core.
        g.poly([-55, -25, 0, -55, 55, -25, 55, 25, 0, 55, -55, 25])
            .fill(0x455d85)
            .stroke({ color: 0x91b8f6, width: 7 });
        g.circle(0, 0, 27).fill(0x172139).stroke({ color: 0x7fdef1, width: 6 });
        g.circle(0, 0, 13).fill(0xc1eff7);
        for (const x of [-43, 43]) g.roundRect(x - 7, -15, 14, 30, 5).fill(0xe5bd6d);
    } else if (id === 'powerModules') {
        for (const x of [-25, 13]) g.roundRect(x, -55, 15, 16, 4).fill(0xe8bf80);
        g.roundRect(-43, -42, 86, 94, 14).fill(0x263654).stroke({ color, width: 7 });
        g.poly([-1, -27, -24, 7, -6, 7, -15, 35, 25, -7, 7, -7, 18, -27]).fill(0xffce78);
    } else if (id === 'lifeSupport') {
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
