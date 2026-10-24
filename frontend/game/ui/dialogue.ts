import { CanvasTextMetrics, Container, Graphics, TextStyle } from 'pixi.js';
import { C } from '../graphics/shapes';
import { DialoguePlayback, SPEAKERS } from '../state/dialogues';
import { portraitView } from '../graphics/portraitView';
import { STORY_PORTRAITS } from '../graphics/portraitAppearance';
import { button, label, panel } from './primitives';
import { dialogueTick } from '../systems/audio';

/** Nonblocking radio card. Only its controls receive pointer events; messages wait for acknowledgement. */
export function dialogueView(playback: DialoguePlayback, advance: () => void) {
    const root = new Container(),
        line = playback.line;
    const lineIndex = playback.index;
    if (!line) return Object.assign(root, { lineIndex, update: (_deltaMS: number) => {} });
    // Wrap the complete sentence once so words do not jump as letters appear.
    const wrapped = Array.from(
        CanvasTextMetrics.measureText(
            line.text,
            new TextStyle({
                fontFamily: 'Trebuchet MS',
                fontSize: 34,
                fontWeight: '600',
                wordWrap: true,
                wordWrapWidth: 1000,
            }),
        ).lines.join('\n'),
    );
    const extraHeight = Math.max(0, wrapped.join('').split('\n').length * 22 + 168 - 272);
    root.y = -extraHeight;
    root.eventMode = 'passive';
    root.on(
        'pointerdown',
        (event) => 'stopPropagation' in event.nativeEvent && event.nativeEvent.stopPropagation(),
    );
    panel(root, 32, 460, 660, 272 + extraHeight);
    root.addChild(new Graphics().roundRect(32, 460, 4, 272 + extraHeight, 2).fill(C.mint));
    label(root, 'ŁĄCZNOŚĆ NA ŻYWO · CZEKA NA POTWIERDZENIE', 54, 478, 12, C.mint);
    const speaker = SPEAKERS[line.speaker],
        portrait = portraitView(STORY_PORTRAITS[line.speaker]);
    portrait.position.set(100, 564);
    portrait.scale.set(0.3);
    root.addChild(portrait);
    label(root, speaker.role, 156, 507, 11, C.mint);
    label(root, speaker.name, 156, 529, 23, C.text);
    const text = label(root, '', 156, 568, 17, C.text);
    text.label = 'dialogue-text';
    label(
        root,
        `${playback.index + 1} / ${playback.definition.lines.length} · Enter`,
        54,
        696 + extraHeight,
        12,
        C.muted,
    );
    const next = button(
        root,
        playback.index + 1 === playback.definition.lines.length ? 'ZAMKNIJ WIADOMOŚĆ' : 'DALEJ →',
        448,
        681 + extraHeight,
        222,
        advance,
        true,
        true,
        34,
        14,
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
                playback.typing ? 'POKAŻ CAŁOŚĆ' : final ? 'ZAMKNIJ WIADOMOŚĆ' : 'DALEJ →',
            );
            wasTyping = playback.typing;
        }
    };
    update(0);
    return Object.assign(root, { lineIndex, update });
}
