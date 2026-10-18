import { Graphics } from 'pixi.js';
import { HARPOON_ARMS, type HarpoonArmPose } from '../systems/harpoonArms';
import { rotateVector } from '../systems/flight';

export function drawHarpoonArms(
    graphics: Graphics,
    poses: readonly HarpoonArmPose[],
    handling = 0,
    power = 0,
) {
    graphics.clear();
    for (const pose of poses) {
        for (const [from, to] of [
            [pose.shoulder, pose.elbow],
            [pose.elbow, pose.tip],
        ]) {
            graphics
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: 0x293840, width: 9 + handling });
            graphics
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: 0x879ca1, width: 5 + handling * 0.8 });
            graphics
                .moveTo(from.x + 1, from.y - 1)
                .lineTo(to.x + 1, to.y - 1)
                .stroke({ color: 0xb4c6c7, width: 1 });
        }
        for (const joint of [pose.shoulder, pose.elbow, pose.tip]) {
            graphics.circle(joint.x, joint.y, 5 + handling * 0.7).fill(0x293840);
            graphics.circle(joint.x, joint.y, 3.4).fill(0xb58e4b);
            graphics.circle(joint.x, joint.y, 1).fill(0xd6bc83);
        }
        const gap =
            HARPOON_ARMS.jawOpen - pose.closure * (HARPOON_ARMS.jawOpen - HARPOON_ARMS.jawClosed);
        for (const side of [-1, 1]) {
            const points = [
                [-7, side * 4],
                [4, side * gap],
                [14 + power * 2, side * (gap * 0.55)],
                [15 + power * 2, side * (gap * 0.55 - 3)],
            ].flatMap(([x, y]) => {
                const offset = rotateVector({ x, y }, pose.angle);
                return [pose.tip.x + offset.x, pose.tip.y + offset.y];
            });
            graphics.poly(points).stroke({ color: 0x283840, width: 5 + handling * 0.8 });
            graphics.poly(points).stroke({ color: 0xc3cdca, width: 2.5 + power * 0.6 });
        }
    }
}
