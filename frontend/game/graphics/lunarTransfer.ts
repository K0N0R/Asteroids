import { EARTH_SYSTEM_BODY_SCALE } from '../worlds/celestialBodies';
import { Container, Graphics } from 'pixi.js';
import { label } from '../ui/primitives';
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

export function lunarTransferPose(progress: number, surface: boolean, zoom: number) {
    const t = Math.max(0, Math.min(1, progress));
    const ease = t * t * (3 - 2 * t);
    const approach = surface ? ease : 1 - ease;
    const globeZoom = (126 * EARTH_SYSTEM_BODY_SCALE.moon) / MOON.radius;
    return {
        zoom: globeZoom * (zoom / globeZoom) ** approach,
        pivot: {
            x: MOON.center.x + (MOON.exit.x - MOON.center.x) * approach,
            y: MOON.center.y + (MOON.exit.y - MOON.center.y) * approach,
        },
        detail: Math.min(1, approach * 3),
        pitch: Math.sin(Math.PI * t) ** 2,
    };
}

export class LunarTransferView extends Container {
    private scene = new Graphics();
    private title = label(this, '', 560, 735, 30, C.text, 620);
    private hint = label(
        this,
        'Transfer · sterowanie chwilowo zablokowane',
        560,
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
    update(active: boolean, progress: number, surface: boolean) {
        const g = this.scene.clear();
        this.visible = active;
        if (!this.visible) return;
        this.title.visible = this.hint.visible = true;
        const t = Math.max(0, Math.min(1, progress));
        const opacity = Math.min(1, t * 8, (1 - t) * 8);
        this.title.setText(
            surface ? 'KSIĘŻYC · WEJŚCIE NAD POWIERZCHNIĘ' : 'KSIĘŻYC · POWRÓT NA ORBITĘ',
        );
        this.title.alpha = this.hint.alpha = opacity;
        g.rect(560, 825, 480, 3)
            .fill({ color: C.line, alpha: opacity })
            .rect(560, 825, 480 * t, 3)
            .fill({ color: C.cyan, alpha: opacity });
    }
}
