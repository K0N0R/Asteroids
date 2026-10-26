export interface VenusPowerState {
    isolated: boolean;
    rotations: number[];
}
export type VenusPowerAction =
    | { isolate: true }
    | { rotate: number }
    | { confirm: true }
    | { cancel: true };
// Ports are N/E/S/W. The branch at (1,2) is damaged and must be isolated first.
export const VENUS_POWER_WIDTH = 5;
export const VENUS_POWER_TILES = [0, 0, 6, 10, 10, 10, 10, 15, 10, 10, 0, 0, 3, 10, 10] as const;
export const VENUS_POWER_SYSTEMS = ['CHŁODZENIE', 'STEROWANIE', 'ARCHIWUM'] as const;
export function validVenusPowerState(value: unknown): value is VenusPowerState {
    if (!value || typeof value !== 'object') return false;
    const p = value as VenusPowerState;
    return (
        typeof p.isolated === 'boolean' &&
        Array.isArray(p.rotations) &&
        p.rotations.length === VENUS_POWER_TILES.length &&
        p.rotations.every((r) => Number.isInteger(r) && r >= 0 && r < 4)
    );
}
/** No timer or material penalty: the child can inspect, rotate and retry safely. */
export class VenusPower {
    readonly state: VenusPowerState;
    revision = 0;
    message = 'Najpierw odłącz gałąź z przebiciem. Potem doprowadź energię do trzech modułów.';
    constructor(saved?: VenusPowerState) {
        this.state = saved
            ? { isolated: saved.isolated, rotations: [...saved.rotations] }
            : {
                  isolated: false,
                  rotations: VENUS_POWER_TILES.map((mask, i) =>
                      mask && mask !== 15 ? (i % 3 === 0 ? 2 : 1) : 0,
                  ),
              };
    }
    ports(index: number) {
        let mask: number = VENUS_POWER_TILES[index] ?? 0;
        for (let i = 0; i < this.state.rotations[index]; i++)
            mask = ((mask << 1) & 15) | (mask >> 3);
        return mask;
    }
    get powered() {
        const visited = new Set<number>();
        if (!this.state.isolated || !(this.ports(5) & 8)) return visited;
        const queue = [5];
        visited.add(5);
        for (let n = 0; n < queue.length; n++) {
            const i = queue[n],
                x = i % 5,
                y = Math.floor(i / 5);
            for (const [dx, dy, port, back] of [
                [0, -1, 1, 4],
                [1, 0, 2, 8],
                [0, 1, 4, 1],
                [-1, 0, 8, 2],
            ]) {
                const nx = x + dx,
                    ny = y + dy,
                    next = ny * 5 + nx;
                if (nx < 0 || nx >= 5 || ny < 0 || ny >= 3 || visited.has(next)) continue;
                if (this.ports(i) & port && this.ports(next) & back) {
                    visited.add(next);
                    queue.push(next);
                }
            }
        }
        return visited;
    }
    get systems() {
        const powered = this.powered;
        return [4, 9, 14].map((i) => powered.has(i) && !!(this.ports(i) & 2));
    }
    act(action: VenusPowerAction) {
        if ('cancel' in action) return false;
        if ('isolate' in action) {
            this.state.isolated = true;
            this.message =
                'Przebicie odłączone. Obracaj łączniki: jasna linia pokazuje przepływ energii.';
        } else if ('rotate' in action) {
            const i = action.rotate;
            if (
                !this.state.isolated ||
                !Number.isInteger(i) ||
                !VENUS_POWER_TILES[i] ||
                VENUS_POWER_TILES[i] === 15
            )
                return false;
            this.state.rotations[i] = (this.state.rotations[i] + 1) % 4;
            this.message = this.systems.every(Boolean)
                ? 'Wszystkie moduły gotowe. Możesz uruchomić laboratorium.'
                : 'Prąd płynie tylko przez stykające się końcówki. Połącz wszystkie trzy wyjścia.';
        } else if ('confirm' in action) {
            this.revision++;
            if (this.state.isolated && this.systems.every(Boolean)) return true;
            this.message = 'Nie wszystkie moduły mają zasilanie. Sprawdź ciemne połączenia.';
            return false;
        }
        this.revision++;
        return false;
    }
}
