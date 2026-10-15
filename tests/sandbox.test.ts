import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier2d-compat';
import { HULLS, type HullId } from '../frontend/game/config';
import { newCampaign, SaveRepository } from '../frontend/game/state/campaign';
import {
    SandboxRun,
    SANDBOX_SCENARIOS,
    defaultSandboxConfig,
    normalizeSandboxConfig,
    type SandboxScenario,
} from '../frontend/game/systems/sandbox';
import { enemyPosition } from '../frontend/game/systems/enemies';

before(async () => RAPIER.init());
const idle = {
    target: { x: 2000, y: 0 },
    thrust: false,
    brake: false,
    fire: false,
    interact: false,
};

test('all sandbox scenarios initialize every hull with neutral pilot and identical supplies', () => {
    for (const scenario of Object.keys(SANDBOX_SCENARIOS) as SandboxScenario[]) {
        for (const hull of Object.keys(HULLS) as HullId[]) {
            const run = new SandboxRun({
                ...defaultSandboxConfig(),
                scenario,
                hull,
                armor: 2,
                weapon: 'rail',
            });
            try {
                const s = run.simulation;
                assert.equal(s.hullId, hull);
                assert.equal(s.maxHull, HULLS[hull].health + 50);
                assert.equal(s.repairKits, 3);
                assert.equal(s.pilot.turn, 1);
                assert.ok(run.objectives().length >= 1);
                assert.equal(run.report('stopped').completed, false);
                if (scenario === 'escort') assert.ok(s.escort);
                if (scenario === 'salvage') assert.ok(s.recoverySignal);
                if (scenario === 'mining') assert.equal(s.enemies.enemies.size, 0);
                for (let i = 0; i < 4; i++) s.step(idle);
                assert.ok(Number.isFinite(s.position.x));
            } finally {
                run.simulation.dispose();
            }
        }
    }
});

test('same seed, modules and fixed inputs reproduce the same mission state on restart', () => {
    const config = {
        ...defaultSandboxConfig(),
        scenario: 'combat' as const,
        hull: 'fighter' as const,
        drill: 1,
    };
    const digest = () => {
        const run = new SandboxRun(config);
        try {
            for (let i = 0; i < 240; i++) {
                const first = [...run.simulation.enemies.enemies.values()][0];
                run.simulation.step({
                    ...idle,
                    target: first ? enemyPosition(first) : idle.target,
                    fire: true,
                });
            }
            return {
                report: run.report('stopped'),
                position: run.simulation.position,
                enemies: [...run.simulation.enemies.enemies.values()].map((e) => [
                    e.id,
                    e.health,
                    enemyPosition(e),
                ]),
            };
        } finally {
            run.simulation.dispose();
        }
    };
    assert.deepEqual(digest(), digest());
});

test('mining layout varies with the seed and stays clear around the initial ship', () => {
    const a = new SandboxRun(defaultSandboxConfig()),
        b = new SandboxRun({ ...defaultSandboxConfig(), seed: 72 });
    try {
        assert.notDeepEqual(a.simulation.sector.rocks, b.simulation.sector.rocks);
        for (const rock of a.simulation.sector.rocks)
            assert.ok(
                Math.hypot(rock.x - a.simulation.position.x, rock.y - a.simulation.position.y) >
                    rock.radius + 180,
            );
    } finally {
        a.simulation.dispose();
        b.simulation.dispose();
    }
});

test('sandbox deliveries and deaths never write to the normal campaign repository', () => {
    let writes = 0,
        stored = '';
    const repository = new SaveRepository({
        getItem: () => stored || null,
        setItem: (_key, value) => {
            writes++;
            stored = value;
        },
    });
    const real = newCampaign();
    real.bank = { ore: 73, parts: 12, crystals: 4 };
    repository.save(real);
    const saved = stored,
        snapshot = JSON.stringify(real),
        before = writes;
    const run = new SandboxRun({ ...defaultSandboxConfig(), scenario: 'salvage', hull: 'tug' });
    try {
        const s = run.simulation,
            item = s.salvage.items.get(8801)!;
        assert.ok(s.salvage.attach(item, s.ship));
        s.ship.setTranslation({ x: 1, y: 0 }, true);
        item.body.setTranslation({ x: 0.5, y: 0 }, true);
        s.step(idle);
        assert.equal(run.report('stopped').deliveries, 1);
        assert.equal(run.report('stopped').completed, true);
        assert.ok(run.campaign.bank.ore > 0);
        s.hull = 0;
        s.step(idle);
        assert.equal(s.ended, 'destroyed');
        assert.equal(writes, before);
        assert.equal(stored, saved);
        assert.equal(JSON.stringify(real), snapshot);
    } finally {
        run.simulation.dispose();
    }
});

test('report counts real combat damage, is detached, and a fresh attempt resets counters', () => {
    const config = {
        ...defaultSandboxConfig(),
        scenario: 'combat' as const,
        hull: 'fighter' as const,
    };
    const run = new SandboxRun(config);
    try {
        for (let i = 0; i < 600 && !run.simulation.ended; i++) {
            const first = [...run.simulation.enemies.enemies.values()][0];
            run.simulation.step({
                ...idle,
                target: first ? enemyPosition(first) : idle.target,
                fire: true,
            });
        }
        const report = run.report('stopped');
        assert.ok(report.statistics.enemyDamage > 0);
        assert.ok(report.seconds > 0);
        const elapsed = report.seconds;
        run.simulation.step(idle);
        assert.equal(report.seconds, elapsed);
        report.statistics.enemyDamage = -999;
        assert.ok(run.simulation.statistics.enemyDamage >= 0);
        const next = new SandboxRun(config);
        try {
            assert.equal(next.simulation.statistics.enemyDamage, 0);
            assert.equal(next.simulation.elapsed, 0);
            assert.equal(next.simulation.repairKits, 3);
        } finally {
            next.simulation.dispose();
        }
    } finally {
        run.simulation.dispose();
    }
});

test('repair totals count consumed kits and damage totals exclude overkill', () => {
    const run = new SandboxRun(defaultSandboxConfig());
    try {
        const s = run.simulation;
        s.kineticShield.charge = 0;
        s['takeDamage'](20, 'Test');
        assert.equal(s.statistics.hullDamage, 20);
        for (let i = 0; i < 360; i++) s.step({ ...idle, repair: true });
        assert.equal(s.statistics.repairKitsUsed, 1);
        assert.equal(s.repairKits, 2);
        s['takeDamage'](10000, 'Test');
        assert.ok(s.statistics.hullDamage <= s.maxHull + 20);
    } finally {
        run.simulation.dispose();
    }
});

test('damage reports include Aegis pulse absorption before the kinetic shield', () => {
    const run = new SandboxRun({ ...defaultSandboxConfig(), hull: 'aegis' });
    try {
        const s = run.simulation;
        assert.ok(s.aegis!.pulse(s.position, []));
        const charge = s.kineticShield.charge;
        s['takeDamage'](20, 'Test');
        assert.equal(s.kineticShield.charge, charge);
        assert.equal(s.hull, s.maxHull);
        assert.equal(s.statistics.shieldDamage, 20);
        s['takeDamage'](1000, 'Test');
        assert.equal(s.statistics.shieldDamage, 80 + charge);
        assert.equal(s.statistics.hullDamage, s.maxHull);
    } finally {
        run.simulation.dispose();
    }
});

test('scenario objectives require actual return, while delivered salvage stays completed', () => {
    const run = new SandboxRun(defaultSandboxConfig());
    try {
        run.simulation.cargo.ore = 10;
        assert.equal(run.report('stopped').completed, false);
        run.simulation.ship.setTranslation({ x: 1, y: 0 }, true);
        run.simulation.ship.setLinvel({ x: 0, y: 0 }, true);
        for (let i = 0; i < 90; i++) run.simulation.step({ ...idle, interact: true });
        assert.equal(run.simulation.ended, 'returned');
        assert.equal(run.report('returned').completed, true);
    } finally {
        run.simulation.dispose();
    }
});

test('untrusted setup values normalize without granting unknown hulls or module levels', () => {
    const c = normalizeSandboxConfig({
        ...defaultSandboxConfig(),
        hull: 'missing' as HullId,
        scenario: 'missing' as SandboxScenario,
        engine: 99,
        cargo: -3,
        seed: NaN,
    });
    assert.equal(c.hull, 'prospector');
    assert.equal(c.scenario, 'sector');
    assert.equal(c.engine, 3);
    assert.equal(c.cargo, 0);
    assert.equal(c.seed, 71);
});
