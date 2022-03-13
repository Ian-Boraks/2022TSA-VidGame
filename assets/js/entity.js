class GameObject {
  constructor(pos = new Vector2(0, 0), w = 0, h = 0, mass = 1, fixed = true, draw = true) {
    this.pos = pos;
    this.w = w;
    this.h = h;
    this.mass = mass;
    this.drawEnabled = draw;
    this.fixed = fixed;

    this.drawType = null;
    this.vel = new Vector2(0, 0);
    this.type = GameObjectType.NONE;
    this.isColliding = false;

    gameObjects.push(this);
  }

  update() {
    
  }

  draw() {
    if (!this.drawEnabled) return;

    switch (this.drawType) {
      case 'rect':
        ctx.beginPath();
        ctx.fillStyle = this.isColliding ? 'pink' : this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        ctx.closePath();
        break;
      case 'sprite':
        ctx.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.pos.x, this.pos.y, this.w, this.h);
        break;
      default:
        console.error('Entity drawType not set or invalid');
        break;
    }
  }

  scroll() {

  }
}

class SolidRect extends GameObject {
  constructor(pos = new Vector2(0, 0), w = 0, h = 0, color = 'pink', mass = 1, fixed = true, draw = true) {
    super(pos, w, h, mass, fixed, draw);

    this.color = color;
    this.type = GameObjectType.SOLID;
    this.drawType = 'rect';

    super.draw()
  }
}

class SolidSprite extends GameObject {
  constructor(pos = new Vector2(0, 0), w = 0, h = 0, spriteName = 'stone', mass = 1, fixed = true, draw = true) {
    super(pos, w, h, mass, fixed, draw);

    this.spriteName = spriteName;
    this.drawType = 'sprite';
    this.type = GameObjectType.SOLID;

    this.setupSprite();
    super.draw()
  }

  setupSprite() {
    this.img = new Image();
    this.img.src = ROOT + spriteSheets[this.spriteName]["img"];
    this.animation = 'idle';
    this.sx = spriteSheets[this.spriteName][this.animation]["sx"];
    this.sy = spriteSheets[this.spriteName][this.animation]["sy"];
    this.sw = spriteSheets[this.spriteName][this.animation]["sWidth"];
    this.sh = spriteSheets[this.spriteName][this.animation]["sHeight"];
  }
}

class BackgroundRect extends SolidRect {
  constructor(pos = new Vector2(0, 0), w = 0, h = 0, color = 'pink', fixed = true, draw = true) {
    super(pos, w, h, color, fixed, draw);

    this.type = GameObjectType.BACKGROUND;
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw()
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
    ctx.closePath();
  }
}

class BackgroundSprite extends SolidSprite {
  constructor(pos = new Vector2(0, 0), w = 0, h = 0, spriteName = 'stone', fixed = true, draw = true) {
    super(pos, w, h, spriteName, fixed, draw);

    this.type = GameObjectType.BACKGROUND;
  }

  draw() {
    if (!this.drawEnabled) return;
    super.draw()
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
    ctx.closePath();
  }
}