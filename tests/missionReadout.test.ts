import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missionObjectives } from '../frontend/game/ui/missionReadout';

test('HUD marks resource goals independently and still requires a return to the base', () => {
    const goals = missionObjectives(1, { ore: 20, parts: 1 }, [], false, false);
    assert.deepEqual(
        goals.map((goal) => [goal.id, goal.complete]),
        [
            ['ore', true],
            ['parts', false],
            ['return', false],
        ],
    );
    assert.equal(goals[1].progress, '1/2');
    assert.ok(
        missionObjectives(1, { ore: 25, parts: 2 }, [], false, false)
            .slice(0, 2)
            .every((goal) => goal.complete),
    );
    assert.equal(
        missionObjectives(1, { ore: 25, parts: 2 }, [], false, false).at(-1)!.complete,
        false,
    );
});
test('science objectives require the correct data, show both sites and omit zero resource requirements', () => {
    const goals = missionObjectives(3, { ore: 100, parts: 10 }, ['relay'], false, false);
    assert.deepEqual(
        goals.map((goal) => [goal.id, goal.complete]),
        [
            ['relay', true],
            ['archive', false],
            ['return', false],
        ],
    );
});
test('securing a rescue completes pickup but leaves safe extraction pending', () => {
    const goals = missionObjectives(0, { ore: 12, parts: 0 }, [], true, true);
    assert.ok(goals.find((goal) => goal.id === 'rescue')!.complete);
    assert.equal(goals.at(-1)!.complete, false);
    assert.equal(
        missionObjectives(0, { ore: 12, parts: 0 }, [], true, true, true).at(-1)!.complete,
        true,
    );
});
