import { Assets } from "../assets";

export class Ui {
    lifes: number = 5
    score: number = 0
    showHandlingOptions = true;
    constructor(private assets: Assets, private canvas: HTMLCanvasElement) {
        setTimeout(() => {
            this.showHandlingOptions = false;
        }, 10000)
    }
    
    render(ctx: CanvasRenderingContext2D) {

        ctx.textAlign = 'left';
        ctx.font = "25px Trebuchet MS";
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${this.score}`, 12.5, 25);
        for(let i = 0; i < this.lifes; i++) {
            ctx.drawImage(this.assets.image_health, -25.5 + 37.5, -25.5 + 75 + i*50)
        }
        if (this.showHandlingOptions) {
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`aim: "Mouse"`, 37.5 + 50, 67.5);
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`shoot: "Left Mouse"`, 37.5 + 50, 92.6);
            ctx.font = "16px Trebuchet MS";
            ctx.fillStyle = 'white';
            ctx.fillText(`accelerate: "Space"`, 37.5 + 50, 117.5);
        }
    }

    renderDeath(ctx: CanvasRenderingContext2D) {
        ctx.font = "56px Trebuchet MS";
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText(`YOU DIED`, this.canvas.width/2, this.canvas.height/2);
    }
}