import { Container, Graphics } from 'pixi.js';
import { BasePopup } from '../../core/containers/popup/basePopup';
import { Campaign } from '../state/campaign';
import { MissionSimulation } from '../systems/mission';
import { CONTRACTS, GAME, JOBS } from '../config';
import { C, ShipView } from '../graphics/shapes';
import { PROTOTYPES } from '../systems/prototypes';
import { button, clear, label, panel } from './primitives';
import { workerJobs } from '../state/crew';
import { missionObjectives } from './missionReadout';
import { objectiveMark } from './hudIcons';

export interface MissionInfoData {
    simulation: MissionSimulation;
    campaign: Campaign;
    contract: number;
}

export class MissionInfoPopup extends BasePopup<MissionInfoData> {
    private content = new Container();
    constructor() {
        super();
        this.addChild(this.content);
    }
    show({ simulation: s, campaign: c, contract: contractId }: MissionInfoData) {
        clear(this.content);
        const root = this.content;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.82 });
        shade.eventMode = 'static';
        root.addChild(shade);
        panel(root, 240, 104, 1120, 720);
        label(root, 'POKŁAD / INFORMACJE O WYPRAWIE', 280, 141, 14, C.mint);
        label(root, s.hullConfig.name, 280, 176, 36);
        label(root, 'PAUZA · TAB / ESC', 1125, 143, 14, C.muted);
        const minutes = Math.floor(s.elapsed / 60),
            seconds = Math.floor(s.elapsed % 60)
                .toString()
                .padStart(2, '0');
        label(
            root,
            `${minutes}:${seconds} lotu · zniszczone drony ${s.enemyKills}`,
            975,
            188,
            16,
            C.muted,
        );
        root.addChild(
            new Graphics()
                .moveTo(280, 229)
                .lineTo(1320, 229)
                .moveTo(820, 251)
                .lineTo(820, 714)
                .moveTo(280, 737)
                .lineTo(1320, 737)
                .stroke({ color: C.line, width: 1 }),
        );
        label(root, 'STATEK / SYSTEMY', 280, 251, 13, C.muted);
        label(
            root,
            [
                `Kadłub ${Math.ceil(s.hull)}/${s.maxHull} · ładunek ${s.cargoUsed}/${s.cargoCapacity}`,
                `Ruda ${s.cargo.ore} · komponenty ${s.cargo.parts}`,
                `Prędkość ${Math.round(s.speed)} / ${Math.round(s.hullConfig.maxSpeed * s.driveMultiplier * (s.engineFault ? GAME.damagedThrust : 1))} m/s`,
                `Skręt ${s.turnSpeed.toFixed(2)} rad/s · laser ${Math.round(s.laserRange)} m`,
                `Działka ${s.gunDamage.toFixed(1)} obrażeń · zestawy ${s.repairKits}`,
                `Kamuflaż: ${!s.hullConfig.cloak ? 'brak' : s.cloaked ? 'aktywny' : s.cloakEnabled ? `ujawniony (${Math.ceil(s.revealTime)} s)` : 'wyłączony'}`,
            ].join('\n'),
            280,
            282,
            17,
            C.text,
            390,
        );
        label(
            root,
            s.engineFault ? 'AWARIA NAPĘDU · ciąg 45%' : 'Napęd sprawny',
            280,
            406,
            15,
            s.engineFault ? C.red : C.mint,
        );
        if (c.ship) {
            const view = new ShipView(c.ship);
            view.scale.set(s.hullConfig.size * 1.7);
            view.rotation = -Math.PI / 2;
            view.position.set(729, 348);
            root.addChild(view);
        }
        label(root, 'PILOT', 280, 450, 13, C.muted);
        const pilot = c.pilots.find((p) => p.id === c.activeRun?.pilotId);
        label(
            root,
            `${s.pilot.name} · ${s.pilot.role} · P${s.pilot.level}${pilot ? ` · ${pilot.xp} PD` : ''}`,
            280,
            476,
            17,
            C.text,
            500,
        );
        if (pilot)
            label(
                root,
                `Manewrowanie ${pilot.skills.handling} · wydobycie ${pilot.skills.mining} · ewakuacja ${pilot.skills.survival}`,
                280,
                502,
                15,
                C.muted,
                500,
            );
        label(root, 'PROTOTYPY / DO KOŃCA WYPRAWY', 280, 553, 13, C.muted);
        if (!s.prototypes.length)
            label(
                root,
                `Brak modułów · pozostałe skrytki: ${s.sector.caches.length - s.openedCaches.size}`,
                280,
                585,
                17,
                C.muted,
            );
        s.prototypes.forEach((id, i) => {
            label(root, PROTOTYPES[id].name, 280, 582 + i * 66, 17, C.mint);
            label(root, PROTOTYPES[id].detail, 280, 606 + i * 66, 14, C.muted, 500);
        });
        const contract = CONTRACTS[contractId];
        label(root, 'KONTRAKT / CELE', 860, 251, 13, C.muted);
        label(root, contract.title, 860, 277, 22, C.text, 460);
        const checks = new Graphics();
        root.addChild(checks);
        missionObjectives(
            contractId,
            s.cargo,
            [...s.surveyData],
            !!s.recoverySignal,
            s.recoverySecured,
            false,
            s.enemyKills,
        ).forEach((goal, i) => {
            objectiveMark(checks, 867, 322 + i * 30, goal.complete);
            label(
                root,
                `${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`,
                888,
                313 + i * 30,
                17,
                goal.complete ? C.mint : C.muted,
                430,
            );
        });
        label(
            root,
            `Premia po powrocie: ${contract.rewardOre} rudy · ${contract.rewardParts} komponentów`,
            860,
            456,
            15,
            C.gold,
            460,
        );
        label(root, 'ZAŁOGA W BAZIE', 860, 503, 13, C.muted);
        (['mechanic', 'quartermaster'] as const).forEach((role, i) => {
            const jobs = workerJobs(c, role),
                head = jobs[0];
            const title = role === 'mechanic' ? 'Mechanik' : 'Intendent';
            const state = !c.crew[role]
                ? 'niezatrudniony'
                : !head
                  ? 'brak zadań'
                  : `${JOBS[head.kind].title} · ${Math.ceil(head.remaining)} s${jobs.length > 1 ? ` · +${jobs.length - 1} w kolejce` : ''}`;
            label(root, `${title}: ${state}`, 860, 532 + i * 36, 15, head ? C.mint : C.muted, 460);
        });
        label(root, 'ODZYSK', 860, 635, 13, C.muted);
        label(
            root,
            !s.recoverySignal
                ? 'Brak akcji ratunkowej'
                : s.recoverySecured
                  ? 'Cel na holu · zabezpieczysz go po dokowaniu'
                  : `Sygnał #${s.recoverySignal.id} · ${s.recoverySignal.pilot ? 'kapsuła pilota' : 'bez kapsuły'} · ${s.recoverySignal.ship ? 'wrak statku' : 'bez wraku'}`,
            860,
            660,
            16,
            C.text,
            460,
        );
        label(
            root,
            s.outpost.disabledTime > 0
                ? `Cerber: skaner wyłączony · ${Math.ceil(s.outpost.disabledTime)} s`
                : s.outpost.secured
                  ? 'Cerber: dane zabezpieczone'
                  : s.outpost.alarm > 0
                    ? `Cerber: alarm · ${Math.ceil(s.outpost.alarm)} s`
                    : 'Cerber: E dane · G sabotaż: 3 s / 1 komponent',
            860,
            697,
            13,
            s.outpost.alarm > 0 ? C.red : C.muted,
            460,
        );
        label(
            root,
            '1 Baza · 2 Ruda · 3 Pas · 4 Wrak · 5 Żyła · 6 Ratunek · 7 Lumen · 8 Mnemos · 9 Skrytki · 0 Cerber · F Dron',
            280,
            753,
            15,
            C.muted,
        );
        label(root, 'Lot i praca załogi są zatrzymane.', 280, 792, 14, C.muted);
        button(root, 'WRÓĆ DO LOTU', 1120, 773, 200, () => this.promise.resolve(), true, true, 36);
    }
}
