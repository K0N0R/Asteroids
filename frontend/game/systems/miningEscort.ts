import { ResearchEscort } from './escort';
import { GAME, HULLS, JOBS } from '../config';
import { MOON } from '../worlds/moon';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { Point } from '../worlds/sector';
import type { NavigationRock } from './escort';

export const MINING_CONVOY = {
    site: { x: MOON.center.x - 500, y: MOON.center.y + 900 },
    home: { x: MOON.construction.x + 230, y: MOON.construction.y },
    target: HULLS.mule.cargo,
    damagePerSecond: 12,
    radius: 330,
    kitCost: { ore: JOBS.kit.ore * 2, parts: JOBS.kit.parts * 2 },
} as const;

export class MiningEscort extends ResearchEscort {
    cargoOre = 0;
    cargoParts = 0;
    deliveredOre = 0;
    trips = 0;
    repairKits = 0;
    repairProgress = 0;
    repairs = 0;
    returning = false;
    failed = '';
    underThreat = false;
    beam: { from: Point; to: Point } | null = null;
    readonly beams: { from: Point; to: Point }[] = [];
    constructor(world: RAPIER.World) {
        super(world, { ...MINING_CONVOY.site });
        this.health = HULLS.mule.health;
        this.body.setTranslation(
            { x: MINING_CONVOY.home.x / 100, y: MINING_CONVOY.home.y / 100 },
            true,
        );
        this.previous = this.position;
    }
    get cargoUsed() {
        return this.cargoOre + this.cargoParts;
    }
    get extracting() {
        return !this.returning && this.state === 'research' && !this.failed && !this.repairProgress;
    }
    get status() {
        if (this.failed) return `Muł: ${this.failed} · możesz kontynuować dostawy samodzielnie`;
        if (this.state === 'destroyed') return 'Muł zniszczony · dokończ dostawy lub ponów lot';
        if (this.state === 'complete') return 'Fundamenty gotowe · Muł odblokowany';
        if (this.state === 'idle') return 'Muł przy budowie · N: nawigacja · E: start eskorty';
        if (this.repairProgress)
            return `Muł: naprawa ${Math.floor(this.repairProgress)}/${GAME.repairSeconds} s`;
        if (this.state === 'waiting')
            return this.waitingReason === 'player'
                ? 'Muł czeka na eskortę'
                : 'Muł czeka na udrożnienie drogi';
        if (this.returning)
            return `Muł: dostawa do budowy · ${this.cargoOre} Fe / ${this.cargoParts} K`;
        if (this.extracting && this.underThreat)
            return 'Muł: wydobycie wstrzymane · usuń wrogów ze złoża';
        return `Muł: ${this.extracting ? 'wydobycie' : 'dolot do złoża'} · ładownia ${this.cargoUsed}/${MINING_CONVOY.target} · dostarczono ${this.deliveredOre} Fe`;
    }
    returnToStation() {
        this.returning = true;
        this.setDestination({ ...MINING_CONVOY.home });
        this.state = 'travel';
    }
    resumeMining(point: Point = MINING_CONVOY.site) {
        this.returning = false;
        this.setDestination({ ...point });
        this.state = 'travel';
    }
    complete() {
        this.state = 'complete';
        this.body.setLinvel({ x: 0, y: 0 }, true);
        this.collider.setSensor(true);
    }
    fail(reason: string) {
        this.failed = reason;
        this.state = 'failed';
        this.body.setLinvel({ x: 0, y: 0 }, true);
        this.beam = null;
        this.beams.length = 0;
    }
    override update(
        dt: number,
        player: Point,
        rocks: readonly NavigationRock[],
        hostileNear: boolean,
    ) {
        this.beam = null;
        this.beams.length = 0;
        this.underThreat = hostileNear;
        if (this.failed || this.state === 'destroyed' || this.state === 'idle') return false;
        if (this.state === 'complete') {
            this.departure += dt;
            return false;
        }
        if (
            this.health <= HULLS.mule.health - GAME.repairHull &&
            !hostileNear &&
            this.cooldown <= 0
        ) {
            if (
                !this.repairKits &&
                this.cargoOre >= MINING_CONVOY.kitCost.ore &&
                this.cargoParts >= MINING_CONVOY.kitCost.parts
            ) {
                this.cargoOre -= MINING_CONVOY.kitCost.ore;
                this.cargoParts -= MINING_CONVOY.kitCost.parts;
                this.repairKits++;
            }
            if (this.repairKits) {
                this.previous = this.position;
                this.previousAngle = this.body.rotation();
                this.body.setLinvel({ x: 0, y: 0 }, true);
                this.body.setAngvel(0, true);
                this.repairProgress += dt;
                if (this.repairProgress + 1e-8 >= GAME.repairSeconds) {
                    this.repairKits--;
                    this.health = Math.min(HULLS.mule.health, this.health + GAME.repairHull);
                    this.repairProgress = 0;
                    this.repairs++;
                }
                return false;
            }
        }
        this.repairProgress = 0;
        super.update(dt, player, rocks, true);
        return this.returning && this.state === 'research';
    }
    override damage(amount: number, safeRadius = 0) {
        this.repairProgress = 0;
        return super.damage(amount, safeRadius);
    }
}
