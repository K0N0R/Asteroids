import { Container, Graphics } from 'pixi.js';
import { label } from '../ui/primitives';
import { C } from './shapes';
import { planetView } from './planetView';

/** Screen-space horizon masks the coordinate change and dissolves into the destination. */
export class LunarTransferView extends Container {
    private scene = new Graphics();
    private moon = planetView('lunar');
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
        this.moon.cacheAsTexture(false);
        this.addChildAt(this.moon, 1);
        this.eventMode = 'none';
        this.visible = false;
    }
    update(active: boolean, progress: number, surface: boolean, charging: number) {
        const g = this.scene.clear();
        this.visible = active || charging > 0;
        this.moon.visible = active;
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
        const approach = surface ? ease : 1 - ease;
        this.moon.position.set(800, 450 + approach * 500);
        this.moon.scale.set(0.95 + approach * approach * 32);
        this.moon.alpha =
            (0.38 + 0.62 * approach) *
            (surface ? Math.min(1, (1 - t) / 0.22) : Math.min(1, (1 - t) / 0.15));
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
