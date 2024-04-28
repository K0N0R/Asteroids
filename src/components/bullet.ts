import { Assets } from "../assets";
import { distance, getAngleFromVector } from "../utils/utils";
import { Player } from "./player";

export class Bullet {
    movV = { x: 0, y: 0 };
    angle = 0;
    constructor(private asset: HTMLImageElement, public pos: { x: number; y: number }, movV: { x: number; y: number }) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 10;
        this.movV.y = movV.y * 10;
        this.angle = getAngleFromVector(movV);
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.asset, 2.5, 0);
        ctx.restore();
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;
    }

} 

export class BulletContainer {
    bullets: Bullet[] = []
    constructor(private assets: Assets, private player: Player) {

    }
    addBullet(pos: {x: number; y: number;}, angle: {x: number; y: number;}) {
        this.bullets.push(new Bullet(this.assets.image_bullet, pos, angle ));
    }
    render(ctx: CanvasRenderingContext2D) {
        this.bullets.forEach(bullet => {
            bullet.render(ctx);
        })

        this.remove();
    }

    remove() {
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            if (distance(this.player.pos, this.bullets[i].pos) > 5000) {
                this.bullets.splice(i, 1);
            }
        }
    }
}