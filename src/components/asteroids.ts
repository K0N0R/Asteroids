import { Assets } from "../assets";
import { distance, NormalizeVectorFromPoints, swapAndSlow, getRandomValueFromRange, normalise } from "../utils/utils";
import { Player } from "./player";

export class Asteroid {
    pos = { x: 0, y: 0 };
    movV = { x: 0, y: 0 };

    angle = 0;

    constructor(private asset: HTMLImageElement, pos: { x: number; y: number }, movV: { x: number; y: number }, ) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.movV.x = movV.x * getRandomValueFromRange(1.5, 4.5);
        this.movV.y = movV.y * getRandomValueFromRange(1.5, 4.5);
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

    constructor(private assets: Assets, private player: Player, private canvas: HTMLCanvasElement) {
        setInterval(() => {

            const spawn = () => {
                if (this.asteroids.length < 200) {
                    const angle = getRandomValueFromRange(0, Math.PI * 2);
                    const vector = normalise({ x: Math.cos(angle), y: Math.sin(angle) });
                    const distance = getRandomValueFromRange(2000, 2500);
        
                    const asteroidsSpawn = {
                        x: this.player.pos.x + (vector.x * distance),
                        y: this.player.pos.y + (vector.y * distance)
                    }
        
                    this.asteroids.push(new Asteroid(
                        Math.random() > 0.5 ? this.assets.image_asteroid_1 : this.assets.image_asteroid_2,
                        asteroidsSpawn,
                        NormalizeVectorFromPoints(
                            asteroidsSpawn,
                            { x: (this.player.pos.x + Math.random() * 20 + 20), y: (this.player.pos.x + Math.random() * 20 + 20) })
                    ));
                }
            }
            
            for(let i = 0; i < 20; i++) {
                spawn();
            }
        }, 5000)
    }
    render(ctx: CanvasRenderingContext2D) {
        
        for (var i = 0; i < this.asteroids.length; i++) {
            this.asteroids[i].render(ctx);
        }

        this.remove();
        this.checkCollision();
    }
    remove() {
        for (var i = this.asteroids.length - 1; i >= 0; i--) {
            if (distance(this.player.pos, this.asteroids[i].pos) > 5000) {
                this.asteroids.splice(i, 1);
            }
        }
    }
    checkCollision() {
        for (var i = 0; i < this.asteroids.length; i++) {
            for (var j = 0; j < this.asteroids.length; j++) {
                if (i === j) { continue; }
                if (distance(this.asteroids[i].pos, this.asteroids[j].pos) < 51) {
                    var vBetween = NormalizeVectorFromPoints(this.asteroids[i].pos, this.asteroids[j].pos)
                    this.asteroids[i].pos.x += vBetween.x;
                    this.asteroids[i].pos.y += vBetween.y;
                    this.asteroids[j].pos.x -= vBetween.x;
                    this.asteroids[j].pos.y -= vBetween.y;
                    var swapArray = swapAndSlow(this.asteroids[i].movV, this.asteroids[j].movV);
                    this.asteroids[i].movV = swapArray[0];
                    this.asteroids[j].movV = swapArray[1];
                    continue;
                }
            }
        }
    }
}
