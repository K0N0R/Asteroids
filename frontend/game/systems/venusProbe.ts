import { ResearchEscort, type NavigationRock } from './escort';
import { V, VENUS_SAMPLES } from '../worlds/venusLayout';
import type { Point } from '../worlds/sector';

/** Probe motion and scanning share one clock, including the post-hit cooldown. */
export class VenusProbe extends ResearchEscort {
    started = false;
    stage: 'orbit' | 'atmosphere' = 'orbit';
    sampleProgress = 0;
    sampleIndex = 0;
    blocked: 'threat' | 'distance' | 'recovering' | 'incoming' | null = null;
    protected override get selfRepairEnabled() {
        return false;
    }
    protected override get researchOnArrival() {
        return false;
    }
    get sampleTarget() {
        return VENUS_SAMPLES[this.sampleIndex];
    }
    launch() {
        this.started = true;
        this.stage = 'orbit';
        this.resumeResearch({ ...V.atmosphereApproach });
    }
    enterAtmosphere(index: number) {
        this.stage = 'atmosphere';
        this.moveToSample(index);
    }
    moveToSample(index: number) {
        this.sampleIndex = Math.max(0, Math.min(2, index));
        const q = this.sampleTarget;
        this.sampleProgress = 0;
        this.resumeResearch({ x: q.x - 150, y: q.y - 80 });
    }
    override update(
        dt: number,
        player: Point,
        rocks: readonly NavigationRock[],
        hostileNear: boolean,
        waveReady = true,
    ) {
        if (this.state === 'research') {
            this.previous = this.position;
            this.previousAngle = this.body.rotation();
            this.cooldown = Math.max(0, this.cooldown - dt);
            this.scanning = false;
        } else super.update(dt, player, rocks, hostileNear);
        if (this.stage !== 'atmosphere' || !['complete', 'research'].includes(this.state))
            return false;
        this.state = 'research';
        this.collider.setSensor(false);
        this.body.setLinvel({ x: 0, y: 0 }, true);
        this.body.setAngvel(0, true);
        this.blocked = hostileNear
            ? 'threat'
            : Math.hypot(player.x - this.position.x, player.y - this.position.y) > 650
              ? 'distance'
              : this.cooldown > 0
                ? 'recovering'
                : !waveReady
                  ? 'incoming'
                  : null;
        this.scanning = this.blocked === null;
        if (this.scanning) this.sampleProgress += dt;
        return this.sampleProgress + 1e-8 >= 15;
    }
}
