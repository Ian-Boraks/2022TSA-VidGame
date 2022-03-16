// ! PLAYER NEEDS TO BE FIRST IN THE gameObjects ARRAY
var player = new Player(new Vec2(canvas.width / 2 - 50, canvas.height - 300));

canvasBorders = [
  new SolidRect(new Vec2(-10, 0), new Vec2(10, canvas.height), Config.DEBUG ? Colors.DEBUG_PINK : Colors.TRANSPARENT, [true, true]),
  new SolidRect(new Vec2(canvas.width, 0), new Vec2(10, canvas.height), Config.DEBUG ? Colors.DEBUG_PINK : Colors.TRANSPARENT, [true, true]),
  new SolidRect(new Vec2(0, canvas.height), new Vec2(canvas.width, 10), Config.DEBUG ? Colors.DEBUG_PINK : Colors.TRANSPARENT, [true, true]),
  new SolidRect(new Vec2(0, canvas.height), new Vec2(canvas.width, 10), Config.DEBUG ? Colors.DEBUG_PINK : Colors.TRANSPARENT, [true, true])
];

scrollBorders = [
  new ScrollBorder(new Vec2(canvas.width / 2 - 200, canvas.height - 500), new Vec2(100, 500), [true, true]),
  new ScrollBorder(new Vec2(canvas.width / 2 + 100, canvas.height - 500), new Vec2(100, 500), [true, true]),
  new ScrollBorder(new Vec2(canvas.width / 2 - 200, canvas.height - 70), new Vec2(400, 100), [true, true]),
  new ScrollBorder(new Vec2(canvas.width / 2 - 200, canvas.height - 500), new Vec2(400, 100), [true, true])
]

gameWorld = [
  new SolidRect(new Vec2(-20000, canvas.height - 100), new Vec2(40000, 100), 'blue', [true, false]),
  new SolidRect(new Vec2(700, canvas.height - 200), new Vec2(100, 100), 'red', [true, false]),
];

function begin() {
  pressedKeys.forEach((key) => {
    switch (key) {
      case KEY.LEFT:
      case KEY.A:
        player.vel.x += -8;
        break;

      case KEY.RIGHT:
      case KEY.D:
        player.vel.x += 8;
        break;

      case KEY.UP:
      case KEY.W:
      case KEY.SPACE:
        if (player.touchingGround) player.vel.y = -12;
        break;

      default:
        break;
    }
  });
  player.vel.x = player.vel.x > Config.MAX_VELOCITY.x ? Config.MAX_VELOCITY.x : player.vel.x < -Config.MAX_VELOCITY.x ? -Config.MAX_VELOCITY.x : player.vel.x;
  player.vel.y = player.vel.y > Config.MAX_VELOCITY.y ? Config.MAX_VELOCITY.y : player.vel.y < -Config.MAX_VELOCITY.y ? -Config.MAX_VELOCITY.y : player.vel.y;
}

function collisionRunner() {
  let obj1;
  let obj2;
  for (let i = 0; i < gameObjects.length; i++) {
    obj2 = gameObjects[i];
    if (obj2.type == GameObjectType.BACKGROUND) continue;
    for (let j = 0; j < this.gameObjects.length; j++) {
      obj1 = this.gameObjects[j];
      if (
        obj1 == obj2 ||
        obj1.type == GameObjectType.BACKGROUND ||
        obj1.type == GameObjectType.PLAYER ||
        obj2.fixed[0]
      ) continue;
      obj1.collideRectangle(obj2);
    }
  }
}

function update() {
  gameObjects.forEach((gameObject) => {
    gameObject.update(gameObject);
  });
  scrollAmount.Zero();
  collisionRunner();
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gameObjects.forEach((gameObject) => {
    gameObject.pos.Add(gameObject.vel);
    if (gameObject.type == GameObjectType.PLAYER) return; // Player is drawn after all other objects
    gameObject.draw();
  });
  player.draw();
}

function end() {

}

MainLoop
  .setBegin(begin)
  .setUpdate(update)
  .setDraw(draw)
  .setEnd(end)
  .setMaxAllowedFPS(Config.MAX_FPS)
  .start();