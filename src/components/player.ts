import { Assets } from "../assets";
import { Keyboard } from "../utils/keyboard";
import { GetAngleFromVector, GetDistance, NormalizeVectorFromPoints } from "../utils/utils";
import { BulletContainer } from "./bullet";

export class Player {
    rotV = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };
    mousePos = { x: 0, y: 0 };

    private blinkingEnginesProgress = 0;
    private blinkingImortalityProgress = 0;
    isImmortal = false;
    constructor(private assets: Assets, public pos: {x: number; y: number }, private bulletContainer: BulletContainer, private canvas: HTMLCanvasElement) {
        
        this.startCheckingMousePosition();
    }

    startCheckingMousePosition() {
        this.canvas.onmousemove = (evt:any) => {
            this.mousePos.x = evt.offsetX;
            this.mousePos.y = evt.offsetY;
        }
        this.canvas.onmousedown = (evt:any) => {
            var angle = GetAngleFromVector(this.rotV) - Math.PI / 2;
            var translationX1 = Math.cos(angle - 0.58) * 47;
            var translationY1 = Math.sin(angle - 0.58) * 47;
            var translationX2 = Math.cos(angle + 0.51) * 45;
            var translationY2 = Math.sin(angle + 0.51) * 45;
            //var translationX3 = Math.cos(angle - 0.107) * 73;
            //var translationY3 = Math.sin(angle - 0.107) * 73;
            //var translationX4 = Math.cos(angle + 0.045) * 73;
            //var translationY4 = Math.sin(angle + 0.045) * 73;
            this.bulletContainer.addBullet({ x: this.pos.x + translationX1, y: this.pos.y + translationY1 }, this.rotV);
            this.bulletContainer.addBullet({ x: this.pos.x + translationX2, y: this.pos.y + translationY2 }, this.rotV);
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX3, y: this.pos.y + translationY3 }, this.rotV));
            //this.Bullets.push(new Bullet({ x: this.pos.x + translationX4, y: this.pos.y + translationY4 }, this.rotV));

        }
    }
    render(ctx: CanvasRenderingContext2D) {
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;

        this.rotV = NormalizeVectorFromPoints({ x: this.mousePos.x + 7, y: this.mousePos.y + 7 }, { x: this.pos.x, y: this.pos.y });

        if (Keyboard.keys[32]) {
            var dist = GetDistance(this.pos, this.mousePos);
            dist = Math.sqrt(dist);
            dist -= 7;
            this.movV.x += this.rotV.x * dist / 22;
            this.movV.y += this.rotV.y * dist / 22;
        }
        this.movV.x *= 0.92;
        this.movV.y *= 0.92;

        this.checkCollision();
        this.draw(ctx);
    }
    private checkCollision() {
        if (this.pos.y > this.canvas.height - 50) {
            this.pos.y = this.canvas.height - 50
            this.movV.y = -this.movV.y * 0.6
        }
        if (this.pos.y < 50) {
            this.pos.y = 50
            this.movV.y = -this.movV.y * 0.6
        }
        if (this.pos.x > this.canvas.width - 45) {
            this.pos.x = this.canvas.width - 45
            this.movV.x = -this.movV.x * 0.6
        }
        if (this.pos.x < 45) {
            this.pos.x = 45
            this.movV.x = -this.movV.x * 0.6
        }
    }


    draw(ctx: CanvasRenderingContext2D) {
        if (Keyboard.keys[32]) {
            ctx.save();
            this.blinkingEnginesProgress += 0.1;
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(GetAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingEnginesProgress)/2+0.75;
            ctx.drawImage(this.assets.image_spaceship_engines, -45, -50);
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(GetAngleFromVector(this.rotV));
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.assets.image_spaceship, -45, -50);
        ctx.restore();
        if (this.isImmortal) {
            this.blinkingImortalityProgress += 0.1;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(GetAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingImortalityProgress)/2+0.5;
            ctx.drawImage(this.assets.image_shipshield, -45, -50);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
}
