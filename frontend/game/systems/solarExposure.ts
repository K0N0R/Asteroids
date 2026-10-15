import type { Point } from '../worlds/sector';

export const SOLAR = { period: 40, warningAt: 22, flareAt: 28, cooling: 12, damage: 6 } as const;
export const MERCURY_SHELTERS = [
    { x: 1200, y: 400 },
    { x: 2300, y: -450 },
    { x: 3500, y: 700 },
] as const;
export function inSolarShadow(point: Point, rock: Point & { radius: number }) {
    const distance = rock.x - point.x;
    return (
        rock.radius >= 60 &&
        distance > rock.radius &&
        distance < 650 &&
        Math.abs(rock.y - point.y) < rock.radius * 0.72
    );
}
export class SolarExposure {
    heat = 0;
    elapsed = 0;
    sheltered = true;
    shielded = false;
    get phase() {
        return this.elapsed % SOLAR.period < SOLAR.warningAt
            ? 'calm'
            : this.elapsed % SOLAR.period < SOLAR.flareAt
              ? 'warning'
              : 'flare';
    }
    get remaining() {
        return Math.ceil(
            (this.phase === 'calm'
                ? SOLAR.warningAt
                : this.phase === 'warning'
                  ? SOLAR.flareAt
                  : SOLAR.period) -
                (this.elapsed % SOLAR.period),
        );
    }
    step(dt: number, sheltered: boolean, shielded: boolean) {
        this.elapsed += dt;
        this.sheltered = sheltered;
        this.shielded = shielded;
        const rate = sheltered
            ? -SOLAR.cooling
            : shielded
              ? this.phase === 'flare'
                  ? 8
                  : 1.5
              : this.phase === 'flare'
                ? 24
                : 10;
        this.heat = Math.max(0, Math.min(100, this.heat + rate * dt));
        return this.heat >= 100 && !sheltered ? SOLAR.damage * dt : 0;
    }
    get summary() {
        return `Temperatura ${Math.ceil(this.heat)}% · ${this.sheltered ? 'w osłonie / chłodzenie' : 'ekspozycja'} · ${this.phase === 'flare' ? `rozbłysk ${this.remaining} s` : this.phase === 'warning' ? `ROZBŁYSK ZA ${this.remaining} s` : `spokojnie ${this.remaining} s`}`;
    }
}
