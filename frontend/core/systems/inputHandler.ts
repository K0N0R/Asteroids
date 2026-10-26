import { Bus } from './bus';
import { GameState } from './gameState';
import type { Container } from 'pixi.js';

const defaultKeysConfiguration = {
    PAUSE: 'escape',
    THRUST: 'w',
    LEFT: 'a',
    RIGHT: 'd',
    BRAKE: 's',
    BOOST: 'shift',
    ABILITY_Q: 'q',
    ABILITY_E: 'e',
    UNLOAD: 'c',
    INTERACT: 'f',
    TOW: 'h',

    REPAIR: 'r',
    SABOTAGE: 'g',
};
export type TInputKeys = keyof typeof defaultKeysConfiguration;

export class InputHandlerBase {
    keyConfiguration = defaultKeysConfiguration;
    pressedKeys = new Set<string>();
    pointer = { x: window.innerWidth / 2 + 100, y: window.innerHeight / 2 };
    primaryPressed = false;
    secondaryPressed = false;
    pointerInCanvas = false;
    private pressedPointerButtons = new Set<number>();
    private uiPointerButtons = new Set<number>();

    bindUiContainer(container: Container) {
        // Pixi only dispatches capture listeners on interactive ancestors.
        container.eventMode = 'static';
        // Capture before a control can close/rebuild its panel or stop propagation.
        container.on('pointerdowncapture', (event) => {
            this.uiPointerButtons.add(event.button);
            if (event.button === 0) this.primaryPressed = false;
            if (event.button === 2) this.secondaryPressed = false;
        });
    }
    isKeyPressed(key: TInputKeys) {
        return this.pressedKeys.has(this.keyConfiguration[key]);
    }
    hasAnyKeyPressed() {
        return this.pressedKeys.size !== 0;
    }
    clear() {
        for (const key of this.pressedKeys)
            if (key !== 'escape') Bus.emit('input', { name: 'keyup', data: key });
        this.pressedKeys.clear();
        this.pressedPointerButtons.clear();
        // Keep UI presses blocked until release, including compatibility mousedown events.
        this.primaryPressed = false;
        this.secondaryPressed = false;
        Bus.emit('input', { name: 'pointerdown', data: false });
        Bus.emit('input', { name: 'contextmenu', data: false });
    }
    init() {
        const loseFocus = () => {
            this.uiPointerButtons.clear();
            this.clear();
            Bus.emit('input', { name: 'focus-lost' });
        };
        window.addEventListener('blur', loseFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) loseFocus();
        });
        window.addEventListener('keydown', (evt) => {
            const key =
                evt.code === 'Space'
                    ? 'space'
                    : evt.code === 'BracketLeft'
                      ? '['
                      : evt.code === 'BracketRight'
                        ? ']'
                        : /^Key[A-Z]$/.test(evt.code)
                          ? evt.code.slice(3).toLowerCase()
                          : evt.key.toLowerCase();
            if (key === 'space') {
                if (GameState.state === 'gameplay') evt.preventDefault();
                if (!evt.repeat) Bus.emit('input', { name: 'keydown', data: key });
                return;
            }
            if (key === 'k') return;
            if (
                [
                    'w',
                    'a',
                    's',
                    'd',
                    'shift',
                    'q',
                    'e',
                    'f',
                    'h',
                    'r',
                    'c',
                    'g',
                    ',',
                    '.',
                    '[',
                    ']',
                ].includes(key)
            )
                evt.preventDefault();
            if (['tab', 'f6', 'f7'].includes(key) && GameState.state === 'gameplay')
                evt.preventDefault();
            this.pressedKeys.add(key);
            if (!evt.repeat) Bus.emit('input', { name: 'keydown', data: key });
        });
        window.addEventListener('keyup', (evt) => {
            const key =
                evt.code === 'Space'
                    ? 'space'
                    : evt.code === 'BracketLeft'
                      ? '['
                      : evt.code === 'BracketRight'
                        ? ']'
                        : /^Key[A-Z]$/.test(evt.code)
                          ? evt.code.slice(3).toLowerCase()
                          : evt.key.toLowerCase();
            if (key === 'space') {
                Bus.emit('input', { name: 'keyup', data: key });
                return;
            }
            if (key === 'k') return;
            this.pressedKeys.delete(key);
            Bus.emit('input', { name: 'keyup', data: key });
        });
        const flightCursor = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="none" stroke="#8ce4ed" stroke-width="2" stroke-linecap="round"><circle cx="16" cy="16" r="6"/><path d="M16 2v6m0 16v6M2 16h6m16 0h6"/></g><circle cx="16" cy="16" r="1.5" fill="#ffffff"/></svg>')}") 16 16, crosshair`;
        window.addEventListener('pointermove', (evt) => {
            if (evt.target instanceof HTMLCanvasElement)
                evt.target.style.cursor = GameState.state === 'gameplay' ? flightCursor : 'default';
            this.pointer = { x: evt.clientX, y: evt.clientY };
            this.pointerInCanvas = evt.target instanceof HTMLCanvasElement;
            Bus.emit('input', { name: 'pointermove', data: this.pointer });
        });
        const updateButton = (evt: MouseEvent, pressed: boolean) => {
            this.pointer = { x: evt.clientX, y: evt.clientY };
            this.pointerInCanvas = evt.target instanceof HTMLCanvasElement;
            const wasPressed = this.pressedPointerButtons.has(evt.button);
            const next = pressed && this.pointerInCanvas;
            if (next) this.pressedPointerButtons.add(evt.button);
            else this.pressedPointerButtons.delete(evt.button);
            const gameplayPressed = next && !this.uiPointerButtons.has(evt.button);
            if (evt.button === 0) {
                this.primaryPressed = gameplayPressed;
                // UI controls such as sliders still need the physical press/release events.
                if (wasPressed !== next) {
                    Bus.emit('input', { name: 'pointerdown', data: next });
                }
            }
            if (evt.button === 2) {
                this.secondaryPressed = gameplayPressed;
                if (wasPressed !== next) {
                    Bus.emit('input', { name: 'contextmenu', data: next });
                }
            }
            if (!pressed) this.uiPointerButtons.delete(evt.button);
        };
        window.addEventListener('pointerdown', (evt) => updateButton(evt, true));
        window.addEventListener('pointerup', (evt) => updateButton(evt, false));
        window.addEventListener('mousedown', (evt) => updateButton(evt, true));
        window.addEventListener('mouseup', (evt) => updateButton(evt, false));
        window.addEventListener('pointercancel', () => {
            this.uiPointerButtons.clear();
            this.clear();
        });
        document.addEventListener('pointerleave', () => {
            this.pressedPointerButtons.clear();
            this.primaryPressed = false;
            this.secondaryPressed = false;
            this.pointerInCanvas = false;
        });
        window.addEventListener('wheel', (evt) =>
            Bus.emit('input', { name: 'wheel', data: evt.deltaY }),
        );
    }
}
export const InputHandler = new InputHandlerBase();
