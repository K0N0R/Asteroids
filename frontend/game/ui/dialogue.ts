import { CanvasTextMetrics, Container, Graphics, TextStyle } from 'pixi.js';
import { C } from '../graphics/shapes';
import { DialoguePlayback, SPEAKERS } from '../state/dialogues';
import { portraitView } from '../graphics/portraitView';
import { STORY_PORTRAITS } from '../graphics/portraitAppearance';
import { button, label, panel } from './primitives';
import { dialogueTick } from '../systems/audio';
import { CoreConfig } from '../../core/config/coreConfig';

/** Nonblocking radio card. Only its controls receive pointer events; messages wait for acknowledgement. */
export function dialogueView(playback: DialoguePlayback, advance: () => void) {
    const root = new Container(),
        line = playback.line;
    const lineIndex = playback.index;
    if (!line) return Object.assign(root, { lineIndex, update: (_deltaMS: number) => {} });
    const width = 1200,
        textLeft = 96,
        controlsLeft = width - 236,
        textWidth = controlsLeft - textLeft - 24;
    // Wrap the complete sentence once so words do not jump as letters appear.
    const wrapped = Array.from(
        CanvasTextMetrics.measureText(
            line.text,
            new TextStyle({
                fontFamily: 'Trebuchet MS',
                fontSize: 34,
                fontWeight: '600',
                wordWrap: true,
                wordWrapWidth: textWidth * 2,
            }),
        ).lines.join('\n'),
    );
    const height = Math.max(124, wrapped.join('').split('\n').length * 20 + 56);
    root.position.set((CoreConfig.width - width) / 2, CoreConfig.height - 12 - height);
    root.eventMode = 'passive';
    root.on(
        'pointerdown',
        (event) => 'stopPropagation' in event.nativeEvent && event.nativeEvent.stopPropagation(),
    );
    panel(root, 0, 0, width, height);
    root.addChild(new Graphics().roundRect(0, 0, 4, height, 2).fill(C.mint));
    const speaker = SPEAKERS[line.speaker],
        portrait = portraitView(STORY_PORTRAITS[line.speaker]);
    portrait.position.set(48, height / 2);
    portrait.scale.set(0.22);
    root.addChild(portrait);
    label(root, `${speaker.name} · ${speaker.role}`, textLeft, 14, 16, C.mint);
    const text = label(root, '', textLeft, 42, 17, C.text, undefined, { lineHeight: 40 });
    text.label = 'dialogue-text';
    label(
        root,
        `ŁĄCZNOŚĆ · ${playback.index + 1} / ${playback.definition.lines.length}`,
        controlsLeft,
        16,
        12,
        C.muted,
    );
    const next = button(
        root,
        playback.index + 1 === playback.definition.lines.length ? 'ZAMKNIJ WIADOMOŚĆ' : 'DALEJ →',
        controlsLeft,
        height / 2 - 5,
        216,
        advance,
        true,
        true,
        32,
        14,
    );
    label(root, 'Spacja / Enter', controlsLeft, height / 2 + 36, 12, C.muted);
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
                playback.typing ? 'POKAŻ CAŁOŚĆ' : final ? 'ZAMKNIJ WIADOMOŚĆ' : 'DALEJ →',
            );
            wasTyping = playback.typing;
        }
    };
    update(0);
    return Object.assign(root, { lineIndex, update });
}
