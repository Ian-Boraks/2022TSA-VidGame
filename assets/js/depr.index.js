function playerMovementNoGravity(player) {
  moveValues = player.moveValues;
  if (moveUp || moveDown || moveLeft || moveRight) {
    moveValues.amount = moveValues.speed;
  } else {
    moveValues.amount = 0;
    return;
  }

  moveValues.x = 0;
  moveValues.y = 0;

  if ((moveRight != moveLeft) && (moveUp != moveDown)) {
    if (moveRight && moveUp) {
      moveValues.x = 1 / Math.sqrt(2);
      moveValues.y = -1 / Math.sqrt(2);

    } else if (moveRight && moveDown) {
      moveValues.x = 1 / Math.sqrt(2);
      moveValues.y = 1 / Math.sqrt(2);

    } else if (moveLeft && moveUp) {
      moveValues.x = -1 / Math.sqrt(2);
      moveValues.y = -1 / Math.sqrt(2);

    } else {
      moveValues.x = -1 / Math.sqrt(2);
      moveValues.y = 1 / Math.sqrt(2);

    }
  } else if (moveRight && !moveLeft) {
    moveValues.x = 1;
  } else if (moveLeft && !moveRight) {
    moveValues.x = -1;
  } else if (moveUp && !moveDown) {
    moveValues.y = -1;
  } else if (moveDown && !moveUp) {
    moveValues.y = 1;
  } else {
    moveValues.x = 0;
    moveValues.y = 0;
  }

  lastPos = [player.posx, player.posy];
  lastMove = [moveValues.x, moveValues.y];
  let colliding = detectCollision(player)

  if (colliding.bottom) {
    moveValues.y = 0;
    // player.posy = colliding.cordY;
  }

}

makeBox = function () {
  console.log('makeBox');

  new entity(120, 120, 600, 0, ['draw', '#f370db']);
  new entity(120, 20, 800, 140, ['draw', '#f370db']);
  new entity(120, 20, 1000, 240, ['draw', '#f370db']);
  new entity(120, 20, 1400, 120, ['draw', '#f370db']);
  new entity(1000000, 40, 0, 0, ['draw', '#92d03b'], ['floor', 'solid']);
  new entity(120, 10000, -80, 0, ['draw', '#92d03b'], ['stopWall', 'solid']);

  makeBox = noop();
}