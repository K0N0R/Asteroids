// src/utils/utils.ts
function getAngleFromVector(v) {
  return Math.atan2(v.y, v.x) + Math.PI / 2;
}
function NormalizeVectorFromPoints(v1, v2) {
  var Vlength = distance(v1, v2);
  return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };
}
function distance(p1, p2) {
  var vx = p1.x - p2.x;
  var vy = p1.y - p2.y;
  var Vlength = Math.sqrt(vx * vx + vy * vy);
  return Vlength;
}
function swapAndSlow(v1, v2) {
  var tmp = v1.x;
  v1.x = v2.x;
  v2.x = tmp;
  tmp = v1.y;
  v1.y = v2.y;
  v2.y = tmp;
  return [v1, v2];
}
function addImageProcess(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function getRandomValueFromRange(min, max, rng = Math.random) {
  const delta = max - min;
  return min + delta * rng();
}
function getRandomIntegerFromRange(min, max, rng = Math.random) {
  return Math.round(getRandomValueFromRange(min - 0.5 + Number.EPSILON, max + 0.5 - Number.EPSILON, rng));
}
function normalise(v) {
  const vLength = distance(v, { x: 0, y: 0 });
  if (vLength === 0)
    return { x: 0, y: 0 };
  return {
    x: v.x / vLength,
    y: v.y / vLength
  };
}

// src/assets.ts
var Assets = class {
  image_spaceship;
  image_spaceship_engines;
  image_bullet;
  image_asteroid_1;
  image_asteroid_2;
  image_health;
  image_shipshield;
  constructor() {
  }
  async preload() {
    return [this.image_spaceship, this.image_spaceship_engines, this.image_bullet, this.image_asteroid_1, this.image_asteroid_2, this.image_health, this.image_shipshield] = await Promise.all([
      addImageProcess("./spaceship.png"),
      addImageProcess("./spaceship-engines.png"),
      addImageProcess("./bullet.png"),
      addImageProcess("./asteroid1.png"),
      addImageProcess("./asteroid2.png"),
      addImageProcess("./health.png"),
      addImageProcess("./shipshield.png")
    ]);
  }
};

// src/components/asteroids.ts
var Asteroid = class {
  constructor(asset, pos, movV, size) {
    this.asset = asset;
    this.size = size;
    this.pos.x = pos.x;
    this.pos.y = pos.y;
    this.movV.x = movV.x * getRandomValueFromRange(0.1, 2.5);
    this.movV.y = movV.y * getRandomValueFromRange(0.1, 2.5);
    this.health = Math.ceil(this.size / 10);
  }
  pos = { x: 0, y: 0 };
  movV = { x: 0, y: 0 };
  angle = 0;
  health = 0;
  scale = 1;
  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale / 30 * this.size, this.scale / 30 * this.size);
    ctx.drawImage(this.asset, -25.5, -25.5);
    ctx.restore();
    this.angle += 0.02;
    this.pos.x -= this.movV.x;
    this.pos.y -= this.movV.y;
  }
};
var AsteroidContainer = class {
  constructor(assets, player, canvas) {
    this.assets = assets;
    this.player = player;
    this.canvas = canvas;
    setInterval(() => {
      const spawn = () => {
        if (this.asteroids.length < 500) {
          const angle = getRandomValueFromRange(0, Math.PI * 2);
          const vector = normalise({ x: Math.cos(angle), y: Math.sin(angle) });
          const distance2 = getRandomValueFromRange(2e3, 2500);
          const asteroidsSpawn = {
            x: this.player.pos.x + vector.x * distance2,
            y: this.player.pos.y + vector.y * distance2
          };
          this.asteroids.push(new Asteroid(
            Math.random() > 0.5 ? this.assets.image_asteroid_1 : this.assets.image_asteroid_2,
            asteroidsSpawn,
            NormalizeVectorFromPoints(
              asteroidsSpawn,
              { x: this.player.pos.x + getRandomValueFromRange(-100, 100), y: this.player.pos.y + getRandomValueFromRange(-100, 100) }
            ),
            getRandomIntegerFromRange(10, 100)
          ));
        }
      };
      for (let i = 0; i < 50; i++) {
        spawn();
      }
    }, 2500);
  }
  asteroids = [];
  render(ctx) {
    for (var i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render(ctx);
    }
    this.remove();
    this.checkCollision();
  }
  remove() {
    for (var i = this.asteroids.length - 1; i >= 0; i--) {
      if (distance(this.player.pos, this.asteroids[i].pos) > 4e3) {
        this.asteroids.splice(i, 1);
      }
    }
  }
  checkCollision() {
    for (var i = 0; i < this.asteroids.length; i++) {
      for (var j = 0; j < this.asteroids.length; j++) {
        if (i === j) {
          continue;
        }
        if (distance(this.asteroids[i].pos, this.asteroids[j].pos) < this.asteroids[i].size + this.asteroids[j].size) {
          var vBetween = NormalizeVectorFromPoints(this.asteroids[i].pos, this.asteroids[j].pos);
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
};

// src/components/bullet.ts
var Bullet = class {
  constructor(asset, pos, movV) {
    this.asset = asset;
    this.pos = pos;
    this.pos.x = pos.x;
    this.pos.y = pos.y;
    this.movV.x = movV.x * 10;
    this.movV.y = movV.y * 10;
    this.angle = getAngleFromVector(movV);
  }
  movV = { x: 0, y: 0 };
  angle = 0;
  scale = 0.5;
  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.angle);
    ctx.drawImage(this.asset, 2.5, 0);
    ctx.restore();
    this.pos.x += this.movV.x;
    this.pos.y += this.movV.y;
  }
};
var BulletContainer = class {
  constructor(assets, player) {
    this.assets = assets;
    this.player = player;
  }
  bullets = [];
  addBullet(pos, angle) {
    this.bullets.push(new Bullet(this.assets.image_bullet, pos, angle));
  }
  render(ctx) {
    this.bullets.forEach((bullet) => {
      bullet.render(ctx);
    });
    this.remove();
  }
  remove() {
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      if (distance(this.player.pos, this.bullets[i].pos) > 4e3) {
        this.bullets.splice(i, 1);
      }
    }
  }
};

// src/components/health.ts
var Health = class {
  constructor(asset, canvas, player) {
    this.asset = asset;
    this.canvas = canvas;
    this.player = player;
  }
  pos = { x: 0, y: 0 };
  angle = 0;
  available = false;
  TimeoutHandler;
  isShowing = false;
  scale = 0.5;
  render(ctx) {
    if (this.available) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.scale(this.scale, this.scale);
      ctx.rotate(this.angle);
      ctx.drawImage(this.asset, -25.5, -25.5);
      ctx.restore();
      this.angle += 0.02;
    }
  }
  show() {
    if (this.isShowing) {
      return;
    }
    ;
    this.isShowing = true;
    var callback = () => {
      this.available = !this.available;
      this.pos.x = getRandomValueFromRange(this.player.pos.x - this.canvas.width * 0.5, this.player.pos.x + this.canvas.width * 0.5);
      this.pos.y = getRandomValueFromRange(this.player.pos.y - this.canvas.height * 0.5, this.player.pos.y + this.canvas.height * 0.5);
      this.TimeoutHandler = setTimeout(callback, Math.random() * 1e4 + 1e4);
    };
    this.TimeoutHandler = setTimeout(callback, Math.random() * 1e4 + 1e4);
  }
  hide() {
    if (!this.isShowing) {
      return;
    }
    ;
    this.isShowing = false;
    clearTimeout(this.TimeoutHandler);
  }
};

// src/utils/keyboard.ts
var Keyboard = class _Keyboard {
  static keys = new Array(200);
  static start() {
    window.onkeydown = function keypress(evt) {
      _Keyboard.keys[evt.keyCode] = true;
    };
    window.onkeyup = function keypress(evt) {
      _Keyboard.keys[evt.keyCode] = false;
    };
  }
};

// src/components/player.ts
var Player = class {
  constructor(assets, pos, canvas) {
    this.assets = assets;
    this.pos = pos;
    this.canvas = canvas;
  }
  rotV = { x: 0, y: 0 };
  movV = { x: 0, y: 0 };
  mousePos = { x: 0, y: 0 };
  blinkingEnginesProgress = 0;
  blinkingImortalityProgress = 0;
  isImmortal = false;
  render(ctx) {
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
      x: this.pos.x - this.canvas.width / 2 + this.mousePos.x,
      y: this.pos.y - this.canvas.height / 2 + this.mousePos.y
    };
  }
  scale = 0.33;
  draw(ctx) {
    if (Keyboard.keys[32]) {
      ctx.save();
      this.blinkingEnginesProgress += 0.1;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(getAngleFromVector(this.rotV));
      ctx.globalAlpha = Math.sin(this.blinkingEnginesProgress) / 2 + 1;
      ctx.scale(this.scale, this.scale);
      ctx.drawImage(this.assets.image_spaceship_engines, -45, -50);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(getAngleFromVector(this.rotV));
    ctx.globalAlpha = 1;
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.assets.image_spaceship, -45, -50);
    ctx.restore();
    if (this.isImmortal) {
      this.blinkingImortalityProgress += 0.1;
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(getAngleFromVector(this.rotV));
      ctx.globalAlpha = Math.sin(this.blinkingImortalityProgress) / 2 + 0.5;
      ctx.scale(this.scale, this.scale);
      ctx.drawImage(this.assets.image_shipshield, -45, -50);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
};

// src/components/ui.ts
var Ui = class {
  constructor(assets, canvas) {
    this.assets = assets;
    this.canvas = canvas;
    setTimeout(() => {
      this.showHandlingOptions = false;
    }, 1e4);
  }
  lifes = 5;
  score = 0;
  showHandlingOptions = true;
  render(ctx) {
    ctx.textAlign = "left";
    ctx.font = "25px Trebuchet MS";
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${this.score}`, 12.5, 25);
    for (let i = 0; i < this.lifes; i++) {
      ctx.drawImage(this.assets.image_health, -25.5 + 37.5, -25.5 + 75 + i * 50);
    }
    if (this.showHandlingOptions) {
      ctx.font = "16px Trebuchet MS";
      ctx.fillStyle = "white";
      ctx.fillText(`aim: "Mouse"`, 37.5 + 50, 67.5);
      ctx.font = "16px Trebuchet MS";
      ctx.fillStyle = "white";
      ctx.fillText(`shoot: "Left Mouse"`, 37.5 + 50, 92.6);
      ctx.font = "16px Trebuchet MS";
      ctx.fillStyle = "white";
      ctx.fillText(`accelerate: "Space"`, 37.5 + 50, 117.5);
    }
  }
  renderDeath(ctx) {
    ctx.font = "56px Trebuchet MS";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText(`YOU DIED`, this.canvas.width / 2, this.canvas.height / 2);
  }
};

// src/main/game.ts
var Game = class {
  constructor(assets) {
    this.assets = assets;
    this.canvas = document.getElementById("AsteroidCanvas");
    this.canvas.width = window.outerWidth;
    this.canvas.height = window.outerHeight;
    this.ctx = this.canvas.getContext("2d");
    this.player = new Player(this.assets, { x: this.canvas.width / 2, y: this.canvas.height / 2 }, this.canvas);
    this.bulletContainer = new BulletContainer(this.assets, this.player);
    this.health = new Health(this.assets.image_health, this.canvas, this.player);
    this.asteroidsContainer = new AsteroidContainer(this.assets, this.player, this.canvas);
    this.gameUi = new Ui(this.assets, this.canvas);
    window.addEventListener("resize", this.resize.bind(this));
    this.ctx.scale(0.5, 0.5);
    this.resize();
    this.startCheckingMouse();
  }
  canvas;
  ctx;
  bulletContainer;
  player;
  health;
  asteroidsContainer;
  gameUi;
  x = 0;
  get isDead() {
    return this.gameUi.lifes <= 0;
  }
  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-this.player.pos.x + this.canvas.width / 2, -this.player.pos.y + this.canvas.height / 2);
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
        if (distance(bullet.pos, asteroid.pos) < asteroid.size) {
          this.bulletContainer.bullets.splice(j, 1);
          asteroid.health -= 1;
          asteroid.size = asteroid.size * 0.9;
          if (asteroid.health <= 0) {
            this.asteroidsContainer.asteroids.splice(k, 1);
            this.gameUi.score++;
          }
          break;
        }
      }
    }
  }
  checkPlayerAsteroidsCollision() {
    if (!this.player.isImmortal) {
      for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
        const asteroid = this.asteroidsContainer.asteroids[k];
        if (distance(asteroid.pos, this.player.pos) < 15 + asteroid.size) {
          asteroid.health -= 1;
          asteroid.size = asteroid.size * 0.9;
          if (asteroid.health <= 0) {
            this.asteroidsContainer.asteroids.splice(k, 1);
          }
          this.player.isImmortal = true;
          setTimeout(() => {
            this.player.isImmortal = false;
          }, 3e3);
          this.gameUi.lifes--;
        }
      }
    }
  }
  checkPlayerHealthCollision() {
    if (!this.health.available)
      return;
    if (distance(this.health.pos, this.player.pos) < 15) {
      this.gameUi.lifes++;
      this.health.available = false;
    }
  }
  bcgrTranslation() {
    this.x += 1e-4;
    var bgr_x = -this.player.pos.x / 4;
    var bgr_y = -this.player.pos.y / 4;
    this.canvas.style.backgroundPositionX = bgr_x.toString() + "px";
    this.canvas.style.backgroundPositionY = bgr_y.toString() + "px";
  }
  resize() {
    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;
  }
  startCheckingMouse() {
    this.canvas.onmousemove = (evt) => {
      this.player.mousePos.x = evt.offsetX;
      this.player.mousePos.y = evt.offsetY;
    };
    this.canvas.onmousedown = (evt) => {
      if (!this.isDead) {
        var angle = getAngleFromVector(this.player.rotV) - Math.PI / 2;
        const bullets = [
          { x: Math.cos(angle - 0.78) * 29, y: Math.sin(angle - 0.78) * 29 },
          { x: Math.cos(angle + 0.49) * 24, y: Math.sin(angle + 0.49) * 24 },
          { x: Math.cos(angle - 0.2) * 43, y: Math.sin(angle - 0.2) * 43 },
          { x: Math.cos(angle - 0.025) * 43, y: Math.sin(angle - 0.025) * 43 }
        ];
        bullets.forEach((bullet) => {
          this.bulletContainer.addBullet({ x: this.player.pos.x + bullet.x, y: this.player.pos.y + bullet.y }, this.player.rotV);
        });
      }
    };
  }
};

// src/index.ts
window.onload = async function() {
  Keyboard.start();
  const assets = new Assets();
  await assets.preload();
  const game = new Game(assets);
  game.loop();
};
//# sourceMappingURL=index.js.map
