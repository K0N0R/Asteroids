import { Assets } from "../assets";

export class Ui {
    lifes: number = 5
    score: number = 0
    showHandlingOptions = true;
    constructor(private assets: Assets) {
        setTimeout(() => {
            this.showHandlingOptions = false;
        }, 10000)
    }
    
    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = "25px Trebuchet MS";
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${this.score}`, 12.5, 25);
        ctx.rotate(0);
        ctx.restore()
        for(let i = 0; i < this.lifes; i++) {
            ctx.save();
            ctx.translate(37.5, 75 + i*50);
            ctx.rotate(0);
            ctx.drawImage(this.assets.image_health, -25.5, -25.5)
            ctx.restore();
        }
        if (this.showHandlingOptions) {
            ctx.save();
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`aim: "Mouse"`, 37.5 + 50, 67.5);

            ctx.restore()
            ctx.save();
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`shoot: "Left Mouse"`, 37.5 + 50, 92.6);
            ctx.save();
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`accelerate: "Space"`, 37.5 + 50, 117.5);
            ctx.restore()
        }
    }
}