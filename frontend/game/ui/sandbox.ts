import { Container, Graphics } from 'pixi.js';
import { HULLS, shipUpgradeDefinition, type HullId, type WeaponId } from '../config';
import { newShip } from '../state/campaign';
import {
    SANDBOX_SCENARIOS,
    normalizeSandboxConfig,
    type SandboxConfig,
    type SandboxReport,
    type SandboxScenario,
} from '../systems/sandbox';
import { C } from '../graphics/shapes';
import { button, clear, label, panel } from './primitives';
import { fittedShip } from './lobbyGraphics';
import { MODULE_KEYS } from './modulePreview';

export class SandboxSetup extends Container {
    private config: SandboxConfig;
    private editingSeed = false;
    private seedDraft = '';
    constructor(
        config: SandboxConfig,
        private launch: (config: SandboxConfig) => void,
        private close: () => void,
    ) {
        super();
        this.config = normalizeSandboxConfig(config);
        this.render();
    }
    handleKey(key: string) {
        if (!this.editingSeed) return;
        if (key === 'enter') this.editingSeed = false;
        else if (key === 'backspace') this.seedDraft = this.seedDraft.slice(0, -1);
        else if (/^\d$/.test(key) && this.seedDraft.length < 10) this.seedDraft += key;
        else return;
        if (this.seedDraft) this.config.seed = Math.min(4294967295, Number(this.seedDraft));
        this.render();
    }
    private render() {
        clear(this);
        const c = this.config;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.95 });
        shade.eventMode = 'static';
        this.addChild(shade);
        panel(this, 80, 60, 1440, 780);
        label(this, 'SANDBOX / PRÓBY MECHANIK', 120, 91, 31, C.mint);
        label(
            this,
            'Osobna sesja · bez nagród i strat w kampanii · 3 zestawy · pilot bez premii',
            120,
            143,
            16,
            C.muted,
        );
        button(this, 'WRÓĆ DO BAZY', 1310, 88, 170, this.close, false, true, 36);
        (Object.keys(SANDBOX_SCENARIOS) as SandboxScenario[]).forEach((key, i) =>
            button(
                this,
                SANDBOX_SCENARIOS[key].name,
                120 + (i % 4) * 202,
                197 + Math.floor(i / 4) * 45,
                188,
                () => {
                    c.scenario = key;
                    this.render();
                },
                c.scenario === key,
                true,
                35,
            ),
        );
        label(this, SANDBOX_SCENARIOS[c.scenario].detail, 120, 300, 16, C.text, 780);
        label(this, 'KADŁUB / WSZYSTKIE SPECJALIZACJE', 120, 346, 12, C.muted);
        (Object.keys(HULLS) as HullId[]).forEach((key, i) =>
            button(
                this,
                HULLS[key].name.replace(' odzyskany', ''),
                120 + (i % 4) * 200,
                374 + Math.floor(i / 4) * 43,
                184,
                () => {
                    c.hull = key;
                    this.render();
                },
                c.hull === key,
                true,
                33,
            ),
        );
        MODULE_KEYS.forEach((key, i) => {
            const x = 120 + (i % 3) * 270,
                y = 565 + Math.floor(i / 3) * 77;
            label(this, shipUpgradeDefinition(c.hull, key).title, x, y, 14, C.muted, 250);
            for (const [level, text] of ['0', 'I', 'II', 'III'].entries())
                button(
                    this,
                    text,
                    x + level * 47,
                    y + 27,
                    40,
                    () => {
                        c[key] = level;
                        this.render();
                    },
                    c[key] === level,
                    true,
                    30,
                );
        });
        label(this, 'SEED · kliknij liczbę i wpisz własną, zatwierdź Enter', 120, 734, 12, C.muted);
        button(
            this,
            '−',
            120,
            762,
            40,
            () => {
                c.seed = Math.max(0, c.seed - 1);
                this.editingSeed = false;
                this.render();
            },
            false,
            true,
            36,
        );
        button(
            this,
            this.editingSeed ? this.seedDraft || 'Wpisz seed…' : `${c.seed}`,
            170,
            762,
            190,
            () => {
                this.editingSeed = true;
                this.seedDraft = '';
                this.render();
            },
            this.editingSeed,
            true,
            36,
        );
        button(
            this,
            '+',
            370,
            762,
            40,
            () => {
                c.seed = Math.min(4294967295, c.seed + 1);
                this.editingSeed = false;
                this.render();
            },
            false,
            true,
            36,
        );
        button(
            this,
            'Losuj',
            430,
            762,
            115,
            () => {
                c.seed = crypto.getRandomValues(new Uint32Array(1))[0];
                this.editingSeed = false;
                this.render();
            },
            false,
            true,
            36,
        );
        panel(this, 1000, 190, 480, 530);
        label(this, HULLS[c.hull].name, 1030, 218, 28, C.text, 400);
        label(this, HULLS[c.hull].role, 1030, 260, 16, C.muted);
        const view = fittedShip({ ...newShip(1, c.hull), ...c }, 320, 275);
        view.position.set(1240, 432);
        this.addChild(view);
        label(this, 'WARIANT UZBROJENIA', 1030, 592, 12, C.muted);
        (['standard', 'pulse', 'rail'] as WeaponId[]).forEach((weapon, i) =>
            button(
                this,
                ['Standard', 'Impulsowy', 'Ciężki'][i],
                1030 + i * 145,
                625,
                132,
                () => {
                    c.weapon = weapon;
                    this.render();
                },
                c.weapon === weapon,
                true,
                35,
            ),
        );
        label(
            this,
            'F6 restart tej samej próby · F7 zakończenie i wynik',
            1030,
            685,
            13,
            C.muted,
            420,
        );
        button(
            this,
            'URUCHOM PRÓBĘ →',
            1030,
            757,
            420,
            () => this.launch(normalizeSandboxConfig(c)),
            true,
            true,
            44,
        );
    }
}

export function sandboxResult(
    root: Container,
    report: SandboxReport,
    previous: readonly SandboxReport[],
    restart: () => void,
    configure: () => void,
    close: () => void,
) {
    clear(root);
    const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.95 });
    shade.eventMode = 'static';
    root.addChild(shade);
    panel(root, 160, 90, 1280, 720);
    label(root, 'SANDBOX / WYNIK PRÓBY', 205, 123, 28, C.mint);
    label(
        root,
        `${SANDBOX_SCENARIOS[report.config.scenario].name} · ${HULLS[report.config.hull].name} · seed ${report.config.seed}`,
        205,
        169,
        19,
        C.text,
        1180,
    );
    label(
        root,
        `Wariant ${report.config.weapon} · moduły ${MODULE_KEYS.map((k) => report.config[k]).join('/')} (silnik / manewry / ładownia / broń / kadłub / tarcza)`,
        205,
        204,
        14,
        C.muted,
        1180,
    );
    const status = {
        returned: 'Powrót do bazy',
        destroyed: 'Statek zniszczony',
        stopped: 'Próba zakończona ręcznie',
        restart: 'Restart próby',
    }[report.outcome];
    label(
        root,
        `${status} · ${report.completed ? 'CEL WYKONANY' : 'CEL NIEUKOŃCZONY'}`,
        205,
        246,
        20,
        report.completed ? C.mint : C.gold,
    );
    const n = (v: number) => Number(v.toFixed(1));
    const rows = [
        ['Czas', `${n(report.seconds)} s`],
        ['Droga', `${Math.round(report.statistics.distance)} m`],
        [
            'Obrażenia kadłuba / tarczy',
            `${n(report.statistics.hullDamage)} / ${n(report.statistics.shieldDamage)}`,
        ],
        ['Obrażenia zadane wrogom', `${n(report.statistics.enemyDamage)}`],
        [
            'Zniszczeni wrogowie / asteroidy',
            `${report.kills} / ${report.statistics.rocksDestroyed}`,
        ],
        [
            'Zużyte zestawy / dostarczone hole',
            `${report.statistics.repairKitsUsed} / ${report.deliveries}`,
        ],
        [
            'Ładunek na statku',
            `${report.cargo.ore} R · ${report.cargo.parts} K · ${report.cargo.crystals} X${report.cargo.copperOre ? ` · ${report.cargo.copperOre} Cu` : ''}`,
        ],
        ['Pozostały kadłub / tarcza', `${n(report.hull)} / ${n(report.shield)}`],
    ];
    const perf = report.performance;
    rows.push(
        [
            `Płynność · ${perf?.frames ?? 0} klatek po rozgrzewce`,
            perf?.frames
                ? `${n(perf.fps)} FPS · p95 ${perf.p95MS} ms · max ${n(perf.maxMS)} ms`
                : 'Próba zbyt krótka do pomiaru',
        ],
        [
            `Pamięć JS · klatki >33 ms: ${perf?.slowFrames ?? 0}`,
            perf?.heapStartMB != null && perf.heapEndMB != null && perf.heapPeakMB != null
                ? `${n(perf.heapStartMB)} → ${n(perf.heapEndMB)} MB · szczyt ${n(perf.heapPeakMB)}`
                : 'Pomiar pamięci niedostępny w przeglądarce',
        ],
    );
    rows.forEach(([title, value], i) => {
        const x = 205 + (i % 2) * 600,
            y = 294 + Math.floor(i / 2) * 50;
        label(root, title, x, y, 13, C.muted);
        label(root, value, x, y + 22, 21);
    });
    label(root, 'Ostatnie próby w tej sesji', 205, 571, 14, C.muted);
    previous
        .slice(-3)
        .reverse()
        .forEach((r, i) =>
            label(
                root,
                `${SANDBOX_SCENARIOS[r.config.scenario].name} · ${HULLS[r.config.hull].name} · seed ${r.config.seed} · ${n(r.seconds)} s · ${r.kills} zniszczeń · ${r.completed ? 'cel wykonany' : 'nieukończona'}`,
                205,
                601 + i * 26,
                14,
                C.muted,
                1160,
            ),
        );
    label(
        root,
        'Wyniki lokalne · kampania bez zmian · restart przywraca identyczny seed i wyposażenie',
        205,
        699,
        14,
        C.mint,
    );
    button(root, 'POWTÓRZ IDENTYCZNIE', 205, 741, 370, restart, true, true, 42);
    button(root, 'ZMIEŃ KONFIGURACJĘ', 615, 741, 370, configure, false, true, 42);
    button(root, 'WRÓĆ DO BAZY', 1025, 741, 370, close, false, true, 42);
}
