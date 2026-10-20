import { RESOURCE_IDS, RESOURCES } from '../state/resources';
import { Container, Graphics } from 'pixi.js';
import { BasePopup } from '../../core/containers/popup/basePopup';
import type { Campaign } from '../state/campaign';
import type { MissionSimulation } from '../systems/mission';
import { CONTRACTS } from '../config';
import { C, ShipView } from '../graphics/shapes';
import { PROTOTYPES } from '../systems/prototypes';
import { itemIllustration } from '../graphics/items';
import { button, clear, label, panel, illustrationInBox } from './primitives';
import { missionObjectives } from './missionReadout';
import { objectiveMark } from './hudIcons';
import { STORY_TASKS } from '../state/story';

export interface MissionInfoData {
    simulation: MissionSimulation;
    campaign: Campaign;
    contract: number;
    objectives?: ReturnType<typeof missionObjectives>;
    objectivesTitle?: string;
    abortMission?: () => void;
}

export class MissionInfoPopup extends BasePopup<MissionInfoData> {
    private content = new Container();
    private cargoPage = 0;
    private goalPage = 0;
    constructor() {
        super();
        this.addChild(this.content);
    }
    show(data: MissionInfoData) {
        const {
            simulation: s,
            campaign: c,
            contract,
            objectives,
            objectivesTitle,
            abortMission,
        } = data;
        clear(this.content);
        const root = this.content;
        const shade = new Graphics().rect(0, 0, 1600, 900).fill({ color: 0x020810, alpha: 0.82 });
        shade.eventMode = 'static';
        root.addChild(shade);
        panel(root, 130, 80, 1340, 750);
        label(root, 'POKŁAD', 170, 112, 14, C.mint);
        label(root, s.hullConfig.name, 170, 143, 34);
        label(root, 'PAUZA · TAB / ESC', 1250, 114, 14, C.muted);
        const minutes = Math.floor(s.elapsed / 60),
            seconds = Math.floor(s.elapsed % 60)
                .toString()
                .padStart(2, '0');
        label(root, `${minutes}:${seconds} lotu`, 1250, 153, 16, C.muted);
        panel(root, 170, 215, 300, 530);
        panel(root, 490, 215, 560, 530);
        panel(root, 1070, 215, 360, 530);
        label(root, 'STATEK I PILOT', 190, 238, 14, C.mint);
        const pilot = c.pilots.find((pilot) => pilot.id === c.activeRun?.pilotId);
        const stats = [
            ['Kadłub', `${Math.ceil(s.hull)} / ${s.maxHull}`],
            [
                'Tarcza',
                `${Math.ceil(s.kineticShield.charge)} / ${s.kineticShield.profile.capacity}`,
            ],
            ['Ładownia', `${s.cargoUsed} / ${s.cargoCapacity}`],
            ['Prędkość', `${Math.round(s.speed)} m/s`],
            ['Naprawy', s.hullId === 'mule' ? 'Bezpłatne' : `${s.repairKits}`],
        ];
        stats.forEach(([title, value], i) => {
            const x = 190 + (i % 2) * 135,
                y = 281 + Math.floor(i / 2) * 63;
            label(root, title, x, y, 13, C.muted);
            label(root, value, x, y + 22, 21, C.text, 130);
        });
        label(root, s.pilot.name, 190, 493, 21, C.text, 260);
        label(root, `${s.pilot.role} · poziom ${s.pilot.level}`, 190, 526, 15, C.muted, 260);
        if (pilot) label(root, `${pilot.xp} PD`, 190, 551, 16, C.mint);
        if (s.engineFault) label(root, 'Awaria napędu', 190, 586, 16, C.coral);
        if (s.prototypes.length) {
            label(root, 'MODUŁY WYPRAWY', 190, 626, 12, C.muted);
            s.prototypes
                .slice(0, 3)
                .forEach((id, i) =>
                    label(root, PROTOTYPES[id].name, 190, 653 + i * 24, 15, C.mint, 260),
                );
        } else if (c.ship) {
            const ship = new ShipView(c.ship);
            ship.rotation = -Math.PI / 2;
            ship.scale.set(1.1);
            ship.position.set(360, 650);
            root.addChild(ship);
        }
        label(root, `ŁADOWNIA · ${s.cargoUsed} / ${s.cargoCapacity}`, 510, 238, 17, C.mint);
        button(
            root,
            `ZBIERANIE: ${s.grippers.enabled ? 'WŁ.' : 'WYŁ.'}`,
            844,
            233,
            186,
            () => {
                s.toggleCollection();
                this.show(data);
            },
            false,
            true,
            29,
            12,
        );
        const resources = RESOURCE_IDS.filter((id) => (s.cargo[id] ?? 0) > 0);
        const pages = Math.max(1, Math.ceil(resources.length / 8));
        this.cargoPage = Math.max(0, Math.min(this.cargoPage, pages - 1));
        if (!resources.length) {
            illustrationInBox(root, itemIllustration('parts'), 685, 355, 150, 140);
            label(root, 'Ładownia jest pusta', 650, 527, 22, C.muted, 300);
        }
        resources.slice(this.cargoPage * 8, this.cargoPage * 8 + 8).forEach((id, i) => {
            const x = 510 + (i % 2) * 260,
                y = 282 + Math.floor(i / 2) * 101;
            panel(root, x, y, 250, 88);
            illustrationInBox(root, itemIllustration(id), x + 12, y + 12, 28, 28);
            label(root, RESOURCES[id].name, x + 48, y + 12, 15, C.text, 190);
            label(root, `${s.cargo[id]}`, x + 16, y + 53, 23, RESOURCES[id].color);
            button(
                root,
                'WYRZUĆ 1',
                x + 140,
                y + 51,
                96,
                () => {
                    s.jettisonCargo(id);
                    this.show(data);
                },
                false,
                !s.hyperdrive.active && !s.transferActive && s.cargoTransferRemaining <= 0,
                26,
                11,
            );
        });
        if (pages > 1) {
            button(
                root,
                '←',
                510,
                708,
                54,
                () => {
                    this.cargoPage--;
                    this.show(data);
                },
                false,
                this.cargoPage > 0,
                25,
            );
            label(root, `${this.cargoPage + 1} / ${pages}`, 742, 712, 14, C.muted);
            button(
                root,
                '→',
                976,
                708,
                54,
                () => {
                    this.cargoPage++;
                    this.show(data);
                },
                false,
                this.cargoPage < pages - 1,
                25,
            );
        }
        label(root, 'CELE WYPRAWY', 1090, 238, 14, C.mint);
        label(root, objectivesTitle ?? CONTRACTS[contract].title, 1090, 267, 16, C.muted, 320);
        const goals =
            objectives ??
            missionObjectives(
                contract,
                s.cargo,
                [...s.surveyData],
                !!s.recoverySignal,
                s.recoverySecured,
                false,
                s.enemyKills,
            );
        const goalPages = Math.max(1, Math.ceil(goals.length / 3));
        this.goalPage = Math.min(this.goalPage, goalPages - 1);
        const checks = root.addChild(new Graphics());
        goals.slice(this.goalPage * 3, this.goalPage * 3 + 3).forEach((goal, i) => {
            const y = 318 + i * 125;
            objectiveMark(checks, 1098, y + 8, goal.complete);
            label(
                root,
                `${goal.title}${goal.progress ? `  ${goal.progress}` : ''}`,
                1118,
                y,
                17,
                goal.complete ? C.mint : C.text,
                285,
            );
            if (!goal.complete)
                goal.requirements?.forEach((row, index) => {
                    const have =
                        goal.id === 'earth-supply' && c.story?.claimed.includes('earth-materials')
                            ? row.need
                            : STORY_TASKS.find((task) => task.id === goal.id)?.requirements
                              ? (c.bank[row.resource] ?? 0) + (s.cargo[row.resource] ?? 0)
                              : row.have;
                    label(
                        root,
                        `${RESOURCES[row.resource].name}  ${have}/${row.need}`,
                        1118,
                        y + 29 + index * 17,
                        14,
                        have >= row.need ? C.mint : C.muted,
                        285,
                    );
                });
        });
        if (goalPages > 1) {
            button(
                root,
                '←',
                1090,
                708,
                54,
                () => {
                    this.goalPage--;
                    this.show(data);
                },
                false,
                this.goalPage > 0,
                25,
            );
            label(root, `${this.goalPage + 1} / ${goalPages}`, 1230, 712, 14, C.muted);
            button(
                root,
                '→',
                1356,
                708,
                54,
                () => {
                    this.goalPage++;
                    this.show(data);
                },
                false,
                this.goalPage < goalPages - 1,
                25,
            );
        }
        if (abortMission && s.canAbortMission)
            button(root, 'PRZERWIJ MISJĘ…', 170, 770, 230, abortMission, false, true, 36, 14);
        button(root, 'WRÓĆ DO LOTU', 1220, 770, 210, () => this.promise.resolve(), true, true, 36);
    }
}
