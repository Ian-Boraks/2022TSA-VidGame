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
    moveValues.y = 02;
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

var drawGrid = function (size) {
  throw "drawGrid is not yet implemented";
  // FIXME: Objects drawn in this function are perfect match for grid. But if drawn outside of it, they do not fit perfectly.
  const length = objects.grids.length;
  for (let i = 0; i < length; i++) {
    objects.nonFrozen.removeArray(objects.grids[i]);
  }
  objects.grids = [];
  w = canvas.width;
  h = canvas.height;
  squareX = (w / size).round(1, true);
  squareY = (h / size).round(1, true);
  // console.log("Grid size: " + squareX + "x, " + squareY + "y");
  for (let j = 0; j < squareY; j++) {
    for (let i = 0; i < squareX; i++) {
      new entity(size, size, i * size, j * size, ['grid', '#f3333d'], ['grid']);
    }
  }
  new entity((100).round(editorPrecision), (100).round(editorPrecision), (300).round(editorPrecision), (400).round(editorPrecision), ['grid', 'white'], ['grid']);
};