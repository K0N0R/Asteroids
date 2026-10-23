import { CanvasTextMetrics, Container, Graphics, TextStyle } from 'pixi.js';
import { C } from '../graphics/shapes';
import { DialoguePlayback, SPEAKERS } from '../state/dialogues';
import { portraitView } from '../graphics/portraitView';
import { STORY_PORTRAITS } from '../graphics/portraitAppearance';
import { button, label, panel } from './primitives';
import { dialogueTick } from '../systems/audio';

/** A modal bottom panel; only the explicit next control advances the sequence. */
export function dialogueView(playback: DialoguePlayback, advance: () => void) {
    const root = new Container(),
        line = playback.line;
    const lineIndex = playback.index;
    if (!line) return Object.assign(root, { lineIndex, update: (_deltaMS: number) => {} });
    const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: C.ink, alpha: 0.62 });
    shade.eventMode = 'static';
    root.addChild(shade);
    panel(root, 80, 600, 1440, 265);
    label(root, `ŁĄCZNOŚĆ / ${playback.definition.title.toUpperCase()}`, 110, 570, 15, C.mint);
    const speaker = SPEAKERS[line.speaker],
        portrait = portraitView(STORY_PORTRAITS[line.speaker]);
    portrait.position.set(205, 725);
    portrait.scale.set(0.62);
    root.addChild(portrait);
    label(root, speaker.role, 330, 623, 12, C.mint);
    label(root, speaker.name, 330, 645, 25, C.text);
    // Wrap the complete sentence once so words do not jump as letters appear.
    const wrapped = Array.from(
        CanvasTextMetrics.measureText(
            line.text,
            new TextStyle({
                fontFamily: 'Trebuchet MS',
                fontSize: 46,
                fontWeight: '600',
                wordWrap: true,
                wordWrapWidth: 2240,
            }),
        ).lines.join('\n'),
    );
    const text = label(root, '', 330, 690, 23, C.text);
    text.label = 'dialogue-text';
    label(
        root,
        `${playback.index + 1} / ${playback.definition.lines.length} · Enter`,
        330,
        815,
        14,
        C.muted,
    );
    const next = button(
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
    const caption = next.children[1] as ReturnType<typeof label>;
    const final = playback.index + 1 === playback.definition.lines.length;
    let shown = -1,
        wasTyping: boolean | undefined;
    const update = (deltaMS: number) => {
        if (playback.update(deltaMS)) dialogueTick();
        const length = Array.from(playback.visibleText).length;
        if (shown !== length) {
            text.setText(playback.typing ? wrapped.slice(0, length).join('') : wrapped.join(''));
            shown = length;
        }
        if (wasTyping !== playback.typing) {
            caption.setText(
                playback.typing ? 'POKAŻ CAŁOŚĆ' : final ? 'ZAKOŃCZ ODPRAWĘ →' : 'DALEJ →',
            );
            wasTyping = playback.typing;
        }
    };
    update(0);
    return Object.assign(root, { lineIndex, update });
}
