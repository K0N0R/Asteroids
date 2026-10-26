import type { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import { researchPath } from '../frontend/game/systems/escort';
import { VenusProbe } from '../frontend/game/systems/venusProbe';
import { VENUS_POWER_TILES } from '../frontend/game/systems/venusPower';
import { V, VENUS_MAPS } from '../frontend/game/worlds/venusLayout';
import { VENUS_LAB_MODULES } from '../frontend/game/worlds/venusLaboratory';
import { enemyPosition } from '../frontend/game/systems/enemies';
import type { Point } from '../frontend/game/worlds/sector';

/** Acceptance pilot: normal turn/thrust/brake/weapons/F only. No teleport, heal or kill API. */
export class VenusFlightPilot {
    phase = '';
    history: string[] = [];
    shots = 0;
    minHull = Infinity;
    private path: Point[] = [];
    private destination: Point = { x: Infinity, y: Infinity };
    private clock = 0;
    next(s: MissionSimulation): FlightInput {
        this.minHull = Math.min(this.minHull, s.hull);
        const act = s.venusAct!,
            story = s.campaign.story!,
            v = story.venus!;
        const has = (id: string) => story.claimed.includes(id);
        let goal: Point = { x: 0, y: 0 },
            phase = 'Powrót do Satuk 15';
        let interact = true;
        if (!has('venus-toxic-orbit')) {
            goal = V.relay;
            phase = 'Przekaźnik';
        } else if (!has('venus-dead-laboratory') && !act.packet) {
            goal = act.area === 'orbit' ? V.stationGate : v.powerRestored ? V.archive : V.power;
            phase =
                act.area === 'orbit'
                    ? 'Dolot do śluzy laboratorium'
                    : v.powerRestored
                      ? 'Archiwum'
                      : 'Zasilanie';
        } else if (act.packet) {
            goal =
                act.area === 'station'
                    ? V.stationEntry
                    : act.area === 'installation'
                      ? V.aiEntry
                      : goal;
            phase = 'Dostarczenie ' + act.packet;
        } else if (!has('venus-atmospheric-probe') && v.probeBuilt) {
            const e = s.escort as VenusProbe;
            phase = 'Eskorta / ' + e.stage + ' / ' + v.transmission;
            if (!e.started) goal = V.probe;
            else if (e.stage === 'orbit' && e.state === 'complete') goal = V.atmosphereApproach;
            else {
                // Follow beside the probe, leaving its physical flight path clear.
                goal = { x: e.position.x + 170, y: e.position.y - 120 };
                interact = false;
            }
        } else if (has('venus-atmospheric-probe') && !has('venus-horizon-project')) {
            goal = act.area === 'atmosphere' ? V.atmosphereAscent : goal;
        } else if (has('venus-horizon-project') && !has('venus-mercury-signal')) {
            goal = act.area === 'orbit' ? V.aiGate : V.terminal;
            phase = 'Instalacja SI';
        }
        if (phase !== this.phase) {
            this.phase = phase;
            this.history.push(phase);
        }
        if (act.powerPuzzle) {
            const p = act.powerPuzzle;
            if (!p.state.isolated) act.powerAction({ isolate: true });
            else {
                const i = p.state.rotations.findIndex(
                    (n, i) => n !== 0 && !!VENUS_POWER_TILES[i] && VENUS_POWER_TILES[i] !== 15,
                );
                act.powerAction(i >= 0 ? { rotate: i } : { confirm: true });
            }
        }
        const hostile = [...s.enemies.enemies.values()]
            .filter(
                (e) =>
                    e.body.isEnabled() &&
                    e.health > 0 &&
                    (e.id !== 81900 || act.allowDamage(e.id)) &&
                    Math.hypot(
                        enemyPosition(e).x - s.position.x,
                        enemyPosition(e).y - s.position.y,
                    ) < (act.guardianAwake ? 2000 : 1000),
            )
            .sort(
                (a, b) =>
                    Math.hypot(
                        enemyPosition(a).x - s.position.x,
                        enemyPosition(a).y - s.position.y,
                    ) -
                    Math.hypot(
                        enemyPosition(b).x - s.position.x,
                        enemyPosition(b).y - s.position.y,
                    ),
            )[0];
        let aim = goal;
        if (hostile) {
            const p = enemyPosition(hostile),
                vel = hostile.body.linvel(),
                own = s.velocity;
            const time = Math.hypot(p.x - s.position.x, p.y - s.position.y) / 1150;
            aim = { x: p.x + (vel.x * 100 - own.x) * time, y: p.y + (vel.y * 100 - own.y) * time };
            if (act.guardianAwake) {
                const dx = s.position.x - p.x,
                    dy = s.position.y - p.y,
                    d = Math.hypot(dx, dy) || 1;
                goal = { x: p.x + (dx / d) * 440, y: p.y + (dy / d) * 440 };
            }
        }
        const input = this.fly(s, goal, interact && !hostile);
        input.target = aim;
        input.fire = !!hostile;
        if (hostile) this.shots++;
        return input;
    }
    private fly(s: MissionSimulation, goal: Point, interact: boolean): FlightInput {
        if (
            ++this.clock % 90 === 0 ||
            Math.hypot(goal.x - this.destination.x, goal.y - this.destination.y) > 90
        ) {
            this.destination = { ...goal };
            const rocks = [...s.rocks.values()]
                .filter((r) => r.body.isEnabled())
                .map((r) => ({
                    x: r.body.translation().x * 100,
                    y: r.body.translation().y * 100,
                    radius: r.radius + 35,
                }));
            if (s.venusAct!.area === 'station')
                rocks.push(
                    ...VENUS_LAB_MODULES.map((m) => ({
                        x: VENUS_MAPS.station.center.x + m.x,
                        y: VENUS_MAPS.station.center.y + m.y,
                        radius: Math.hypot(m.width, m.height) / 2 + 15,
                    })),
                );
            this.path = researchPath(s.position, goal, rocks);
        }
        if (
            this.path.length > 1 &&
            Math.hypot(this.path[0].x - s.position.x, this.path[0].y - s.position.y) < 85
        )
            this.path.shift();
        const q = this.path[0] ?? goal,
            dx = q.x - s.position.x,
            dy = q.y - s.position.y,
            d = Math.hypot(dx, dy);
        const final = Math.hypot(goal.x - s.position.x, goal.y - s.position.y);
        const angle = Math.atan2(dy, dx),
            error = Math.atan2(
                Math.sin(angle - s.ship.rotation()),
                Math.cos(angle - s.ship.rotation()),
            );
        const stop = (s.speed * s.speed) / (2 * 650) + 35;
        const thrust = final > 60 && d > stop && Math.abs(error) < 0.22;
        return {
            target: goal,
            thrust,
            brake: false,
            turn: final > 60 ? Math.max(-1, Math.min(1, error * 2.5)) : 0,
            boost: d > 1000 && Math.abs(error) < 0.08,
            fire: false,
            interact: interact && final < 95 && s.speed < 40,
        };
    }
}
