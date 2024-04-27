import { Assets } from "../assets";
import { AsteroidContainer } from "../components/asteroids";
import { BulletContainer } from "../components/bullet";
import { Health } from "../components/health";
import { Player } from "../components/player";
import { GetDistance } from "../utils/utils";

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bulletContainer: BulletContainer;
    player: Player;
    health: Health;
    asteroidsContainer: AsteroidContainer;

    x = 0;
    scoreNumber = 0;
    scoreElement: HTMLElement;

    constructor(private assets: Assets) {
        this.canvas = document.getElementById('MainCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.scoreElement = document.getElementById('score') as HTMLElement;

        this.bulletContainer = new BulletContainer(this.assets);
        this.player = new Player(this.assets, {x: 600, y: 400}, this.bulletContainer, this.canvas);
        this.health = new Health(this.assets.image_health, { x: (1000 * Math.random() + 100), y: (600 * Math.random() + 100) });
        this.asteroidsContainer = new AsteroidContainer(this.assets);
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.asteroidsContainer.render(this.ctx, this.player);
        this.player.render(this.ctx);
        this.health.render(this.ctx);
        this.bulletContainer.render(this.ctx);
        if (this.health.lifesNumber < 3) {
            this.health.show();
        } else {
            this.health.hide();
        }

        if (this.health.lifesNumber === 0) {
            return 0;
        }

        this.checkBulletsAndAsteroidsCollision();
        this.checkPlayerAsteroidsCollision();
        this.checkPlayerHealthCollision();
        this.bcgrTranslation();
        requestAnimationFrame(this.loop.bind(this));
    }

    checkBulletsAndAsteroidsCollision() {
        for (var i = this.bulletContainer.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bulletContainer.bullets[i];
            if (((bullet.pos.x > 1250) || (bullet.pos.x < -50)) || ((bullet.pos.y > 850) || (bullet.pos.y < -50))) {
                this.bulletContainer.bullets.splice(i, 1);
                i--;
            }
        }
        for (var j = 0; j < this.bulletContainer.bullets.length; j++) {
            for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
                const bullet = this.bulletContainer.bullets[j];
                const asteroid = this.asteroidsContainer.asteroids[k];
                if (GetDistance(bullet.pos, asteroid.pos) < 30) {
                    if (this.player.isImmortal) { continue; }
                    else {
                        this.bulletContainer.bullets.splice(j, 1);
                        this.asteroidsContainer.asteroids.splice(k, 1);
                        this.scoreNumber++;
                        this.scoreElement.innerHTML = "Score: " + this.scoreNumber.toString();
                        break;
                    }
                }
            }
        }
    }

    checkPlayerAsteroidsCollision() {
        if (!this.player.isImmortal) {
            for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
                const asteroid = this.asteroidsContainer.asteroids[k];
                if (GetDistance(asteroid.pos, this.player.pos) < 65.5) {
                    this.asteroidsContainer.asteroids.splice(k, 1);
                    this.player.isImmortal = true;
                    setTimeout(() => { this.player.isImmortal = false }, 3000);
                    switch (this.health.lifesNumber) {
                        case 1:
                            this.health.life1.style.display = "none";
                            this.health.lifesNumber--;
                            break;
                        case 2:
                            this.health.life2.style.display = "none";
                            this.health.lifesNumber--;
                            break;
                        case 3:
                            this.health.life3.style.display = "none";
                            this.health.lifesNumber--;
                            break;
                    }
                }
            }
        }
    }
    checkPlayerHealthCollision() {
        if (GetDistance(this.health.pos, this.player.pos) < 30) {

            switch (this.health.lifesNumber) {
                case 1:
                    this.health.life2.style.display = "inline";
                    this.health.lifesNumber++;
                    this.health.hide();
                    this.health.pos = { x: -100, y: -100 }
                    break;
                case 2:
                    this.health.life3.style.display = "inline";
                    this.health.lifesNumber++;
                    this.health.hide();
                    this.health.pos = { x: -100, y: -100 }
                    break;
            }
        }
    }

    bcgrTranslation() {
        this.x += 0.0001;
        var bgr_x = Math.cos(this.x) * 10000;
        var bgr_y = Math.sin(this.x) * 10000;
        this.canvas.style.backgroundPositionX = bgr_x.toString() + "px";
        this.canvas.style.backgroundPositionY = bgr_y.toString() + "px";
    }
}
