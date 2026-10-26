import type { Point } from '../worlds/sector';

export interface FlightCue {
    id: string;
    speaker: 'operations' | 'science';
    text: string;
    warning: boolean;
    focus?: Point;
}
export interface DirectionSnapshot {
    returned: boolean;
    destroyed: boolean;
    interrupted: boolean;
    threat: boolean;
    suppressContact?: boolean;
    hullFraction: number;
    heat: number;
    discoveries: { id: string; name: string; position: Point; text?: string }[];
}
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Presentation only: no mission progress, inventory or physics changes. */
export class FlightDirection {
    private launchTime: number;
    private dockTime = 0;
    private docking = false;
    private seen = new Set<string>();
    cue: FlightCue | null = null;
    cueTime = 0;
    focusWeight = 0;
    constructor(launch = true) {
        this.launchTime = launch ? 0 : 1.8;
    }
    get phase() {
        return this.docking ? 'dock' : this.launchTime < 1.8 ? 'launch' : 'flight';
    }
    get fraction() {
        return Math.min(1, this.docking ? this.dockTime / 1.5 : this.launchTime / 1.8);
    }
    get eased() {
        return smooth(this.fraction);
    }
    get active() {
        return this.phase !== 'flight' && !this.returnFinished;
    }
    get returnFinished() {
        return this.docking && this.dockTime >= 1.5;
    }
    advance(dt: number, state: DirectionSnapshot) {
        dt = Math.max(0, Math.min(dt, 0.1));
        if (state.destroyed) {
            this.launchTime = 1.8;
            this.cue = null;
            this.focusWeight = 0;
            return;
        }
        if (state.returned) {
            this.docking = true;
            this.dockTime = Math.min(1.5, this.dockTime + dt);
            this.cue = null;
            this.focusWeight = 0;
            return;
        }
        if (this.phase === 'launch') {
            this.launchTime = Math.min(1.8, this.launchTime + dt);
            return;
        }
        this.cueTime += dt;
        if (this.cueTime > 7) this.cue = null;
        // Threats replace quiet discovery commentary and immediately release the camera.
        const warning =
            state.hullFraction < 0.3
                ? {
                      id: 'hull',
                      text: 'Kadłub ledwo się trzyma. Przerwij atak i znajdź chwilę na naprawę.',
                  }
                : state.heat >= 75
                  ? {
                        id: 'heat',
                        text: 'Temperatura szybko rośnie. Schowaj statek w cieniu dużej skały.',
                    }
                  : state.threat && !state.suppressContact
                    ? {
                          id: 'contact',
                          text: 'Mamy kontakt w pobliżu. Uważaj na ostrzał — obserwujemy Twoją pozycję.',
                      }
                    : null;
        if (warning && !this.seen.has(warning.id)) {
            this.present({ ...warning, speaker: 'operations', warning: true });
        } else if (!warning && !this.cue && !state.interrupted) {
            const discovery = state.discoveries.find((item) => !this.seen.has(item.id));
            if (discovery)
                this.present({
                    id: discovery.id,
                    speaker: 'science',
                    text:
                        discovery.text ??
                        `Na skanerze mamy obiekt: ${discovery.name}. Podejdź spokojnie. Sprawdźmy, co uda się odczytać.`,
                    warning: false,
                    focus: { ...discovery.position },
                });
        }
        if (state.interrupted || state.threat || state.heat >= 75 || state.hullFraction < 0.3) {
            if (this.cue) this.cue.focus = undefined;
        }
        const target =
            this.cue?.focus && this.cueTime < 2.6
                ? Math.sin(Math.PI * Math.min(1, this.cueTime / 2.6)) * 0.28
                : 0;
        this.focusWeight += (target - this.focusWeight) * (1 - Math.exp(-dt * 8));
        if (target === 0 && (state.interrupted || state.threat)) this.focusWeight = 0;
    }
    private present(cue: FlightCue) {
        this.seen.add(cue.id);
        this.cue = cue;
        this.cueTime = 0;
    }
}
