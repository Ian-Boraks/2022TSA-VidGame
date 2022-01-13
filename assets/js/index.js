const config = {
  gravityEnabled: true,
  gravity: .1,
  jumpHeight: 2,
  defaultPlayerSpeed: 7,
  scrollDistance: 300,
  borderThickness: 120,
  defaultAnimationRunDelay: 1,
}

let editorMode = false;
let startBox = { x: 0, y: 0 };
let endBox = { x: 0, y: 0 };
let boxHolder = [];

let map = {};
let spriteSheets = {};
let animationRunDelay = config.defaultAnimationRunDelay;
let animationRunDelayCounter = 0;

let objects = {
  player: null,
  origin: null,
  img: [],
  solids: [],
  ladders: [],
  slopes: [],
  frozen: [],
  nonFrozen: [],
};

let scrollOffsetAdjustment = {
  x: 0,
  y: 0
}

let scrollOffsetTotal = {
  x: 0,
  y: 0
}

let keys = {
  dKey: false,
  sKey: false,
  aKey: false,
  spaceKey: false,
};

let lastMove = [];


// * ON LOAD --------------------------------------------------------
alert("To use the editor, press enter.\nEditor controls:\nClick+Drag to make solid\nShift+Click+Drag to make ladder\nHold Z and then press ctrl to remove last solid\nHold X and then press ctrl to remove last ladder\nPress enter again to exit and to have map changes output to console\n\n\nGame Controls:\nSpace to jump\nA to move left\nD to move right\nS to crouch");

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

const canvas = document.getElementById("game-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const context = canvas.getContext("2d");
context.translate(0, canvas.height);
context.scale(1, -1);

window.addEventListener('DOMContentLoaded', function () {
  // ! This is an example of how to use the sound function
  // ! Now when you click the screen the funny sound will play
  // let gameWindow = document.getElementById('game-window');
  // gameWindow.addEventListener('click', function () {
  //   playSound('trombone');
  // });
  testScript();
});

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

soundManager.onready(function () {
  // ! All sound effects need to be loaded with this function before they can be played
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
        this.animation = "idle";
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
      objects.player = this;
      this.crouched = false;
      this.touchedGround = false;
      this.lastPos = [undefined, undefined];
      this.lastMove = [undefined, undefined];
    }
    if (types.indexOf('solid') > -1) { objects.solids.push(this); }
    if (types.indexOf('ladder') > -1) { objects.ladders.push(this); }
    if (types.indexOf('frozen') > -1) { objects.frozen.push(this); } else { objects.nonFrozen.push(this); }
    if (types.indexOf('slope') > -1) { objects.slopes.push(this); }

    this.draw();
  }

  draw() {
    switch (this.style) {
      case 'img':
        context.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.posx, this.posy, this.width, this.height);
        break;
      case 'draw':
        context.beginPath();
        context.rect(this.posx, this.posy, this.width, this.height);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
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
        if (scrollOffsetAdjustment.x == 0 && scrollOffsetAdjustment.y == 0) { return; }
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
function onKeyDown(event) {
  let keyCode = event.keyCode;
  switch (keyCode) {
    case 68: //d
      keys.dKey = true;
      break;
    case 83: //s
      keys.sKey = true;
      break;
    case 65: //a
      keys.aKey = true;
      break;
    case 87: //w
      keys.wKey = true;
      break;
    case 13: //enter
      keys.enterKey = true;
      editorMode = !editorMode;
      alert(editorMode ? "Editor Mode is: on" : "Editor Mode is: off");
      console.log(boxHolder);
      break;
    case 32: //space
      keys.spaceKey = true;
      break;
    case 16: //shift
      keys.shiftKey = true;
      break;
    case 90: //z
      keys.zKey = true;
      break;
    case 88: //x
      keys.xKey = true;
      break;
    case 17: //ctrl
      keys.ctrlKey = true;

      let length = boxHolder.length;
      if (editorMode && length > 0) {
        if (keys.zKey && boxHolder[length - 1]['types'][0] == 'solid') {
          boxHolder.pop();
          objects.solids.pop();
          objects.nonFrozen.pop();
          console.log('removed solid');
          break;
        }
        if (keys.xKey && boxHolder[length - 1]['types'][0] == 'ladder') {
          boxHolder.pop();
          objects.ladders.pop();
          objects.nonFrozen.pop();
          console.log('removed ladder');
          break;
        }
        console.log('Error: cannot remove non-solid or non-ladder');
      }
      break;
  }
}

function onKeyUp(event) {
  let keyCode = event.keyCode;

  switch (keyCode) {
    case 68: //d
      keys.dKey = false;
      break;
    case 83: //s
      keys.sKey = false;
      break;
    case 65: //a
      keys.aKey = false;
      break;
    case 87: //w
      keys.wKey = false;
      break;
    case 13: //enter
      keys.enterKey = false;
      break;
    case 32: //space
      keys.spaceKey = false;
      break;
    case 16: //shift
      keys.shiftKey = false;
      break;
    case 90: //z
      keys.zKey = false;
      break;
    case 88: //x
      keys.xKey = false;
      break;
    case 17: //ctrl
      keys.ctrlKey = false;
      break;
  }
}


// * UTILITY FUNCTIONS ------------------------------------------------
Object.prototype.getKeysByValue = function (value) {
  let keys = Object.keys(this);
  return keys.filter(key => this[key] === value);
}

function getMousePosition(canvas, start, event) {
  let x = event.clientX - objects.origin.posx;
  let y = canvas.height - event.clientY - objects.origin.posy;
  console.log("Coordinate x: " + x,
    "Coordinate y: " + y);
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
function noop() { /* No operation function */ }

function frameUpdate() {
  context.clearRect(0, 0, canvas.width, canvas.height);
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
  objects.player.draw();
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
  moveValues = player.moveValues;
  moveValues.amount = moveValues.speed;

  if (moveValues.y > -2) {
    moveValues.y -= config.gravity;
  }

  if (player.touchedGround) {
    if (moveValues.x > .2) {
      moveValues.x -= .2;
    } else if (moveValues.x < -.2) {
      moveValues.x += .2;
    } else {
      moveValues.x = 0;
    }
  }

  keysDown = keys.getKeysByValue(true);
  if (keysDown.length > 0 && player.touchedGround) {
    switchAnimation(player, 'walk', 5);
  } else if (keysDown.length == 0 && player.touchedGround) {
    switchAnimation(player, 'idle');
  } else if (!player.touchedGround) {
    switchAnimation(player, 'jump');
  }
  if (!keys.sKey) { player.crouched = false; }

  for (let i = 0; i < keysDown.length; i++) {
    switch (keysDown[i]) {
      case 'dKey':
        moveValues.x = 1;
        break;
      case 'sKey':
        player.crouched = true;
        break;
      case 'aKey':
        moveValues.x = -1;
        break;
      case 'wKey':
        break;
      case 'enterKey':
        break;
      case 'spaceKey':
        if (player.touchedGround) {
          // TODO: Wall Jumps
          playSound('trombone');
          player.touchedGround = false;
          moveValues.y = config.jumpHeight;
        }
      default:
        break;
    }
  }
  detectCollision(player, objects.solids);
  detectCollision(player, objects.ladders);
  player.height = player.crouched ? player.initHeight / 2 : player.initHeight;
}

let detectCollision = function (entity, checkArray = []) {
  // TODO: Remove depreciated STOPWALL & FLOOR collision detection
  // FIXME: 
  let splitHitBoxOffset = 3;
  let collision = {
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
        entity.moveValues.y = 1;
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
        entity.posx = checkArray[i].posx + checkArray[i].width + (entity.moveValues.x * entity.moveValues.amount * -1);
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
        entity.posx = checkArray[i].posx - entity.width + (entity.moveValues.x * entity.moveValues.amount * -1);
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
        if (entity == objects.player) { entity.touchedGround = true; }
        entity.posy = checkArray[i].posy + checkArray[i].height + (entity.moveValues.y * entity.moveValues.amount * -1);
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
        entity.posy = checkArray[i].posy - entity.height;
        entity.moveValues.y = 0;
        collision.top = true;
        // console.log('top');
      }

      if (entity == objects.player) {
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
    if (entity == objects.player) {
      scrollOffsetAdjustment.x = scrollOffsetAdjustment.y = 0;
      if (collision.borderLeft) {
        scrollOffsetAdjustment.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1;
      }
      if (collision.borderRight) {
        scrollOffsetAdjustment.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1;
      }
      if (collision.borderTop) {
        scrollOffsetAdjustment.y = (objects.player.moveValues.y * objects.player.moveValues.amount) * -1;
      }
      if (collision.borderBottom) {
        scrollOffsetAdjustment.y = (objects.player.moveValues.y * objects.player.moveValues.amount) * -1;
      }
    }
  }

  // console.log(collision);
  return collision;
}

makePlayer = function () {
  console.log('makePlayer');

  objects.origin = new entity(0, 0, 0, 0, ["draw", "rgba(0,0,0,0)"], ["solid"]);
  new entity(100, 200, canvas.width / 2, canvas.height / 2, ['img', 'player'], ['player']);
  // new entity(canvas.width, canvas.height, 0, 0, ['draw', 'rgba(0,0,0,0)'], ['onScreenDetection', 'frozen']);

  makePlayer = noop();
}

makeBorder = function () {
  console.log('makeBorder');

  let borderThickness = config.borderThickness;
  let borderColor = 'rgba(0, 0, 0, 0)';
  // let borderColor = '#9370db';

  // new entity(canvas.width, borderThickness, 0, 0, ['draw', borderColor], ['borderWallBottom', 'solid', 'frozen']);
  // new entity(canvas.width, borderThickness, 0, canvas.height - borderThickness, ['draw', borderColor], ['borderWallTop', 'solid', 'frozen']);
  new entity(borderThickness, canvas.height, 0, 0, ['draw', borderColor], ['borderWallLeft', 'solid', 'frozen']);
  new entity(borderThickness, canvas.height, canvas.width - borderThickness, 0, ['draw', borderColor], ['borderWallRight', 'solid', 'frozen']);

  makeBorder = noop();
}

function loadMap(mapID = "init") {
  console.log('loadMap');

  let mapObjects = map[mapID]
  let length = Object.keys(mapObjects).length;
  for (let i = 0; i < length; i++) {
    new entity(
      mapObjects[i]["width"],
      mapObjects[i]["height"],
      mapObjects[i]["initPosx"],
      mapObjects[i]["initPosy"],
      mapObjects[i]["styles"],
      mapObjects[i]["types"]
    );
  }
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

window.testScript = function () {
  console.log('test');
  loadMap();
  makeBorder();
  makePlayer();
  updateInterval = setInterval(frameUpdate, 16);
}