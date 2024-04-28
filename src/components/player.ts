import { Assets } from "../assets";
import { Keyboard } from "../utils/keyboard";
import { getAngleFromVector, distance, NormalizeVectorFromPoints } from "../utils/utils";

export class Player {
    rotV = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };
    mousePos = { x: 0, y: 0 };

    private blinkingEnginesProgress = 0;
    private blinkingImortalityProgress = 0;
    isImmortal = false;
    constructor(private assets: Assets, public pos: {x: number; y: number }, private canvas: HTMLCanvasElement) {
    }

    render(ctx: CanvasRenderingContext2D) {
        this.pos.x += this.movV.x;
        this.pos.y += this.movV.y;

        this.rotV = NormalizeVectorFromPoints({ x: this.aimLocation.x + 7, y: this.aimLocation.y + 7 }, { x: this.pos.x, y: this.pos.y });

        if (Keyboard.keys[32]) {
            var dist = distance(this.pos, this.aimLocation);
            dist = Math.sqrt(dist);
            dist -= 7;
            this.movV.x += this.rotV.x * dist / 22;
            this.movV.y += this.rotV.y * dist / 22;
        }
        this.movV.x *= 0.92;
        this.movV.y *= 0.92;

        this.draw(ctx);
    }
    
    get aimLocation() {
        return {
            x: this.pos.x - this.canvas.width/2 + this.mousePos.x,
            y: this.pos.y - this.canvas.height/2 + this.mousePos.y,
        }
    }

    private scale = 0.66
    draw(ctx: CanvasRenderingContext2D) {
        if (Keyboard.keys[32]) {
            ctx.save();
            this.blinkingEnginesProgress += 0.1;
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(getAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingEnginesProgress)/2+1;
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this.assets.image_spaceship_engines, -45, -50);
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(getAngleFromVector(this.rotV));
        ctx.globalAlpha = 1.0;
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.assets.image_spaceship, -45, -50);
        ctx.restore();
        if (this.isImmortal) {
            this.blinkingImortalityProgress += 0.1;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.rotate(getAngleFromVector(this.rotV));
            ctx.globalAlpha = Math.sin(this.blinkingImortalityProgress)/2+0.5;
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this.assets.image_shipshield, -45, -50);
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
}
