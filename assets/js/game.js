var box = new SolidRect(new Vector2(700, canvas.height - 300), 200, 100, 'red', 10, true);

var box6 = new SolidSprite(new Vector2(0, canvas.height - 100), canvas.width, 100, 'stone', 1000, true);
var player = new Player(new Vector2(400, 400));

player.vel.Add(new Vector2(5, 0));

function positionOf(point, relativeTo) {
  var dx = point.x - relativeTo.x; // diff on x axis
  var dy = point.y - relativeTo.y; // diff on y axis

  if (dx >= dy) { // point is on top right half from relativeTo
    return dx >= - dy ? 'EAST' : 'NORTH';
  }
  else { // point is on bottom left half from relativeTo
    return dx >= - dy ? 'SOUTH' : 'WEST';
  }
}

function detectCollision() {
  let obj1 = player;
  let obj2;

  for (let i = 0; i < gameObjects.length; i++) {
    gameObjects[i].isColliding = false;
  }

  for (let j = 0; j < this.gameObjects.length; j++) {
    obj2 = this.gameObjects[j];

    if (obj2.type == GameObjectType.PLAYER) continue;
    if (obj2.type == GameObjectType.BACKGROUND || obj1.type == GameObjectType.BACKGROUND) continue;
    if (obj2.fixed && obj1.fixed) continue;

    if (rectIntersect(obj1, obj2)) {
      collisionLocation = positionOf(obj1.pos, obj2.pos);
      switch (collisionLocation) {
        case 'NORTH':
          obj1.vel.y = 0;
          break;

        case 'EAST':
          obj1.vel.y = 0;
          obj1.pos.y = obj2.pos.y - obj1.h - .000001;
          obj1.touchingGround = true;
          break;

        case 'SOUTH':
          obj1.vel.x = 0;
          console.log(collisionLocation)
          break;

        case 'WEST':
          obj1.vel.x = 0;
          obj1.pos.x = obj2.pos.x - obj1.w - .000001;
          break;

        default:
          break;
      }
    }

  }
}

function begin() {
  pressedKeys.forEach((key) => {
    switch (key) {
      case KEY.A:
        player.vel.x += -5;
        break;
      case KEY.D:
        player.vel.x += 5;
        break;
      case KEY.SPACE:
        player.vel.y += -15;
        break;
      default:
        break;
    }
  });
  player.vel.x = player.vel.x > 10 ? 10 : player.vel.x < -10 ? -10 : player.vel.x;
  player.vel.y = player.vel.y > 20 ? 20 : player.vel.y < -15 ? -15 : player.vel.y;
}

function update() {
  gameObjects.forEach((gameObject) => {
    gameObject.update();
  });
  detectCollision();
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gameObjects.forEach((gameObject) => {
    gameObject.pos.Add(gameObject.vel);
    gameObject.draw();
  });
}

function end() {

}

MainLoop
  .setBegin(begin)
  .setUpdate(update)
  .setDraw(draw)
  .setEnd(end)
  .setMaxAllowedFPS(config.maxFPS)
  .start();