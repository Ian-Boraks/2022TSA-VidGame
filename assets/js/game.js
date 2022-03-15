// ! PLAYER NEEDS TO BE FIRST IN THE gameObjects ARRAY
var player = new Player(new Vector2(400, 400));

var canvasBorder = [
  new SolidRect(new Vector2(-10, 0), 10, canvas.height, Colors.transparent, 10, true),
  new SolidRect(new Vector2(canvas.width, 0), 10, canvas.height, Colors.transparent, 10, true),
  new SolidRect(new Vector2(0, -10), canvas.width, 10, Colors.transparent, 10, true),
  new SolidRect(new Vector2(0, canvas.height), canvas.width, 10, Colors.transparent, 10, true)
];
var box = new SolidRect(new Vector2(700, canvas.height - 300), 100, 100, 'red', 10, true);

var box6 = new SolidSprite(new Vector2(0, canvas.height - 100), canvas.width, 100, 'stone', 1000, true);

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
    for (let j = i + 1; j < this.gameObjects.length; j++) {
      obj1 = this.gameObjects[j];
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