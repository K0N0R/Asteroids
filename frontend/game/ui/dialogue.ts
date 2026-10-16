import { Container, Graphics } from 'pixi.js';
import { C } from '../graphics/shapes';
import { DialoguePlayback, SPEAKERS } from '../state/dialogues';
import { pilotPortrait } from './lobbyGraphics';
import { button, label, panel } from './primitives';

/** A modal bottom panel; only the explicit next control advances the sequence. */
export function dialogueView(playback: DialoguePlayback, advance: () => void) {
    const root = new Container(),
        line = playback.line;
    if (!line) return root;
    const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: C.ink, alpha: 0.62 });
    shade.eventMode = 'static';
    root.addChild(shade);
    panel(root, 80, 600, 1440, 265);
    label(root, `ŁĄCZNOŚĆ / ${playback.definition.title.toUpperCase()}`, 110, 570, 15, C.mint);
    const speaker = SPEAKERS[line.speaker],
        portrait = pilotPortrait(speaker.archetype, false, speaker.identity);
    portrait.position.set(205, 725);
    portrait.scale.set(0.62);
    root.addChild(portrait);
    label(root, speaker.role, 330, 623, 12, C.mint);
    label(root, speaker.name, 330, 645, 25, C.text);
    label(root, line.text, 330, 690, 23, C.text, 1120);
    label(
        root,
        `${playback.index + 1} / ${playback.definition.lines.length} · Enter / Spacja`,
        330,
        815,
        14,
        C.muted,
    );
    button(
        root,
        playback.index + 1 === playback.definition.lines.length ? 'ZAKOŃCZ ODPRAWĘ →' : 'DALEJ →',
        1220,
        803,
        270,
        advance,
        true,
        true,
        42,
        16,
    );
    return root;
}
