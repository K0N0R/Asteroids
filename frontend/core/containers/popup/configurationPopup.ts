import * as PIXI from 'pixi.js';
import { BasePopup } from './basePopup';
import { Button } from '@components/button';
import { Typography } from '@components/typography';
import { Box } from '@components/box';
import { GameSettings } from '@systems/gameSettings';
import { SoundSliderOption } from '@components/soundSliderOption';

export class ConfigurationPopup extends BasePopup<undefined> {
    private soundSlider: SoundSliderOption;
    constructor() {
        super();
        const backdrop = new PIXI.Graphics()
            .rect(0, 0, 1600, 900)
            .fill({ color: 0x020810, alpha: 0.82 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);
        this.addChild(
            new Box({
                x: 800,
                y: 450,
                width: 760,
                height: 640,
                tint: 0x0b1d2b,
                outlineWidth: 1,
                outlineTint: 0x244758,
                roundness: 14,
                alpha: 1,
            }),
        );
        const text = (value: string, x: number, y: number, size = 20, color = 0xe4f0f4) => {
            const view = new Typography({
                text: value,
                size,
                color,
                horizontalAlign: 'left',
                verticalAlign: 'top',
                fontFamily: 'Segoe UI',
            });
            view.position.set(x, y);
            this.addChild(view);
        };
        text('AURORA / PRZERWA W LOCIE', 470, 171, 15, 0x78e1bc);
        text('Chwila oddechu.', 470, 210, 38);
        text('Symulacja jest zatrzymana.', 470, 268, 18, 0x7d9cac);
        const controls = [
            ['W / A / D', 'Przyspieszanie / skręt w lewo / skręt w prawo'],
            ['S / SHIFT', 'Hamowanie i wsteczny / boost podczas lotu W'],
            ['MYSZ', 'Celowanie niezależnie od kadłuba'],
            ['LPM / PPM', 'Broń / narzędzie; Widmo: kamuflaż 3 s; Mule: lasery / zestaw'],
            ['E', 'Wrak / przytrzymaj: skrytka, skan, odzysk, dokowanie'],
            ['1–9', 'Nawigacja · 6 ratunek, 7/8 nauka, 9 skrytki'],
            ['R', 'Naprawa; Widmo: LPM dash / PPM kamuflaż optyczny'],
            ['TAB', 'Pokład · szczegóły statku, pilot, prototypy i załoga'],
        ];
        controls.forEach(([key, detail], i) => {
            text(key, 470, 323 + i * 33, 17, 0x78e1bc);
            text(detail, 590, 323 + i * 33, 17);
        });
        text('Zamknięcie lub odświeżenie gry oznacza utratę wyprawy.', 470, 594, 17, 0xf2bd75);
        this.soundSlider = new SoundSliderOption(
            'Efekty',
            () => {
                GameSettings.effectsEnabled = !GameSettings.effectsEnabled;
            },
            (value) => {
                GameSettings.effectsVolume = value;
            },
            () => GameSettings.effectsEnabled,
            () => (GameSettings.effectsEnabled ? GameSettings.effectsVolume : 0),
        );
        this.soundSlider.position.set(470, 639);
        this.addChild(this.soundSlider);
        this.addChild(
            new Button({
                x: 800,
                y: 707,
                width: 660,
                height: 52,
                tint: 0x78e1bc,
                roundness: 7,
                children: [
                    new Typography({
                        text: 'WRÓĆ DO GRY  /  ESC',
                        size: 18,
                        color: 0x07121e,
                        fontFamily: 'Segoe UI',
                    }),
                ],
                onClick: () => this.promise.resolve(),
            }),
        );
    }
    update(deltaMS: number) {
        this.soundSlider.update(deltaMS);
    }
}
