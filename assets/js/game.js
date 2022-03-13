var box = new SolidRect(new Vector2(700, canvas.height - 300), 200, 100, 'red', 1, true);

var box6 = new SolidSprite(new Vector2(0, canvas.height - 100), canvas.width, 100, 'stone', 1000, true);
var player = new Player(new Vector2(400, 400));
player.vel.Add(new Vector2(4, 0));

function detectCollision() {
  let obj1 = this;
  let obj2;

  // Reset collision state of all objects
  for (let i = 0; i < gameObjects.length; i++) {
    gameObjects[i].isColliding = false;
  }

  for (let i = 0; i < this.gameObjects.length; i++) {
    obj1 = this.gameObjects[i];
    for (let j = i + 1; j < this.gameObjects.length; j++) {
      obj2 = this.gameObjects[j];

      if (obj2.type == GameObjectType.Background || obj1.type == GameObjectType.Background) continue;
      if (obj2.fixed && obj1.fixed) continue;

      if (rectIntersect(obj1, obj2)) {
        obj1.isColliding = true;
        obj2.isColliding = true;

        let vCollision = new Vector2(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y);
        let distance = Math.sqrt((obj2.pos.x - obj1.pos.x) * (obj2.pos.x - obj1.pos.x) + (obj2.pos.y - obj1.pos.y) * (obj2.pos.y - obj1.pos.y));
        let vCollisionNorm = new Vector2(vCollision.x / distance, vCollision.y / distance);
        let vRelativeVelocity = new Vector2(obj1.vel.x - obj2.vel.x, obj1.vel.y - obj2.vel.y);
        let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;

        speed *= .1;
        if (speed < 0) break;

        let impulse = 2 * speed / (obj1.mass + obj2.mass);

        if (obj1.fixed || obj2.fixed) impulse = 0;

        obj1.vel.Add(new Vector2(
          -impulse * obj2.mass * vCollisionNorm.x,
          -impulse * obj2.mass * vCollisionNorm.y
        ));

        obj2.vel.Add(new Vector2(
          impulse * obj1.mass * vCollisionNorm.x,
          impulse * obj1.mass * vCollisionNorm.y
        ));

        if (obj2.fixed) {
          let xAbs = Math.abs(vCollision.x);
          let yAbs = Math.abs(vCollision.y);
          if (Math.min(xAbs, yAbs) == xAbs) {
            obj1.vel.x = -obj1.vel.x * .8;
            // obj1.vel.x = -obj1.vel.x * 1.1;
          }
          else {
            obj1.vel.y = -obj1.vel.y * .8;
            // obj1.vel.y = -obj1.vel.y * 1.1;
          }
        }

        if (obj1.fixed) {
          let xAbs = Math.abs(vCollision.x);
          let yAbs = Math.abs(vCollision.y);
          if (Math.min(xAbs, yAbs) == xAbs) {
            obj2.vel.x = -obj2.vel.x * .8;
            // obj2.vel.x = -obj2.vel.x * 1.1;
          }
          else {
            obj2.vel.y = -obj2.vel.y * .8;
            // obj2.vel.y = -obj2.vel.y * 1.1;
          }
        }

        if (Math.abs(obj1.vel.x) < config.minVelocity) obj1.vel.x *= .9;

        if (Math.abs(obj1.vel.y) < config.minVelocity) obj1.vel.y *= .9;

        if (Math.abs(obj2.vel.x) < config.minVelocity) obj2.vel.x *= .9;

        if (Math.abs(obj2.vel.y) < config.minVelocity) obj2.vel.y *= .9;

      }
    }
  }
}

function begin() {

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