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