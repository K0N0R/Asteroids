import type { HullId } from '../config';

export type TerminalAction =
    | { rotate: number }
    | { channel: number; delta: -1 | 1 }
    | { confirm: true }
    | { overload: true }
    | { cancel: true };
export const PORTS = [1, 2, 4, 8] as const; // north, east, south, west
export function rotatePorts(mask: number) {
    return ((mask << 1) & 15) | (mask >> 3);
}
export function terminalProfile(hull: HullId) {
    return {
        seconds: hull === 'falcon' ? 45 : 30,
        mistake: hull === 'falcon' ? 15 : 30,
        overload: hull === 'phoenix',
        name:
            hull === 'falcon'
                ? 'Sokół · ciche włamanie'
                : hull === 'phoenix'
                  ? 'Feniks · przełamanie'
                  : 'Standardowy terminal',
    };
}

/** Transient work only. The mission owns costs, scanner alarms and awarding data. */
export class TerminalPuzzle {
    readonly tiles: number[];
    readonly start: number;
    readonly goal: number;
    readonly targetPower: number[];
    readonly power: number[];
    readonly profile: ReturnType<typeof terminalProfile>;
    remaining: number;
    trace: number;
    revision = 0;
    finished = false;
    message = '';
    constructor(
        readonly mode: 'breach' | 'power',
        hull: HullId,
        seed: number,
        trace = 0,
    ) {
        this.profile = terminalProfile(hull);
        this.remaining = this.profile.seconds;
        this.trace = trace;
        let n = seed >>> 0;
        const random = () => {
            n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
            return n;
        };
        const row = random() % 3,
            end = random() % 3;
        this.start = row * 4;
        this.goal = end * 4 + 3;
        this.tiles = Array.from({ length: 12 }, () => [3, 6, 12, 9, 5, 10][random() % 6]);
        const route = [this.start, this.start + 1];
        for (let y = row; y !== end; ) {
            y += Math.sign(end - row);
            route.push(y * 4 + 1);
        }
        route.push(end * 4 + 2, this.goal);
        const port = (from: number, to: number) =>
            to === from + 1 ? 2 : to === from - 1 ? 8 : to > from ? 4 : 1;
        route.forEach((cell, index) => {
            this.tiles[cell] =
                (index ? port(cell, route[index - 1]) : 8) |
                (index < route.length - 1 ? port(cell, route[index + 1]) : 2);
            for (let turn = random() % 4; turn > 0; turn--)
                this.tiles[cell] = rotatePorts(this.tiles[cell]);
        });
        while (this.tiles[this.start] & 8)
            this.tiles[this.start] = rotatePorts(this.tiles[this.start]);
        this.targetPower = [1, 2, 3];
        for (let i = 2; i > 0; i--) {
            const j = random() % (i + 1);
            [this.targetPower[i], this.targetPower[j]] = [this.targetPower[j], this.targetPower[i]];
        }
        this.power = [this.targetPower[1], this.targetPower[2], this.targetPower[0]];
    }
    get energized() {
        const visited = new Set<number>();
        if (!(this.tiles[this.start] & 8)) return visited;
        const queue = [this.start];
        while (queue.length) {
            const cell = queue.pop()!;
            if (visited.has(cell)) continue;
            visited.add(cell);
            const x = cell % 4,
                y = Math.floor(cell / 4);
            const neighbors = [
                y > 0 ? cell - 4 : -1,
                x < 3 ? cell + 1 : -1,
                y < 2 ? cell + 4 : -1,
                x > 0 ? cell - 1 : -1,
            ];
            neighbors.forEach((neighbor, direction) => {
                if (
                    neighbor >= 0 &&
                    !visited.has(neighbor) &&
                    this.tiles[cell] & PORTS[direction] &&
                    this.tiles[neighbor] & PORTS[(direction + 2) % 4]
                )
                    queue.push(neighbor);
            });
        }
        return visited;
    }
    get matched() {
        return this.mode === 'breach'
            ? this.energized.has(this.goal) && !!(this.tiles[this.goal] & 2)
            : this.power.every((value, i) => value === this.targetPower[i]);
    }
    tick(dt: number) {
        if (this.finished || !Number.isFinite(dt) || dt <= 0) return false;
        const second = Math.ceil(this.remaining);
        this.remaining = Math.max(0, this.remaining - dt);
        if (second !== Math.ceil(this.remaining)) this.revision++;
        if (this.remaining > 1e-8) return false;
        this.trace = 100;
        this.finished = true;
        return true;
    }
    act(action: TerminalAction): 'none' | 'success' | 'alarm' {
        if (this.finished || 'cancel' in action) return 'none';
        if ('overload' in action) {
            if (this.mode !== 'breach' || !this.profile.overload) return 'none';
            this.trace = 100;
            this.finished = true;
            return 'success';
        }
        if ('confirm' in action) {
            if (this.matched) {
                this.finished = true;
                return 'success';
            }
            this.trace = Math.min(100, this.trace + this.profile.mistake);
            this.message = 'Niezgodne połączenie · rośnie ślad włamania.';
            this.revision++;
            if (this.trace < 100) return 'none';
            this.finished = true;
            return 'alarm';
        }
        if (
            'rotate' in action &&
            this.mode === 'breach' &&
            Number.isInteger(action.rotate) &&
            action.rotate >= 0 &&
            action.rotate < 12
        ) {
            this.tiles[action.rotate] = rotatePorts(this.tiles[action.rotate]);
            this.revision++;
        }
        if (
            'channel' in action &&
            this.mode === 'power' &&
            Number.isInteger(action.channel) &&
            action.channel >= 0 &&
            action.channel < 3 &&
            [-1, 1].includes(action.delta)
        ) {
            const a = action.channel,
                b = (a + 1) % 3,
                delta = action.delta;
            if (
                this.power[a] + delta < 0 ||
                this.power[a] + delta > 4 ||
                this.power[b] - delta < 0 ||
                this.power[b] - delta > 4
            )
                return 'none';
            this.power[a] += delta;
            this.power[b] -= delta;
            this.revision++;
        }
        return 'none';
    }
}
