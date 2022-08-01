window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 1268;
  canvas.height = 500;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (!this.game.keys.includes(e.key)) {
            this.game.keys.push(e.key);
          }
        } else if (e.key === " ") {
          this.game.player.shootTop();
        } else if (e.key === "d") this.game.debug = !this.game.debug;
      });

      window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          const idx = this.game.keys.indexOf(e.key);
          if (idx !== -1) {
            this.game.keys.splice(idx, 1);
          }
        }
      });
    }
  }

  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.speed = Math.random() * 0.2 + 2.8;
      this.markForDeletion = false;
      this.image = document.getElementById("fireball");
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrameX = 4;
      this.width = this.image.width / this.maxFrameX;
      this.height = this.image.height;
      this.timer = 0;
      this.fps = 30;
      this.timerInterval = 1000 / this.fps;
    }
    update(deltaTime) {
      this.x += this.speed;
      if (this.x > this.game.width * 0.8) this.markForDeletion = true;

      if (this.timer > this.timerInterval) {
        this.timer = 0;
        ++this.frameX;
        if (this.frameX >= this.maxFrameX) this.frameX = 0;
      } else this.timer += deltaTime;
    }

    draw(context) {
      // context.fillStyle = "yellow";
      // context.fillRect(this.x, this.y, this.width, this.height);
      // context.drawImage(this.image, this.x, this.y);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Bangers";
      this.color = "white";
    }
    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";
      context.font = this.fontSize + "px " + this.fontFamily;
      //score
      context.fillText(`Score: ${this.game.score}`, 20, 40);

      const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
      context.fillText(`Score: ${this.game.score}`, 20, 40);
      context.fillText("Time: " + formattedTime, 20, 95);
      if (this.game.gameOver) {
        context.textAlign = "center";
        let message1;
        let message2;
        if (this.game.score > this.game.winningScore) {
          message1 = "You Win!";
          message2 = "Well done!";
        } else {
          message1 = "You lose!";
          message2 = "Try again!";
        }
        context.font = `50px ${this.fontFamily}`;
        context.fillText(
          message1,
          this.game.width * 0.5,
          this.game.height * 0.5
        );
        context.font = `25px ${this.fontFamily}`;
        context.fillText(
          message2,
          this.game.width * 0.5,
          this.game.height * 0.5 + 30
        );
      }

      //projectiles
      if (this.game.player.powerUp) context.fillStyle = "#ffffbd";

      for (let i = 0; i < this.game.ammo; ++i) {
        context.fillRect(20 + i * 5, 50, 3, 20);
      }

      context.restore();
    }
  }

  class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById("gears");
      this.frameX = Math.floor(Math.random() * 3);
      this.frameY = Math.floor(Math.random() * 3);
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size = this.spriteSize * this.sizeModifier;
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markForDeletion = false;
      this.angle = 0;
      this.va = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      this.bottomBounceBoundary = Math.random() * 80 + 60;
    }
    update() {
      this.angle += this.va;
      this.speedY += this.gravity;
      this.x -= this.speedX + this.game.speed;
      this.y += this.speedY;

      if (this.y > this.game.height || this.x < 0 - this.size)
        this.markForDeletion = true;

      if (
        this.y > this.game.height - this.bottomBounceBoundary &&
        this.bounced < 2
      ) {
        ++this.bounced;
        this.speedY *= -0.5;
      }
    }
    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.spriteSize,
        this.frameY * this.spriteSize,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();
    }
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 100;
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.image = document.getElementById("player");
      this.powerUp = false;
      this.powerUpTimer = 0;
      this.powerUpLimit = 10000;
    }
    update(deltaTime) {
      //increment frame
      if (this.frameX < this.maxFrame) ++this.frameX;
      else this.frameX = 0;
      // handle move
      if (this.game.keys.includes("ArrowUp")) this.speedY -= this.maxSpeed;
      else if (this.game.keys.includes("ArrowDown"))
        this.speedY += this.maxSpeed;
      else this.speedY = 0;
      this.y += this.speedY;

      if (this.y > this.game.height - this.height * 0.5)
        this.y = this.game.height - this.height * 0.5;

      if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;

      //   handle projectiles
      this.projectiles.forEach((projectile) => projectile.update(deltaTime));
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markForDeletion
      );

      //power up
      if (this.powerUp) {
        if (this.powerUpTimer > this.powerUpLimit) {
          this.game.sound.playSound("powerDownSound");
          this.powerUpTimer = 0;
          this.powerUp = false;
          this.frameY = 0;
        } else {
          this.game.ammo += 0.1;
          this.frameY = 1;
          this.powerUpTimer += deltaTime;
        }
      }
    }
    draw(context) {
      this.projectiles.forEach((projectile) => projectile.draw(context));
      if (this.game.debug)
        context.strokeRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    enterPowUp() {
      if (this.game.ammo < this.game.maxAmmo)
        this.game.ammo = this.game.maxAmmo;
      this.powerUpTimer = 0;
      this.powerUp = true;
      this.game.sound.playSound("powerUpSound");
    }

    shootTop() {
      if (this.game.ammo > 0) {
        this.game.sound.playSound("shootSound");
        this.projectiles.push(
          new Projectile(this.game, this.x + this.width - 10, this.y + 30)
        );
        --this.game.ammo;
      }
      if (this.powerUp) this.shootBottom();
    }

    shootBottom() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(
            this.game,
            this.x + this.width - 10,
            this.y + this.height - 14
          )
        );
      }
    }
  }

  class Shield {
    constructor(game) {
      this.game = game;
      this.image = document.getElementById("shield");
      this.width = this.game.player.width;
      this.height = this.game.player.height;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrameX = 24;
      this.timer = 0;
      this.fps = 30;
      this.timerInterval = 1000 / this.fps;
    }

    update(deltaTime) {
      if (this.timer > this.timerInterval) {
        this.timer = 0;
        ++this.frameX;
        if (this.frameX >= this.maxFrameX) return;
      } else this.timer += deltaTime;
    }

    reset() {
      this.frameX = 0;
      this.game.sound.playSound("shieldSound");
    }

    draw(ctx) {
      ctx.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.game.player.x,
        this.game.player.y,
        this.width,
        this.height
      );
    }
  }

  class Explosion {
    constructor(game, x, y) {
      this.game = game;
      this.spriteWidth = 200;
      this.spriteHeight = 200;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.x = x - this.spriteWidth * 0.5;
      this.y = y - this.spriteHeight * 0.5;
      this.frameX = 0;
      this.fps = 30;
      this.timer = 0;
      this.interval = 1000 / this.fps;
      this.markForDeletion = false;
      this.maxFrame = 8;
    }
    update(deltaTime) {
      this.x -= this.game.speed;
      if (this.timer > this.interval) {
        ++this.frameX;
        this.timer = 0;
      } else this.timer += deltaTime;
      if (this.frameX > this.maxFrame) this.markForDeletion = true;
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class SmokeExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);
      this.image = document.getElementById("smokeExplosion");
    }
  }

  class FireExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);
      this.image = document.getElementById("fireExplosion");
    }
  }

  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markForDeletion = false;
      this.frameX = 0;
      this.maxFrame = 37;
    }
    update() {
      if (this.frameX < this.maxFrame) ++this.frameX;
      else this.frameX = 0;
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markForDeletion = true;
    }
    draw(context) {
      if (this.game.debug) {
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.fillStyle = "black";
        context.font = "20px Helvetica, arial";
        context.fillText(this.lives, this.x, this.y);
      }
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 2;
      // this.lives = this.score;
      this.lives = 2;
      this.image = document.getElementById("angler1");
      this.frameY = Math.floor(Math.random() * 3);
    }
  }

  class Angler2 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 213;
      this.height = 165;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 3;
      // this.lives = this.score;
      this.lives = 3;
      this.image = document.getElementById("angler2");
      this.frameY = Math.floor(Math.random() * 2);
    }
  }

  class Lucky extends Enemy {
    constructor(game) {
      super(game);
      this.width = 99;
      this.height = 95;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("lucky");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = 12;
      this.type = "lucky";
    }
  }

  class HiveWhale extends Enemy {
    constructor(game) {
      super(game);
      this.width = 400;
      this.height = 227;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 15;
      this.lives = this.score;
      this.image = document.getElementById("hivewhale");
      this.frameY = 0;
      this.type = "hivewhale";
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }

  class BubWhale extends Enemy {
    constructor(game) {
      super(game);
      this.width = 270;
      this.height = 219;
      this.score = 20;
      this.lives = this.score;
      this.image = document.getElementById("bulbwhale");
      this.maxFrameY = 2;
      this.frameY = Math.floor(Math.random() * 2);
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.type = "bulbwhale";
      this.speedX = Math.random() * -0.8 - 0.2;
    }
  }

  class Stalker extends Enemy {
    constructor(game) {
      super(game);
      this.width = 243;
      this.height = 123;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 5;
      this.lives = this.score;
      this.image = document.getElementById("stalker");
      this.frameY = 0;
      this.type = "stalker";
      this.speedX = Math.random() * -1 - 1;
    }
  }

  class Razorfin extends Enemy {
    constructor(game) {
      super(game);
      this.width = 187;
      this.height = 149;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 7;
      this.lives = this.score;
      this.image = document.getElementById("razorfin");
      this.frameY = 0;
      this.type = "razorfin";
      this.speedX = Math.random() * -1 - 1;
    }
  }

  class MoonFish extends Enemy {
    constructor(game) {
      super(game);
      this.width = 227;
      this.height = 240;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 15;
      this.lives = this.score;
      this.image = document.getElementById("moonfish");
      this.frameY = 0;
      this.type = "moonfish";
      this.speedX = Math.random() * -0.8 - 2;
    }
  }

  class Drone extends Enemy {
    constructor(game, x, y) {
      super(game);
      this.width = 115;
      this.height = 95;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.score = 4;
      this.lives = this.score;
      this.image = document.getElementById("drone");
      this.frameY = Math.floor(Math.random() * 2);
      this.type = "drone";
      this.speedX = Math.random() * -4.7 - 0.5;
    }
  }

  class SoundController {
    constructor() {
      this.powerUpSound = document.getElementById("powerup");
      this.powerDownSound = document.getElementById("powerdown");
      this.hitSound = document.getElementById("hit");
      this.shootSound = document.getElementById("shoot");
      this.explosionSound = document.getElementById("explosion");
      this.shieldSound = document.getElementById("shieldSound");
    }

    playSound(type) {
      this[type].currentTime = 0;
      this[type].play();
    }
    powerUp() {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play();
    }
  }

  class Layer {
    constructor(game, image, speedModifier) {
      this.game = game;
      this.image = image;
      this.speedModifier = speedModifier;
      this.x = 0;
      this.y = 0;
      this.width = 1768;
      this.height = 500;
    }
    update() {
      if (this.x <= -this.width) this.x = 0;
      else this.x -= this.game.speed * this.speedModifier;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width, this.y);
    }
  }

  class Background {
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById("layer1");
      this.layer1 = new Layer(game, this.image1, 0.2);
      this.image2 = document.getElementById("layer2");
      this.layer2 = new Layer(game, this.image2, 0.4);
      this.image3 = document.getElementById("layer3");
      this.layer3 = new Layer(game, this.image3, 0.6);
      this.image4 = document.getElementById("layer4");
      this.layer4 = new Layer(game, this.image4, 0.6);
      this.layers = [this.layer1, this.layer2, this.layer3];
    }
    update() {
      this.layers.forEach((layer) => layer.update());
    }
    draw(context) {
      this.layers.forEach((layer) => layer.draw(context));
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.background = new Background(this);
      this.sound = new SoundController(this);
      this.shield = new Shield(this);
      this.enemies = [new BubWhale(this)];
      this.keys = [];
      this.particles = [];
      this.explosions = [];
      this.ammo = 20;
      this.maxAmmo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 500;
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      this.gameOver = false;
      this.score = 0;
      this.winningScore = 1000;
      this.gameTime = 0;
      this.timeLimit = 60000;
      this.speed = 1;
      this.debug = false;
    }
    update(deltaTime) {
      //game time
      if (!this.gameOver) this.gameTime += deltaTime;
      if (this.gameTime > this.timeLimit) this.gameOver = true;

      //background
      this.background.update();
      this.background.layer4.update();

      //player
      this.player.update(deltaTime);

      //shield
      this.shield.update(deltaTime);

      //ammo
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) ++this.ammo;

        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }

      //particles
      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter(
        (particle) => !particle.markForDeletion
      );

      //Enemies
      this.enemies.forEach((enemy) => {
        enemy.update();
        if (this.checkCollision(this.player, enemy)) {
          this.sound.playSound("hitSound");
          this.addExplosion(enemy);
          this.shield.reset();
          if (enemy.type === "lucky") this.player.enterPowUp();
          else if (!this.gameOver) --this.score;
          enemy.markForDeletion = true;
          for (let i = 0; i < enemy.score; ++i) {
            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
          }
        }

        this.player.projectiles.forEach((projectile) => {
          if (this.checkCollision(projectile, enemy)) {
            this.addExplosion(enemy);
            this.sound.playSound("explosionSound");

            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );

            projectile.markForDeletion = true;
            --enemy.lives;
            if (enemy.lives <= 0) {
              this.addExplosion(enemy);
              if (enemy.type === "hivewhale") {
                for (let i = 0; i < 5; ++i) {
                  this.enemies.push(
                    new Drone(
                      this,
                      enemy.x + Math.random() * enemy.width,
                      enemy.y + enemy.height * 0.5
                    )
                  );
                }
              } else if (enemy.type === "moonfish") this.player.enterPowUp();
              for (let i = 0; i < enemy.score; ++i) {
                this.particles.push(
                  new Particle(
                    this,
                    enemy.x + enemy.width * 0.5,
                    enemy.y + enemy.height * 0.5
                  )
                );
              }
              enemy.markForDeletion = true;
              if (!this.gameOver) this.score += enemy.score;

              // if (this.score > this.winningScore) this.gameOver = true;
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markForDeletion);

      //add enemy
      if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else this.enemyTimer += deltaTime;

      //explosions
      this.explosions.forEach((explosion) => explosion.update(deltaTime));
      this.explosions = this.explosions.filter(
        (explosion) => !explosion.markForDeletion
      );
    }
    draw(context) {
      //background
      this.background.draw(context);
      // UI
      this.ui.draw(context);
      //player
      this.player.draw(context);
      //shield
      this.shield.draw(context);
      //particles
      this.particles.forEach((particle) => particle.draw(context));
      //Enemies
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      //explosions
      this.explosions.forEach((explosion) => {
        explosion.draw(context);
      });
      this.background.layer4.draw(context);
    }

    addEnemy() {
      const numberRandom = Math.random();
      if (numberRandom < 0.2) this.enemies.push(new Angler1(this));
      else if (numberRandom < 0.3) this.enemies.push(new Razorfin(this));
      else if (numberRandom < 0.4) this.enemies.push(new Stalker(this));
      else if (numberRandom < 0.6) this.enemies.push(new Angler2(this));
      else if (numberRandom < 0.7) this.enemies.push(new HiveWhale(this));
      else if (numberRandom < 0.8) this.enemies.push(new BubWhale(this));
      else if (numberRandom < 0.9) this.enemies.push(new MoonFish(this));
      else this.enemies.push(new Lucky(this));
    }

    addExplosion(enemy) {
      const numberRandom = Math.random();
      if (numberRandom < 0.5)
        this.explosions.push(
          new SmokeExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
      else
        this.explosions.push(
          new FireExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
    }

    checkCollision(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y
      );
    }
  }

  const game = new Game(canvas.width, canvas.height);

  let lastTime = 0;

  const animate = (timeStamp) => {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw(ctx);
    game.update(deltaTime);

    requestAnimationFrame(animate);
  };

  animate(0);
});
