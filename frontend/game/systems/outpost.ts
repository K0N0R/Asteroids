import { OUTPOST } from '../config';
import type { OutpostSpec, Point } from '../worlds/sector';

/** Scanner and alarm timers use simulation time, including the existing pause rules. */
export class OutpostSecurity {
    trace = 0;
    disabledTime = 0;
    sabotaged = false;
    detection = 0;
    alarm = 0;
    secured = false;
    equipmentProgress = 0;
    equipmentSecured = false;
    equipmentArmed = false;
    reinforcementsCalled = false;
    constructor(readonly spec: OutpostSpec) {}

    raiseAlarm() {
        this.alarm = OUTPOST.alarmSeconds;
        const callGuards = !this.reinforcementsCalled;
        this.reinforcementsCalled = true;
        return callGuards;
    }
    disable() {
        if (this.sabotaged) return false;
        this.sabotaged = true;
        this.disabledTime = OUTPOST.disabledSeconds;
        this.detection = 0;
        this.alarm = 0;
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
    update(dt: number, exposed: boolean) {
        this.disabledTime = Math.max(0, this.disabledTime - dt);
        if (this.disabledTime > 0) {
            exposed = false;
            this.detection = 0;
        }
        this.alarm = Math.max(0, this.alarm - dt);
        this.detection = exposed
            ? Math.min(OUTPOST.detectSeconds, this.detection + dt)
            : Math.max(0, this.detection - dt * 2);
        let callGuards = false;
        if (this.detection + 1e-8 >= OUTPOST.detectSeconds) {
            callGuards = this.raiseAlarm();
        }
        return { callGuards };
    }
}
