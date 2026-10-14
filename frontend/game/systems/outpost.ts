import { OUTPOST } from '../config';
import type { OutpostSpec, Point } from '../worlds/sector';

/** Security and download timers use simulation time, including the existing pause rules. */
export class OutpostSecurity {
    sabotageProgress = 0;
    disabledTime = 0;
    sabotaged = false;
    detection = 0;
    alarm = 0;
    download = 0;
    secured = false;
    reinforcementsCalled = false;
    constructor(readonly spec: OutpostSpec) {}

    disable() {
        if (this.sabotaged) return false;
        this.sabotaged = true;
        this.sabotageProgress = 0;
        this.disabledTime = OUTPOST.disabledSeconds;
        this.detection = 0;
        this.alarm = 0;
        this.download = 0;
        return true;
    }
    scannerAngle(elapsed: number) {
        return this.spec.phase + elapsed * OUTPOST.scanSpeed;
    }
    sees(player: Point, elapsed: number, signature: number, lineClear: boolean) {
        const dx = player.x - this.spec.x,
            dy = player.y - this.spec.y;
        const angle = Math.atan2(dy, dx) - this.scannerAngle(elapsed);
        const error = Math.atan2(Math.sin(angle), Math.cos(angle));
        return (
            this.disabledTime <= 0 &&
            lineClear &&
            Math.hypot(dx, dy) < OUTPOST.scanRange * signature &&
            Math.abs(error) < OUTPOST.scanHalfAngle
        );
    }
    update(dt: number, exposed: boolean, canDownload: boolean) {
        this.disabledTime = Math.max(0, this.disabledTime - dt);
        if (this.disabledTime > 0) {
            exposed = false;
            this.alarm = 0;
            this.detection = 0;
        }
        this.alarm = Math.max(0, this.alarm - dt);
        this.detection = exposed
            ? Math.min(OUTPOST.detectSeconds, this.detection + dt)
            : Math.max(0, this.detection - dt * 2);
        let callGuards = false;
        if (this.detection + 1e-8 >= OUTPOST.detectSeconds) {
            this.alarm = OUTPOST.alarmSeconds;
            if (!this.reinforcementsCalled) {
                this.reinforcementsCalled = true;
                callGuards = true;
            }
        }
        // A scan is a warning first. A completed alarm locks the terminal until it expires.
        if (!canDownload || this.alarm > 0 || this.secured) this.download = 0;
        else this.download += dt;
        let completed = false;
        if (!this.secured && this.download + 1e-8 >= OUTPOST.downloadSeconds) {
            this.secured = true;
            this.download = 0;
            completed = true;
        }
        return { callGuards, completed };
    }
}
