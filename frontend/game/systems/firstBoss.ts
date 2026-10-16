import { ENEMY_PROFILES } from '../config';
import type { Enemy } from './enemies';

export const FIRST_BOSS = {
    id: 16000,
    hull: 720,
    phaseAt: 468,
    retreatAt: 180,
    warning: 3,
    duration: 180,
    arenaRadius: 1500,
} as const;
export const FINAL_BOSS = {
    id: 17000,
    hull: 900,
    phaseAt: 540,
    thirdAt: 270,
    retreatAt: 1,
    warning: 4,
    duration: 210,
    arenaRadius: 1500,
} as const;
export function finalBossProfile(phase: 1 | 2 | 3 = 1) {
    return {
        ...firstBossProfile(phase === 1 ? 1 : 2),
        name: 'Jednostka finałowa',
        hull: FINAL_BOSS.hull,
        chaseSpeed: [135, 160, 185][phase - 1],
        windup: [1.4, 1.1, 0.9][phase - 1],
        shotInterval: [2.5, 2.2, 2][phase - 1],
        shotDamage: [14, 10, 8][phase - 1],
    };
}
export function firstBossProfile(phase: 1 | 2 = 1) {
    return {
        ...ENEMY_PROFILES.lancer,
        name: 'Ciężka jednostka',
        hull: FIRST_BOSS.hull,
        radius: 52,
        patrolSpeed: 65,
        chaseSpeed: phase === 1 ? 135 : 170,
        acceleration: 220,
        turnSpeed: 2.6,
        detectRange: 1600,
        loseRange: 1900,
        leash: 1700,
        preferredRange: 360,
        windup: phase === 1 ? 1.4 : 0.9,
        shotInterval: phase === 1 ? 2.5 : 1.8,
        shotSpeed: 650,
        shotLife: 1.7,
        shotDamage: phase === 1 ? 14 : 10,
        oreLoot: 0,
        partsLoot: 0,
    };
}
export interface FirstBossHost {
    spawn(): void;
    enemy(): Enemy | undefined;
    remove(): void;
}
/** Shared lifecycle for opt-in heavy encounters; story identity remains unspecified. */
export class FirstBossEncounter {
    state: 'idle' | 'warning' | 'battle' | 'failed' | 'complete' = 'idle';
    phase: 1 | 2 | 3 = 1;
    constructor(readonly finale = false) {
        this.health = this.rules.hull;
    }
    get rules() {
        return this.finale ? FINAL_BOSS : FIRST_BOSS;
    }
    get damageFloor() {
        return this.phase === 1
            ? this.rules.phaseAt
            : this.finale && this.phase === 2
              ? FINAL_BOSS.thirdAt
              : this.rules.retreatAt;
    }
    health: number = FIRST_BOSS.hull;
    timer = 0;
    reason = '';
    get active() {
        return this.state === 'warning' || this.state === 'battle';
    }
    get complete() {
        return this.state === 'complete';
    }
    get summary() {
        if (this.complete && this.finale)
            return 'Jednostka finałowa unieszkodliwiona · wróć z raportem do Satuk 15';
        if (this.complete) return 'Ciężka jednostka wycofała się · wróć z raportem do Satuk 15';
        if (this.state === 'failed') return `${this.reason} · puść G i ponów przy punkcie 3`;
        if (this.state === 'idle' && this.finale)
            return '3 finałowe starcie · G przez 2 s · trzy fazy · raport po powrocie';
        if (this.state === 'idle')
            return '3 rejon starcia · G przez 2 s · zmniejsz pancerz do 25%, aby wymusić odwrót';
        if (this.state === 'warning')
            return `Ciężki kontakt za ${Math.ceil(this.timer)} s · przygotuj się do walki`;
        return this.finale
            ? `Jednostka finałowa · faza ${this.phase}/3 · pancerz ${Math.ceil(this.health)}/${FINAL_BOSS.hull}`
            : `Ciężka jednostka · faza ${this.phase}/2 · pancerz ${Math.ceil(this.health)}/${FIRST_BOSS.hull} · odwrót przy ${FIRST_BOSS.retreatAt}`;
    }
    start() {
        if (this.active || this.complete) return false;
        this.state = 'warning';
        this.phase = 1;
        this.health = this.rules.hull;
        this.reason = '';
        this.timer = this.rules.warning;
        return true;
    }
    fail(host: FirstBossHost, reason: string) {
        if (!this.active) return;
        host.remove();
        this.state = 'failed';
        this.reason = reason;
    }
    step(dt: number, host: FirstBossHost) {
        if (!this.active) return;
        this.timer -= dt;
        if (this.state === 'warning') {
            if (this.timer > 1e-8) return;
            host.spawn();
            this.state = 'battle';
            this.timer = this.rules.duration;
        }
        const enemy = host.enemy();
        if (!enemy) {
            this.fail(host, 'Kontakt utracony');
            return;
        }
        this.health = enemy.health;
        if (this.health <= this.rules.retreatAt + 1e-8) {
            host.remove();
            this.state = 'complete';
            if (this.finale) this.health = 0;
            return;
        }
        if (
            (this.phase === 1 && this.health <= this.rules.phaseAt) ||
            (this.finale && this.phase === 2 && this.health <= FINAL_BOSS.thirdAt)
        ) {
            this.phase = this.phase === 1 ? 2 : 3;
            enemy.config = this.finale ? finalBossProfile(this.phase) : firstBossProfile(2);
            enemy.charge = 0;
            enemy.cooldown = Math.max(enemy.cooldown, 0.6);
        }
        if (this.timer <= 0) this.fail(host, 'Przekroczono czas starcia');
    }
}
