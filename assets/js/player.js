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

    this.setupSprite(true);
  }

  crouch(crouched) {
    this.isCrouched = crouched;
    this.pos.y += crouched ? 100 : -100;
    this.size.y = this.isCrouched ? 100 : 200;
  }

  respawn() {
    // ? NOTE: I am doing _.clone() to make sure I don't get any reference errors
    this.pos = new Vec2(_.clone(this.initPos.x), _.clone(this.initPos.y));
    scrollAmount = new Vec2(-scrollTotal.x, -scrollTotal.y);
    scrollTotal = new Vec2(0, 0);
  }

  update() {
    switch (this.animation) {
      case 'walkL':
        if (this.vel.y > Config.GRAVITY * 2 || this.vel.y < -Config.GRAVITY * 2) {
          this.switchAnimation('jumpL');
          break;
        };
      case 'jumpL':
        if (this.vel.x > 0) {
          this.switchAnimation('jumpR');
        } else if (this.vel.x == 0 && this.animation != 'idleL' && this.touchingGround) {
          this.switchAnimation('idleL');
        } else if (this.touchingGround && this.animation == 'jumpL') { this.switchAnimation('idleL'); }
        break;

      case 'walkR':
        if (this.vel.y > Config.GRAVITY * 2 || this.vel.y < -Config.GRAVITY * 2) {
          this.switchAnimation('jumpR');
          break;
        };
      case 'jumpR':
        if (this.vel.x < 0) {
          this.switchAnimation('jumpL');
        } else if (this.vel.x == 0 && this.animation != 'idleR' && this.touchingGround) {
          this.switchAnimation('idleR');
        } else if (this.touchingGround && this.animation == 'jumpR') { this.switchAnimation('idleR'); }
        break;

      case 'idleL':
      case 'idleR':
        if (this.vel.x != 0) this.switchAnimation('walk' + (this.vel.x > 0 ? 'R' : 'L'));
        if (
          (this.vel.y > Config.GRAVITY * 2 || this.vel.y < -Config.GRAVITY * 2)
        ) this.switchAnimation('jump' + ((this.animation.includes('R') || this.vel.x > 0) ? 'R' : 'L'));
        break;
    }
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

  setupSprite(firstTime = false, animationName = 'idleR') {
    if (firstTime) {
      this.img = new Image();
      this.img.src = ROOT + spriteSheets[this.spriteName]["img"];
    }

    this.animation = animationName;
    this.currentFrame = 1;
    this.frames = spriteSheets[this.spriteName][this.animation]["frames"];
    this.sx = spriteSheets[this.spriteName][this.animation]["sx"];
    this.sy = spriteSheets[this.spriteName][this.animation]["sy"];
    this.sw = spriteSheets[this.spriteName][this.animation]["sWidth"];
    this.sh = spriteSheets[this.spriteName][this.animation]["sHeight"];
  }
}