const config = {
  gravityEnabled: true,
  gravity: .1,
  jumpHeight: 2,
  defaultPlayerSpeed: 7,
  playerMaxSpeedError: 20,
  playerMaxSpeed: 1,
  scrollDistance: 300,
  borderThickness: 300,
  defaultAnimationRunDelay: 1,
  defWidth: 2880,
  defHeight: 1620
}

let debugMode = false;

let editorPrecision = 35;
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
  tokens: [],
  grids: []
};

const objectsInit = objects;

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
    }
  }
)

$.getJSON(
  {
    async: false,
    url: '/assets/json/sprite-sheet.json',
    success: function (data) {
      spriteSheets = data;
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

soundManager.setup({
  debugMode: false
});
soundManager.defaultOptions = {
  autoLoad: true,
}
soundManager.onready(function () {
  // ! All sound effects need to be loaded with this function before they can be played
  // Music: https://www.chosic.com/free-music/all/
  soundManager.createSound({
    id: 'backgroundMusic',
    url: '/assets/sound/CHIPTUNE_The_Old_Tower_Inn.mp3',
    onfinish: function () { playSound('backgroundMusic1'); },
    volume: 90
  });
  soundManager.createSound({
    id: 'backgroundMusic1',
    url: '/assets/sound/CHIPTUNE_Minstrel_Dance.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic2'); }, 2000) },
    volume: 90
  });
  soundManager.createSound({
    id: 'backgroundMusic2',
    url: '/assets/sound/CHIPTUNE_The_Bards_Tale.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic'); }, 2000) },
    volume: 90
  });
  soundManager.createSound({
    id: 'trombone',
    url: '/assets/sound/FX68GWY-funny-trombone-slide-accent.mp3',
  });
  soundManager.createSound({
    id: 'pickUp',
    url: '/assets/sound/mixkit-arcade-mechanical-bling-210.wav',
    volume: 50
  });
  soundManager.createSound({
    id: 'jump',
    url: '/assets/sound/mixkit-player-jumping-in-a-video-game-2043.wav',
    volume: 50
  });
  soundManager.createSound({
    id: 'wallJump',
    url: '/assets/sound/mixkit-video-game-spin-jump-2648.wav',
    volume: 50,
    autoLoad: false
  });
});

// * CLASSES ----------------------------------------------------------
class entity {
  constructor(width, height, initPosx, initPosy, styles = ['draw', '#ff2f34'], types = ['solid']) {
    this.width = width; this.height = height;
    this.initWidth = width; this.initHeight = height;
    this.posx = initPosx; this.posy = initPosy;
    this.types = types;
    this.mainType = types[0];
    this.moveValues = { x: 0, y: 0, amount: 0, speed: 7 };

    switch (styles[0]) {
      case 'img':
        this.style = 'img';
        objects.img.push(this);
        this.imgLink = styles[1];
        this.img = new Image();
        this.img.src = spriteSheets[styles[1]]["img"];
        this.animation = styles[2];
        this.sx = spriteSheets[styles[1]][this.animation]["sx"];
        this.sy = spriteSheets[styles[1]][this.animation]["sy"];
        this.sWidth = spriteSheets[styles[1]][this.animation]["sWidth"];
        this.sHeight = spriteSheets[styles[1]][this.animation]["sHeight"];
        break;
      case 'draw':
        this.style = 'draw';
        this.color = styles[1];
        break;
      case 'grid':
        this.style = 'grid';
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
    if (types.indexOf('token') > -1) { objects.tokens.push(this); }
    if (types.indexOf('grid') > -1) { objects.grids.push(this); }

    this.draw();
  }

  draw() {
    switch (this.style) {
      case 'img':
        ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.posx, this.posy, this.width, this.height);
        break;
      case 'draw':
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.posx, this.posy, this.width, this.height);
        ctx.closePath();
        break;
      case 'grid':
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.rect(this.posx, this.posy, this.width, this.height);
        ctx.stroke();
        ctx.closePath();
      default:
        // console.log('Error: entity style not found (draw)');
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
  dKey: [false, false], // Has additional holding boolean
  aKey: [false, false], // Has additional holding boolean
  sKey: [false],
  spaceKey: [false],
  shiftKey: [false],
  wKey: [false],
  xKey: [false],
  zKey: [false],
  ctrlKey: [false],
  enterKey: [false],
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
      keys.sKey[0] = true;
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
      switch (keys.shiftKey[0]) {
        case true:
          debugMode = !debugMode;
          alert(debugMode ? "debugMode is: on" : "debugMode is: off");
          break;
        default:
          editorMode = !editorMode;
          if (editorMode && debugMode) { drawGrid(editorPrecision); } else {
            const length = objects.grids.length;
            for (let i = 0; i < length; i++) {
              objects.remove(objects.grids[i]);
            }
          }
          alert(editorMode ? "Editor Mode is: on" : "Editor Mode is: off");
          break;
      }
      window.dispatchEvent(new Event('resize'));
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
        } else if (keys.ctrlKey[0] && boxHolder[length - 1]['types'][0] == 'ladder') {
          boxHolder.pop();
          objects.ladders.pop();
          objects.nonFrozen.pop();
          console.log('removed ladder');
        } else {
          console.log('Error: cannot remove non-solid or non-ladder');
        }
      }
      break;
    case 17: //ctrl
      keys.ctrlKey[0] = true;
      break;
    case 221: //]
      if (editorMode) {
        editorPrecision += 5;
        if (debugMode) { drawGrid(editorPrecision); }
      }
      break;
    case 219: //[
      if (editorMode && editorPrecision > 5) {
        editorPrecision -= 5;
        if (debugMode) { drawGrid(editorPrecision); }
      }
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

Number.prototype.round = function (num, roundUp = false) {
  if (roundUp) {
    return Math.ceil(this / num) * num;
  } else {
    return Math.round(this / num) * num;
  }
}

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

Array.prototype.remove = function (what) {
  const index = this.indexOf(what)
  if (index > -1) { this.splice(index, 1); }
  else { console.log('Error: element not found'); }
};

Object.prototype.remove = function (what) {
  let keyList = Object.keys(this);
  if (this == objects) {
    keyList.remove("player");
    keyList.remove("origin");
  }
  for (let i = 0; i < keyList.length; i++) {
    const arrayName = keyList[i];
    const index = this[arrayName].indexOf(what)
    if (index > -1) { this[arrayName].splice(index, 1); }
  }
};

function getMousePosition(canvas, start, event) {
  const x = ((event.clientX * canvas.width / canvas.clientWidth) - objects.origin.posx).round(editorPrecision);
  const y = (((innerHeight - event.clientY) * canvas.height / canvas.clientHeight) - objects.origin.posy).round(editorPrecision);
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
          "width": Math.abs(endBox.x - startBox.x).round(editorPrecision),
          "height": Math.abs(endBox.y - startBox.y).round(editorPrecision),
          "initPosx": Math.min(startBox.x, endBox.x).round(editorPrecision),
          "initPosy": Math.min(startBox.y, endBox.y).round(editorPrecision),
          "styles": keys.shiftKey[0] ? ["draw", "#2370db"] : ["draw", "#f370db"],
          "types": keys.shiftKey[0] ? ["ladder"] : ["solid"]
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

var drawGrid = function (size) {
  // FIXME: Objects drawn in this function are perfect match for grid. But if drawn outside of it, they do not fit perfectly.
  const length = objects.grids.length;
  for (let i = 0; i < length; i++) {
    objects.nonFrozen.remove(objects.grids[i]);
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
  if (Math.abs(lastPos[0] - objects.player.posx) > config.playerMaxSpeedError || Math.abs(lastPos[1] - objects.player.posy) > config.playerMaxSpeedError) {
    console.log("Player moved too fast");
    objects.player.posx = lastPos[0];
    objects.player.posy = lastPos[1];
    let collision = detectCollision(objects.player, "solids", false);
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

  if (editorMode) {
    // TODO: Move this out of the scoreUpdate function
    let editorTextWidth = ctx.measureText("Editor Mode --- snap (use [ / ]): " + editorPrecision).width;
    ctx.beginPath();
    ctx.rect(13, -150, editorTextWidth + 8, 60);
    ctx.fillStyle = '#222222';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = gradient;

    ctx.fillText("Editor Mode --- snap (use [ / ]): " + editorPrecision, 20, -100);
  }
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
        }
      default:
        break;
    }
  }

  let collisionSolids = detectCollision(player);
  let collisionLadders = detectCollision(player, "ladders");
  let collisionTokens = detectCollision(player, "tokens");

  if (
    keys.spaceKey &&
    !player.touchedGround &&
    !collisionSolids.borderLeft &&
    !collisionSolids.borderRight &&
    !collisionLadders.ladder &&
    !keys.sKey[0]
  ) {
    // FIXME: able to infinite wall jump kinda on border walls
    player.touchedGround = false;
    if (collisionSolids.left && keys.aKey[0]) {
      player.touchedGround = true;
      moveValues.x = 1.5;
      keys.aKey[0] = false;
      wallJump = true;
      playerDirection = "right";
      // playSound('wallJump');
      scoreUpdate(100);
    } else if (collisionSolids.right && keys.dKey[0]) {
      player.touchedGround = true;
      moveValues.x = -1.5;
      keys.dKey[0] = false;
      wallJump = true;
      playerDirection = "left";
      // playSound('wallJump');
      scoreUpdate(100);
    }
  }
  if (keys.aKey[1] && !wallJump && player.touchedGround) { keys.aKey[0] = true; }
  if (keys.dKey[1] && !wallJump && player.touchedGround) { keys.dKey[0] = true; }
  player.height = player.crouched ? player.initHeight / 2 : player.initHeight;
}

const detectCollision = function (entity, checkArrayName = "solids", moveEntity = true) {
  // TODO: Remove depreciated STOPWALL & FLOOR collision detection
  let checkArray;
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
  switch (checkArrayName) {
    case "ladders":
      checkArray = objects.ladders;
      length = checkArray.length;
      if (length <= 0) { break; }
      if (checkArray.length)
        for (let i = 0; i < checkArray.length; i++) {
          const ladder = checkArray[i];
          if (
            (
              entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > ladder.posx &&
              entity.posx + (entity.moveValues.x * entity.moveValues.amount) < ladder.posx + ladder.width &&
              entity.posy + entity.height > ladder.posy &&
              entity.posy < ladder.posy + ladder.height
            ) || (
              entity.posx + entity.width > ladder.currentPosx &&
              entity.posx < ladder.currentPosx + ladder.width &&
              entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= ladder.posy &&
              entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= ladder.posy + ladder.height
            )
          ) {
            collision.ladder = true;
            if (moveEntity) {
              entity.moveValues.y = 1;
            }
          }
        }
      break;
    case "tokens":
      checkArray = objects.tokens;
      length = checkArray.length;
      if (length <= 0) { break; }
      for (let i = 0; i < checkArray.length; i++) {
        const token = checkArray[i];
        if (
          (
            entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > token.posx &&
            entity.posx + (entity.moveValues.x * entity.moveValues.amount) < token.posx + token.width &&
            entity.posy + entity.height > token.posy &&
            entity.posy < token.posy + token.height
          ) || (
            entity.posx + entity.width > token.currentPosx &&
            entity.posx < token.currentPosx + token.width &&
            entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= token.posy &&
            entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= token.posy + token.height
          )
        ) {
          scoreUpdate(10000);
          objects.remove(token);
          playSound('pickUp');
        }
      }
      break;
    case "solids":
      checkArray = objects.solids;
      length = checkArray.length;
      if (length <= 0) { break; }
      for (let i = 0; i < checkArray.length; i++) {
        const solid = checkArray[i];
        if (
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width / 2 > solid.posx &&
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) < solid.posx + solid.width &&
          entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
          entity.posy + splitHitBoxOffset < solid.posy + solid.height
        ) {
          if (solid.mainType == 'stopWall') { collision.stopWall = true; }
          if (solid.mainType == 'borderWallLeft') { collision.borderLeft = true; }
          if (moveEntity) {
            entity.posx = solid.posx + solid.width + (entity.moveValues.x * entity.moveValues.amount * -1);
          }
          collision.left = true;
          // console.log('left');
        }

        if (
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > solid.posx &&
          entity.posx + (entity.moveValues.x * entity.moveValues.amount) < solid.posx + solid.width &&
          entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
          entity.posy + splitHitBoxOffset < solid.posy + solid.height
        ) {
          if (solid.mainType == 'stopWall') { collision.stopWall = true; }
          if (solid.mainType == 'borderWallRight') { collision.borderRight = true; }
          if (moveEntity) {
            entity.posx = solid.posx - entity.width + (entity.moveValues.x * entity.moveValues.amount * -1);
          }
          collision.right = true;
          // console.log('right');
        }

        if (
          entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
          entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) >= solid.posy &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= solid.posy + solid.height
        ) {
          if (solid.mainType == 'stopWall') { collision.stopWall = true; }
          if (solid.mainType == 'borderWallBottom') { collision.borderBottom = true; }
          else if (entity == objects.player) {
            if (moveEntity) {
              entity.touchedGround = true;
            }
          }
          if (moveEntity) {
            entity.posy = solid.posy + solid.height + (entity.moveValues.y * entity.moveValues.amount * (collision.borderBottom ? -1.1 : -1));
          }
          collision.bottom = true;
        }

        if (
          entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
          entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= solid.posy &&
          entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) <= solid.posy + solid.height
        ) {
          if (solid.mainType == 'stopWall') { collision.stopWall = true; }
          if (solid.mainType == 'borderWallTop') { collision.borderTop = true; }
          if (moveEntity) {
            entity.posy = solid.posy - entity.height + (entity.moveValues.y * entity.moveValues.amount * (collision.borderTop ? -1.1 : -1));
          }
          collision.top = true;
          // console.log('top');
        }

        if (entity == objects.player && moveEntity) {
          if (
            entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
            entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
            entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.initHeight >= solid.posy &&
            entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.initHeight / 2) <= solid.posy + solid.height
          ) {
            if (solid.mainType == 'stopWall') { collision.stopWall = true; }
            if (solid.mainType == 'borderWallTop') { collision.borderTop = true; }
            entity.crouched = true;
          }
        }
      }

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

      collision.border = collision.borderLeft || collision.borderRight || collision.borderTop || collision.borderBottom;
      break;
    default:
      break;
  }

  // console.log(collision);
  return collision;
}

function makeDefaultEntities() {
  const borderThickness = config.borderThickness;
  const borderColor = debugMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0)';
  const defaultEntities = [
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
    }
  ];

  // On the creation of default entities, the game will check if the origin and player are created. If not, it will create them.
  if (!objects.player) {
    objects.player = new entity(100, 200, 310, 310, ['img', 'player', 'idleR'], ['player']);
  }
  if (!objects.origin) {
    objects.origin = new entity(10, 10, 0, 0, ["draw", debugMode ? "#1370df" : "rgba(0, 0, 0, 0)"], undefined);
  }

  loadMap(null, false, defaultEntities);
}

function loadMap(mapID = "init", clearMap = true, mapArray = null) {
  if (clearMap) {
    let keyList = Object.keys(objects);
    keyList.remove("player");
    keyList.remove("origin");
    for (let i = 0; i < keyList.length; i++) {
      objects[keyList[i]] = [];
    }
    objects.player = null;
    objects.origin = null;
  }

  // If the function is called with a mapArray use that instead of pulling from the map.json file
  // This is mainly used for loading the default entities
  let mapObjects = mapArray ? mapArray : map[mapID];
  let length = mapArray ? mapArray.length : Object.keys(mapObjects).length;
  let loadMapPrecision = 25;

  for (let i = 0; i < length; i++) {
    new entity(
      (mapObjects[i]["width"] > loadMapPrecision ? mapObjects[i]["width"] : loadMapPrecision).round(loadMapPrecision),
      (mapObjects[i]["height"] > loadMapPrecision ? mapObjects[i]["height"] : loadMapPrecision).round(loadMapPrecision),
      (mapObjects[i]["initPosx"]).round(loadMapPrecision),
      (mapObjects[i]["initPosy"]).round(loadMapPrecision),
      mapObjects[i]["styles"],
      mapObjects[i]["types"]
    );
  }

  // FIXME: This is apparently deprecated now and should be fixed. But I have no way to stop recursion.
  try {
    if (loadMap.caller.name != "makeDefaultEntities") { makeDefaultEntities(); }
  } catch (TypeError) {
    makeDefaultEntities();
    throw "TypeError:\nRecursion is not allowed check failed, making default entities";
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