import { Container, Graphics } from 'pixi.js';
import { label } from '../ui/primitives';
import { C } from './shapes';

/** Screen-space horizon masks the coordinate change and dissolves into the destination. */
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
    update(active: boolean, progress: number, surface: boolean, charging: number) {
        const g = this.scene.clear();
        this.visible = active || charging > 0;
        if (!this.visible) return;
        if (!active) {
            g.rect(0, 0, 1600, 900).fill({ color: C.ink, alpha: charging });
            this.title.visible = this.hint.visible = false;
            return;
        }
        this.title.visible = this.hint.visible = true;
        const t = Math.max(0, Math.min(1, progress));
        const ease = t * t * (3 - 2 * t);
        const opacity = 1 - ease;
        g.rect(0, 0, 1600, 900).fill({ color: C.ink, alpha: opacity });
        const radius = surface ? 1100 + ease * 1800 : 1100 - ease * 800;
        const y = surface ? 1250 + ease * 1700 : 1250 - ease * 720;
        g.circle(800, y, radius + 12).fill({ color: 0x728995, alpha: opacity * 0.3 });
        g.circle(800, y, radius).fill({ color: 0x343f48, alpha: opacity });
        for (let i = 0; i < 14; i++) {
            const a = i * 2.4,
                r = radius * (0.2 + (i % 4) * 0.14);
            g.circle(
                800 + Math.cos(a) * r,
                y + Math.sin(a) * r,
                radius * (0.025 + (i % 3) * 0.02),
            ).fill({ color: 0x26333d, alpha: opacity });
        }
        g.rect(0, 0, 1600, 70)
            .rect(0, 700, 1600, 200)
            .fill({ color: C.ink, alpha: opacity * 0.8 });
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
