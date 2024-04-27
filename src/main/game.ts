import { Assets } from "../assets";
import { AsteroidContainer } from "../components/asteroids";
import { BulletContainer } from "../components/bullet";
import { Health } from "../components/health";
import { Player } from "../components/player";
import { Ui } from "../components/ui";
import { GetDistance } from "../utils/utils";

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bulletContainer: BulletContainer;
    player: Player;
    health: Health;
    asteroidsContainer: AsteroidContainer;
    gameUi: Ui;

    x = 0;

    constructor(private assets: Assets) {
        this.canvas = document.getElementById('AsteroidCanvas') as HTMLCanvasElement;
        this.canvas.width =  window.outerWidth;
        this.canvas.height =  window.outerHeight;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.bulletContainer = new BulletContainer(this.assets);
        this.player = new Player(this.assets, {x: this.canvas.width/2, y: this.canvas.height/2}, this.bulletContainer, this.canvas);
        this.health = new Health(this.assets.image_health, this.canvas);
        this.asteroidsContainer = new AsteroidContainer(this.assets, this.canvas);
        this.gameUi = new Ui(this.assets);

        window.addEventListener('resize', this.resize.bind(this))
        this.resize();
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.asteroidsContainer.render(this.ctx, this.player);
        this.player.render(this.ctx);
        this.health.render(this.ctx);
        this.bulletContainer.render(this.ctx);
        this.gameUi.render(this.ctx);
        if (this.gameUi.lifes < 5) {
            this.health.show();
        } else {
            this.health.hide();
        }

        if (this.gameUi.lifes <= 0) {
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
            if (((bullet.pos.x > this.canvas.width*1.1) || (bullet.pos.x < -this.canvas.height*0.1)) || ((bullet.pos.y > this.canvas.height*1.1) || (bullet.pos.y < -this.canvas.width*0.1))) {
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
                        this.gameUi.score++;
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
                    this.gameUi.lifes--;
                }
            }
        }
    }
    checkPlayerHealthCollision() {
        if(!this.health.available) return;
        if (GetDistance(this.health.pos, this.player.pos) < 30) {
            this.gameUi.lifes++;
            this.health.available = false;
        }
    }

    bcgrTranslation() {
        this.x += 0.0001;
        var bgr_x = Math.cos(this.x) * 10000;
        var bgr_y = Math.sin(this.x) * 10000;
        this.canvas.style.backgroundPositionX = bgr_x.toString() + "px";
        this.canvas.style.backgroundPositionY = bgr_y.toString() + "px";
    }

    resize() {
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
    }
}
