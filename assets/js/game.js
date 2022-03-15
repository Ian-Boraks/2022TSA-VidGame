// ! PLAYER NEEDS TO BE FIRST IN THE gameObjects ARRAY
var player = new Player(new Vec2(400, 400));

var canvasBorder = [
  new SolidRect(new Vec2(-10, 0), new Vec2(10, canvas.height), Colors.TRANSPARENT, true),
  new SolidRect(new Vec2(canvas.width, 0), new Vec2(10, canvas.height), Colors.TRANSPARENT, true),
  new SolidRect(new Vec2(0, -10), new Vec2(canvas.width, 10), Colors.TRANSPARENT, true),
  new SolidRect(new Vec2(0, canvas.height), new Vec2(canvas.width, 10), Colors.TRANSPARENT, true)
];

var gameWorld = [
  new SolidRect(new Vec2(700, canvas.height - 300), new Vec2(100, 100), 'red', false),
  new BackgroundRect(new Vec2(700, canvas.height - 300), new Vec2(100, 100), 'red', true),
  new SolidSprite(new Vec2(0, canvas.height - 100), new Vec2(canvas.width, 100), 'stone', true),
];

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

function collisionRunner() {
  let obj1;
  let obj2;
  for (let i = 0; i < gameObjects.length; i++) {
    obj2 = gameObjects[i];
    if (obj2.type == GameObjectType.BACKGROUND) continue;
    for (let j = i + 1; j < this.gameObjects.length; j++) {
      obj1 = this.gameObjects[j];
      if (obj1.type == GameObjectType.BACKGROUND) continue;
      if (obj1.fixed && obj2.fixed) continue;
      obj1.collideRectangle(obj2);
    }
  }
}

function update() {
  gameObjects.forEach((gameObject) => {
    gameObject.update(gameObject);
  });
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
  .setMaxAllowedFPS(config.maxFPS)
  .start();