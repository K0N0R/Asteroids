import { EARTH_SYSTEM_BODY_SCALE } from '../worlds/celestialBodies';
import { Container, Graphics } from 'pixi.js';
import { hudLabel as label } from '../ui/hudIcons';
import { C } from './shapes';
import { MOON } from '../worlds/moon';
import type { Point } from '../worlds/sector';

export function lunarTransferPoint(
    point: Point,
    ship: Point,
    pose: ReturnType<typeof lunarTransferPose> | null,
    zoom: number,
): Point {
    if (!pose) return point;
    const scale = zoom / pose.zoom;
    return {
        x: pose.pivot.x + (point.x - ship.x) * scale,
        y: pose.pivot.y + (point.y - ship.y) * scale,
    };
}

export function lunarTransferPose(
    progress: number,
    surface: boolean,
    zoom: number,
    site: { center: Point; exit: Point; radius: number } = MOON,
) {
    const t = Math.max(0, Math.min(1, progress));
    const ease = t * t * (3 - 2 * t);
    const approach = surface ? ease : 1 - ease;
    const globeZoom = (126 * EARTH_SYSTEM_BODY_SCALE.moon) / site.radius;
    return {
        zoom: globeZoom * (zoom / globeZoom) ** approach,
        pivot: {
            x: site.center.x + (site.exit.x - site.center.x) * approach,
            y: site.center.y + (site.exit.y - site.center.y) * approach,
        },
        detail: Math.min(1, approach * 3),
        pitch: Math.sin(Math.PI * t) ** 2,
    };
}

export class LunarTransferView extends Container {
    private scene = new Graphics();
    private title = label(this, '', 530, 735, 26, C.text, 590);
    private hint = label(
        this,
        'Transfer · sterowanie chwilowo zablokowane',
        530,
        779,
        18,
        C.muted,
        640,
    );
    constructor() {
        super();
        this.addChildAt(this.scene, 0);
        this.eventMode = 'none';
        this.visible = false;
    }
    update(active: boolean, progress: number, surface: boolean, name = 'Księżyc') {
        const g = this.scene.clear();
        this.visible = active;
        if (!this.visible) return;
        this.title.visible = this.hint.visible = true;
        const t = Math.max(0, Math.min(1, progress));
        const opacity = Math.min(1, t * 8, (1 - t) * 8);
        this.title.setText(
            `${name.toUpperCase()} · ${surface ? 'WEJŚCIE NAD POWIERZCHNIĘ' : 'POWRÓT NA ORBITĘ'}`,
        );
        this.title.alpha = this.hint.alpha = opacity;
        // A quiet curved limb, motion streaks and a fade soften the coordinate-space handoff.
        const veil = Math.sin(Math.PI * t) ** 2;
        g.rect(0, 0, 1600, 900).fill({ color: 0x10182b, alpha: veil * 0.18 });
        const horizonY = surface ? 900 - 370 * t : 530 + 370 * t;
        g.ellipse(800, horizonY + 500, 1200, 560).stroke({
            color: 0xb3bfd2,
            alpha: veil * 0.18,
            width: 2,
        });
        for (let i = 0; i < 8; i++) {
            const x = 130 + i * 190,
                direction = surface ? 1 : -1;
            const y = (((i * 127 + t * direction * 700) % 800) + 800) % 800;
            g.moveTo(x, y)
                .lineTo(x + direction * 12, y + direction * 45)
                .stroke({ color: 0xd0dbe7, alpha: veil * 0.1, width: 1 });
        }
        g.roundRect(500, 714, 650, 124, 18).fill({ color: 0x10182b, alpha: opacity * 0.74 });
        g.rect(530, 825, 590, 3)
            .fill({ color: C.line, alpha: opacity })
            .rect(530, 825, 590 * t, 3)
            .fill({ color: C.cyan, alpha: opacity });
    }
}
