import type { Cargo } from '../state/campaign';
import { cargoLoad, resourceSummary } from '../state/resources';
import { ResearchEscort } from './escort';
import { GAME, HULLS } from '../config';
import { MOON } from '../worlds/moon';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { Point } from '../worlds/sector';
import type { NavigationRock } from './escort';
import { GripperSystem } from './grippers';

export const MINING_CONVOY = {
    site: { x: MOON.center.x - 500, y: MOON.center.y + 900 },
    home: { x: MOON.construction.x + 230, y: MOON.construction.y },
    target: HULLS.mule.cargo,
    radius: 330,
} as const;

export class MiningEscort extends ResearchEscort {
    readonly grippers = new GripperSystem(HULLS.mule.grabbers, HULLS.mule.grabberRange);
    readonly cargo: Cargo = { ore: 0, parts: 0 };
    get cargoOre() {
        return this.cargo.ore;
    }
    set cargoOre(n: number) {
        this.cargo.ore = n;
    }
    get cargoParts() {
        return this.cargo.parts;
    }
    set cargoParts(n: number) {
        this.cargo.parts = n;
    }
    deliveredOre = 0;
    trips = 0;
    protected override get selfRepairEnabled() {
        return false;
    }
    returning = false;
    processingReady = true;
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
    override get vulnerable() {
        return this.state !== 'destroyed' && this.state !== 'failed';
    }
    get cargoUsed() {
        return cargoLoad(this.cargo);
    }
    get extracting() {
        return !this.returning && this.state === 'research' && !this.failed && !this.repairProgress;
    }
    get status() {
        if (this.failed) return `Muł: ${this.failed} · możesz kontynuować dostawy samodzielnie`;
        if (this.state === 'destroyed') return 'Muł zniszczony · dokończ dostawy lub ponów lot';
        if (this.state === 'complete') return 'Dostawy zakończone · odbierz instalacje stacji';
        if (!this.processingReady)
            return 'Muł czeka na montaż linii przetwarzania i zasilania stacji';
        if (this.state === 'idle') return 'Muł przy budowie · N: nawigacja · F: start eskorty';
        if (this.repairProgress)
            return `Muł: naprawa ${Math.floor(this.repairProgress)}/${GAME.repairSeconds} s`;
        if (this.state === 'waiting')
            return this.waitingReason === 'player'
                ? 'Muł czeka na eskortę'
                : 'Muł czeka na udrożnienie drogi';
        if (this.returning) return `Muł: dostawa do budowy · ${resourceSummary(this.cargo)}`;
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
        this.failed = '';
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
        if (
            this.health <= HULLS.mule.health - GAME.repairHull &&
            !hostileNear &&
            this.cooldown <= 0
        ) {
            this.previous = this.position;
            this.previousAngle = this.body.rotation();
            this.body.setLinvel({ x: 0, y: 0 }, true);
            this.body.setAngvel(0, true);
            this.repairProgress += dt;
            if (this.repairProgress + 1e-8 >= GAME.repairSeconds) {
                this.health = Math.min(HULLS.mule.health, this.health + GAME.repairHull);
                this.repairProgress = 0;
                this.repairs++;
            }
            return false;
        }
        this.repairProgress = 0;
        if (this.state === 'complete') {
            this.departure += dt;
            return false;
        }
        super.update(dt, player, rocks, true);
        return this.returning && this.state === 'research';
    }
    override damage(amount: number, safeRadius = 0) {
        this.repairProgress = 0;
        return super.damage(amount, safeRadius);
    }
}
