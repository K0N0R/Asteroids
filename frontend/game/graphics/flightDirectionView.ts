import { Container, Graphics } from 'pixi.js';
import type { FlightDirection } from '../systems/flightDirection';
import { hudLabel as label } from '../ui/hudIcons';
import { C } from './theme';

/** Cinematic bars only. Crew messages share the persistent, nonblocking radio inbox. */
export class FlightDirectionView extends Container {
    private ink = new Graphics();
    private caption = label(this, '', 580, 780, 22, C.text);
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChildAt(this.ink, 0);
    }
    update(direction: FlightDirection) {
        const g = this.ink.clear();
        this.caption.visible = direction.active;
        if (direction.active) {
            const envelope = Math.sin(Math.PI * direction.fraction);
            g.rect(0, 0, 1600, 42 * envelope).fill({ color: 0x070e23, alpha: 0.85 });
            g.rect(0, 900 - 78 * envelope, 1600, 78 * envelope).fill({
                color: 0x070e23,
                alpha: 0.85,
            });
            this.caption.setText(
                direction.phase === 'launch'
                    ? 'SATUK 15 · WYLOT ZE STACJI'
                    : 'SATUK 15 · PODEJŚCIE DO DOKU',
            );
            this.caption.alpha = envelope;
        }
    }
}
