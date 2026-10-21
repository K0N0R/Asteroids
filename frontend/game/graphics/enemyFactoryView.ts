import { Container, Graphics } from 'pixi.js';
import { ENEMY_FACTORY, type EnemyFactory } from '../systems/enemyFactory';
import { worldLabel as label } from '../ui/primitives';
import { C } from './shapes';

export class EnemyFactoryView extends Container {
    private hull = new Graphics();
    private state = new Graphics();
    private readout = new Container();
    private title = label(this.readout, '5 · STOCZNIA POLOWA', 0, -155, 20, C.red, 350);
    private status = label(this.readout, '', 0, 140, 17, C.muted, 360);
    private ruinState: boolean | null = null;
    constructor() {
        super();
        this.position.copyFrom(ENEMY_FACTORY.position);
        this.eventMode = 'none';
        this.addChildAt(this.hull, 0);
        this.readout.addChildAt(this.state, 0);
        this.addChild(this.readout);
    }
    update(factory: EnemyFactory, cameraAngle: number) {
        this.position.copyFrom(factory.position);
        this.title.setText(
            factory.idBase === 73000
                ? factory.position.x > 0
                    ? 'INSTALACJA FOBOSA'
                    : '5 · ZAKŁAD PRZEMYSŁOWY'
                : '5 · STOCZNIA POLOWA',
        );
        this.readout.rotation = -cameraAngle;
        const g = this.state.clear();
        if (this.ruinState !== factory.destroyed) {
            this.ruinState = factory.destroyed;
            const h = this.hull.clear();
            if (factory.destroyed) {
                h.poly([-85, -60, -25, -65, -38, -10, -80, 15])
                    .fill(0x3c454a)
                    .poly([10, -65, 70, -45, 78, 5, 20, -15])
                    .fill(0x414b51)
                    .poly([-65, 25, -5, 5, 58, 42, 35, 65, -50, 60])
                    .fill(0x303d47);
                this.title.setText('5 · RUINY STOCZNI');
            } else {
                h.circle(0, 0, 135)
                    .stroke({ color: C.red, width: 2, alpha: 0.18 })
                    .poly([-85, -40, -58, -65, 58, -65, 85, -40, 85, 40, 58, 65, -58, 65, -85, 40])
                    .fill(0x253744)
                    .roundRect(-60, -42, 120, 84, 10)
                    .fill(0x142632);
                for (const side of [-1, 1]) {
                    h.rect(side * 70 - 7, -30, 14, 60)
                        .fill(0xa36b52)
                        .roundRect(side * 35 - 9, -32, 18, 64, 4)
                        .fill(0x657b84);
                }
                h.rect(-13, -46, 26, 92).fill(0x314a57);
                h.roundRect(-54, -37, 108, 74, 12).fill(0x667a96);
                h.roundRect(-43, -28, 86, 56, 8).fill(0x202d47);
                for (const side of [-1, 1]) {
                    h.roundRect(-61, side * 55 - 7, 122, 14, 4).fill(0xa99db3);
                    for (let x = -48; x <= 48; x += 16)
                        h.roundRect(x, side * 55 - 3, 8, 6, 2).fill(0xe3b681);
                    h.roundRect(side * 72 - 8, -35, 16, 70, 5).fill(0x8d9cb2);
                }
                h.roundRect(-24, -18, 48, 36, 6).fill(0x3e5270);
                h.roundRect(-18, -12, 36, 24, 4).fill(0xafcdd7);
            }
        }
        if (factory.destroyed) {
            this.status.setText('Produkcja wyłączona');
            return;
        }
        g.rect(-90, -105, 180, 8)
            .fill(C.ink)
            .rect(-90, -105, (180 * factory.health) / ENEMY_FACTORY.health, 8)
            .fill(C.red);
        const full = factory.units.size >= ENEMY_FACTORY.limit;
        this.status.setText(
            !factory.active
                ? 'Wykrycie celu uruchomi produkcję'
                : full
                  ? 'Hangar czeka · limit jednostek'
                  : `Kolejny start: ${Math.ceil(factory.remaining)} s · jednostki ${factory.units.size}/${ENEMY_FACTORY.limit}`,
        );
        g.circle(0, 0, 11).fill(factory.active ? C.red : C.gold);
        if (factory.active && !full)
            g.rect(-90, 108, 180 * (1 - factory.remaining / ENEMY_FACTORY.interval), 4).fill(C.red);
    }
}
