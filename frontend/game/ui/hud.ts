import { Container, Graphics } from 'pixi.js';
import { Typography } from '../../core/containers/components/typography';
import { CONTRACTS, DRONES, GAME, JOBS, SCAN_SITES } from '../config';
import { Campaign } from '../state/campaign';
import { C } from '../graphics/shapes';
import { MissionSimulation } from '../systems/mission';
import { label, panel } from './primitives';
import { contractProgress } from '../state/contracts';
import { navigationWaypoint } from '../worlds/sector';
import { enemyPosition } from '../systems/enemies';

export class MissionHud extends Container {
    target = 1;
    private status: Typography;
    private cargo: Typography;
    private context: Typography;
    private notice: Typography;
    private objective: Typography;
    private direction: Typography;
    private systems: Typography;
    private crew: Typography;
    private recovery: Typography;
    private combat: Typography;
    private combatDetail: Typography;
    private recoveryWasSecured = false;
    private lastSurveyCount = 0;
    private map = new Graphics();
    private bars = new Graphics();
    private arrow = new Graphics();
    private throttle = 0;
    constructor(
        readonly sim: MissionSimulation,
        private contract: number,
        private campaign: Campaign,
    ) {
        super();
        const firstSite = CONTRACTS[contract].sites[0];
        if (firstSite) this.target = SCAN_SITES[firstSite].key - 1;
        if (sim.recoverySignal) this.target = 5;
        panel(this, 28, 25, 965, 92);
        label(
            this,
            `${sim.hullConfig.name.toUpperCase()} / PILOT P${sim.pilot.level}`,
            52,
            43,
            16,
            C.mint,
        );
        this.status = label(this, '', 52, 73, 18);
        this.cargo = label(this, '', 550, 43, 18);
        this.addChild(this.bars);
        panel(this, 28, 133, 550, 78);
        this.systems = label(this, '', 52, 149, 16, C.mint);
        label(
            this,
            'R · naprawa przy małej prędkości, bez ciągu i strzelania',
            52,
            181,
            15,
            C.muted,
        );
        panel(this, 28, 227, 550, 76);
        this.combat = label(this, '', 52, 243, 16, C.mint);
        this.combatDetail = label(this, '', 52, 274, 14, C.muted);
        panel(this, 28, 744, 920, 126);
        this.context = label(this, '', 52, 764, 20, C.mint);
        label(
            this,
            'MYSZ → obrót     SPACJA → ciąg     SHIFT → hamulec     LPM → działko',
            52,
            805,
            16,
            C.muted,
        );
        label(
            this,
            'E interakcja / skan / odzysk     R naprawa     1–8 nawigacja     ESC pauza',
            52,
            838,
            15,
            C.muted,
        );
        panel(this, 1240, 25, 332, 477);
        label(this, 'SEKTOR / NAWIGACJA', 1262, 47, 15, C.muted);
        this.addChild(this.map);
        this.direction = label(this, '', 1262, 319, 18, C.mint);
        label(this, '1 Baza   2 Ruda   3 Pas   4 Wrak   5 Żyła', 1262, 355, 13, C.muted);
        label(this, '6 Ratunek   7 Przekaźnik   8 Obserwatorium', 1262, 376, 12, C.mint);
        label(this, CONTRACTS[contract].title.toUpperCase(), 1262, 413, 14, C.muted);
        this.objective = label(this, '', 1262, 444, 15, C.text, 285);
        panel(this, 1240, 520, 332, 128);
        label(this, 'ZAŁOGA W BAZIE', 1262, 540, 14, C.muted);
        this.crew = label(this, '', 1262, 572, 16, C.mint);
        panel(this, 1240, 669, 332, 110);
        label(this, 'ODZYSK / AKCJA RATUNKOWA', 1262, 685, 13, C.muted);
        this.recovery = label(this, '', 1262, 714, 15, C.mint, 290);
        this.notice = label(this, '', 620, 151, 18, C.gold, 600);
        this.addChild(this.arrow);
        this.refresh();
    }
    get waypoint() {
        return navigationWaypoint(
            this.sim.sector.landmarks,
            this.target + 1,
            this.sim.recoverySignal,
        );
    }
    update(deltaMS: number) {
        this.throttle += deltaMS;
        if (this.throttle > 100) {
            this.throttle = 0;
            this.refresh();
        }
    }
    private refresh() {
        const s = this.sim,
            p = s.position,
            v = s.velocity;
        const time = `${Math.floor(s.elapsed / 60)
            .toString()
            .padStart(2, '0')}:${Math.floor(s.elapsed % 60)
            .toString()
            .padStart(2, '0')}`;
        this.status.setText(
            `${s.pilot.name}    /    ${Math.round(s.speed)} m/s    /    ${time}    /    kadłub ${Math.ceil(s.hull)}/${s.maxHull}`,
        );
        this.cargo.setText(
            `ŁADUNEK  ${s.cargoUsed} / ${s.cargoCapacity}     ${s.cargo.ore} R  ·  ${s.cargo.parts} K`,
        );
        this.bars
            .clear()
            .roundRect(550, 82, 410, 8, 4)
            .fill(C.line)
            .roundRect(550, 82, Math.max(1, (410 * s.cargoUsed) / s.cargoCapacity), 8, 4)
            .fill(C.gold);
        this.context.setText(s.context);
        const enemies = [...s.enemies.enemies.values()];
        const chasers = enemies.filter((enemy) => enemy.state === 'chase').length;
        const nearest = Math.min(
            ...enemies.map((enemy) => {
                const e = enemyPosition(enemy);
                return Math.hypot(e.x - p.x, e.y - p.y);
            }),
        );
        this.combat.setText(
            chasers
                ? `ALARM / POŚCIG · drony ${chasers}`
                : s.distanceHome < DRONES.safeRadius
                  ? 'STREFA AURORY / BEZPIECZNA'
                  : nearest < DRONES.detectRange
                    ? 'PATROL / OBCY SYGNAŁ'
                    : 'SEKTOR / BRAK POŚCIGU',
        );
        this.combat.setColor(chasers ? C.red : C.mint);
        this.combatDetail.setText(
            `Zniszczone: ${s.enemyKills} · ${nearest < 1200 ? `najbliższy dron ${(nearest / 1000).toFixed(1)} km` : 'patrole strzegą cennych miejsc'}`,
        );
        if (s.recoverySecured && !this.recoveryWasSecured) {
            this.recoveryWasSecured = true;
            this.target = 0;
        }
        if (s.surveyData.size !== this.lastSurveyCount) {
            this.lastSurveyCount = s.surveyData.size;
            const nextSite = CONTRACTS[this.contract].sites.find((site) => !s.surveyData.has(site));
            if (CONTRACTS[this.contract].sites.length && (!s.recoverySignal || s.recoverySecured))
                this.target = nextSite ? SCAN_SITES[nextSite].key - 1 : 0;
        }
        this.recovery.setText(
            !s.recoverySignal
                ? 'Brak wybranego sygnału'
                : s.recoverySecured
                  ? 'Cel na holu · wróć do bazy'
                  : `Sygnał #${s.recoverySignal.id}\n${s.recoverySignal.pilot ? 'Kapsuła pilota' : 'Brak kapsuły'} · ${s.recoverySignal.ship ? 'wrak' : 'bez wraku'}`,
        );
        this.systems.setText(
            `${s.engineFault ? 'AWARIA NAPĘDU · ciąg 45%' : 'SYSTEMY SPRAWNE'}   /   zestawy ${s.repairKits}`,
        );
        this.systems.setColor(s.engineFault ? C.red : C.mint);
        const job = this.campaign.crew.jobs[0];
        this.crew.setText(
            !this.campaign.crew.mechanic
                ? 'Brak mechanika'
                : job
                  ? `${JOBS[job.kind].title}\n${Math.ceil(job.remaining)} s · kolejka ${this.campaign.crew.jobs.length}`
                  : 'Zadania zakończone / brak kolejki',
        );
        this.notice.setText(s.noticeTime > 0 ? s.notice : '');
        this.objective.setText(contractProgress(this.contract, s.cargo, [...s.surveyData]));
        const waypoint = this.waypoint,
            distance = Math.hypot(waypoint.x - p.x, waypoint.y - p.y);
        this.direction.setText(`${waypoint.name} · ${(distance / 1000).toFixed(1)} km`);
        const x = 1405,
            y = 193,
            radius = 108,
            scale = radius / GAME.sectorRadius;
        this.map.clear().circle(x, y, radius).fill(0x071520).stroke({ color: C.line, width: 1 });
        this.map
            .moveTo(x - radius, y)
            .lineTo(x + radius, y)
            .moveTo(x, y - radius)
            .lineTo(x, y + radius)
            .stroke({ color: C.line, width: 1, alpha: 0.5 });
        this.map.circle(x, y, 4).fill(C.mint);
        s.sector.landmarks.forEach((l) => {
            const mx = x + l.x * scale,
                my = y + l.y * scale;
            this.map
                .circle(mx, my, l.radius * scale)
                .stroke({ color: l.kind === 'belt' ? C.red : C.gold, alpha: 0.4, width: 1 });
            if (l.siteId)
                this.map
                    .rect(mx - 4, my - 4, 8, 8)
                    .fill(s.surveyData.has(l.siteId) ? C.mint : C.cyan);
            else this.map.circle(mx, my, 3).fill(l.key === this.target + 1 ? C.text : C.gold);
        });
        if (s.recoverySignal && !s.recoverySecured) {
            const mx = x + s.recoverySignal.x * scale,
                my = y + s.recoverySignal.y * scale;
            this.map
                .poly([mx, my - 7, mx + 7, my, mx, my + 7, mx - 7, my])
                .stroke({ color: C.mint, width: 2 });
        }
        for (const enemy of enemies) {
            const e = enemyPosition(enemy),
                mx = x + e.x * scale,
                my = y + e.y * scale;
            this.map
                .poly([mx + 4, my, mx - 3, my - 3, mx - 3, my + 3])
                .fill(enemy.state === 'chase' ? C.red : 0xb3696c);
        }
        this.map.circle(x + p.x * scale, y + p.y * scale, 3.5).fill(C.cyan);
        this.map
            .moveTo(x + p.x * scale, y + p.y * scale)
            .lineTo(x + (p.x + v.x * 0.4) * scale, y + (p.y + v.y * 0.4) * scale)
            .stroke({ color: C.cyan, width: 1 });
        this.arrow.clear();
        if (distance > 250) {
            const a = Math.atan2(waypoint.y - p.y, waypoint.x - p.x);
            const ax = 800 + Math.cos(a) * 230,
                ay = 450 + Math.sin(a) * 160;
            this.arrow
                .poly([
                    ax + Math.cos(a) * 10,
                    ay + Math.sin(a) * 10,
                    ax + Math.cos(a + 2.4) * 8,
                    ay + Math.sin(a + 2.4) * 8,
                    ax + Math.cos(a - 2.4) * 8,
                    ay + Math.sin(a - 2.4) * 8,
                ])
                .fill({ color: this.target === 0 ? C.mint : C.gold, alpha: 0.8 });
        }
    }
}
