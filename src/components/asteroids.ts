import { Assets } from "../assets";
import { GetDistance, NormalizeVectorFromPoints, SwapAndSlow } from "../utils/utils";
import { Player } from "./player";

export class Asteroid {
    pos = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };

    angle = 0;

    constructor(private asset: HTMLImageElement, pos: { x: number; y: number }, movV: { x: number; y: number }, ) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * 2.5;
        this.movV.y = movV.y * 2.5;;
    }
    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.asset, -25.5, -25.5)
        ctx.restore();
        this.angle += 0.02;
        this.pos.x -= this.movV.x;
        this.pos.y -= this.movV.y;

    }
}

export class AsteroidContainer {
    asteroids: Asteroid[] = [];

    constructor(private assets: Assets, private canvas: HTMLCanvasElement) {}
    render(ctx: CanvasRenderingContext2D, player: Player) {
        if (this.asteroids.length < 5) {
            const asteroidsSpawn = [{ x:  this.canvas.width * Math.random(), y: 0 }, { x: this.canvas.width * Math.random(), y: this.canvas.height }, { x: 0, y: this.canvas.height * Math.random() }, { x: this.canvas.width, y: this.canvas.height * Math.random() }]
            const randomElement = (Math.random() * 4) | 0;
            this.asteroids.push(new Asteroid(this.assets.image_asteroid, { x: asteroidsSpawn[randomElement].x, y: asteroidsSpawn[randomElement].y }, NormalizeVectorFromPoints(asteroidsSpawn[randomElement], { x: (player.pos.x + Math.random() * 20 + 20), y: (player.pos.x + Math.random() * 20 + 20) })));
        }
        for (var i = 0; i < this.asteroids.length; i++) {
            this.asteroids[i].render(ctx);
        }

        this.remove();
        this.checkCollision();
    }
    remove() {
        for (var i = this.asteroids.length - 1; i >= 0; i--) {
            if (((this.asteroids[i].pos.x > this.canvas.width*1.1) || (this.asteroids[i].pos.x < -this.canvas.width*0.1)) || ((this.asteroids[i].pos.y > this.canvas.height*1.1) || (this.asteroids[i].pos.y < -this.canvas.height*0.1))) {
                this.asteroids.splice(i, 1);
                i--;
            }
        }
    }
    checkCollision() {
        for (var i = 0; i < this.asteroids.length; i++) {
            for (var j = 0; j < this.asteroids.length; j++) {
                if (i === j) { continue; }
                if (GetDistance(this.asteroids[i].pos, this.asteroids[j].pos) < 51) {
                    var vBetween = NormalizeVectorFromPoints(this.asteroids[i].pos, this.asteroids[j].pos)
                    this.asteroids[i].pos.x += vBetween.x;
                    this.asteroids[i].pos.y += vBetween.y;
                    this.asteroids[j].pos.x -= vBetween.x;
                    this.asteroids[j].pos.y -= vBetween.y;
                    var swapArray = SwapAndSlow(this.asteroids[i].movV, this.asteroids[j].movV);
                    this.asteroids[i].movV = swapArray[0];
                    this.asteroids[j].movV = swapArray[1];
                    continue;
                }
            }
        }
    }
}
