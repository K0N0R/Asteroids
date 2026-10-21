import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShapeLibrary } from '../frontend/game/graphics/shapes';

test('asteroid geometry survives shared views and is freed with the last owner', () => {
    const library = new ShapeLibrary();
    for (const lunar of [false, true]) {
        const first = lunar ? library.lunarRock(17, true) : library.rock(17, true);
        const second = lunar ? library.lunarRock(17, true) : library.rock(17, true);
        const context = first.context;
        assert.equal(second.context, context);
        first.destroy();
        assert.ok(context.instructions?.length);
        second.destroy();
        assert.equal(context.instructions, null);
    }
    library.dispose();
});

test('ten thousand destroyed asteroid variants leave no retained geometry', () => {
    const library = new ShapeLibrary();
    const contexts = (library as unknown as { rocks: Map<string, unknown> }).rocks;
    for (let i = 0; i < 10000; i++) {
        const rock = i % 2 ? library.lunarRock(i, false) : library.rock(i, true);
        const context = rock.context;
        rock.destroy();
        assert.equal(context.instructions, null);
        assert.equal(contexts.size, 0);
    }
    library.dispose();
});
