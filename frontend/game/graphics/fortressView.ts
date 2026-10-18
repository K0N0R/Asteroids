import { FORTRESS_WALL_HALF_WIDTH } from '../config';
import { Container, Graphics } from 'pixi.js';
import type { generateSector } from '../worlds/sector';

export function fortressView(
    fortress: ReturnType<typeof generateSector>['fortress'],
    destroyed: ReadonlySet<number> = new Set(),
) {
    const view = new Container(),
        walls = new Graphics(),
        core = new Graphics();
    for (const [index, wall] of fortress.walls.entries()) {
        if (destroyed.has(index)) continue;
        const ax = wall.from.x - fortress.x,
            ay = wall.from.y - fortress.y;
        const bx = wall.to.x - fortress.x,
            by = wall.to.y - fortress.y;
        walls
            .beginPath()
            .moveTo(ax, ay)
            .lineTo(bx, by)
            .stroke({ color: 0x263a47, width: FORTRESS_WALL_HALF_WIDTH * 2 + 8 })
            .stroke({ color: 0x758997, width: FORTRESS_WALL_HALF_WIDTH * 2 })
            .stroke({ color: 0x455966, width: FORTRESS_WALL_HALF_WIDTH * 2 - 12 })
            .stroke({ color: 0xb87963, width: 2, alpha: 0.6 });
        for (let t = 0; t < 1; t += 0.125) {
            const x = ax + (bx - ax) * t,
                y = ay + (by - ay) * t;
            walls.roundRect(x - 16, y - 16, 32, 32, 5).fill(0x334957);
            walls.circle(x, y, 3).fill(0xc67f63);
        }
    }
    // Reinforced red beacons distinguish the open edge from solid walls.
    for (const wall of [fortress.walls[0], fortress.walls[1]]) {
        const p = wall === fortress.walls[0] ? wall.to : wall.from;
        const x = p.x - fortress.x,
            y = p.y - fortress.y;
        walls
            .roundRect(x - 22, y - 22, 44, 44, 8)
            .fill(0x516471)
            .circle(x, y, 12)
            .fill({ color: 0xe18b66, alpha: 0.15 })
            .circle(x, y, 5)
            .fill(0xe18b66);
    }
    core.circle(0, 0, 101).fill(0x263b48).circle(0, 0, 88).fill(0x566b79);
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
            x = Math.cos(a) * 68,
            y = Math.sin(a) * 68;
        core.roundRect(x - 12, y - 12, 24, 24, 5)
            .fill(0x354b59)
            .circle(x, y, 3)
            .fill(0xc9876c);
    }
    core.circle(0, 0, 44)
        .fill(0x223a4c)
        .ellipse(0, -5, 31, 25)
        .fill(0x87afc4)
        .ellipse(-10, -14, 12, 6)
        .fill({ color: 0xe4f5fc, alpha: 0.65 })
        .roundRect(-18, 29, 36, 6, 3)
        .fill(0xc9876c);
    view.addChild(walls, core);
    return view;
}
