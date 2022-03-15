class Player extends GameObject {
  constructor(pos, size = new Vec2(100, 200), draw = true) {
    super(pos, size, false, draw);

    this.touchingGround = false;
    this.spriteName = 'player';
    this.drawType = 'sprite';
    this.vel = new Vec2(0, 0);
    this.type = GameObjectType.PLAYER;
    this.fixed = false;

    this.setupSprite();
  }

  update() {
    if (this.touchingGround) this.vel.x *= 0.9;
    super.update();
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw()
    if (config.debug) {
      ctx.beginPath();
      ctx.fillStyle = this.isColliding ? "rgba(255, 10, 255, 0.2)" : "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
      ctx.closePath();
    }
  }

  setupSprite(animationName = 'idleR') {
    this.img = new Image();
    this.img.src = ROOT + spriteSheets[this.spriteName]["img"];
    this.animation = animationName;
    this.sx = spriteSheets[this.spriteName][this.animation]["sx"];
    this.sy = spriteSheets[this.spriteName][this.animation]["sy"];
    this.sw = spriteSheets[this.spriteName][this.animation]["sWidth"];
    this.sh = spriteSheets[this.spriteName][this.animation]["sHeight"];
  }
}