import { test } from 'node:test';
import assert from 'node:assert/strict';

test('physical F/Q/E work across keyboard layouts, Space/K emit no actions, and focus loss clears all controls', async () => {
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
        assert.equal(input.isKeyPressed('INTERACT'), true);
        assert.equal(input.isKeyPressed('ABILITY_Q'), true);
        assert.equal(input.isKeyPressed('ABILITY_E'), true);
        assert.deepEqual(actions, ['f', 'q', 'e']);
        emit('keydown', 'KeyQ', 'a', true);
        assert.equal(actions.length, 3);
        emit('keydown', 'Space', ' ');
        emit('keyup', 'Space', ' ');
        emit('keydown', 'KeyK', 'k');
        emit('keyup', 'KeyK', 'k');
        assert.deepEqual(actions, ['f', 'q', 'e']);
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
