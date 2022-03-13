class Player extends GameObject {
  constructor(pos, w = 100, h = 200, mass = 10, draw = true) {
    super(pos, w, h, false, draw, mass);

    this.spriteName = 'player';
    this.drawType = 'sprite';
    this.vel = new Vector2(0, 0);
    this.type = GameObjectType.Player;
    this.fixed = false;

    this.setupSprite();
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw()
    if (config.debug) {
      ctx.beginPath();
      ctx.fillStyle = this.isColliding ? "rgba(255, 10, 255, 0.2)" : "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
      ctx.closePath();
    }
  }

  setupSprite() {
    this.img = new Image();
    this.img.src = ROOT + spriteSheets[this.spriteName]["img"];
    console.log(this.img.src)
    this.animation = 'idleR';
    this.sx = spriteSheets[this.spriteName][this.animation]["sx"];
    this.sy = spriteSheets[this.spriteName][this.animation]["sy"];
    this.sw = spriteSheets[this.spriteName][this.animation]["sWidth"];
    this.sh = spriteSheets[this.spriteName][this.animation]["sHeight"];
  }
}