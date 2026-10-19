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
        // Schematic connected fragment: each internal oxygen bridges two silicon sites.
        for (const y of [-42, 42])
            for (const x of [-42, 42]) {
                g.moveTo(x, y)
                    .lineTo(-x, y)
                    .moveTo(x, y)
                    .lineTo(x, -y)
                    .stroke({ color: 0x677c9a, width: 5 });
            }
        for (const y of [-42, 42]) for (const x of [-42, 42]) atom(x, y, 'Si', color, 22);
        for (const y of [-42, 42]) atom(0, y, 'O', RESOURCES.oxygen.color, 18);
        for (const x of [-42, 42]) atom(x, 0, 'O', RESOURCES.oxygen.color, 18);
    } else if (['steel', 'aluminiumAlloy', 'pureCopper', 'pureSilicon'].includes(id)) {
        // A fragment of extended structure, not an isolated fake molecule.
        for (let y = 0; y < 3; y++)
            for (let x = 0; x < 3; x++) {
                const px = (x - 1) * 42,
                    py = (y - 1) * 38;
                if (x < 2)
                    g.moveTo(px, py)
                        .lineTo(px + 42, py)
                        .stroke({ color: 0x677c9a, width: 5 });
                if (y < 2)
                    g.moveTo(px, py)
                        .lineTo(px, py + 38)
                        .stroke({ color: 0x677c9a, width: 5 });
                const symbol =
                    id === 'pureCopper'
                        ? 'Cu'
                        : id === 'pureSilicon'
                          ? 'Si'
                          : id === 'steel'
                            ? 'Fe'
                            : id === 'aluminiumAlloy'
                              ? x === 1 && y === 1
                                  ? 'Mg'
                                  : 'Al'
                              : 'Si';
                atom(px, py, symbol, color, 17);
            }
        if (id === 'steel') atom(-21, -19, 'C', RESOURCES.carbon.color, 12);
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
