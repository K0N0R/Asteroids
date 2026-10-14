import { Graphics } from 'pixi.js';
import type { HarpoonArmPose } from '../systems/harpoonArms';
import { rotateVector } from '../systems/flight';

export function drawHarpoonArms(graphics: Graphics, poses: readonly HarpoonArmPose[]) {
    graphics.clear();
    for (const pose of poses) {
        for (const [from, to] of [
            [pose.shoulder, pose.elbow],
            [pose.elbow, pose.tip],
        ]) {
            graphics
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: 0x293840, width: 9 });
            graphics
                .moveTo(from.x, from.y)
                .lineTo(to.x, to.y)
                .stroke({ color: 0x879ca1, width: 5 });
            graphics
                .moveTo(from.x + 1, from.y - 1)
                .lineTo(to.x + 1, to.y - 1)
                .stroke({ color: 0xb4c6c7, width: 1 });
        }
        for (const joint of [pose.shoulder, pose.elbow, pose.tip]) {
            graphics
                .circle(joint.x, joint.y, 5)
                .fill(0x293840)
                .stroke({ color: 0xa9b8b8, width: 1 });
            graphics.circle(joint.x, joint.y, 3.4).fill(0xb58e4b);
            graphics.circle(joint.x, joint.y, 1).fill(0xd6bc83);
        }
        const direction =
            pose.tip.x < 0 && Math.abs(pose.tip.y) < 40
                ? Math.atan2(pose.tip.y - pose.elbow.y, pose.tip.x - pose.elbow.x)
                : pose.angle;
        const gap = 12 - pose.closure * 10;
        for (const side of [-1, 1]) {
            const points = [
                [-7, side * 4],
                [4, side * gap],
                [14, side * (gap * 0.55)],
                [15, side * (gap * 0.55 - 3)],
            ].flatMap(([x, y]) => {
                const offset = rotateVector({ x, y }, direction);
                return [pose.tip.x + offset.x, pose.tip.y + offset.y];
            });
            graphics.poly(points).stroke({ color: 0x283840, width: 5 });
            graphics.poly(points).stroke({ color: 0xc3cdca, width: 2.5 });
        }
    }
}
