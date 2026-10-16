export type RescueRepairAction =
    | { side: 'left' | 'right'; index: number }
    | { confirm: true }
    | { cancel: true };
export class RescueRepair {
    readonly rightOrder: number[];
    selected: number | null = null;
    readonly connected = new Set<number>();
    revision = 0;
    message = 'Wybierz obwód po lewej, potem odpowiadające mu oznaczenie po prawej.';
    constructor(seed: number) {
        const shift = (seed >>> 0) % 3;
        this.rightOrder = [2, 0, 1].map((i) => (i + shift) % 3);
        if (this.rightOrder.every((v, i) => v === i)) this.rightOrder.reverse();
    }
    act(action: RescueRepairAction) {
        if ('cancel' in action) return false;
        if ('confirm' in action) {
            this.message =
                this.connected.size === 3
                    ? 'Obwody zabezpieczone. Można podłączyć hol.'
                    : 'Najpierw połącz wszystkie trzy obwody.';
            this.revision++;
            return this.connected.size === 3;
        }
        if (!Number.isInteger(action.index) || action.index < 0 || action.index > 2) return false;
        if (action.side === 'left') {
            this.selected = this.connected.has(action.index) ? null : action.index;
            this.message = 'Połącz wybrany obwód z takim samym oznaczeniem po prawej.';
        } else if (action.side === 'right') {
            if (this.selected === null) this.message = 'Najpierw wybierz obwód po lewej.';
            else if (this.rightOrder[action.index] !== this.selected) {
                this.message = 'Niezgodne obwody. Wybierz pasujące oznaczenie.';
                this.selected = null;
            } else {
                this.connected.add(this.selected);
                this.selected = null;
                this.message =
                    this.connected.size === 3
                        ? 'Wszystkie obwody połączone. Zatwierdź zabezpieczenie.'
                        : 'Obwód połączony. Zabezpiecz pozostałe.';
            }
        }
        this.revision++;
        return false;
    }
}
