import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, EventBoundary, FederatedPointerEvent, Rectangle } from 'pixi.js';
import 'pixi.js/events';

test('physical F/Q/E work across layouts, Space acknowledges messages without a flight control, and blur clears controls', async () => {
    const previousWindow = globalThis.window,
        previousDocument = globalThis.document;
    const listeners = new Map<string, ((event: any) => void)[]>();
    const listen = (name: string, handler: (event: any) => void) =>
        listeners.set(name, [...(listeners.get(name) ?? []), handler]);
    globalThis.window = { innerWidth: 1600, innerHeight: 900, addEventListener: listen } as never;
    globalThis.document = { hidden: false, addEventListener: listen } as never;
    const { Bus } = await import('../frontend/core/systems/bus');
    const owner = {},
        actions: string[] = [];
    Bus.subscribe(
        'input',
        (event) => {
            if (event.name === 'keydown') actions.push(event.data);
        },
        owner,
    );
    try {
        const { InputHandlerBase } = await import('../frontend/core/systems/inputHandler');
        const input = new InputHandlerBase();
        input.init();
        const emit = (type: string, code: string, key: string, repeat = false) => {
            for (const listener of listeners.get(type) ?? [])
                listener({ code, key, repeat, preventDefault() {} });
        };
        emit('keydown', 'KeyF', 'x');
        emit('keydown', 'KeyQ', 'a');
        emit('keydown', 'KeyE', 'e');
        emit('keydown', 'KeyH', 'h');
        assert.equal(input.isKeyPressed('INTERACT'), true);
        assert.equal(input.isKeyPressed('TOW'), true);
        assert.equal(input.isKeyPressed('ABILITY_Q'), true);
        assert.equal(input.isKeyPressed('ABILITY_E'), true);
        assert.deepEqual(actions, ['f', 'q', 'e', 'h']);
        emit('keydown', 'KeyQ', 'a', true);
        assert.equal(actions.length, 4);
        emit('keydown', 'Space', ' ');
        emit('keydown', 'Space', ' ', true);
        emit('keyup', 'Space', ' ');
        emit('keydown', 'KeyK', 'k');
        emit('keyup', 'KeyK', 'k');
        assert.deepEqual(actions, ['f', 'q', 'e', 'h', 'space']);
        assert.equal(input.pressedKeys.has('space'), false);
        assert.equal(input.pressedKeys.has('k'), false);
        input.primaryPressed = input.secondaryPressed = true;
        for (const listener of listeners.get('blur') ?? []) listener({});
        assert.equal(input.pressedKeys.size, 0);
        assert.equal(input.primaryPressed, false);
        assert.equal(input.secondaryPressed, false);
        emit('keyup', 'KeyQ', 'a');
        assert.equal(input.isKeyPressed('ABILITY_Q'), false);
    } finally {
        Bus.unsubscribeOwner(owner);
        globalThis.window = previousWindow;
        globalThis.document = previousDocument;
    }
});

test('UI presses block both weapons through panel closure and compatibility mouse events', async () => {
    const previousWindow = globalThis.window,
        previousDocument = globalThis.document,
        previousCanvas = globalThis.HTMLCanvasElement;
    const listeners = new Map<string, ((event: any) => void)[]>();
    const listen = (name: string, handler: (event: any) => void) =>
        listeners.set(name, [...(listeners.get(name) ?? []), handler]);
    globalThis.window = { innerWidth: 1600, innerHeight: 900, addEventListener: listen } as never;
    globalThis.document = { hidden: false, addEventListener: listen } as never;
    globalThis.HTMLCanvasElement = class {
        style = { cursor: '' };
    } as never;
    const { InputHandlerBase } = await import('../frontend/core/systems/inputHandler');
    const { Bus } = await import('../frontend/core/systems/bus');
    const owner = {},
        physicalPresses: boolean[] = [];
    Bus.subscribe(
        'input',
        (event) => {
            if (event.name === 'pointerdown') physicalPresses.push(event.data);
        },
        owner,
    );
    try {
        const input = new InputHandlerBase();
        input.init();
        const canvas = new HTMLCanvasElement();
        const emit = (type: string, button: number, target: object = canvas) => {
            for (const listener of listeners.get(type) ?? [])
                listener({ button, target, clientX: 400, clientY: 300 });
        };
        const pressed = (button: number) =>
            button === 0 ? input.primaryPressed : input.secondaryPressed;

        for (const button of [0, 2]) {
            for (const stopsNativePropagation of [false, true]) {
                const stage = new Container(),
                    world = stage.addChild(new Container()),
                    ui = stage.addChild(new Container()),
                    control = ui.addChild(new Container()),
                    boundary = new EventBoundary(stage);
                ui.eventMode = 'passive';
                world.eventMode = 'static';
                world.hitArea = new Rectangle(0, 0, 1600, 900);
                control.eventMode = 'static';
                control.hitArea = new Rectangle(0, 0, 100, 100);
                input.bindUiContainer(ui);
                assert.equal(boundary.hitTest(50, 50), control);
                assert.equal(boundary.hitTest(400, 300), world, 'empty UI space allows gameplay');
                let clicks = 0;
                control.on('pointerdown', () => {
                    clicks++;
                    // Opening or closing a panel can clear input and destroy the clicked view.
                    input.clear();
                    ui.removeChild(control);
                    control.destroy();
                });
                const event = new FederatedPointerEvent(boundary);
                event.type = 'pointerdown';
                event.button = button;
                event.target = control;
                boundary.dispatchEvent(event);
                assert.equal(clicks, 1, 'UI action still runs');
                if (!stopsNativePropagation) emit('pointerdown', button);
                assert.equal(pressed(button), false);
                emit('mousedown', button);
                assert.equal(pressed(button), false, 'compatibility event cannot start a weapon');
                if (button === 0)
                    assert.equal(physicalPresses.at(-1), true, 'sliders retain physical input');
                emit('pointermove', button);
                assert.equal(pressed(button), false, 'dragging away cannot start a weapon');
                emit('pointerup', button, {});
                emit('mouseup', button, {});
                assert.equal(pressed(button), false);
                emit('pointerdown', button);
                emit('mousedown', button);
                assert.equal(pressed(button), true, 'next gameplay click works normally');
                emit('pointerup', button, {});
                emit('mouseup', button, {});
                assert.equal(pressed(button), false, 'release outside canvas stops the weapon');
                stage.destroy({ children: true });
            }
        }
        assert.ok(physicalPresses.includes(true), 'sliders retain physical pointer input');
        assert.equal(physicalPresses.at(-1), false);
        emit('pointerdown', 0, {});
        emit('mousedown', 2, {});
        assert.equal(input.primaryPressed, false);
        assert.equal(input.secondaryPressed, false);
    } finally {
        Bus.unsubscribeOwner(owner);
        globalThis.window = previousWindow;
        globalThis.document = previousDocument;
        globalThis.HTMLCanvasElement = previousCanvas;
    }
});
