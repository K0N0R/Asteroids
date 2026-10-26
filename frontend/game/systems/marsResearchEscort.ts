import type RAPIER from '@dimforge/rapier2d-compat';
import { ResearchEscort, type NavigationRock } from './escort';
import type { Point } from '../worlds/sector';
import {
    marsResearchLegClear,
    marsResearchPointClear,
    marsResearchScanTarget,
    MARS_RESEARCH_HOME,
} from '../worlds/marsResearch';

export class MarsResearchEscort extends ResearchEscort {
    protected override get navigationGridSize() {
        return 50;
    }
    protected override get navigationWaypointRadius() {
        return 15;
    }
    returning = false;
    scanTarget: Point;
    private lastSafe: Point = { x: 380, y: 0 };
    constructor(world: RAPIER.World, destination: Point) {
        super(world, destination);
        this.scanTarget = marsResearchScanTarget(destination);
    }
    protected override allowsTravel(a: Point, b: Point) {
        return marsResearchLegClear(a, b);
    }
    protected override get arrivalRadius() {
        return this.returning ? 35 : 90;
    }
    protected override get researchOnArrival() {
        return !this.returning;
    }
    override resumeResearch(point: Point) {
        this.returning = false;
        this.scanTarget = marsResearchScanTarget(point);
        return super.resumeResearch(point);
    }
    returnToStation() {
        super.resumeResearch(MARS_RESEARCH_HOME);
        this.returning = true;
        this.scanning = false;
    }
    override update(
        dt: number,
        player: Point,
        rocks: readonly NavigationRock[],
        hostileNear: boolean,
    ) {
        const complete = super.update(dt, player, rocks, hostileNear);
        if (this.state === 'research' && !this.repairing) {
            const p = this.position,
                a = Math.atan2(this.scanTarget.y - p.y, this.scanTarget.x - p.x),
                error = Math.atan2(
                    Math.sin(a - this.body.rotation()),
                    Math.cos(a - this.body.rotation()),
                );
            this.body.setAngvel(Math.max(-1.5, Math.min(1.5, error * 4)), true);
        }
        const p = this.position,
            v = this.velocity;
        if (!marsResearchLegClear(p, { x: p.x + v.x * dt * 3, y: p.y + v.y * dt * 3 }, 45))
            this.body.setLinvel({ x: 0, y: 0 }, true);
        if (marsResearchPointClear(p, 55)) this.lastSafe = { ...p };
        return complete;
    }
    /** Physics collisions must not push the research vessel into the hazard. */
    keepSafe() {
        if (this.state === 'destroyed') return;
        if (!marsResearchPointClear(this.position, 45)) {
            this.body.setTranslation({ x: this.lastSafe.x / 100, y: this.lastSafe.y / 100 }, true);
            this.body.setLinvel({ x: 0, y: 0 }, true);
            this.previous = { ...this.lastSafe };
        }
    }
}
