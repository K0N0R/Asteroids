import { Container, Graphics } from 'pixi.js';
import type { MissionSimulation } from '../systems/mission';
import {
    SHIP_ABILITIES,
    ABILITY_NAMES,
    ABILITY_COOLDOWNS,
    type Ability,
} from '../systems/shipAbilities';
import { C } from '../graphics/shapes';
import { clear, label, panel } from './primitives';
import { Typography } from '../../core/containers/components/typography';

type Icon =
    | 'gun'
    | 'laser'
    | 'emp'
    | 'rocket'
    | 'shockwave'
    | 'cloak'
    | 'shield'
    | 'claw'
    | 'dash'
    | 'repair'
    | 'tow';
interface Slot {
    title: string;
    detail: string;
    icon: Icon;
    key?: string;
    ability?: Ability;
    module?: 'drill' | 'handling' | 'guns' | 'grippers' | 'shield';
}
const DETAILS: Record<Ability, string> = {
    emp: 'Na chwilę blokuje ostrzał wrogów. Odpycha skały bez zadawania im obrażeń.',
    shockwave: 'Fala uderzeniowa uszkadza pobliskich wrogów i silnie odpycha asteroidy.',
    cloak: 'Ukrywa statek przed przeciwnikami. Użycie uzbrojenia lub narzędzi przerywa kamuflaż.',
    shield: 'Tworzy czasowe wzmocnienie tarczy. Nie odnawia zużytej osłony.',
    rocket: 'Wystrzeliwuje rakietę w kierunku wskazanego lub namierzonego celu.',
};
export function shipHudSlots(s: MissionSimulation): Slot[] {
    const hull = s.hullId;
    const primary: Slot =
        hull === 'mule'
            ? {
                  title: 'Lasery wydobywcze',
                  detail: 'Dwa promienie rozbijają skały i wydobywają surowce.',
                  icon: 'laser',
                  module: 'drill',
              }
            : hull === 'harpoon'
              ? {
                    title: 'Zacisk szczypców',
                    detail: 'Zaciska wysunięte ramiona na skałach i obiektach.',
                    icon: 'claw',
                    module: 'grippers',
                }
              : hull === 'atlas'
                ? { title: 'Rakieta', detail: DETAILS.rocket, icon: 'rocket', module: 'guns' }
                : {
                      title:
                          hull === 'phoenix'
                              ? 'Dwa działka skrzydłowe'
                              : hull === 'stinger'
                                ? 'Rapid fire'
                                : hull === 'aegis'
                                  ? 'Działko energetyczne'
                                  : 'Działko',
                      detail:
                          hull === 'tug'
                              ? 'Strzela z centralnego stanowiska na ogonie statku.'
                              : 'Strzela w kierunku kursora. Utrzymuj cel w linii ognia.',
                      icon: 'gun',
                      module: 'guns',
                  };
    if (primary.icon === 'gun' && !['aegis', 'stinger', 'raider', 'lancer'].includes(hull))
        primary.module = undefined;
    const slots: Slot[] = [];
    if (s.hullConfig.guns.length || hull === 'mule' || hull === 'harpoon' || hull === 'atlas')
        slots.push({ ...primary, key: 'LPM' });
    if (
        hull !== 'mule' &&
        (s.hullConfig.lasers.length ||
            ['widmo', 'tug', 'atlas', 'fighter', 'stinger', 'harpoon', 'phoenix'].includes(hull))
    ) {
        const secondary: Slot =
            hull === 'widmo'
                ? {
                      title: 'Ofensywny dash',
                      detail: 'Gwałtowny zryw zadający obrażenia przy przelocie przez przeciwnika.',
                      icon: 'dash',
                      module: 'handling',
                  }
                : hull === 'tug'
                  ? {
                        title: ABILITY_NAMES.emp,
                        detail: DETAILS.emp,
                        icon: 'emp',
                        ability: 'emp',
                        module: 'drill',
                    }
                  : hull === 'atlas' || hull === 'fighter'
                    ? {
                          title: 'Granaty wybuchowe',
                          detail: 'Wybuch uszkadza statki i skały w pobliżu detonacji.',
                          icon: 'emp',
                          module: 'guns',
                      }
                    : hull === 'stinger'
                      ? {
                            title: 'Rakieta',
                            detail: DETAILS.rocket,
                            icon: 'rocket',
                            module: 'guns',
                            ability: 'rocket',
                        }
                      : hull === 'harpoon'
                        ? {
                              title: 'Ramiona szczypców',
                              detail: 'Wysuwa i chowa ramiona chwytające. LPM steruje zaciskiem.',
                              icon: 'claw',
                              module: 'grippers',
                          }
                        : hull === 'phoenix'
                          ? {
                                title: 'Promienie zapalające',
                                detail: 'Dwa promienie podpalają wrogie statki. Nie wydobywają surowców.',
                                icon: 'laser',
                                module: 'drill',
                            }
                          : {
                                title:
                                    hull === 'aegis' ? 'Krótkie lasery boczne' : 'Laser wydobywczy',
                                detail: 'Rozbija skały i wydobywa surowce. Celuj w wybrane złoże.',
                                icon: 'laser',
                                module: 'drill',
                            };
        slots.push({ ...secondary, key: 'PPM' });
    }
    const abilities = SHIP_ABILITIES[hull];
    for (const key of ['q', 'e'] as const) {
        const ability = abilities?.[key];
        if (ability)
            slots.push({
                title: ABILITY_NAMES[ability],
                detail: DETAILS[ability],
                icon: ability,
                key: key.toUpperCase(),
                ability,
                module:
                    ability === 'rocket'
                        ? 'guns'
                        : ability === 'shield'
                          ? 'shield'
                          : ability === 'cloak' && hull === 'widmo'
                            ? 'drill'
                            : undefined,
            });
    }
    if (hull === 'mule')
        slots.push({
            title: 'Nielimitowane naprawy',
            detail: 'Przytrzymaj R, aby naprawiać kadłub bez zużycia zestawów. Samonaprawa jest cechą pasywną statku.',
            icon: 'repair',
        });
    if (s.hullConfig.radarJamming > 0)
        slots.push({
            title: 'Mniejsza wykrywalność',
            detail: `Pasywnie ogranicza wykrywalność o ${Math.round(s.hullConfig.radarJamming * 100)}%.`,
            icon: 'cloak',
        });
    slots.push({
        title: `Holowanie · ${s.salvage.capacity} ${s.salvage.capacity === 1 ? 'slot' : s.salvage.capacity < 5 ? 'sloty' : 'slotów'}`,
        detail: `Możesz holować jednocześnie ${s.salvage.capacity} ${s.salvage.capacity === 1 ? 'obiekt' : s.salvage.capacity < 5 ? 'obiekty' : 'obiektów'}. J zwalnia wybrany obiekt; listę znajdziesz pod Tab.`,
        icon: 'tow',
        module: hull === 'tug' ? 'handling' : undefined,
    });
    return slots;
}
function drawIcon(g: Graphics, icon: Icon, color: number) {
    const line = { color, width: 2.5 };
    if (icon === 'gun')
        g.roundRect(-17, -5, 25, 10, 3)
            .fill(color)
            .rect(8, -3, 15, 6)
            .fill(color)
            .moveTo(-6, 5)
            .lineTo(-12, 16)
            .stroke(line);
    else if (icon === 'laser')
        for (const y of [-8, 8])
            g.moveTo(-19, y).lineTo(18, y).stroke(line).circle(20, y, 3).fill(color);
    else if (icon === 'rocket')
        g.poly([-20, 10, 6, -16, 16, -16, 16, -6, -10, 20, -8, 8])
            .stroke(line)
            .circle(6, -6, 3)
            .fill(color);
    else if (icon === 'emp')
        g.circle(0, 2, 13)
            .stroke(line)
            .moveTo(-5, -12)
            .lineTo(-5, -19)
            .lineTo(4, -19)
            .stroke(line)
            .poly([3, -7, -5, 3, 2, 3, -3, 13, 8, 0, 1, 0])
            .fill(color);
    else if (icon === 'shockwave')
        for (const r of [7, 15, 23]) g.beginPath().arc(0, 0, r, -2.8, 2.8).stroke(line);
    else if (icon === 'shield')
        g.poly([-17, -15, 0, -21, 17, -15, 14, 6, 0, 21, -14, 6]).stroke(line);
    else if (icon === 'claw')
        g.moveTo(-18, -18)
            .lineTo(-18, 10)
            .lineTo(-5, 18)
            .moveTo(18, -18)
            .lineTo(18, 10)
            .lineTo(5, 18)
            .stroke(line);
    else if (icon === 'dash')
        for (const x of [-12, 0, 12])
            g.moveTo(x - 5, -15)
                .lineTo(x + 5, 0)
                .lineTo(x - 5, 15)
                .stroke(line);
    else if (icon === 'repair')
        g.moveTo(-13, 0).lineTo(13, 0).moveTo(0, -13).lineTo(0, 13).stroke({ color, width: 6 });
    else if (icon === 'tow')
        g.circle(-12, -5, 8).circle(12, 7, 8).moveTo(-5, -1).lineTo(5, 3).stroke(line);
    else
        g.ellipse(0, 0, 23, 13)
            .stroke(line)
            .circle(0, 0, 6)
            .stroke(line)
            .moveTo(-21, 21)
            .lineTo(21, -21)
            .stroke(line);
}

export class ShipAbilityHud extends Container {
    private rings: {
        slot: Slot;
        ink: Graphics;
        glyph: Graphics;
        counter: Typography;
        counterBack: Graphics;
        radius: number;
    }[] = [];
    constructor(private sim: MissionSimulation) {
        super();
        let x = 40;
        const slots = shipHudSlots(sim);
        const tooltip = new Container();
        for (const slot of slots) {
            const passive = !slot.key,
                radius = passive ? 23 : 32;
            const view = new Container();
            view.position.set(x + radius, 830);
            const ink = new Graphics();
            view.addChild(ink);
            const glyph = new Graphics();
            drawIcon(glyph, slot.icon, passive ? C.muted : C.mint);
            glyph.scale.set(passive ? 0.65 : 0.9);
            view.addChild(glyph);
            const counterBack = new Graphics().circle(0, 0, 18).fill({ color: C.ink, alpha: 0.96 });
            const counter = new Typography({
                text: '',
                size: 22,
                weight: 'bold',
                color: C.text,
                horizontalAlign: 'center',
                verticalAlign: 'center',
            });
            view.addChild(counterBack, counter);
            if (slot.key) {
                const width = slot.key.length === 1 ? 22 : 34;
                const left = -radius - 5,
                    top = 14,
                    height = 23;
                view.addChild(
                    new Graphics()
                        .roundRect(left, top, width, height, 6)
                        .fill(C.panel)
                        .stroke({ color: C.muted, width: 1 }),
                );
                const key = new Typography({
                    text: slot.key,
                    size: 11,
                    color: C.text,
                    horizontalAlign: 'center',
                    verticalAlign: 'center',
                });
                key.position.set(left + width / 2, top + height / 2);
                view.addChild(key);
            }
            view.eventMode = 'static';
            view.cursor = 'help';
            view.on('pointerenter', () => {
                clear(tooltip);
                panel(tooltip, 32, 590, 470, 164);
                label(tooltip, slot.title, 52, 608, 23, C.text, 430);
                label(tooltip, slot.detail, 52, 643, 16, C.muted, 430);
                const level = slot.module
                    ? (sim.campaign.ship?.[
                          slot.module === 'guns' || slot.module === 'grippers'
                              ? 'drill'
                              : slot.module
                      ] ?? 0)
                    : null;
                label(
                    tooltip,
                    level === null
                        ? slot.icon === 'gun'
                            ? `Wyposażenie: ${sim.weaponConfig.name}`
                            : 'Cecha kadłuba · parametry stałe'
                        : `Ulepszenie: ${level} / 3 · ${slot.module === 'guns' ? 'uzbrojenie' : slot.module === 'handling' ? 'sterowanie' : slot.module === 'grippers' ? 'chwytaki' : 'system specjalny'}`,
                    52,
                    721,
                    13,
                    C.mint,
                    430,
                );
                tooltip.visible = true;
            });
            view.on('pointerleave', () => {
                tooltip.visible = false;
            });
            view.on(
                'pointerdown',
                (e) => 'stopPropagation' in e.nativeEvent && e.nativeEvent.stopPropagation(),
            );
            this.addChild(view);
            this.rings.push({ slot, ink, glyph, counter, counterBack, radius });
            x += passive ? 62 : 87;
        }
        tooltip.visible = false;
        this.addChild(tooltip);
        this.update();
    }
    update() {
        for (const { slot, ink, glyph, counter, counterBack, radius } of this.rings) {
            const cooldown = slot.ability
                ? this.sim.abilities.cooldowns[slot.ability]
                : slot.icon === 'dash'
                  ? this.sim.dashCooldown
                  : 0;
            const interval =
                slot.ability === 'cloak'
                    ? this.sim.opticalCloakInterval
                    : slot.ability === 'shield'
                      ? (this.sim.aegis?.pulseCooldown ?? 18)
                      : slot.ability === 'rocket' && this.sim.hullId === 'stinger'
                        ? 4
                        : slot.ability
                          ? ABILITY_COOLDOWNS[slot.ability]
                          : 5;
            ink.clear()
                .circle(0, 0, radius)
                .fill({ color: C.ink, alpha: 0.94 })
                .stroke({
                    color: slot.key ? C.mint : C.muted,
                    width: slot.key ? 2 : 1,
                    alpha: cooldown > 0 ? 0.25 : 0.8,
                });
            if (cooldown > 0)
                ink.beginPath()
                    .arc(
                        0,
                        0,
                        radius,
                        -Math.PI / 2,
                        -Math.PI / 2 + Math.PI * 2 * Math.max(0, 1 - cooldown / interval),
                    )
                    .stroke({ color: C.mint, width: 3 });
            counter.setText(cooldown > 0 ? `${Math.ceil(cooldown)}` : '');
            counterBack.visible = cooldown > 0;
            glyph.alpha = cooldown > 0 ? 0.2 : 1;
        }
    }
}
