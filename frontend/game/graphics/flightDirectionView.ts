import { Container, Graphics } from 'pixi.js';
import type { FlightDirection } from '../systems/flightDirection';
import { portraitView } from './portraitView';
import { STORY_PORTRAITS } from './portraitAppearance';
import { SPEAKERS } from '../state/dialogues';
import { hudLabel as label } from '../ui/hudIcons';
import { C } from './theme';

/** Non-modal radio: the pilot keeps control and combat continues. */
export class FlightDirectionView extends Container {
    private ink = new Graphics();
    private radio = new Container();
    private speaker = label(this.radio, '', 112, 14, 14, C.mint);
    private message = label(this.radio, '', 112, 40, 18, C.text, 630);
    private caption = label(this, '', 580, 780, 22, C.text);
    private portraits = {
        operations: portraitView(STORY_PORTRAITS.operations),
        science: portraitView(STORY_PORTRAITS.science),
    };
    constructor() {
        super();
        this.eventMode = 'none';
        this.addChildAt(this.ink, 0);
        this.radio.position.set(410, 684);
        this.addChild(this.radio);
        for (const portrait of Object.values(this.portraits)) {
            portrait.scale.set(0.3);
            portrait.position.set(54, 57);
            this.radio.addChild(portrait);
        }
    }
    update(direction: FlightDirection) {
        const g = this.ink.clear(),
            cue = direction.cue;
        this.radio.visible = direction.phase === 'flight' && !!cue;
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
        if (this.radio.visible && cue) {
            g.roundRect(410, 684, 780, 116, 18).fill({ color: 0x141e3a, alpha: 0.94 });
            g.roundRect(410, 703, 4, 78, 2).fill(cue.warning ? C.gold : C.mint);
            this.speaker.setText(
                `${SPEAKERS[cue.speaker].name} · ${cue.warning ? 'UWAGA' : 'ŁĄCZNOŚĆ'}`,
            );
            this.message.setText(
                Array.from(cue.text)
                    .slice(0, Math.floor(direction.cueTime * 55))
                    .join(''),
            );
            for (const [id, portrait] of Object.entries(this.portraits))
                portrait.visible = id === cue.speaker;
            this.radio.alpha = Math.min(1, direction.cueTime * 5, (7 - direction.cueTime) * 3);
        }
    }
}
