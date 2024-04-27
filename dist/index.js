// src/utils/utils.ts
function GetAngleFromVector(v) {
  return Math.atan2(v.y, v.x) + Math.PI / 2;
}
function NormalizeVectorFromPoints(v1, v2) {
  var Vlength = GetDistance(v1, v2);
  return { x: (v1.x - v2.x) / Vlength, y: (v1.y - v2.y) / Vlength };
}
function GetDistance(p1, p2) {
  var vx = p1.x - p2.x;
  var vy = p1.y - p2.y;
  var Vlength = Math.sqrt(vx * vx + vy * vy);
  return Vlength;
}
function SwapAndSlow(v1, v2) {
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

// src/assets.ts
var Assets = class {
  image_spaceship;
  image_spaceship_engines;
  image_bullet;
  image_asteroid;
  image_health;
  image_shipshield;
  constructor() {
  }
  async preload() {
    return [this.image_spaceship, this.image_spaceship_engines, this.image_bullet, this.image_asteroid, this.image_health, this.image_shipshield] = await Promise.all([
      addImageProcess("./spaceship.png"),
      addImageProcess("./spaceship-engines.png"),
      addImageProcess("./bullet.png"),
      addImageProcess("./asteroid2.png"),
      addImageProcess("./health.png"),
      addImageProcess("./shipshield.png")
    ]);
  }
};

// src/components/asteroids.ts
var Asteroid = class {
  constructor(asset, pos, movV) {
    this.asset = asset;
    this.pos.x = pos.x;
    this.pos.y = pos.y;
    this.movV.x = movV.x * 2.5;
    this.movV.y = movV.y * 2.5;
    ;
  }
  pos = { x: 0, y: 0 };
  movV = { x: 0, y: 0 };
  angle = 0;
  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.asset, -25.5, -25.5);
    ctx.restore();
    this.angle += 0.02;
    this.pos.x -= this.movV.x;
    this.pos.y -= this.movV.y;
  }
};
var AsteroidContainer = class {
  constructor(assets) {
    this.assets = assets;
  }
  asteroids = [];
  render(ctx, player) {
    if (this.asteroids.length < 5) {
      const AsteroidsSpawn = [{ x: 1200 * Math.random(), y: 0 }, { x: 1200 * Math.random(), y: 800 }, { x: 0, y: 800 * Math.random() }, { x: 1200, y: 800 * Math.random() }];
      const randomElement = Math.random() * 4 | 0;
      this.asteroids.push(new Asteroid(this.assets.image_asteroid, { x: AsteroidsSpawn[randomElement].x, y: AsteroidsSpawn[randomElement].y }, NormalizeVectorFromPoints(AsteroidsSpawn[randomElement], { x: player.pos.x + Math.random() * 20 + 20, y: player.pos.x + Math.random() * 20 + 20 })));
    }
    for (var i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render(ctx);
    }
    this.remove();
    this.checkCollision();
  }
  remove() {
    for (var i = this.asteroids.length - 1; i >= 0; i--) {
      if (this.asteroids[i].pos.x > 1250 || this.asteroids[i].pos.x < -50 || (this.asteroids[i].pos.y > 850 || this.asteroids[i].pos.y < -50)) {
        this.asteroids.splice(i, 1);
        i--;
      }
    }
  }
  checkCollision() {
    for (var i = 0; i < this.asteroids.length; i++) {
      for (var j = 0; j < this.asteroids.length; j++) {
        if (i === j) {
          continue;
        }
        if (GetDistance(this.asteroids[i].pos, this.asteroids[j].pos) < 51) {
          var vBetween = NormalizeVectorFromPoints(this.asteroids[i].pos, this.asteroids[j].pos);
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
    this.angle = GetAngleFromVector(movV);
  }
  movV = { x: 0, y: 0 };
  angle = 0;
  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.asset, 2.5, 0);
    ctx.restore();
    this.pos.x += this.movV.x;
    this.pos.y += this.movV.y;
  }
};
var BulletContainer = class {
  constructor(assets) {
    this.assets = assets;
  }
  bullets = [];
  addBullet(pos, angle) {
    this.bullets.push(new Bullet(this.assets.image_bullet, pos, angle));
  }
  render(ctx) {
    this.bullets.forEach((bullet) => {
      bullet.render(ctx);
    });
  }
};

// src/components/health.ts
var Health = class {
  constructor(asset, pos) {
    this.asset = asset;
    this.pos = pos;
    this.life1 = document.getElementById("health1");
    this.life2 = document.getElementById("health2");
    this.life3 = document.getElementById("health3");
  }
  angle = 0;
  isAlive = false;
  TimeoutHandler;
  isWoring = false;
  life1;
  life2;
  life3;
  lifesNumber = 3;
  render(ctx) {
    if (this.isAlive) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.angle);
      ctx.drawImage(this.asset, -25.5, -25.5);
      ctx.restore();
      this.angle += 0.02;
    }
  }
  show() {
    if (this.isWoring) {
      return;
    }
    ;
    this.isWoring = true;
    var callback = () => {
      this.isAlive = !this.isAlive;
      this.pos.x = 1e3 * Math.random() + 100;
      this.pos.y = 600 * Math.random() + 100;
      this.TimeoutHandler = setTimeout(callback, Math.random() * 1e4 + 1e4);
    };
    this.TimeoutHandler = setTimeout(callback, Math.random() * 1e4 + 1e4);
  }
  hide() {
    if (!this.isWoring) {
      return;
    }
    ;
    this.isWoring = false;
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
  constructor(assets, pos, bulletContainer, canvas) {
    this.assets = assets;
    this.pos = pos;
    this.bulletContainer = bulletContainer;
    this.canvas = canvas;
    this.startCheckingMousePosition();
  }
  rotV = { x: 0, y: 0 };
  movV = { x: 0, y: 0 };
  mousePos = { x: 0, y: 0 };
  blinkingEnginesProgress = 0;
  blinkingImortalityProgress = 0;
  isImmortal = false;
  startCheckingMousePosition() {
    this.canvas.onmousemove = (evt) => {
      this.mousePos.x = evt.offsetX;
      this.mousePos.y = evt.offsetY;
    };
    this.canvas.onmousedown = (evt) => {
      var angle = GetAngleFromVector(this.rotV) - Math.PI / 2;
      var translationX1 = Math.cos(angle - 0.58) * 47;
      var translationY1 = Math.sin(angle - 0.58) * 47;
      var translationX2 = Math.cos(angle + 0.51) * 45;
      var translationY2 = Math.sin(angle + 0.51) * 45;
      this.bulletContainer.addBullet({ x: this.pos.x + translationX1, y: this.pos.y + translationY1 }, this.rotV);
      this.bulletContainer.addBullet({ x: this.pos.x + translationX2, y: this.pos.y + translationY2 }, this.rotV);
    };
  }
  render(ctx) {
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
  checkCollision() {
    if (this.pos.y > this.canvas.height - 50) {
      this.pos.y = this.canvas.height - 50;
      this.movV.y = -this.movV.y * 0.6;
    }
    if (this.pos.y < 50) {
      this.pos.y = 50;
      this.movV.y = -this.movV.y * 0.6;
    }
    if (this.pos.x > this.canvas.width - 45) {
      this.pos.x = this.canvas.width - 45;
      this.movV.x = -this.movV.x * 0.6;
    }
    if (this.pos.x < 45) {
      this.pos.x = 45;
      this.movV.x = -this.movV.x * 0.6;
    }
  }
  draw(ctx) {
    if (Keyboard.keys[32]) {
      ctx.save();
      this.blinkingEnginesProgress += 0.1;
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(GetAngleFromVector(this.rotV));
      ctx.globalAlpha = Math.sin(this.blinkingEnginesProgress) / 2 + 0.75;
      ctx.drawImage(this.assets.image_spaceship_engines, -45, -50);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(GetAngleFromVector(this.rotV));
    ctx.globalAlpha = 1;
    ctx.drawImage(this.assets.image_spaceship, -45, -50);
    ctx.restore();
    if (this.isImmortal) {
      this.blinkingImortalityProgress += 0.1;
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(GetAngleFromVector(this.rotV));
      ctx.globalAlpha = Math.sin(this.blinkingImortalityProgress) / 2 + 0.5;
      ctx.drawImage(this.assets.image_shipshield, -45, -50);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
};

// src/main/game.ts
var Game = class {
  constructor(assets) {
    this.assets = assets;
    this.canvas = document.getElementById("MainCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreElement = document.getElementById("score");
    this.bulletContainer = new BulletContainer(this.assets);
    this.player = new Player(this.assets, { x: 600, y: 400 }, this.bulletContainer, this.canvas);
    this.health = new Health(this.assets.image_health, { x: 1e3 * Math.random() + 100, y: 600 * Math.random() + 100 });
    this.asteroidsContainer = new AsteroidContainer(this.assets);
  }
  canvas;
  ctx;
  bulletContainer;
  player;
  health;
  asteroidsContainer;
  x = 0;
  scoreNumber = 0;
  scoreElement;
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
      if (bullet.pos.x > 1250 || bullet.pos.x < -50 || (bullet.pos.y > 850 || bullet.pos.y < -50)) {
        this.bulletContainer.bullets.splice(i, 1);
        i--;
      }
    }
    for (var j = 0; j < this.bulletContainer.bullets.length; j++) {
      for (var k = 0; k < this.asteroidsContainer.asteroids.length; k++) {
        const bullet = this.bulletContainer.bullets[j];
        const asteroid = this.asteroidsContainer.asteroids[k];
        if (GetDistance(bullet.pos, asteroid.pos) < 30) {
          if (this.player.isImmortal) {
            continue;
          } else {
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
          setTimeout(() => {
            this.player.isImmortal = false;
          }, 3e3);
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
          this.health.pos = { x: -100, y: -100 };
          break;
        case 2:
          this.health.life3.style.display = "inline";
          this.health.lifesNumber++;
          this.health.hide();
          this.health.pos = { x: -100, y: -100 };
          break;
      }
    }
  }
  bcgrTranslation() {
    this.x += 1e-4;
    var bgr_x = Math.cos(this.x) * 1e4;
    var bgr_y = Math.sin(this.x) * 1e4;
    this.canvas.style.backgroundPositionX = bgr_x.toString() + "px";
    this.canvas.style.backgroundPositionY = bgr_y.toString() + "px";
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
