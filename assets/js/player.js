class Player extends GameObject {
  constructor(pos, size = new Vec2(100, 200), draw = true) {
    super(pos, size, [false, false], draw);

    this.initPos = new Vec2(_.clone(pos.x), _.clone(pos.y));

    this.touchingGround = false;
    this.isCrouched = false;
    this.spriteName = 'player';
    this.drawType = 'sprite';
    this.vel = new Vec2(0, 0);
    this.type = GameObjectType.PLAYER;
    this.fixed = [false, false];

    this.setupSprite();
  }

  crouch(crouched) {
    this.isCrouched = crouched;
    this.pos.y += crouched ? 100 : -100;
    this.size.y = this.isCrouched ? 100 : 200;
  }

  respawn() {
    // ? NOTE: I hate that I have to do _.clone() to make sure i don't get any reference errors
    this.pos = new Vec2(_.clone(this.initPos.x), _.clone(this.initPos.y));
  }

  update() {
    super.update();
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw()
    if (Config.DEBUG) {
      ctx.beginPath();
      ctx.fillStyle = (this.isColliding ? Colors.DEBUG_PINK : Colors.DEBUG_GREY);
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