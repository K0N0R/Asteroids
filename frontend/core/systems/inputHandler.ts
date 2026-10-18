import { Bus } from './bus';
import { GameState } from './gameState';

const defaultKeysConfiguration = {
    PAUSE: 'escape',
    THRUST: 'w',
    LEFT: 'a',
    RIGHT: 'd',
    BRAKE: 's',
    BOOST: 'shift',
    HYPERDRIVE: 'space',
    UNLOAD: 'c',
    INTERACT: 'e',
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
        this.primaryPressed = false;
        this.secondaryPressed = false;
        Bus.emit('input', { name: 'pointerdown', data: false });
        Bus.emit('input', { name: 'contextmenu', data: false });
    }
    init() {
        const loseFocus = () => {
            this.clear();
            Bus.emit('input', { name: 'focus-lost' });
        };
        window.addEventListener('blur', loseFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) loseFocus();
        });
        window.addEventListener('keydown', (evt) => {
            const key = evt.code === 'Space' ? 'space' : evt.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'shift', 'e', 'r', 'c', 'g'].includes(key))
                evt.preventDefault();
            if (key === 'space' && GameState.state === 'gameplay') evt.preventDefault();
            if (['tab', 'f6', 'f7'].includes(key) && GameState.state === 'gameplay')
                evt.preventDefault();
            this.pressedKeys.add(key);
            if (!evt.repeat) Bus.emit('input', { name: 'keydown', data: key });
        });
        window.addEventListener('keyup', (evt) => {
            const key = evt.code === 'Space' ? 'space' : evt.key.toLowerCase();
            this.pressedKeys.delete(key);
            Bus.emit('input', { name: 'keyup', data: key });
        });
        window.addEventListener('pointermove', (evt) => {
            this.pointer = { x: evt.clientX, y: evt.clientY };
            this.pointerInCanvas = evt.target instanceof HTMLCanvasElement;
            Bus.emit('input', { name: 'pointermove', data: this.pointer });
        });
        const updateButton = (evt: MouseEvent, pressed: boolean) => {
            this.pointer = { x: evt.clientX, y: evt.clientY };
            this.pointerInCanvas = evt.target instanceof HTMLCanvasElement;
            if (evt.button === 0) {
                const next = pressed && this.pointerInCanvas;
                if (this.primaryPressed !== next) {
                    this.primaryPressed = next;
                    Bus.emit('input', { name: 'pointerdown', data: next });
                }
            }
            if (evt.button === 2) {
                const next = pressed && this.pointerInCanvas;
                if (this.secondaryPressed !== next) {
                    this.secondaryPressed = next;
                    Bus.emit('input', { name: 'contextmenu', data: next });
                }
            }
        };
        window.addEventListener('pointerdown', (evt) => updateButton(evt, true));
        window.addEventListener('pointerup', (evt) => updateButton(evt, false));
        window.addEventListener('mousedown', (evt) => updateButton(evt, true));
        window.addEventListener('mouseup', (evt) => updateButton(evt, false));
        window.addEventListener('pointercancel', () => this.clear());
        document.addEventListener('pointerleave', () => {
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
