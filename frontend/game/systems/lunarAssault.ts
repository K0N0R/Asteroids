import type { EnemyKind } from '../config';
export interface AssaultHost {
    spawn(kind: EnemyKind, wave: number): number;
    alive(id: number): boolean;
    remove(id: number): void;
}
export class LunarAssault {
    state: 'idle' | 'warning' | 'battle' | 'failed' | 'complete' = 'idle';
    health = 180;
    wave = 0;
    timer = 0;
    reason = '';
    readonly enemies = new Set<number>();
    readonly spawned = new Set<number>();
    get active() {
        return this.state === 'warning' || this.state === 'battle';
    }
    get angle() {
        return [Math.PI, -Math.PI / 2, 0][Math.max(0, this.wave - 1)];
    }
    get summary() {
        return this.state === 'complete'
            ? 'Atak odparty · wróć z raportem do Satuk 15'
            : this.state === 'failed'
              ? `${this.reason} · G przy stacji ponawia obronę`
              : this.state === 'idle'
                ? 'G przy stacji · rozpocznij finałową obronę'
                : `Atak ${this.wave}/3 · stacja ${this.health}/180 · ${this.state === 'warning' ? `kontakt za ${Math.ceil(this.timer)} s` : 'zniszcz napastnika'}`;
    }
    start() {
        if (this.active || this.state === 'complete') return false;
        this.health = 180;
        this.wave = 0;
        this.reason = '';
        this.spawned.clear();
        this.next();
        return true;
    }
    private next() {
        this.wave++;
        this.state = 'warning';
        this.timer = 6;
    }
    damage(amount: number) {
        if (this.active) this.health = Math.max(0, this.health - Math.max(0, amount));
    }
    fail(host: AssaultHost, reason: string) {
        if (!this.active) return;
        this.state = 'failed';
        this.reason = reason;
        for (const id of this.enemies) host.remove(id);
        this.enemies.clear();
    }
    step(dt: number, host: AssaultHost) {
        if (!this.active) return;
        if (!this.health) {
            this.fail(host, 'Stacja nie przetrwała ataku');
            return;
        }
        this.timer -= dt;
        if (this.state === 'warning') {
            if (this.timer > 1e-8) return;
            const id = host.spawn(this.wave === 3 ? 'lancer' : 'patrol', this.wave);
            this.enemies.add(id);
            this.spawned.add(id);
            this.state = 'battle';
            this.timer = 90;
        }
        for (const id of this.enemies) if (!host.alive(id)) this.enemies.delete(id);
        if (!this.enemies.size) {
            if (this.wave === 3) this.state = 'complete';
            else this.next();
        } else if (this.timer <= 0) this.fail(host, 'Atak nie został odparty w wyznaczonym czasie');
    }
}
