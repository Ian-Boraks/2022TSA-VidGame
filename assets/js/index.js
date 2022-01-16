const config = {
  gravityEnabled: true,
  debugMode: true,
  gravity: .1,
  jumpHeight: 2,
  defaultPlayerSpeed: 7,
  configPlayerMaxSpeed: 20,
  scrollDistance: 300,
  borderThickness: 300,
  defaultAnimationRunDelay: 1,
  defWidth: 2880,
  defHeight: 1620
}

let editorMode = false;
let startBox = { x: 0, y: 0 };
let endBox = { x: 0, y: 0 };
let boxHolder = [];

let map = {};
let spriteSheets = {};
let animationRunDelay = config.defaultAnimationRunDelay;
let animationRunDelayCounter = 0;
let playerDirection = "right";

let objects = {
  player: null,
  origin: null,
  img: [],
  solids: [],
  ladders: [], // FIXME: Ladders can phase you through the ground
  slopes: [],
  frozen: [],
  nonFrozen: [],
  borders: [],
};

let scrollOffsetAdjustment = {
  x: 0,
  y: 0
}

let scrollOffsetTotal = {
  x: 0,
  y: 0
}

let lastMove = [];
let lastPos = [];

let backgroundMusicPlaying = false;
let score = 0;


// * ON LOAD --------------------------------------------------------
// alert("To use the editor, press enter.\nEditor controls:\nClick+Drag to make solid\nShift+Click+Drag to make ladder\nPress enter again to exit and to have map changes output to console\n\n\nGame Controls:\nSpace to jump\nA to move left\nD to move right\nS to crouch");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

window.addEventListener('resize', () => {
  // get the max size that fits both width and height by finding the min scale
  let canvasScale = Math.min(innerWidth / config.defWidth, innerHeight / config.defHeight);
  // or for max size that fills
  // let canvasScale = Math.max(innerWidth / config.defWidth, innerHeight / config.defHeight);

  // now set canvas size and resolution to the new scale
  canvas.style.width = (canvas.width = Math.floor(config.defWidth * canvasScale)) + "px";
  canvas.style.height = (canvas.height = Math.floor(config.defHeight * canvasScale)) + "px";

  canvas.width = (config.defWidth > innerWidth) ? config.defWidth : innerWidth;
  canvas.height = (config.defHeight > innerHeight) ? config.defHeight : innerHeight;

  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);

  if (objects.borders.length != 0) {
    objects.borders.forEach(
      border => {
        // console.log(border);
        objects.borders = objects.borders.filterArray(border);
        objects.frozen = objects.frozen.filterArray(border);
        objects.solids = objects.solids.filterArray(border);
      }
    );

    makeDefaultEntities();
  }
});

$.getJSON(
  {
    async: false,
    url: '/assets/json/map.json',
    success: function (data) {
      map = data;
      console.log(map);
    }
  }
)

$.getJSON(
  {
    async: false,
    url: '/assets/json/sprite-sheet.json',
    success: function (data) {
      spriteSheets = data;
      console.log(spriteSheets);
    }
  }
)

window.addEventListener('DOMContentLoaded', function () {
  // ! This is an example of how to use the sound function
  // ! Now when you click the screen the funny sound will play
  // let gameWindow = document.getElementById('game-window');
  // gameWindow.addEventListener('click', function () {
  //   playSound('trombone');
  // });
  window.dispatchEvent(new Event('resize'));
  startUp();
});

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

soundManager.onready(function () {
  // ! All sound effects need to be loaded with this function before they can be played
  // Music: https://www.chosic.com/free-music/all/ 
  soundManager.createSound({
    id: 'backgroundMusic',
    url: '/assets/sound/CHIPTUNE_The_Old_Tower_Inn.mp3',
    autoLoad: true,
    onfinish: function () { playSound('backgroundMusic1'); }
  });
  soundManager.createSound({
    id: 'backgroundMusic1',
    url: '/assets/sound/CHIPTUNE_Minstrel_Dance.mp3',
    autoLoad: true,
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic2'); }, 2000) }
  });
  soundManager.createSound({
    id: 'backgroundMusic2',
    url: '/assets/sound/CHIPTUNE_The_Bards_Tale.mp3',
    autoLoad: true,
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic'); }, 2000) }
  });
  soundManager.createSound({
    id: 'trombone',
    url: '/assets/sound/FX68GWY-funny-trombone-slide-accent.mp3'
  });
});

// * CLASSES ----------------------------------------------------------
class entity {
  constructor(width, height, initPosx, initPosy, styles = ['draw', '#ff2f34'], types = ['solid']) {
    this.width = width; this.height = height;
    this.initWidth = width; this.initHeight = height;
    this.posx = initPosx; this.posy = initPosy;
    this.style = styles[0];
    this.types = types;
    this.mainType = types[0];
    this.moveValues = { x: 0, y: 0, amount: 0, speed: 7 };

    switch (styles[0]) {
      case 'img':
        objects.img.push(this);
        this.imgLink = styles[1];
        this.img = new Image();
        this.img.src = spriteSheets[styles[1]]["img"];
        this.animation = styles[2];
        console.log(styles[2]);
        this.sx = spriteSheets[styles[1]][this.animation]["sx"];
        this.sy = spriteSheets[styles[1]][this.animation]["sy"];
        this.sWidth = spriteSheets[styles[1]][this.animation]["sWidth"];
        this.sHeight = spriteSheets[styles[1]][this.animation]["sHeight"];
        break;
      case 'draw':
        this.color = styles[1];
        break;
      default:
        console.log('Error: entity style not found (setup)');
        break;
    }

    if (types.indexOf('player') > -1) {
      this.crouched = false;
      this.touchedGround = false;
      this.lastPos = [undefined, undefined];
      this.lastMove = [undefined, undefined];
    }
    if (types.indexOf('solid') > -1) { objects.solids.push(this); }
    if (types.indexOf('ladder') > -1) { objects.ladders.push(this); }
    if (types.indexOf('frozen') > -1) { objects.frozen.push(this); } else { objects.nonFrozen.push(this); }
    if (types.indexOf('slope') > -1) { objects.slopes.push(this); }
    if (types.indexOf('border') > -1) { objects.borders.push(this); }

    this.draw();
  }

  draw() {
    switch (this.style) {
      case 'img':
        ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.posx, this.posy, this.width, this.height);
        break;
      case 'draw':
        ctx.beginPath();
        ctx.rect(this.posx, this.posy, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        break;
      default:
        console.log('Error: entity style not found (draw)');
        break;
    }
  }

  move() {
    switch (this == objects.player) {
      case true:
        if (this.moveValues.amount == 0) { return; }
        this.lastPos = [this.posx, this.posy];
        this.lastMove = [this.moveValues.x, this.moveValues.y];
        this.posx += this.moveValues.x * this.moveValues.amount;
        this.posy += this.moveValues.y * this.moveValues.amount;
        break;
      case false:
        this.posx += scrollOffsetAdjustment.x;
        this.posy += scrollOffsetAdjustment.y;
        break;
      default:
        console.log('Error: entity type not found');
        break;
    }
  }
}

// * KEYBOARD CONTROLS ------------------------------------------------
var keys = {
  dKey: [false, false],
  aKey: [false, false],
  sKey: [false],
  spaceKey: [false],
  shiftKey: [false],
  wKey: [false],
  xKey: [false],
  zKey: [false],
  ctrlKey: [false],
};

function onKeyDown(event) {
  let keyCode = event.keyCode;
  switch (keyCode) {
    case 68: //d
      if (keys.dKey[1]) { break; }
      keys.dKey[0] = true;
      keys.dKey[1] = true;

      if (!backgroundMusicPlaying) {
        let startSong = Math.floor(Math.random() * 3);
        if (startSong == 0) { playSound('backgroundMusic'); }
        else if (startSong == 1) { playSound('backgroundMusic1'); }
        else if (startSong == 2) { playSound('backgroundMusic2'); }
        backgroundMusicPlaying = true;
      }
      break;
    case 83: //s
      keys.sKey = true;
      break;
    case 65: //a
      if (keys.aKey[1]) { break; }
      keys.aKey[0] = true;
      keys.aKey[1] = true;
      break;
    case 87: //w
      keys.wKey[0] = true;
      break;
    case 13: //enter
      keys.enterKey[0] = true;
      editorMode = !editorMode;
      alert(editorMode ? "Editor Mode is: on" : "Editor Mode is: off");
      window.dispatchEvent(new Event('resize'));
      console.log(boxHolder);
      break;
    case 32: //space
      keys.spaceKey[0] = true;
      break;
    case 16: //shift
      keys.shiftKey[0] = true;
      break;
    case 90: //z
      keys.zKey[0] = true;
      let length = boxHolder.length;
      if (editorMode && length > 0) {
        if (keys.ctrlKey[0] && boxHolder[length - 1]['types'][0] == 'solid') {
          boxHolder.pop();
          objects.solids.pop();
          objects.nonFrozen.pop();
          console.log('removed solid');
          break;
        } else if (keys.ctrlKey[0] && boxHolder[length - 1]['types'][0] == 'ladder') {
          boxHolder.pop();
          objects.ladders.pop();
          objects.nonFrozen.pop();
          console.log('removed ladder');
          break;
        }
        console.log('Error: cannot remove non-solid or non-ladder');
      }
      break;
    case 17: //ctrl
      keys.ctrlKey[0] = true;
      break;
  }
}

function onKeyUp(event) {
  let keyCode = event.keyCode;

  switch (keyCode) {
    case 68: //d
      keys.dKey[0] = false;
      keys.dKey[1] = false;
      break;
    case 83: //s
      keys.sKey[0] = false;
      break;
    case 65: //a
      keys.aKey[0] = false;
      keys.aKey[1] = false;
      break;
    case 87: //w
      keys.wKey[0] = false;
      break;
    case 13: //enter
      keys.enterKey[0] = false;
      break;
    case 32: //space
      keys.spaceKey[0] = false;
      break;
    case 16: //shift
      keys.shiftKey[0] = false;
      break;
    case 90: //z
      keys.zKey[0] = false;
      break;
    case 88: //x
      keys.xKey[0] = false;
      break;
    case 17: //ctrl
      keys.ctrlKey[0] = false;
      break;
  }
}


// * UTILITY FUNCTIONS ------------------------------------------------
function noop() { /* No operation function */ }

Object.prototype.getKeysByValue = function (selection) {
  // console.log(
  //   Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)))
  // );
  return filteredKeysTemp = Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)));
}

Object.prototype.filterArray = function (value) {
  return this.filter(function (ele) {
    return ele != value;
  });
}

function getMousePosition(canvas, start, event) {
  const x = (event.clientX * canvas.width / canvas.clientWidth) - objects.origin.posx;
  const y = ((innerHeight - event.clientY) * canvas.height / canvas.clientHeight) - objects.origin.posy;
  console.log("Coordinate x: " + x, "Coordinate y: " + y);
  if (start) {
    startBox.x = x;
    startBox.y = y;
  } else {
    endBox.x = x;
    endBox.y = y;
    if (editorMode) {
      boxHolder.push(
        {
          "width": Math.abs(endBox.x - startBox.x),
          "height": Math.abs(endBox.y - startBox.y),
          "initPosx": Math.min(startBox.x, endBox.x),
          "initPosy": Math.min(startBox.y, endBox.y),
          "styles": keys.shiftKey ? ["draw", "#2370db"] : ["draw", "#f370db"],
          "types": keys.shiftKey ? ["ladder"] : ["solid"]
        }
      );
      new entity(
        boxHolder.at(-1)["width"],
        boxHolder.at(-1)["height"],
        boxHolder.at(-1)["initPosx"] + objects.origin.posx,
        boxHolder.at(-1)["initPosy"] + objects.origin.posy,
        boxHolder.at(-1)["styles"],
        boxHolder.at(-1)["types"]
      );
    }
  }
}

canvas.addEventListener("mousedown", function (e) {
  getMousePosition(canvas, true, e);
});

canvas.addEventListener("mouseup", function (e) {
  getMousePosition(canvas, false, e);
});

// * FUNCTIONS --------------------------------------------------------

function frameUpdate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lastPos = [objects.player.posx, objects.player.posy];
  if (config.gravityEnabled) { playerMovementGravity(objects.player); } else { playerMovementNoGravity(objects.player); }
  if (animationRunDelayCounter <= animationRunDelay) { animationRunDelayCounter++; } else { animationRunDelayCounter = 0; }
  if (animationRunDelayCounter == animationRunDelay) {
    for (let i = 0; i < objects.img.length; i++) {
      animate(objects.img[i]);
    }
  }
  for (let i = 0; i < objects.nonFrozen.length; i++) {
    objects.nonFrozen[i].move();
    objects.nonFrozen[i].draw();
  }
  for (let i = 0; i < objects.frozen.length; i++) {
    objects.frozen[i].draw();
  }
  if (Math.abs(lastPos[0] - objects.player.posx) > config.configPlayerMaxSpeed || Math.abs(lastPos[1] - objects.player.posy) > config.configPlayerMaxSpeed) {
    // console.log("Player moved too fast");
    objects.player.posx = lastPos[0];
    objects.player.posy = lastPos[1];
    let collision = detectCollision(objects.player, objects.solids, false);
    if (collision.bottom) {
      objects.player.posy = lastPos[1] + 4;
    }
    if (collision.top) {
      objects.player.posy = lastPos[1] - 4;
    }
  }
  objects.player.draw();
  scoreUpdate(1);
}

function scoreUpdate(value = 0) {
  let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  ctx.font = "60px Arial";
  let textWidth = ctx.measureText("Score: " + score).width;

  gradient.addColorStop("0", " magenta");
  gradient.addColorStop("0.1", "cyan");
  gradient.addColorStop("0.5", "blue");
  gradient.addColorStop("1.0", "red");

  score += value;

  ctx.save();
  ctx.scale(1, -1);

  ctx.beginPath();
  ctx.rect(13, -73, textWidth + 8, 60);
  ctx.fillStyle = '#222222';
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = gradient;

  ctx.fillText("Score: " + score, 20, -20);
  ctx.restore();
}

function animate(entity) {
  let frames = spriteSheets[entity.imgLink][entity.animation]["frames"];

  entity.sx += entity.sWidth;

  if (entity.sx / entity.sWidth >= frames) { entity.sx = spriteSheets[entity.imgLink][entity.animation]["sx"]; }
}

function switchAnimation(entity, animationID, animationSpeed = config.defaultAnimationRunDelay) {
  if (entity.animation == animationID) { return; }
  animationRunDelay = animationSpeed;
  entity.animation = animationID;
  entity.sx = spriteSheets[entity.imgLink][entity.animation]["sx"];
  entity.sy = spriteSheets[entity.imgLink][entity.animation]["sy"];
  entity.sWidth = spriteSheets[entity.imgLink][entity.animation]["sWidth"];
  entity.sHeight = spriteSheets[entity.imgLink][entity.animation]["sHeight"];
}

function playerMovementGravity(player) {
  // return;
  moveValues = player.moveValues;
  moveValues.amount = moveValues.speed;
  let wallJump = false;

  if (moveValues.y > -2) {
    moveValues.y -= config.gravity;
  }

  if (moveValues.x > .2) {
    moveValues.x -= player.touchedGround ? .2 : .01;
  } else if (moveValues.x < -.2) {
    moveValues.x += player.touchedGround ? .2 : .01;
  } else {
    moveValues.x = 0;
  }


  // FIXME: Wall jumps sometimes allow the player to just zoom up walls and not actually jump
  let collisionSolids = detectCollision(player, objects.solids, false);
  let collisionLadders = detectCollision(player, objects.ladders, false);

  if (keys.spaceKey && !player.touchedGround && (!collisionSolids.borderLeft && !collisionSolids.borderRight) && !collisionLadders.ladder) {
    player.touchedGround = false;
    if (collisionSolids.left && keys.aKey[0]) {
      player.touchedGround = true;
      moveValues.x = 1.5;
      keys.aKey[0] = false;
      wallJump = true;
      playerDirection = "right";
      scoreUpdate(1000);
    } else if (collisionSolids.right && keys.dKey[0]) {
      player.touchedGround = true;
      moveValues.x = -1.5;
      keys.dKey[0] = false;
      wallJump = true;
      playerDirection = "left";
      scoreUpdate(1000);
    }
  }

  keysDown = keys.getKeysByValue(true);
  keysDown = keysDown.concat(keys.getKeysByValue([true, true]));

  if (keysDown.length == 0 && player.touchedGround) {
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
        moveValues.x = 1;
        if (player.touchedGround) { switchAnimation(player, 'walkR', 2); }
        playerDirection = 'right';
        break;
      case 'sKey':
        player.crouched = true;
        break;
      case 'aKey':
        // if (wallJump[0] == "right") { return; }
        moveValues.x = -1;
        if (player.touchedGround) { switchAnimation(player, 'walkL', 2); }
        playerDirection = 'left';
        break;
      case 'spaceKey':
        if (player.touchedGround) {
          player.touchedGround = false;
          moveValues.y = config.jumpHeight;
        }
      default:
        break;
    }
  }

  if (keys.aKey[1] && !wallJump && player.touchedGround) { keys.aKey[0] = true; }
  if (keys.dKey[1] && !wallJump && player.touchedGround) { keys.dKey[0] = true; }

  detectCollision(player, objects.solids);
  detectCollision(player, objects.ladders);
  player.height = player.crouched ? player.initHeight / 2 : player.initHeight;
}

let detectCollision = function (entity, checkArray = [], moveEntity = true) {
  // TODO: Remove depreciated STOPWALL & FLOOR collision detection
  let splitHitBoxOffset = 3;
  let collision = {
    ladder: false,

    top: false,
    bottom: false,
    left: false,
    right: false,

    borderTop: false,
    borderBottom: false,
    borderRight: false,
    borderLeft: false,
  };
  if (checkArray == objects.ladders) {
    for (let i = 0; i < checkArray.length; i++) {
      if (
        (
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > checkArray[i].posx &&
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
          entity.posy + entity.height > checkArray[i].posy &&
          entity.posy < checkArray[i].posy + checkArray[i].height
        ) || (
          entity.posx + entity.width > checkArray[i].currentPosx &&
          entity.posx < checkArray[i].currentPosx + checkArray[i].width &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= checkArray[i].posy &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= checkArray[i].posy + checkArray[i].height
        )
      ) {
        collision.ladder = true;
        if (moveEntity) {
          entity.moveValues.y = 1;
        }
      }
    }
  } else {
    for (let i = 0; i < checkArray.length; i++) {
      if (
        entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width / 2 > checkArray[i].posx &&
        entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
        entity.posy + entity.height - splitHitBoxOffset > checkArray[i].posy &&
        entity.posy + splitHitBoxOffset < checkArray[i].posy + checkArray[i].height
      ) {
        if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
        if (checkArray[i].mainType == 'borderWallLeft') { collision.borderLeft = true; }
        if (moveEntity) {
          entity.posx = checkArray[i].posx + checkArray[i].width + (entity.moveValues.x * entity.moveValues.amount * -1);
        }
        collision.left = true;
        // console.log('left');
      }

      if (
        entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > checkArray[i].posx &&
        entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
        entity.posy + entity.height - splitHitBoxOffset > checkArray[i].posy &&
        entity.posy + splitHitBoxOffset < checkArray[i].posy + checkArray[i].height
      ) {
        if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
        if (checkArray[i].mainType == 'borderWallRight') { collision.borderRight = true; }
        if (moveEntity) {
          entity.posx = checkArray[i].posx - entity.width + (entity.moveValues.x * entity.moveValues.amount * -1);
        }
        collision.right = true;
        // console.log('right');
      }

      if (
        entity.posx + entity.width - splitHitBoxOffset > checkArray[i].posx &&
        entity.posx + splitHitBoxOffset < checkArray[i].posx + checkArray[i].width &&
        entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) >= checkArray[i].posy &&
        entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= checkArray[i].posy + checkArray[i].height
      ) {
        if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
        if (checkArray[i].mainType == 'borderWallBottom') { collision.borderBottom = true; }
        else if (entity == objects.player) {
          if (moveEntity) {
            entity.touchedGround = true;
          }
        }
        if (moveEntity) {
          entity.posy = checkArray[i].posy + checkArray[i].height + (entity.moveValues.y * entity.moveValues.amount * (collision.borderBottom ? -1.1 : -1));
        }
        collision.bottom = true;
      }

      if (
        entity.posx + entity.width - splitHitBoxOffset > checkArray[i].posx &&
        entity.posx + splitHitBoxOffset < checkArray[i].posx + checkArray[i].width &&
        entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= checkArray[i].posy &&
        entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) <= checkArray[i].posy + checkArray[i].height
      ) {
        if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
        if (checkArray[i].mainType == 'borderWallTop') { collision.borderTop = true; }
        if (moveEntity) {
          entity.posy = checkArray[i].posy - entity.height + (entity.moveValues.y * entity.moveValues.amount * (collision.borderTop ? -1.1 : -1));
        }
        collision.top = true;
        // console.log('top');
      }

      if (entity == objects.player && moveEntity) {
        if (
          entity.posx + entity.width - splitHitBoxOffset > checkArray[i].posx &&
          entity.posx + splitHitBoxOffset < checkArray[i].posx + checkArray[i].width &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.initHeight >= checkArray[i].posy &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.initHeight / 2) <= checkArray[i].posy + checkArray[i].height
        ) {
          if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
          if (checkArray[i].mainType == 'borderWallTop') { collision.borderTop = true; }
          entity.crouched = true;
        }
      }
    }
    // if (
    //   entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > checkArray[i].posx &&
    //   entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
    //   entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) >= checkArray[i].posy &&
    //   entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= checkArray[i].posy + checkArray[i].height
    // ) {
    //   console.log('help');
    // }
    if (moveEntity) {
      if (entity == objects.player) {
        scrollOffsetAdjustment.x = scrollOffsetAdjustment.y = 0;

        if (collision.borderLeft) {
          scrollOffsetAdjustment.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1.1;
        }
        if (collision.borderRight) {
          scrollOffsetAdjustment.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1.1;
        }
        if (collision.borderTop) {
          scrollOffsetAdjustment.y = (objects.player.moveValues.y * objects.player.moveValues.amount) * -1.1;
        }
        if (collision.borderBottom) {
          scrollOffsetAdjustment.y = (objects.player.moveValues.y * objects.player.moveValues.amount) * -1.1;
        }
      }
    }
  }

  collision.border = collision.borderLeft || collision.borderRight || collision.borderTop || collision.borderBottom;

  // console.log(collision);
  return collision;
}

function makeDefaultEntities() {
  const borderThickness = config.borderThickness;
  let borderColor = config.debugMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0)';
  let defaultEntities = [
    {
      "width": 1000000, "height": 600,
      "initPosx": -600, "initPosy": -560,
      "styles": ["draw", "#92d03b"],
      "types": ["solid"]
    },
    {
      "width": 600, "height": 10000,
      "initPosx": -500, "initPosy": 0,
      "styles": ["draw", "#92d03b"],
      "types": ["solid"]
    },
    {
      "width": canvas.width, "height": borderThickness,
      "initPosx": 0, "initPosy": 0,
      "styles": ["draw", borderColor],
      "types": ["borderWallBottom", "border", "solid", "frozen"]
    },
    {
      "width": canvas.width, "height": borderThickness,
      "initPosx": 0, "initPosy": canvas.height - borderThickness,
      "styles": ["draw", borderColor],
      "types": ["borderWallTop", "border", "solid", "frozen"]
    },
    {
      "width": borderThickness - 60, "height": canvas.height,
      "initPosx": 0, "initPosy": 0,
      "styles": ["draw", borderColor],
      "types": ["borderWallLeft", "border", "solid", "frozen"]
    },
    {
      "width": borderThickness + 150, "height": canvas.height,
      "initPosx": canvas.width - borderThickness - 150, "initPosy": 0,
      "styles": ["draw", borderColor],
      "types": ["borderWallRight", "border", "solid", "frozen"]
    },

  ];
  loadMap(null, false, defaultEntities);
}

function loadMap(mapID = "init", clearMap = true, mapArray = null) {
  if (clearMap) {
    objects = { player: null, origin: null, img: [], solids: [], ladders: [], frozen: [], nonFrozen: [], borders: [] };
  }

  // If the function is called with a mapArray use that instead of pulling from the map.json file
  let mapObjects = mapArray ? mapArray : map[mapID];
  let length = mapArray ? mapArray.length : Object.keys(mapObjects).length;

  for (let i = 0; i < length; i++) {
    new entity(
      mapObjects[i]["width"], mapObjects[i]["height"],
      mapObjects[i]["initPosx"], mapObjects[i]["initPosy"],
      mapObjects[i]["styles"],
      mapObjects[i]["types"]
    );
  }

  // FIXME: This is apparently deprecated now and should be fixed. But I have no way to stop recursion.
  if (loadMap.caller.name != "makeDefaultEntities") makeDefaultEntities();

  // On loadMap, the game will check if the origin and player are created. If not, it will create them.
  if (!objects.player) {
    objects.player = new entity(100, 200, 310, 310, ['img', 'player', 'idleR'], ['player']);
  }
  if (!objects.origin) {
    objects.origin = new entity(10, 10, 0, 0, ["draw", config.debugMode ? "#23f" : "rgba(0, 0, 0, 0)"], ["solid"]);
  }
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

window.startUp = function () {
  loadMap();
  updateInterval = setInterval(frameUpdate, 16);
}