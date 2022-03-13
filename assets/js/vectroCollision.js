function detectCollision() {
  let obj1;
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

      collisionTypes = rectIntersect(obj1, obj2);

      if (collisionTypes) {
        obj1.isColliding = true;
        obj2.isColliding = true;

        let vCollision = new Vector2(obj2.pos.x - obj1.pos.x, obj2.pos.y - obj1.pos.y);
        let distance = Math.sqrt((obj2.pos.x - obj1.pos.x) * (obj2.pos.x - obj1.pos.x) + (obj2.pos.y - obj1.pos.y) * (obj2.pos.y - obj1.pos.y));
        let vCollisionNorm = new Vector2(vCollision.x / distance, vCollision.y / distance);
        let vRelativeVelocity = new Vector2(obj1.vel.x - obj2.vel.x, obj1.vel.y - obj2.vel.y);
        let speed = vRelativeVelocity.x * vCollisionNorm.x + vRelativeVelocity.y * vCollisionNorm.y;

        speed *= .8;
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

        // ob1Top = obj1.pos.y;
        // ob2Top = obj2.pos.y;

        // ob1Bottom = obj1.pos.y + obj1.h;
        // ob2Bottom = obj2.pos.y + obj2.h;

        // ob1Left = obj1.pos.x;
        // ob2Left = obj2.pos.x;

        // ob1Right = obj1.pos.x + obj1.w;
        // ob2Right = obj2.pos.x + obj2.w;

        // if (obj1.mass > obj2.mass) {
        //   obj.pos.y = ob2Bottom;
        // }


        // let overlap = new Vector2(
        //   obj1.pos
        // );

        // obj2.pos.Add(overlap);

        // if (obj2.fixed) {
        //   let xAbs = Math.abs(vCollision.x);
        //   let yAbs = Math.abs(vCollision.y);
        //   if (Math.min(xAbs, yAbs) == xAbs) {
        //     obj1.vel.x = -obj1.vel.x * .8;
        //     // obj1.vel.x = -obj1.vel.x * 1.1;
        //   }
        //   else {
        //     obj1.vel.y = -obj1.vel.y * .8;
        //     // obj1.vel.y = -obj1.vel.y * 1.1;
        //   }
        // }

        // if (obj1.fixed) {
        //   let xAbs = Math.abs(vCollision.x);
        //   let yAbs = Math.abs(vCollision.y);
        //   if (Math.min(xAbs, yAbs) == xAbs) {
        //     obj2.vel.x = -obj2.vel.x * .8;
        //     // obj2.vel.x = -obj2.vel.x * 1.1;
        //   }
        //   else {
        //     obj2.vel.y = -obj2.vel.y * .8;
        //     // obj2.vel.y = -obj2.vel.y * 1.1;
        //   }
        // }

        // if (Math.abs(obj1.vel.x) < config.minVelocity) obj1.vel.x *= .9;

        // if (Math.abs(obj1.vel.y) < config.minVelocity) obj1.vel.y *= .9;

        // if (Math.abs(obj2.vel.x) < config.minVelocity) obj2.vel.x *= .9;

        // if (Math.abs(obj2.vel.y) < config.minVelocity) obj2.vel.y *= .9;

      }
    }
  }
}