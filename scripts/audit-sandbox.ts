import RAPIER from '@dimforge/rapier2d-compat';
import { writeFileSync, mkdirSync } from 'node:fs';
import { HULLS, GAME, type HullId } from '../frontend/game/config';
import { SandboxRun, defaultSandboxConfig } from '../frontend/game/systems/sandbox';
import { angleDifference } from '../frontend/game/systems/flight';
import { enemyPosition } from '../frontend/game/systems/enemies';
import type { MissionSimulation, FlightInput } from '../frontend/game/systems/mission';
import { MissionSimulation as Simulation } from '../frontend/game/systems/mission';
import {
    beginRun,
    finishRun,
    newCampaign,
    buyUpgrade,
    parseCampaign,
} from '../frontend/game/state/campaign';
import { manufacture } from '../frontend/game/state/production';
import assert from 'node:assert/strict';

const idle: FlightInput = {
    target: { x: 0, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};
function steer(s: MissionSimulation, target: { x: number; y: number }, radius: number) {
    const dx = target.x - s.position.x,
        dy = target.y - s.position.y;
    const distance = Math.hypot(dx, dy);
    const error = angleDifference(Math.atan2(dy, dx), s.ship.rotation());
    const stop = (s.speed * s.speed) / (2 * s.hullConfig.brake);
    return {
        ...idle,
        target,
        turn: Math.max(-1, Math.min(1, error * 2.5)),
        thrust: Math.abs(error) < 0.3 && distance > radius + stop + 15,
        brake: s.speed > 20 && (distance < radius + stop || Math.abs(error) > 0.6),
    };
}
function mine(s: MissionSimulation): FlightInput {
    const p = s.position;
    const loot = [...s.loot.values()].sort(
        (a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    )[0];
    if (loot && Math.hypot(loot.x - p.x, loot.y - p.y) < 450) return steer(s, loot, 45);
    const rocks = [...s.rocks.values()].sort((a, b) => {
        const ap = a.body.translation(),
            bp = b.body.translation();
        return (
            Math.hypot(ap.x * 100 - p.x, ap.y * 100 - p.y) -
            Math.hypot(bp.x * 100 - p.x, bp.y * 100 - p.y)
        );
    });
    const r = rocks[0];
    if (!r) return idle;
    const pos = r.body.translation();
    const input = steer(s, { x: pos.x * 100, y: pos.y * 100 }, r.radius + 70);
    return { ...input, fire: true, mine: true };
}

async function main() {
    await RAPIER.init();
    const rows: object[] = [];
    for (const seed of [71, 2026])
        for (const hull of Object.keys(HULLS) as HullId[])
            for (const level of [0, 3]) {
                for (const scenario of [
                    'mining',
                    'bulk-mining',
                    'combat',
                    'combat-lancer',
                ] as const) {
                    const mining = scenario === 'mining' || scenario === 'bulk-mining';
                    const run = new SandboxRun({
                        ...defaultSandboxConfig(),
                        hull,
                        seed,
                        scenario: mining ? 'mining' : 'combat',
                        engine: level,
                        handling: level,
                        cargo: level,
                        drill: level,
                        armor: level,
                        shield: level,
                    });
                    const s = run.simulation;
                    if (scenario === 'bulk-mining') {
                        for (let i = 0; i < 25; i++)
                            s['addRock']({
                                x: 2000 + (i % 5) * 220,
                                y: (Math.floor(i / 5) - 2) * 220,
                                radius: 45,
                                rich: true,
                                variant: i,
                                vx: 0,
                                vy: 0,
                            });
                    }
                    if (scenario === 'combat-lancer') {
                        for (const id of [...s.enemies.enemies.keys()])
                            s.enemies.damage(id, 100000);
                        s.enemies.add(s.sector.enemies.map((e) => ({ ...e, kind: 'lancer' })));
                    }
                    let peakSpeed = 0,
                        firstKill: number | null = null;
                    try {
                        for (let frame = 0; frame < 40 / GAME.step && !s.ended; frame++) {
                            let input: FlightInput;
                            if (mining) input = mine(s);
                            else {
                                const enemies = [...s.enemies.enemies.values()].sort((a, b) => {
                                    const ap = enemyPosition(a),
                                        bp = enemyPosition(b),
                                        p = s.position;
                                    return (
                                        Math.hypot(ap.x - p.x, ap.y - p.y) -
                                        Math.hypot(bp.x - p.x, bp.y - p.y)
                                    );
                                });
                                const enemy = enemies[0];
                                input = enemy
                                    ? {
                                          ...steer(
                                              s,
                                              enemyPosition(enemy),
                                              hull === 'harpoon' ? 45 : 180,
                                          ),
                                          fire: true,
                                          mine: frame % 180 < 120,
                                      }
                                    : idle;
                            }
                            // Edge-triggered abilities must be pressed again, rather than held forever.
                            if (hull === 'widmo')
                                input = { ...input, fire: frame % 120 === 0, mine: false };
                            if (hull === 'harpoon')
                                input = { ...input, fire: frame % 60 === 0, mine: true };
                            s.step(input);
                            if (s.enemyKills && firstKill === null) firstKill = s.elapsed;
                            peakSpeed = Math.max(peakSpeed, s.speed);
                            s.events.length = 0;
                            if (!mining && s.enemyKills >= 2) break;
                        }
                        const report = run.report(s.ended ?? 'stopped');
                        if (![s.position.x, s.position.y, s.hull, s.speed].every(Number.isFinite))
                            throw new Error(`Invalid physics: ${hull}`);
                        rows.push({
                            seed,
                            hull,
                            level,
                            scenario,
                            seconds: Number(s.elapsed.toFixed(2)),
                            cargo: s.cargoUsed,
                            kills: s.enemyKills,
                            firstKill,
                            peakSpeed: Number(peakSpeed.toFixed(1)),
                            remainingHull: Number(s.hull.toFixed(1)),
                            maxHull: s.maxHull,
                            damage: Number(report.statistics.enemyDamage.toFixed(1)),
                            received: Number(report.statistics.hullDamage.toFixed(1)),
                            rocks: report.statistics.rocksDestroyed,
                            ended: s.ended,
                        });
                    } finally {
                        s.dispose();
                    }
                }
                console.log(`audited seed ${seed}: ${hull} ${level}`);
            }
    mkdirSync('dist/audit', { recursive: true });
    writeFileSync(
        'dist/audit/sandbox-balance.json',
        JSON.stringify(
            {
                method: '40 seconds fixed-step scripted pilot; standard weapons; mining seeks nearest loot/rock; bulk-mining adds 25 rich rocks; combat seeks nearest enemy and uses both actions (edge-triggered arms/dash are pulsed); combat-lancer replaces the two patrols with Lancers at the same positions. No return or rewards. Not an optimal player or a rendered FPS benchmark.',
                rows,
            },
            null,
            2,
        ),
    );
    const columns = Object.keys(rows[0]);
    writeFileSync(
        'dist/audit/sandbox-balance.csv',
        [
            columns.join(','),
            ...rows.map((row) =>
                columns.map((key) => String((row as Record<string, unknown>)[key] ?? '')).join(','),
            ),
        ].join('\n') + '\n',
    );
    console.log(`Saved ${rows.length} attempts to dist/audit/sandbox-balance.json`);
    const c = newCampaign();
    const progression: object[] = [];
    for (let sortie = 0; sortie < 24 && c.station.workshop < 2; sortie++) {
        buyUpgrade(c, 'workshop');
        if (c.bank.parts < 12) {
            manufacture(c, 'steel');
            manufacture(c, 'plating');
        }
        assert.ok(beginRun(c, 71 + sortie), 'Normal campaign must allow the next sortie');
        const s = new Simulation(c, 71 + sortie);
        try {
            let returning = false;
            for (let frame = 0; frame < 180 / GAME.step && !s.ended; frame++) {
                returning ||= s.cargoUsed >= 25 || s.elapsed > 90;
                const flight = returning ? steer(s, { x: 0, y: 0 }, 85) : mine(s);
                s.step({ ...flight, interact: returning && s.distanceHome < 170 && s.speed < 60 });
                s.events.length = 0;
            }
            const result = finishRun(
                c,
                s.ended === 'returned',
                s.cargo,
                s.elapsed,
                'audit',
                s.repairKits,
                {
                    lossPosition: s.position,
                    data: [...s.surveyData],
                    kills: s.enemyKills,
                },
            );
            assert.ok(result);
            const state = JSON.stringify(c);
            assert.equal(finishRun(c, true, s.cargo, s.elapsed, 'duplicate'), null);
            assert.equal(JSON.stringify(c), state);
            assert.deepEqual(parseCampaign(state), c);
            progression.push({
                sortie: sortie + 1,
                result: s.ended ?? 'timeout',
                cargo: result.cargo,
                bank: { ...c.bank },
                station: { ...c.station },
                seconds: s.elapsed,
                overflow: result.overflow,
            });
            if (s.ended !== 'returned') break;
        } finally {
            s.dispose();
        }
    }
    buyUpgrade(c, 'workshop');
    writeFileSync(
        'dist/audit/progression.json',
        JSON.stringify(
            {
                method: 'Fresh ordinary campaign; real generated sectors, scripted mining and return; actual rewards, staff jobs, purchases and save roundtrips; no resources injected. Controller is not an optimal player.',
                workshop: c.station.workshop,
                bank: c.bank,
                progression,
            },
            null,
            2,
        ),
    );
    console.log(`Progression: ${progression.length} sorties, workshop ${c.station.workshop}`);
    assert.equal(c.station.workshop, 2, 'Scripted economy route must reach workshop II');
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
