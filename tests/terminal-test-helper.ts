import assert from 'node:assert/strict';
import type { MissionSimulation } from '../frontend/game/systems/mission';
import type { TerminalPuzzle, TerminalAction } from '../frontend/game/systems/terminalPuzzle';

/** Solve from the same visible ports and meter values offered to a player. No hidden answer or state mutation. */
export function terminalMoves(p: TerminalPuzzle): TerminalAction[] {
    if (p.mode === 'power') {
        const queue = [{ values: [...p.power], actions: [] as TerminalAction[] }];
        const seen = new Set<string>();
        while (queue.length) {
            const node = queue.shift()!,
                key = node.values.join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            if (node.values.every((v, i) => v === p.targetPower[i])) return node.actions;
            for (let channel = 0; channel < 3; channel++)
                for (const delta of [-1, 1] as const) {
                    const values = [...node.values],
                        b = (channel + 1) % 3;
                    values[channel] += delta;
                    values[b] -= delta;
                    if (values.every((v) => v >= 0 && v <= 4))
                        queue.push({ values, actions: [...node.actions, { channel, delta }] });
                }
        }
        throw new Error('No power solution');
    }
    const find = (
        cell: number,
        entering: number,
        visited: Set<number>,
    ): TerminalAction[] | null => {
        if (visited.has(cell)) return null;
        const used = new Set(visited).add(cell);
        let mask = p.tiles[cell];
        for (let turns = 0; turns < 4; turns++, mask = ((mask << 1) & 15) | (mask >> 3)) {
            if (!(mask & entering)) continue;
            const actions: TerminalAction[] = Array.from({ length: turns }, () => ({
                rotate: cell,
            }));
            if (cell === p.goal && mask & 2) return actions;
            const neighbors = [
                [cell >= 4 ? cell - 4 : -1, 1, 4],
                [cell % 4 < 3 ? cell + 1 : -1, 2, 8],
                [cell < 8 ? cell + 4 : -1, 4, 1],
                [cell % 4 > 0 ? cell - 1 : -1, 8, 2],
            ];
            for (const [next, exit, entry] of neighbors) {
                if (next < 0 || !(mask & exit)) continue;
                const tail = find(next, entry, used);
                if (tail) return [...actions, ...tail];
            }
        }
        return null;
    };
    const moves = find(p.start, 8, new Set());
    assert.ok(moves, 'visible grid must have a traversable circuit');
    return moves;
}
export function solveTerminal(sim: MissionSimulation, mode?: 'breach' | 'power') {
    const idle = {
        target: sim.position,
        thrust: false,
        brake: false,
        fire: false,
        interact: false,
    };
    if (!sim.terminalPuzzle && mode) {
        sim.step(idle);
        sim.step({ ...idle, interact: mode === 'breach', sabotage: mode === 'power' });
    }
    const puzzle = sim.terminalPuzzle;
    assert.ok(puzzle, `terminal ${mode ?? ''} should be open`);
    if (mode) assert.equal(puzzle.mode, mode);
    for (const action of terminalMoves(puzzle)) {
        sim.terminalAction(action);
        sim.step(idle);
    }
    assert.ok(
        sim.terminalAction({ confirm: true }),
        'solution must complete through the mission API',
    );
}
