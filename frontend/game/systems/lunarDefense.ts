import { MOON } from '../worlds/moon';
import type { Point } from '../worlds/sector';

export const LUNAR_DEFENSE = {
    waves: 3,
    health: 100,
    impactDamage: 30,
    targetRadius: 130,
    warningSeconds: 5,
    spawnInterval: 3,
    spawnDistance: 900,
} as const;
export interface DefenseHost {
    spawn(angle: number, speed: number): number | undefined;
    rock(id: number): { position: Point; previous: Point; radius: number } | null;
    remove(id: number, impact: boolean): void;
}
export class LunarDefense {
    state: 'idle' | 'warning' | 'wave' | 'failed' | 'complete' = 'idle';
    health: number = LUNAR_DEFENSE.health;
    wave = 0;
    timer = 0;
    remaining = 0;
    destroyed = 0;
    impacts = 0;
    reason = '';
    readonly threats = new Map<number, number>();
    get active() {
        return this.state === 'warning' || this.state === 'wave';
    }
    get angle() {
        return [Math.PI, -Math.PI / 2, 0][Math.max(0, this.wave - 1)];
    }
    get summary() {
        return this.state === 'idle'
            ? 'G przy budowie · rozpocznij obronę · 3 fale'
            : this.state === 'failed'
              ? `${this.reason} · G przy budowie ponawia obronę`
              : this.state === 'complete'
                ? 'Obrona ukończona · postęp zapisany'
                : `Obrona ${this.wave}/3 · konstrukcja ${this.health}/100 · ${this.state === 'warning' ? `fala za ${Math.ceil(this.timer)} s` : `zagrożenia ${this.threats.size + this.remaining}`}`;
    }
    start() {
        if (this.active || this.state === 'complete') return false;
        this.health = LUNAR_DEFENSE.health;
        this.wave = 0;
        this.destroyed = 0;
        this.impacts = 0;
        this.reason = '';
        this.nextWave();
        return true;
    }
    private nextWave() {
        this.wave++;
        this.remaining = this.wave + 1;
        this.timer = LUNAR_DEFENSE.warningSeconds;
        this.state = 'warning';
    }
    fail(host: DefenseHost, reason: string) {
        if (!this.active) return;
        this.state = 'failed';
        this.reason = reason;
        for (const id of this.threats.keys()) host.remove(id, false);
        this.threats.clear();
        this.remaining = 0;
    }
    step(dt: number, host: DefenseHost) {
        if (!this.active) return;
        for (const [id, age] of this.threats) {
            const rock = host.rock(id);
            if (!rock) {
                this.threats.delete(id);
                this.destroyed++;
                continue;
            }
            const from = rock.previous,
                to = rock.position;
            const dx = to.x - from.x,
                dy = to.y - from.y;
            const t = Math.max(
                0,
                Math.min(
                    1,
                    ((MOON.construction.x - from.x) * dx + (MOON.construction.y - from.y) * dy) /
                        Math.max(0.0001, dx * dx + dy * dy),
                ),
            );
            if (
                Math.hypot(
                    from.x + t * dx - MOON.construction.x,
                    from.y + t * dy - MOON.construction.y,
                ) <=
                LUNAR_DEFENSE.targetRadius + rock.radius
            ) {
                host.remove(id, true);
                this.threats.delete(id);
                this.impacts++;
                this.health = Math.max(0, this.health - LUNAR_DEFENSE.impactDamage);
                if (this.health <= 0) {
                    this.fail(host, 'Konstrukcja uszkodzona przez asteroidy');
                    return;
                }
            } else if (
                age > 35 ||
                Math.hypot(to.x - MOON.construction.x, to.y - MOON.construction.y) > 1400
            ) {
                host.remove(id, false);
                this.threats.delete(id);
            } else this.threats.set(id, age + dt);
        }
        this.timer -= dt;
        if (this.state === 'warning') {
            if (this.timer > 1e-8) return;
            this.state = 'wave';
            this.timer = 0;
        }
        if (this.remaining > 0 && this.timer <= 1e-8) {
            const angle = this.angle + (this.remaining - (this.wave + 2) / 2) * 0.12;
            const id = host.spawn(angle, 48 + this.wave * 8);
            if (id === undefined) {
                this.fail(host, 'Obrona przerwana');
                return;
            }
            this.threats.set(id, 0);
            this.remaining--;
            this.timer = LUNAR_DEFENSE.spawnInterval;
        }
        if (!this.remaining && !this.threats.size) {
            if (this.wave === LUNAR_DEFENSE.waves) this.state = 'complete';
            else this.nextWave();
        }
    }
}
