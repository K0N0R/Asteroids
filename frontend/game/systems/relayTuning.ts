export type RelayAction = { channel: number; delta: -1 | 1 } | { confirm: true } | { cancel: true };

/** Three discrete phase offsets. Adjustments never consume mission resources. */
export class RelayTuning {
    readonly targets: number[];
    readonly phases: number[];
    attempts = 0;
    revision = 0;
    message = 'Nałóż turkusowy sygnał na złotą falę wzorcową we wszystkich trzech kanałach.';
    constructor(seed: number) {
        const n = seed >>> 0;
        this.targets = [n % 8, (n >>> 3) % 8, (n >>> 6) % 8];
        this.phases = this.targets.map((v, i) => (v + 2 + i) % 8);
    }
    get matched() {
        return this.phases.map((p, i) => p === this.targets[i]);
    }
    act(action: RelayAction) {
        if ('cancel' in action) return false;
        if ('confirm' in action) {
            this.attempts++;
            this.message = this.matched.every(Boolean)
                ? 'Sygnał zsynchronizowany.'
                : 'Niezgodna faza. Popraw przesunięcie zaznaczonych kanałów.';
            this.revision++;
            return this.matched.every(Boolean);
        }
        if (
            !Number.isInteger(action.channel) ||
            action.channel < 0 ||
            action.channel > 2 ||
            ![-1, 1].includes(action.delta)
        )
            return false;
        this.phases[action.channel] = (this.phases[action.channel] + action.delta + 8) % 8;
        this.message = 'Dopasuj trzy kanały, następnie zatwierdź synchronizację.';
        this.revision++;
        return false;
    }
}
