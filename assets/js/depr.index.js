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

function playerMovementGravity(player, secondsPassed) {
  // return;
  let moveValues = player.moveValues;
  moveValues.amount = moveValues.speed;
  let wallJump = false;

  if (moveValues.y > -2) {
    moveValues.y -= config.gravity;
  }

  if (moveValues.x > .1) {
    moveValues.x -= player.touchedGround ? .15 : .01;
  } else if (moveValues.x < -.1) {
    moveValues.x += player.touchedGround ? .15 : .01;
  } else {
    moveValues.x = 0;
  }

  keysDown = keys.getKeysByValue(true);
  keysDown = keysDown.concat(keys.getKeysByValue([true, true]));

  if (!keys.aKey[1] && !keys.dKey[1] && player.touchedGround) {
    switch (playerDirection) {
      case "right":
        switchAnimation(player, "idleR");
        break;
      case "left":
        switchAnimation(player, "idleL");
        break;
    }
  } else if (!player.touchedGround) {
    switch (playerDirection) {
      case "right":
        switchAnimation(player, "jumpR");
        break;
      case "left":
        switchAnimation(player, "jumpL");
        break;
    }
  }

  if (!keys.sKey[0]) { player.crouched = false; }

  for (let i = 0; i < keysDown.length; i++) {
    switch (keysDown[i]) {
      case 'dKey':
        // if (wallJump[0] == "left") { return; }
        moveValues.x += Math.abs(moveValues.x) > (config.playerMaxSpeed) ? 0 : .25;
        if (player.touchedGround) { switchAnimation(player, 'walkR', 2); }
        playerDirection = 'right';
        break;
      case 'sKey':
        player.crouched = true;
        break;
      case 'aKey':
        // if (wallJump[0] == "right") { return; }
        moveValues.x -= Math.abs(moveValues.x) > (config.playerMaxSpeed) ? 0 : .25;
        if (player.touchedGround) { switchAnimation(player, 'walkL', 2); }
        playerDirection = 'left';
        break;
      case 'spaceKey':
        if (player.touchedGround) {
          player.touchedGround = false;
          playSound('jump');
          moveValues.y = config.jumpHeight;
          if (!wallJump) {
            wallJumpTimer = setTimeout(() => {
              // setTimeout(() => { wallJumpAllowed = false; }, 200);
              wallJumpAllowed = true;
              wallJumpTimer = null;
            }, 400);
          }
        }
      default:
        break;
    }
  }

  void detectCollision(player, "stairs");
  let collisionSolids = detectCollision(player);
  let collisionLadders = detectCollision(player, "ladders");
  void detectCollision(player, "tokens", false);
  void detectCollision(player, "traps", false);
  void detectOutOfBounds(player);

  if (
    keys.spaceKey[0] &&
    !player.touchedGround &&
    !collisionSolids.borderLeft &&
    !collisionSolids.borderRight &&
    !collisionLadders.ladder &&
    wallJumpAllowed
  ) {
    player.touchedGround = false;
    if (collisionSolids.left && keys.dKey[0]) {
      player.touchedGround = true;
      moveValues.x = 1;
      // keys.dKey[0] = false;
      wallJump = true;
      playerDirection = "right";
      wallJumpAllowed = true;
      // playSound('wallJump');
      scoreUpdate(100);
    } else if (collisionSolids.right && keys.aKey[0]) {
      player.touchedGround = true;
      moveValues.x = -1;
      // keys.aKey[0] = false;
      wallJump = true;
      playerDirection = "left";
      wallJumpAllowed = true;
      // playSound('wallJump');
      scoreUpdate(100);
    }
  }
  if (keys.aKey[1] && !wallJump && player.touchedGround) {
    keys.aKey[0] = true;
    wallJumpAllowed = false;
    if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
  }
  if (keys.dKey[1] && !wallJump && player.touchedGround) {
    keys.dKey[0] = true;
    wallJumpAllowed = false;
    if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
  }
  player.height = player.crouched ? player.initHeight / 2 : player.initHeight;
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