import { Assets } from "../assets";
import { AsteroidContainer } from "../components/asteroids";
import { BulletContainer } from "../components/bullet";
import { Health } from "../components/health";
import { Player } from "../components/player";
import { Ui } from "../components/ui";
import { getAngleFromVector, distance } from "../utils/utils";

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    bulletContainer: BulletContainer;
    player: Player;
    health: Health;
    asteroidsContainer: AsteroidContainer;
    gameUi: Ui;

    x = 0;
    get isDead() {
        return this.gameUi.lifes <= 0
    }

    constructor(private assets: Assets) {
        this.canvas = document.getElementById('AsteroidCanvas') as HTMLCanvasElement;
        this.canvas.width =  window.outerWidth;
        this.canvas.height =  window.outerHeight;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.player = new Player(this.assets, {x: this.canvas.width/2, y: this.canvas.height/2}, this.canvas);
        this.bulletContainer = new BulletContainer(this.assets, this.player);
                this.health = new Health(this.assets.image_health, this.canvas, this.player);
        this.asteroidsContainer = new AsteroidContainer(this.assets, this.player, this.canvas);
        this.gameUi = new Ui(this.assets, this.canvas);

        window.addEventListener('resize', this.resize.bind(this))
        this.ctx.scale(0.5, 0.5);
        this.resize();
        this.startCheckingMouse();
        
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.player.pos.x + this.canvas.width/2, -this.player.pos.y + this.canvas.height/2);
        if (!this.isDead) {
            this.player.render(this.ctx);
            if (this.gameUi.lifes < 5) {
                this.health.show();
            } else {
                this.health.hide();
            }
            this.health.render(this.ctx);
        }
        this.asteroidsContainer.render(this.ctx);
        this.bulletContainer.render(this.ctx);
        this.ctx.restore();
        this.gameUi.render(this.ctx);
        if (this.isDead) {
            this.gameUi.renderDeath(this.ctx);
        }

        this.checkBulletsAndAsteroidsCollision();
        if (!this.isDead) {
            this.checkPlayerAsteroidsCollision();
            this.checkPlayerHealthCollision();
        }
        this.bcgrTranslation();
        requestAnimationFrame(this.loop.bind(this));
        
    }

    checkBulletsAndAsteroidsCollision() {
        for (var j = 0; j < this.bulletContainer.bullets.length; j++) {
            for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
                const bullet = this.bulletContainer.bullets[j];
                const asteroid = this.asteroidsContainer.asteroids[k];
                if (distance(bullet.pos, asteroid.pos) < 30) {
                    this.bulletContainer.bullets.splice(j, 1);
                    this.asteroidsContainer.asteroids.splice(k, 1);
                    this.gameUi.score++;
                    break;
                }
            }
        }
    }

    checkPlayerAsteroidsCollision() {
        if (!this.player.isImmortal) {
            for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
                const asteroid = this.asteroidsContainer.asteroids[k];
                if (distance(asteroid.pos, this.player.pos) < 50) {
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
        if (distance(this.health.pos, this.player.pos) < 30) {
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

    startCheckingMouse() {
        this.canvas.onmousemove = (evt:any) => {
            this.player.mousePos.x = evt.offsetX;
            this.player.mousePos.y = evt.offsetY;
        }
        this.canvas.onmousedown = (evt:any) => {
            if (!this.isDead) {
                var angle = getAngleFromVector(this.player.rotV) - Math.PI / 2;
                const bullets = [
                    {x: Math.cos(angle - 0.78) * 29, y: Math.sin(angle - 0.78) * 29},
                    {x: Math.cos(angle + 0.49) * 24, y: Math.sin(angle + 0.49) * 24},
                    {x: Math.cos(angle - 0.2) * 43, y: Math.sin(angle - 0.2) * 43},
                    {x: Math.cos(angle - 0.025) * 43, y: Math.sin(angle - 0.025) * 43},
                ]
                bullets.forEach(bullet => {
                    this.bulletContainer.addBullet({ x: this.player.pos.x + bullet.x, y: this.player.pos.y + bullet.y }, this.player.rotV);
                })
            }
        }
    }
}
