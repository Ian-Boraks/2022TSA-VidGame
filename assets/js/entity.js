class GameObject {
  constructor(
    pos = new Vec2(0, 0),
    size = new Vec2(0, 0),
    fixed = [true, false], // [noGravity, noScroll]
    draw = true
  ) {
    this.animationSpeed = Config.ANIMATION_SPEED;
    this.animationSubStep = 0;
    this.currentFrame = 1;

    this.pos = pos;
    this.size = size;
    this.drawEnabled = draw;
    this.fixed = fixed;
    this.touchingGround = false;

    this.drawType = null;
    this.vel = new Vec2(0, 0);
    this.center = new Vec2(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    this.type = GameObjectType.NONE;
    this.isColliding = false;

    gameObjects.push(this);

  }

  animate() {
    if (this.frames <= 1) return;
    this.animationSubStep++;
    if (this.animationSubStep > Config.ANIMATION_SPEED) {
      this.animationSubStep = 0;
      this.currentFrame++;
      if (this.currentFrame > this.frames) this.currentFrame = 1;
      this.sx = (this.currentFrame - 1) * 100;
    }
  }

  switchAnimation(animationName) {
    if (this.drawType != 'sprite') { console.error('Entity is not a sprite, can not switch animation'); return; }
    this.setupSprite(false, animationName);
  }

  collideRectangle(gameObject) {
    // TODO: Add proper collision for player being moved by fixed objects
    let gameObjectCollision = {
      TOP: false,
      BOTTOM: false,
      LEFT: false,
      RIGHT: false
    }

    let vx = gameObject.vel.x;
    let vy = gameObject.vel.y;

    let dx = gameObject.center.x - this.center.x;// x difference between centers
    let dy = gameObject.center.y - this.center.y;// y difference between centers
    let aw = (gameObject.size.x + this.size.x) * 0.5;// average width
    let ah = (gameObject.size.y + this.size.y) * 0.5;// average height

    /* If either distance is greater than the average dimension there is no collision. */
    if (Math.abs(dx) > aw || Math.abs(dy) > ah) return false;

    /* To determine which region of this rectangle the rect's center
    point is in, we have to account for the scale of the this rectangle.
    To do that, we divide dx and dy by it's width and height respectively. */
    if (Math.abs(dx / this.size.x) > Math.abs(dy / this.size.y)) {

      if (dx < 0) { // left of this
        if (gameObject.vel.x < 0) return false;
        gameObject.pos.x = this.pos.x - gameObject.size.x;
        gameObject.vel.x = 0;

        gameObjectCollision.RIGHT = true; // right of gameObject
      }
      else { // right of this
        if (gameObject.vel.x > 0) return false;
        gameObject.pos.x = this.pos.x + this.size.x;
        gameObject.vel.x = 0;

        gameObjectCollision.LEFT = true; // left of gameObject
      }

    } else {

      if (dy < 0) { // top of this
        if (gameObject.vel.y < 0) return false;
        gameObject.pos.y = this.pos.y - gameObject.size.y;

        if (this.type != GameObjectType.SCROLL) gameObject.vel.y = 0;
        if (this.type != GameObjectType.SCROLL) gameObject.touchingGround = true;

        gameObjectCollision.BOTTOM = true; // bottom of gameObject
      }
      else { // bottom of this
        if (gameObject.vel.y > 0) return false;
        gameObject.pos.y = this.pos.y + this.size.y;

        if (this.type != GameObjectType.SCROLL) gameObject.vel.y = 0;

        gameObjectCollision.TOP = true; // top of gameObject
      }
    }

    if (this.type == GameObjectType.SCROLL && gameObject.type == GameObjectType.PLAYER) {
      if (gameObjectCollision.TOP || gameObjectCollision.BOTTOM) scrollAmount.y -= vy;
      if (gameObjectCollision.LEFT || gameObjectCollision.RIGHT) scrollAmount.x -= vx;
    }

    this.isColliding = true;
    gameObject.isColliding = true;
    return true;
  }

  update() {
    this.isColliding = false;
    if (!this.fixed[0]) this.vel.y += Config.GRAVITY;
    if (!this.fixed[1]) {
      if (this.type != GameObjectType.PLAYER && (scrollAmount.x != 0 || scrollAmount.y != 0)) this.scroll();
      if (this.touchingGround) {
        this.vel.x *= 0.8;
      } else {
        this.vel.x *= 0.92;
      };
    }
    this.center = new Vec2(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    this.touchingGround = false;
  }

  draw() {
    if (!this.drawEnabled) return;

    switch (this.drawType) {
      case 'rect':
        ctx.beginPath();
        ctx.fillStyle = (this.isColliding && Config.DEBUG) ? Colors.DEBUG_PINK : this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        ctx.closePath();
        break;
      case 'sprite':
        this.animate();
        ctx.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.pos.x, this.pos.y, this.size.x, this.size.y);
        break;
      default:
        console.error('Entity drawType not set or invalid');
        break;
    }
  }

  scroll() {
    this.pos.x += scrollAmount.x;
    this.pos.y += scrollAmount.y;
  }
}

class SolidRect extends GameObject {
  constructor(pos = new Vec2(0, 0), size = new Vec2(0, 0), color = 'pink', fixed = true, draw = true) {
    super(pos, size, fixed, draw);

    this.color = color;
    this.type = GameObjectType.SOLID;
    this.drawType = 'rect';

    super.draw();
  }
}

class SolidSprite extends GameObject {
  constructor(pos = new Vec2(0, 0), size = new Vec2(0, 0), spriteName = 'stone', fixed = true, draw = true) {
    super(pos, size, fixed, draw);

    this.spriteName = spriteName;
    this.drawType = 'sprite';
    this.type = GameObjectType.SOLID;

    this.setupSprite(true);
    super.draw();
  }

  setupSprite(firstTime = false, animationName = 'idle') {
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

class BackgroundRect extends SolidRect {
  constructor(pos = new Vec2(0, 0), size = new Vec2(0, 0), color = 'pink', fixed = true, draw = true) {
    super(pos, size, color, fixed, draw);

    this.type = GameObjectType.BACKGROUND;
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw();
    ctx.beginPath();
    ctx.fillStyle = Colors.OVERLAY;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    ctx.closePath();
  }
}

class BackgroundSprite extends SolidSprite {
  constructor(pos = new Vec2(0, 0), size = new Vec2(0, 0), spriteName = 'stone', fixed = true, draw = true) {
    super(pos, size, spriteName, fixed, draw);

    this.type = GameObjectType.BACKGROUND;
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw();
    ctx.beginPath();
    ctx.fillStyle = Colors.OVERLAY;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    ctx.closePath();
  }
}

class ScrollBorder extends GameObject {
  constructor(pos = new Vec2(0, 0), size = new Vec2(0, 0), fixed = true, draw = true) {
    super(pos, size, fixed, draw);

    this.color = Config.DEBUG ? Colors.DEBUG_GREY : Colors.TRANSPARENT;
    this.type = GameObjectType.SCROLL;
    this.drawType = 'rect';

    super.draw();
  }
}