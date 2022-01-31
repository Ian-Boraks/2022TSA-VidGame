
const config = {
  gravityEnabled: true,
  gravity: .05,
  jumpHeight: 1,
  playerDefaultSpeed: .5,
  playerFriction: .08,
  playerMaxSpeed: 12,
  playerMaxSpeedError: 30,
  scrollDistance: 300,
  borderThickness: 300,
  defaultAnimationRunDelay: 1,
  defWidth: 2880,
  defHeight: 1620,
  frameRate: 60,
}

let debugMode = false;

let editorPrecision = 35;
let editorMode = false;
let startBox = { x: 0, y: 0 };
let endBox = { x: 0, y: 0 };
let boxHolder = [];
let typeOfEntity = 'solid';

let delta;
let wallJumpFriction;
let infiniteJumps = false;
let stageID = 'stage1';
let backgroundOffset = {
  x: 5000,
  y: 400
}
const backgroundOffsetInit = backgroundOffset;

let map = {};
let spriteSheets = {};

$.getJSON(
  {
    async: false,
    url: '/assets/json/map.json',
    success: (data) => {
      map = data;
    },
    error: function (data, jqXHR, textStatus, errorThrown) {
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
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

let animationRunDelay = config.defaultAnimationRunDelay;
let animationRunDelayCounter = 0;
let playerDirection = "right";

let objects = {
  player: null,
  origin: null,
  bounds: null,
  backgroundImg: null,
  img: [],
  solids: [],
  ladders: [], // FIXME: Ladders can phase you through the ground
  stairs: [],
  frozen: [],
  nonFrozen: [],
  borders: [],
  tokens: [],
  traps: [],
  grids: [],
  boxHolder: [],
  background: [],
};

const objectsInit = objects;

var scrollOffsetAdjustment = {
  x: 0,
  y: 0
}

var scrollOffsetTotal = {
  x: 0,
  y: 0
}

let lastMove = [];
let lastPos = [];
let respawning = false;
let wallJumpAllowed = false;
let playerMovementCheck = true;
let wallJumpTimer = null;
let stairScroll = false;
let detectOutOfBoundsToggle = true;

let backgroundMusicPlaying = false;
let score = 0;

let totalFrames = 0;

// * ON LOAD --------------------------------------------------------
// alert("To use the editor, press enter.\nEditor controls:\nClick+Drag to make solid\nShift+Click+Drag to make ladder\nPress enter again to exit and to have map changes output to console\n\n\nGame Controls:\nSpace to jump\nA to move left\nD to move right\nS to crouch");
if (window.location.href.indexOf('#') > -1) {
} else {
  window.location.href = "/readme.html";
}

const canvas = document.getElementById("game-canvas");
const tempCanvasDisplay = canvas.style.display;
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

    makeDefaultEntities(true);
  }
});

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
    volume: 70
  });
  soundManager.createSound({
    id: 'backgroundMusic1',
    url: '/assets/sound/CHIPTUNE_Minstrel_Dance.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic2'); }, 2000) },
    volume: 70
  });
  soundManager.createSound({
    id: 'backgroundMusic2',
    url: '/assets/sound/CHIPTUNE_The_Bards_Tale.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic'); }, 2000) },
    volume: 70
  });
  soundManager.createSound({
    id: 'trombone',
    url: '/assets/sound/FX68GWY-funny-trombone-slide-accent.mp3',
    autoLoad: false,
  });
  soundManager.createSound({
    id: 'pickUp',
    url: '/assets/sound/mixkit-arcade-mechanical-bling-210.wav',
    volume: 50
  });
  soundManager.createSound({
    id: 'jump',
    url: '/assets/sound/mixkit-player-jumping-in-a-video-game-2043.wav',
    volume: 30
  });
  soundManager.createSound({
    id: 'wallJump',
    url: '/assets/sound/mixkit-video-game-spin-jump-2648.wav',
    volume: 50,
    autoLoad: false
  });
  soundManager.createSound({
    id: 'death',
    url: '/assets/sound/163442__under7dude__man-dying.wav',
    volume: 100,
  });
});

var video = document.getElementById('intro');
var startText = document.getElementById('startText');
video.onended = function (e) {
  canvas.style.display = tempCanvasDisplay;
  video.style.display = "none";
  MainLoop.start();
  console.log("Main Loop Started");
};

// * UTILITY FUNCTIONS ------------------------------------------------
const noop = () => { /* No operation function */ };

Number.prototype.round = function (num, roundUp = false) {
  if (roundUp) {
    return Math.ceil(this / num) * num;
  } else {
    return Math.round(this / num) * num;
  };
};

Object.prototype.getKeysByValue = function (selection) {
  // console.log(
  //   Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)))
  // );
  return Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)));
};

Array.prototype.filterArray = function (value) {
  return this.filter(function (ele) {
    return ele != value;
  });
};

Array.prototype.removeArray = function (what) {
  // console.log(what);
  const index = this.indexOf(what);
  if (index > -1) { this.splice(index, 1); };
};

Object.prototype.removeDict = function (what) {
  let keyList = Object.keys(this);
  if (this == objects) {
    keyList.removeArray("player");
    keyList.removeArray("origin");
    keyList.removeArray("bounds");
    keyList.removeArray("backgroundImg")
  };
  for (let i = 0; i < keyList.length; i++) {
    this[keyList[i]].removeArray(what);
  };
};

const updateClipboard = function (newClip) {
  navigator.clipboard.writeText(newClip).then(function () {
    /* clipboard successfully set */
  }, function () {
    /* clipboard write failed */
  });
};

const returnMoveValues = function (entity) {
  return {
    x: entity.moveValues.x,
    y: entity.moveValues.y,
    amount: entity.moveValues.amount,

    totMovX: entity.moveValues.x,
    totMovY: entity.moveValues.y,

    newx: entity.posx + entity.moveValues.x,
    newy: entity.posy + entity.moveValues.y
  };
};

const lerp = function (start, end, speed) {
  return start + (end - start) * speed;
};

const oscillator = function (time, frequency = 1, amplitude = 1, phase = 0, offset = 0) {
  return Math.sin(time * frequency * Math.PI * 2 + phase * Math.PI * 2) * amplitude + offset;
};

const getRandom = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.random() * (max - min) + min; //The maximum is exclusive and the minimum is inclusive
};

// * EDITOR -----------------------------------------------------------
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
      if (Math.abs(endBox.x - startBox.x).round(editorPrecision) == 0 || Math.abs(endBox.y - startBox.y).round(editorPrecision) == 0) {
        throw "Error: box must be at least 1 unit in size";
      }

      var boxTemp = {
        "width": Math.abs(endBox.x - startBox.x).round(editorPrecision),
        "height": Math.abs(endBox.y - startBox.y).round(editorPrecision),
        "initPosx": Math.min(startBox.x, endBox.x).round(editorPrecision),
        "initPosy": Math.min(startBox.y, endBox.y).round(editorPrecision),
        "styles": [],
        "types": [],
      }

      switch (typeOfEntity) {
        case 'solid':
          boxTemp["styles"] = ["img", "solid_brick", "idle"];
          boxTemp["types"] = ["solid"];
          break;
        case 'ladder':
          boxTemp["styles"] = ["draw", "#2370db"];
          boxTemp["types"] = ["ladder"];
          break;
        case 'trap':
          boxTemp["styles"] = ["img", "trap", "idle"];
          boxTemp["types"] = ["trap"];
          break;
        case 'token':
          boxTemp["styles"] = ["draw", "#42f5a1"];
          boxTemp["types"] = ["token"];
          break;
        case 'stair':
          drawStairs(startBox.x + objects.origin.posx, startBox.y + objects.origin.posy, endBox.x + objects.origin.posx, endBox.y + objects.origin.posy, "#f2f5a1");
          return;
        case 'background':
          boxTemp["styles"] = ["draw", "#2dff"];
          boxTemp["types"] = ["background"];
        default:
          console.log('Error: entity type not found');
          break;
      }
      boxHolder.push(boxTemp);
      objects.boxHolder.push(
        new entity(
          boxHolder.at(-1)["width"],
          boxHolder.at(-1)["height"],
          boxHolder.at(-1)["initPosx"] + objects.origin.posx,
          boxHolder.at(-1)["initPosy"] + objects.origin.posy,
          boxHolder.at(-1)["styles"],
          boxHolder.at(-1)["types"]
        )
      );

      updateClipboard(JSON.stringify(boxHolder));
    }
  }
}

canvas.addEventListener("mousedown", function (e) {
  getMousePosition(canvas, true, e);
});

canvas.addEventListener("mouseup", function (e) {
  getMousePosition(canvas, false, e);
});

// * CLASSES ----------------------------------------------------------
class entity {
  constructor(width, height, initPosx, initPosy, styles = ['draw', '#ff2f34'], types = ['solid']) {
    void ctx.fillRect(0, 0, canvas.width, canvas.height, 'black');
    this.width = width;
    this.height = height;
    this.initWidth = width;
    this.initHeight = height;
    this.posx = initPosx;
    this.posy = initPosy;
    this.types = types;
    this.mainType = types[0];
    this.moveValues = { x: 0, y: 0, amount: 0, speed: config.playerDefaultSpeed };

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
        if (this.mainType != 'player') {
          finalizeGroundEntities(this);
        }
        if (this.mainType == 'backgroundImg') {
          this.totalTimePassed = { x: 0, y: 100 };
        } else { this.totalTimePassed = 0; }
        this.draw = () => { this.drawImg(this); };
        break;
      case 'draw':
        this.style = 'draw';
        this.color = styles[1];
        this.draw = () => { this.drawRect(this); };
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
      this.touchedLadder = false;
      this.lastPos = [undefined, undefined];
      this.lastMove = [undefined, undefined];
      this.move = () => { this.movePlayer(this); };
      return;
    } else {
      if (types.indexOf('backgroundImg') > -1) { this.animationSpeed = 2000; objects.backgroundImg = this; }
      if (types.indexOf('solid') > -1) { objects.solids.push(this); }
      if (types.indexOf('ladder') > -1) { objects.ladders.push(this); }
      if (types.indexOf('frozen') > -1) { objects.frozen.push(this); } else { objects.nonFrozen.push(this); }
      if (types.indexOf('stair') > -1) { objects.stairs.push(this); }
      if (types.indexOf('border') > -1) { objects.borders.push(this); }
      if (types.indexOf('token') > -1) { objects.tokens.push(this); }
      if (types.indexOf('grid') > -1) { objects.grids.push(this); }
      if (types.indexOf('trap') > -1) { this.animationSpeed = getRandom(1000, 1500); objects.traps.push(this); }
      if (types.indexOf('background') > -1) { objects.background.push(this); }
      this.move = () => { this.moveDefault(this); };
    }
  }

  drawImg = () => {
    ctx.drawImage(this.img, this.sx, this.sy, this.sWidth, this.sHeight, this.posx, this.posy, this.width, this.height);
  }

  drawRect = () => {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.posx, this.posy, this.width, this.height);
    ctx.closePath();
  }

  drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.rect(this.posx, this.posy, this.width, this.height);
    ctx.stroke();
    ctx.closePath();
  }

  movePlayer = () => {
    if (this.moveValues.x == 0 && this.moveValues.y == 0) { return; }

    const tempPos = [this.posx, this.posy];

    for (i = 0; i < 1.1; i += 0.1) {
      // this.posx += this.moveValues.x;
      // this.posy += this.moveValues.y;
      this.posx = lerp(tempPos[0], tempPos[0] + this.moveValues.x, i);
      this.posy = lerp(tempPos[1], tempPos[1] + this.moveValues.y, i);
    }
  }

  moveDefault = () => {
    if (scrollOffsetAdjustment.x == 0 && scrollOffsetAdjustment.y == 0) { return; }

    this.posx += scrollOffsetAdjustment.x;
    this.posy += scrollOffsetAdjustment.y;
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
  oneKey: [false],
  twoKey: [false],
  threeKey: [false],
  fourKey: [false],
  fiveKey: [false],
  sixKey: [false],
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
        video.paused ? video.play() : video.pause();
        startText.style.display = 'none';
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
      editorMode = !editorMode;
      if (!editorMode) {
        updateClipboard(JSON.stringify(boxHolder));
        console.log(JSON.stringify(boxHolder));
      }
      alert(editorMode ? "Editor Mode is: on" : "Editor Mode is: off");
      break;
    case 32: //space
      keys.spaceKey[0] = true;
      break;
    case 16: //shift
      if (!editorMode) { break; }
      infiniteJumps = !infiniteJumps;
      debugMode = !debugMode;
      window.dispatchEvent(new Event('resize'));
      keys.shiftKey[0] = true;
      break;
    case 90: //z
      keys.zKey[0] = true;
      let length = boxHolder.length;
      if (editorMode && length > 0) {
        let tempBox = objects.boxHolder[length - 1];
        if (keys.ctrlKey[0]) {
          if (tempBox.types.indexOf('stairLast') > -1) {
            while (!(objects.boxHolder[objects.boxHolder.length - 1].types.indexOf('stairFirst') > -1)) {
              tempBox = objects.boxHolder[objects.boxHolder.length - 1];
              objects.removeDict(tempBox);
              boxHolder.pop();
            }
            tempBox = objects.boxHolder[objects.boxHolder.length - 1];
            objects.removeDict(tempBox);
            boxHolder.pop();
            updateClipboard(JSON.stringify(boxHolder));
          } else {
            objects.removeDict(tempBox);
            boxHolder.pop();
            updateClipboard(JSON.stringify(boxHolder));
          }
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
    case 49: //1
      keys.oneKey[0] = true;
      typeOfEntity = 'ladder'
      break;
    case 50: //2
      keys.twoKey[0] = true;
      typeOfEntity = 'trap'
      break;
    case 51: //3
      keys.threeKey[0] = true;
      typeOfEntity = 'token'
      break;
    case 52: //4
      keys.fourKey[0] = true;
      typeOfEntity = 'solid'
      break;
    case 53: //5
      keys.fiveKey[0] = true;
      typeOfEntity = 'stair'
      break;
    case 54: //6
      keys.sixKey[0] = true;
      typeOfEntity = 'background'
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
    case 49: //1
      keys.oneKey[0] = false;
      break;
    case 50: //2
      keys.twoKey[0] = false;
      break;
    case 51: //3
      keys.threeKey[0] = false;
      break;
    case 52: //4
      keys.fourKey[0] = false;
      break;
    case 53: //5
      keys.fiveKey[0] = false;
      break;
    case 54: //6
      keys.sixKey[0] = false;
      break;
  }
}

// * FUNCTIONS --------------------------------------------------------
const drawStairs = function (x1, y1, x2, y2, color) {
  console.log("drawStairs");
  const slope = (y2 - y1) / (x2 - x1);
  const w = Math.abs(x2 - x1);
  const xDir = x2 - x1 > 0 ? 1 : -1;

  let j = 0;
  for (let i = 0; i < w; i++) {
    let x = x1 + (i * xDir);
    let y = y1 + (j * xDir);

    boxHolder.push(
      {
        "width": 10,
        "height": 10,
        "initPosx": x - objects.origin.posx,
        "initPosy": y - objects.origin.posy,
        "styles": ["draw", color],
        "types": ["solid", "stair"],
      }
    );

    objects.boxHolder.push(
      new entity(10, 10, x, y, ["draw", color], ["solid", "stair", i == 0 ? "stairFirst" : (i == w - 1 ? "stairLast" : null)])
    );

    j += slope;
  }
  updateClipboard(JSON.stringify(boxHolder));
}

function animateRunner() {
  secondsPassed = totalFrames / config.fps;
  if (animationRunDelayCounter <= animationRunDelay) { animationRunDelayCounter++; } else { animationRunDelayCounter = 0; }
  if (animationRunDelayCounter == animationRunDelay) {
    for (let i = 0; i < objects.img.length; i++) {
      animate(objects.img[i], secondsPassed);
    }
  }
  return;
}

function respawn() {
  // MainLoop.stop()
  loadMap(stageID);

  detectOutOfBoundsToggle = false;
  objects.removeDict(objects.player);
  objects.player = null;

  scrollOffsetTotal.x = 0;
  scrollOffsetTotal.y = 0;
  backgroundOffset.x = 0;
  backgroundOffset.y = 400;
  canvas.style.backgroundPosition = "bottom " + backgroundOffset.y / -10 + "px right " + backgroundOffset.x / 10 + "px";


  if (!objects.player) {
    setTimeout(() => {
      objects.player = new entity(100, 200, 310, 310, ['img', 'player', 'idleR'], ['player']);
      detectOutOfBoundsToggle = true;
    }, 1000);
  }
}

function scoreUpdate(value = 0) {
  let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  ctx.font = "60px Arial";
  score += value;
  if (score < 0) { score = 0; }
  let textWidth = ctx.measureText("Score: " + score.round(1, true)).width;

  gradient.addColorStop("0", "pink");
  gradient.addColorStop("0.1", "cyan");
  gradient.addColorStop("0.5", "lightblue");
  gradient.addColorStop("1.0", "red");

  ctx.save();
  ctx.scale(1, -1);

  ctx.beginPath();
  ctx.rect(13, -73, textWidth + 8, 60);
  ctx.fillStyle = '#222222';
  ctx.fill();
  ctx.closePath();

  ctx.fillStyle = gradient;

  ctx.fillText("Score: " + score.round(1, true), 20, -20);

  if (editorMode) {
    let editorTextWidth1 = ctx.measureText("Editor Mode -- snap (use [ / ]): " + editorPrecision).width;
    let editorText2 = "Press # to change type -- "
    switch (typeOfEntity) {
      case 'ladder':
        editorText2 += " ͇1͇:͇ ͇L͇A͇D͇D͇E͇R͇, 2: TRAP, 3: TOKEN, 4: SOLID, 5: STAIRS, 6: BACKGROUND"
        break;
      case 'trap':
        editorText2 += "1: LADDER, ͇2͇:͇ ͇T͇R͇A͇P͇, 3: TOKEN, 4: SOLID, 5: STAIRS, 6: BACKGROUND"
        break;
      case 'token':
        editorText2 += "1: LADDER, 2: TRAP, ͇3͇:͇ ͇T͇O͇K͇E͇N͇, 4: SOLID, 5: STAIRS, 6: BACKGROUND"
        break;
      case 'solid':
        editorText2 += "1: LADDER, 2: TRAP, 3: TOKEN, ͇4͇:͇ ͇S͇O͇L͇I͇D͇, 5: STAIRS, 6: BACKGROUND"
        break;
      case 'stair':
        editorText2 += "1: LADDER, 2: TRAP, 3: TOKEN, 4: SOLID, ͇5̳:̳ ̳S̳T̳A̳I̳R̳S̳, 6: BACKGROUND"
        break;
      case 'background':
        editorText2 += "1: LADDER, 2: TRAP, 3: TOKEN, 4: SOLID, 5: STAIRS, ͇6͇:͇ ͇B͇A͇C͇K͇G͇R͇O̳U̳N̳D͇"
        break;
      default:
        console.log('Error: entity type not found');
        break;
    }
    let editorTextWidth2 = ctx.measureText(editorText2).width;

    let editorTextWidth = Math.max(editorTextWidth1, editorTextWidth2);

    ctx.beginPath();
    ctx.rect(13, -210, editorTextWidth + 8, 120);
    ctx.fillStyle = '#222222';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = gradient;

    ctx.fillText("Editor Mode -- snap (use [ / ]): " + editorPrecision, 20, -100);
    ctx.fillText(editorText2, 20, -160);
  }

  ctx.restore();
}

function finalizeGroundEntities(entity) {
  const imgWidth = entity.sWidth;
  const imgHeight = entity.sHeight;
  const posx = (entity.posx).round(1, true);
  const posy = (imgHeight - entity.posy - entity.height).round(1, true);
  const posxImg = (imgWidth - posx) > 0 ? posx : posx - imgWidth;
  const posyImg = (imgHeight - posy) > 0 ? posy : posy - imgHeight;

  switch (entity.mainType) {
    case 'trap':
      entity.sx = Math.random() * imgWidth;
      entity.sy = imgHeight - entity.height;
      entity.sWidth = entity.width;
      entity.sHeight = entity.height;
      break;

    case 'solid':
      entity.sx = Math.random() * imgWidth / 4;
      entity.sy = Math.random() * imgWidth / 4;
      entity.sWidth = entity.width / 2;
      entity.sHeight = entity.height / 2;
      break;

    case 'backgroundImg':
      entity.sx = 0;
      entity.sWidth = imgWidth;
      entity.sHeight = imgHeight;
      break;

    default:
      break;
  }

}

function animate(entity, secondsPassed) {
  let frames = spriteSheets[entity.imgLink][entity.animation]["frames"];

  switch (entity.mainType) {
    case 'trap':
      let height = spriteSheets[entity.imgLink][entity.animation]["sHeight"];
      entity.sx = lerp(0, frames, entity.totalTimePassed / entity.animationSpeed);
      entity.sy = height - entity.height - (oscillator(totalFrames / 40, .2, .5) * 5);
      if (entity.totalTimePassed / entity.animationSpeed >= 1) {
        entity.sx = lerp(0, frames, 0);
        entity.totalTimePassed = 0;
      } else if (entity.totalTimePassed / entity.animationSpeed <= -1) {
        entity.sx = lerp(0, frames, 0);
        entity.totalTimePassed = 0;
      }
      break;

    case 'solid':
      break;

    case 'backgroundImg':
      const tempTotalTimePassed = entity.totalTimePassed;
      if (entity.totalTimePassed.x > 0) {
        const tempLerp = lerp(5490, frames, (entity.totalTimePassed.x / 10) / entity.animationSpeed);
        const tempEntitySX = entity.sx
        for (i = 0; i < 1.05; i += .05) {
          entity.sx = lerp(tempEntitySX, tempLerp, i);
        }
      } else if (entity.totalTimePassed.x < 0) {
        const tempLerp = lerp(5490, 0, Math.abs((entity.totalTimePassed.x / 10)) / entity.animationSpeed);
        const tempEntitySX = entity.sx
        for (i = 0; i < 1.05; i += .05) {
          entity.sx = lerp(tempEntitySX, tempLerp, i);
        }
      }
      if (entity.totalTimePassed.y > 0) {
        const tempLerp = lerp(-100, frames, (entity.totalTimePassed.y / 20) / entity.animationSpeed);
        const tempEntitySY = entity.sy
        for (i = 0; i < 1.05; i += .05) {
          entity.sy = lerp(tempEntitySY, tempLerp, i);
        }
      } else if (entity.totalTimePassed.y < 0) {
        const tempLerp = lerp(-100, 0, Math.abs((entity.totalTimePassed.y / 20)) / entity.animationSpeed);
        const tempEntitySY = entity.sy
        for (i = 0; i < 1.05; i += .05) {
          entity.sy = lerp(tempEntitySY, tempLerp, i);
        }
      }
      if (entity.totalTimePassed.x / entity.animationSpeed >= 1 && entity.sx >= frames) {
        entity.sx = lerp(5490, frames, 0);
        entity.totalTimePassed.x = 0;
      } else if (entity.totalTimePassed.x / entity.animationSpeed <= -1) {
        entity.sx = lerp(5490, 0, 0);
        entity.totalTimePassed.x = 0;
      }
      if (entity.sy >= 1587) {
        entity.sy = 1587;
        entity.totalTimePassed.y = tempTotalTimePassed.y;
      }
      break;

    default:
      entity.sx += entity.sWidth;
      if (entity.sx / entity.sWidth >= frames) { entity.sx = spriteSheets[entity.imgLink][entity.animation]["sx"]; }
      break;
  }
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

const playerMovementGravity = (delta) => {
  let player;
  let pMoveVal;
  let slowMove = false;
  let wallJump = false;
  // wallJumpAllowed = true;

  try {
    player = objects.player;
    pMoveVal = player.moveValues;
  } catch (error) {
    throw new Error("Player not found");
  }

  if (infiniteJumps) { player.touchedGround = true; }

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

  const pCurMovVal = {
    x: pMoveVal.x,
    y: pMoveVal.y
  }

  for (i = 0; i < keysDown.length; i++) {
    switch (keysDown[i]) {
      case 'dKey':
        if (!player.touchedGround && playerDirection == "left") { slowMove = true; }
        pMoveVal.x += pMoveVal.speed * delta * (slowMove ? 0 : 1);
        if (Math.abs(pMoveVal.x) >= config.playerMaxSpeed) { pMoveVal.x = pCurMovVal.x; }
        if (player.touchedGround) { switchAnimation(player, 'walkR', 2); }
        playerDirection = "right";
        break;
      case 'sKey':
        player.crouched = true;
        break;
      case 'aKey':
        if (!player.touchedGround && playerDirection == "right") { slowMove = true; }
        pMoveVal.x += -pMoveVal.speed * delta * (slowMove ? 0 : 1);
        if (Math.abs(pMoveVal.x) >= config.playerMaxSpeed) { pMoveVal.x = pCurMovVal.x; }
        if (player.touchedGround) { switchAnimation(player, 'walkL', 2); }
        playerDirection = "left";
        break;
      case 'spaceKey':
        if (player.touchedGround) {
          player.touchedGround = false;
          playSound('jump');
          pMoveVal.y += config.jumpHeight * delta;

          if (!wallJump) {
            wallJumpTimer = setTimeout(() => {
              // console.log("walljump timer");
              // setTimeout(() => { MainLoop.stop(); }, 800);
              wallJumpAllowed = true;
              wallJumpTimer = null;

            }, 200);
          }
        }
      default:
        break;
    }
  }

  const friction = () => {
    if (pMoveVal.x > 1) {
      pMoveVal.x -= config.playerFriction * delta * (wallJumpFriction ? .5 : 1);
    } else if (pMoveVal.x < -1) {
      pMoveVal.x += config.playerFriction * delta * (wallJumpFriction ? .5 : 1);
    }
    else {
      pMoveVal.x = 0;
    }
  }

  const gravity = () => {
    if (pMoveVal.y < -config.playerMaxSpeed) { return; }
    if (pMoveVal.y > config.playerMaxSpeed * 2) { pMoveVal.y = pCurMovVal.y; }
    pMoveVal.y -= config.gravity * delta;
  }

  void detectCollision(player, "stairs");
  let collisionSolids = detectCollision(player, "solids");
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
    // collisionSolids = detectCollision(player, "solids");
    // console.log("walls", collisionSolids.left, collisionSolids.right);
    // console.log(collisionSolids.wallJumpLeft, collisionSolids.wallJumpRight);
    // console.log("Keys", (keys.dKey[0] ), (keys.aKey[0] ));
    if (collisionSolids.wallJumpLeft && keys.dKey[0]) {
      // console.log("wall jump 1");
      pMoveVal.y = 0;
      pMoveVal.x = 0;
      player.touchedGround = true;
      pMoveVal.x += (pMoveVal.speed * 1.1) * delta;
      // keys.dKey[0] = false;
      wallJump = true;
      playerDirection = "right";
      wallJumpAllowed = true;
      wallJumpFriction = true;
      // playSound('wallJump');
      scoreUpdate(100);
    } else if (collisionSolids.wallJumpRight && keys.aKey[0]) {
      // console.log("wall jump 2");
      pMoveVal.y = 0;
      pMoveVal.x = 0;
      player.touchedGround = true;
      pMoveVal.x += -(pMoveVal.speed * 1.1) * delta;
      // keys.aKey[0] = false;
      wallJump = true;
      playerDirection = "left";
      wallJumpAllowed = true;
      wallJumpFriction = true;
      // playSound('wallJump');
      scoreUpdate(100);
    }
  }

  player.height = player.crouched ? player.initHeight / 2 : player.initHeight;

  gravity();
  friction();

  player.move();

  if (keys.aKey[1] && !wallJump && player.touchedGround) {
    // console.log("wall jump 1");
    keys.aKey[0] = true;
    wallJumpAllowed = false;
    wallJumpFriction = false;
    if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
  }
  if (keys.dKey[1] && !wallJump && player.touchedGround) {
    // console.log("wall jump 2");
    keys.dKey[0] = true;
    wallJumpAllowed = false;
    wallJumpFriction = false;
    if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
  }
}

const detectOutOfBounds = function (entity) {
  let bounds = objects.bounds;
  if (!bounds || !detectOutOfBoundsToggle) { return "Detect Bounds Did Not Run"; }

  const moveValues = returnMoveValues(entity);

  if (
    (
      moveValues.newx + entity.width > bounds.posx &&
      moveValues.newx < bounds.posx + bounds.width &&
      entity.posy + entity.height > bounds.posy &&
      entity.posy < bounds.posy + bounds.height
    ) || (
      entity.posx + entity.width > bounds.posx &&
      entity.posx < bounds.posx + bounds.width &&
      moveValues.newy + entity.height >= bounds.posy &&
      moveValues.newy <= bounds.posy + bounds.height
    )
  ) {
    return true;
  } else {
    console.log("out of bounds");
    entity.posx = lastPos[0];
    entity.posy = lastPos[1];
    entity.moveValues.x = -lastMove[0];
    entity.moveValues.y = -lastMove[1];
    // respawn();
    // detectOutOfBoundsToggle = false;
    return false;
  }
}

const detectCollision = function (entity, checkArrayName = "solids", moveEntity = true) {
  // TODO: Remove depreciated STOPWALL & FLOOR collision detection
  delta = MainLoop.getSimulationTimestep();
  let checkArray;
  let splitHitBoxOffset = 3;
  let collision = {
    ladder: false,
    stairLeft: false,
    stairRight: false,
    stairMove: false,
    stairScroll: false,

    wallJumpRight: false,
    wallJumpLeft: false,

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
      length = length;
      if (length <= 0) { break; }
      for (let i = 0; i < checkArray.length; i++) {
        const ladder = checkArray[i];
        if (!ladder) { continue; }
        const moveValues = returnMoveValues(entity);
        if (
          (
            moveValues.newx + entity.width > ladder.posx &&
            moveValues.newx < ladder.posx + ladder.width &&
            entity.posy + entity.height > ladder.posy &&
            entity.posy < ladder.posy + ladder.height
          ) || (
            entity.posx + entity.width > ladder.currentPosx &&
            entity.posx < ladder.currentPosx + ladder.width &&
            moveValues.newy + entity.height >= ladder.posy &&
            moveValues.newy <= ladder.posy + ladder.height
          )
        ) {
          collision.ladder = true;
          if (moveEntity) {
            entity.touchedGround = false;
            if (entity.moveValues.y >= config.playerMaxSpeed) { continue; };
            if (entity.moveValues.y < 0) { entity.moveValues.y = 0; }
            entity.moveValues.y += config.playerDefaultSpeed * delta / 6;
          }
        }
      }
      if (collision.ladder) { entity.touchedLadder = true; } else { entity.touchedLadder = false; }
      break;
    case "traps":
      checkArray = objects.traps;
      length = checkArray.length;
      if (length <= 0) { break; }
      for (let i = 0; i < length; i++) {
        const trap = checkArray[i];
        if (!trap) { continue; }
        const moveValues = returnMoveValues(entity);
        if (
          (
            moveValues.newx + entity.width > trap.posx &&
            moveValues.newx < trap.posx + trap.width &&
            moveValues.newy + entity.height > trap.posy &&
            moveValues.newy < trap.posy + trap.height
          ) || (
            entity.posx + entity.width > trap.posx &&
            entity.posx < trap.currentPosx + trap.width &&
            moveValues.newy + entity.height >= trap.posy &&
            moveValues.newy <= trap.posy + trap.height
          )
        ) {
          scoreUpdate(-1000);
          if (!editorMode) {
            respawn();
          }
          playSound('death');
        }
      }
      break;
    case "tokens":
      checkArray = objects.tokens;
      length = checkArray.length;
      if (length <= 0) { break; }
      for (let i = 0; i < length; i++) {
        const token = checkArray[i];
        if (!token) { continue; }
        const moveValues = returnMoveValues(entity);
        if (
          (
            moveValues.newx + entity.width > token.posx &&
            moveValues.newx < token.posx + token.width &&
            entity.posy + entity.height > token.posy &&
            entity.posy < token.posy + token.height
          ) || (
            entity.posx + entity.width > token.posx &&
            entity.posx < token.currentPosx + token.width &&
            moveValues.newy + entity.height >= token.posy &&
            moveValues.newy <= token.posy + token.height
          )
        ) {
          switch (token.mainType) {
            case 'nextStage':
              // TODO: Add next stage token
              console.log("next stage")
              if (stageID == "stage1") {
                loadMap("stage2");
              } else if (stageID == "stage2") {
                loadMap("stage3");
              } else if (stageID == "stage3") {
                loadMap("stage4");
              }
              break;

            default:
              scoreUpdate(1000);
              if (!editorMode) {
                objects.removeDict(token);
              }
              playSound('pickUp');
              break;
          }
        }
      }
      break;
    case "stairs":
      // TODO: Remove Bouncing Stairs
      checkArray = objects.stairs;
      length = checkArray.length;
      if (objects.stairs.length <= 0) { break; }
      for (let i = 0; i < length; i++) {
        let stair = checkArray[i];
        if (!stair) { continue; }
        const moveValues = returnMoveValues(entity);
        if (
          moveValues.newx + entity.width / 2 > stair.posx &&
          moveValues.newx < stair.posx + stair.width &&
          entity.posy + entity.height > stair.posy &&
          entity.posy < stair.posy + stair.height
        ) { collision.left = true; collision.stairLeft = true; }

        if (
          moveValues.newx + entity.width > stair.posx &&
          moveValues.newx + entity.width / 2 < stair.posx + stair.width &&
          entity.posy + entity.height > stair.posy &&
          entity.posy < stair.posy + stair.height
        ) { collision.right = true; collision.stairRight = true; }

        if (
          entity.posx + entity.width + 20 > stair.posx &&
          entity.posx - 20 < stair.posx + stair.width &&
          moveValues.newy + entity.height + 20 >= stair.posy &&
          moveValues.newy + (entity.height / 2) <= stair.posy + stair.height
        ) {
          // if (stair.mainType == 'borderWallTop') { collision.borderTop = true; }
          collision.top = true;
        }

        if (collision.right || collision.left && !collision.top) { collision.stairMove = true; }

        if (moveEntity && collision.left && entity.touchedGround && !collision.top) {
          entity.moveValues.y += config.playerDefaultSpeed * delta / 4;
          wallJumpAllowed = false;
          if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
          break;
        }
        if (moveEntity && collision.right && entity.touchedGround && !collision.top) {
          entity.moveValues.y += config.playerDefaultSpeed * delta / 4;
          wallJumpAllowed = false;
          if (wallJumpTimer) { clearTimeout(wallJumpTimer); }
          break;
        }
      }
      break;
    case "solids":
      checkArray = objects.solids;
      length = checkArray.length;
      let tempScroll = {
        x: 0,
        y: 0
      }
      if (length <= 0) { break; }
      for (let i = 0; i < length; i++) {
        const solid = checkArray[i];
        if (!solid) { continue; }
        let moveValues = returnMoveValues(entity);
        if (
          moveValues.newx + entity.width / 2 > solid.posx &&
          moveValues.newx < solid.posx + solid.width &&
          entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
          entity.posy + splitHitBoxOffset < solid.posy + solid.height
        ) {

          if (solid.mainType == 'borderWallLeft') { collision.borderLeft = true; continue; }
          // if (moveEntity && !collisionStairs.stairMove) {
          entity.moveValues.x = 0;
          // }
          collision.left = true;
          // console.log('left');
        }

        if (
          moveValues.newx + entity.width > solid.posx &&
          moveValues.newx + entity.width / 2 < solid.posx + solid.width &&
          entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
          entity.posy + splitHitBoxOffset < solid.posy + solid.height
        ) {

          if (solid.mainType == 'borderWallRight') { collision.borderRight = true; continue; }
          // if (moveEntity && !collisionStairs.stairMove) {
          entity.moveValues.x = 0;
          // }
          collision.right = true;
          // console.log('right');
        }

        // moveValues = returnMoveValues(entity);
        if (
          entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
          entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
          moveValues.newy + (entity.height / 2) >= solid.posy &&
          moveValues.newy <= solid.posy + solid.height
        ) {
          entity.posy = solid.posy + solid.height;

          if (solid.mainType == 'borderWallBottom') {
            collision.borderBottom = true;
            entity.posy += entity.height / 8;
            continue;
          }
          else if (entity == objects.player) {
            if (moveEntity) {
              entity.touchedGround = true;
            }
          }
          if (moveEntity) {
            entity.moveValues.y = 0;
          }
          collision.bottom = true;
        }

        if (entity == objects.player && moveEntity) {
          if (
            entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
            entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
            moveValues.newy + entity.initHeight >= solid.posy &&
            moveValues.newy + (entity.initHeight / 2) <= solid.posy + solid.height
          ) {
            if (solid.mainType == 'borderWallTop') {
              collision.borderTop = true;
              tempScroll.y -= moveValues.totMovY > 0 ? moveValues.totMovY : 0;
              if (!entity.touchedLadder) {
                entity.posy = entity.posy + tempScroll.y;
                tempScroll.y += 1
              }
              continue;
            }
            entity.crouched = true;
            entity.height = entity.crouched ? entity.initHeight / 2 : entity.initHeight;
          }

          // if (
          //   entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
          //   entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
          //   moveValues.newy + entity.initHeight * 1.25 >= solid.posy &&
          //   moveValues.newy + (entity.initHeight / 2) <= solid.posy + solid.height
          // ) {
          //   if (solid.mainType == 'borderWallTop') {
          //     collision.borderTop = true;
          //     tempScroll.y -= moveValues.totMovY > 0 ? moveValues.totMovY : 0;
          //     entity.posy = entity.posy + tempScroll.y;
          //     continue
          //   }
          // }
        }

        if (!entity.touchedGround) {
          if (
            moveValues.newx + entity.width / 2 > solid.posx &&
            moveValues.newx - (splitHitBoxOffset * 4) < solid.posx + solid.width &&
            entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
            entity.posy + splitHitBoxOffset < solid.posy + solid.height
          ) {

            if (solid.mainType == 'borderWallLeft') { continue; }
            collision.wallJumpLeft = true;
          }

          if (
            moveValues.newx + entity.width + (splitHitBoxOffset * 4) > solid.posx &&
            moveValues.newx + entity.width / 2 < solid.posx + solid.width &&
            entity.posy + entity.height - splitHitBoxOffset > solid.posy &&
            entity.posy + splitHitBoxOffset < solid.posy + solid.height
          ) {

            if (solid.mainType == 'borderWallRight') { continue; }
            collision.wallJumpRight = true;
          }
        }


        if (
          entity.posx + entity.width - splitHitBoxOffset > solid.posx &&
          entity.posx + splitHitBoxOffset < solid.posx + solid.width &&
          moveValues.newy + entity.height >= solid.posy &&
          moveValues.newy + (entity.height / 2) <= solid.posy + solid.height
        ) {


          if (solid.mainType == 'borderWallTop') {
            entity.moveValues.y = entity.moveValues.y;
            collision.borderTop = true;
            continue;
          }
          if (moveEntity) {
            // entity.moveValues.y = 0;
            entity.posy = solid.posy - entity.height - (splitHitBoxOffset * 4);
          }
          collision.top = true;
          // console.log('top');
        }
      }


      if (moveEntity && entity.mainType == 'player') {
        const moveValues = returnMoveValues(entity);
        scrollOffsetAdjustment.x = scrollOffsetAdjustment.y = 0;
        if (collision.borderLeft || collision.borderRight) {
          scrollOffsetAdjustment.x += (moveValues.totMovX * -1.3) + tempScroll.x;
          entity.moveValues.x = 0;
          entity.posx = lastPos[0];
        }
        if (collision.borderTop || collision.borderBottom) {
          scrollOffsetAdjustment.y += (moveValues.totMovY * -1.3) + tempScroll.y;
          if (collision.borderTop && entity.crouched) {
            scrollOffsetAdjustment.y -= entity.height / 2;
            // scrollOffsetAdjustment.y = (moveValues.newy + entity.height) - solid.posy;
          }
          // entity.moveValues.y = 0;
        }
        scrollOffsetTotal.x += scrollOffsetAdjustment.x;
        scrollOffsetTotal.y += scrollOffsetAdjustment.y;

        if (scrollOffsetAdjustment.x + scrollOffsetAdjustment.y != 0) {
          backgroundOffset.x -= scrollOffsetAdjustment.x;
          backgroundOffset.y -= scrollOffsetAdjustment.y;
          // objects.backgroundImg.draw();
          canvas.style.backgroundPosition = "bottom " + backgroundOffset.y / -10 + "px right " + backgroundOffset.x / 10 + "px";
          console.log(canvas.style.backgroundPosition);
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

function makeDefaultEntities(justBorders = false) {
  const borderThickness = config.borderThickness;
  const borderColor = debugMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0)';
  const defaultEntities = [
    // !justBorders ?
    //   {
    //     "width": canvas.width, "height": canvas.height + 110,
    //     "initPosx": 0, "initPosy": -110,
    //     "styles": ["img", 'backgroundImg', 'idle'],
    //     "types": ["backgroundImg", "background", "frozen"]
    //   } : null,
    !justBorders ?
      {
        "width": 1000000, "height": 600,
        "initPosx": -600, "initPosy": -560,
        "styles": ["draw", "#92d03b"],
        "types": ["solid"]
      } : null,
    !justBorders ?
      {
        "width": 600, "height": 10000,
        "initPosx": -500, "initPosy": 0,
        "styles": ["draw", "#92d03b"],
        "types": ["solid"]
      } : null,
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
      "width": borderThickness + 700, "height": canvas.height,
      "initPosx": canvas.width - borderThickness - 700, "initPosy": 0,
      "styles": ["draw", borderColor],
      "types": ["borderWallRight", "border", "solid", "frozen"]
    },
  ];

  // On the creation of default entities, the game will check if the origin and player are created. If not, it will create them.
  if (!objects.player) {
    objects.player = new entity(100, 200, 310, 310, ['img', 'player', 'idleR'], ['player']);
  }
  if (!objects.origin) {
    objects.origin = new entity(10, 10, 0, 0, ["draw", debugMode ? "#1370df" : "rgba(0, 0, 0, 0)"], undefined);
  }
  if (!objects.bounds) {
    console.log('bounds made');
    objects.bounds = new entity(
      canvas.width - borderThickness - 700 - borderThickness + 60,
      canvas.height - borderThickness - borderThickness,
      borderThickness - 60,
      borderThickness,
      ["draw", borderColor],
      ["bounds", "frozen"]
    );
  }

  loadMap(null, false, defaultEntities);
  // objects.backgroundImg.draw();
}

function loadMap(mapID = "stage1", clearMap = true, mapArray = null) {
  void ctx.fillRect(0, 0, canvas.width, canvas.height, 'black');
  if (clearMap) {
    scrollOffsetTotal = { x: 0, y: 0 };
    let keyList = Object.keys(objects);
    for (let i = 3; i < keyList.length; i++) {
      objects[keyList[i]] = [];
    }
    objects.player = null;
    objects.origin = null;
  }

  // If the function is called with a mapArray use that instead of pulling from the map.json file
  // This is mainly used for loading the default entities
  let mapObjects = mapArray ? mapArray : map[mapID];
  let length = mapArray ? mapArray.length : Object.keys(mapObjects).length;
  let loadMapPrecision = 1;

  for (let i = 0; i < length; i++) {
    ctx.fillRect(0, 0, canvas.width, canvas.height, 'black');
    if (!mapObjects[i] || mapObjects[i]["width"] == 0 || mapObjects[i]["height"] == 0) { continue; }
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
    if (loadMap.caller.name != "makeDefaultEntities") { makeDefaultEntities(); stageID = mapID; } else { console.log("Map loaded."); }
  } catch (TypeError) {
    makeDefaultEntities();
    throw "TypeError: loadMap.caller is null, recursion check failed.\n\nMaking default entities.";
  }
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

const update = (deltaUpdate) => {
  delta = deltaUpdate;
  let player = objects.player;

  if (!player) { return; }
  try {
    lastPos = [player.posx, player.posy];
    lastMove = [player.moveValues.x, player.moveValues.y];

    playerMovementGravity(delta);
    if (
      playerMovementCheck &&
      (Math.abs(lastPos[0] - player.posx) > config.playerMaxSpeedError || Math.abs(lastPos[1] - player.posy) > config.playerMaxSpeedError)
    ) {
      console.log("Player moved too fast");
      let collision = detectCollision(player, "solids", false);
      if (collision.right) {
        player.posx = lastPos[0] - 4;
      }
      if (collision.left) {
        player.posx = lastPos[0] + 4;
      }
      if (collision.bottom) {
        player.posy = lastPos[1] + 4;
      }
      if (collision.top) {
        player.posy = lastPos[1] - 4;
      }
    }
    playerMovementCheck = true;
  } catch (TypeError) {
    // throw TypeError
  }
  return;
}

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  totalFrames++;
  for (let i = 0; i < objects.traps.length; i++) {
    objects.traps[i].totalTimePassed += 1;
  }
  animateRunner();

  // objects.backgroundImg.draw();

  for (let i = 0; i < objects.frozen.length; i++) {
    objects.frozen[i].draw();
  }

  for (let i = 0; i < objects.nonFrozen.length; i++) {
    if (objects.nonFrozen[i].mainType == "player" || objects.nonFrozen[i].mainType == "backgroundImg") { continue; }
    objects.nonFrozen[i].move();
    objects.nonFrozen[i].draw();
  }
  scoreUpdate(-1);
  if (objects.player) {
    objects.player.draw();
  }
}

const end = () => {
  // ctx.clearRecdt(0, 0, canvas.width, canvas.height);
}

// async function dfs(timeStamp) {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   secondsPassed = (timeStamp - oldTimeStamp) / 1000;
//   oldTimeStamp = timeStamp;
//   totalTimePassed.total += secondsPassed;

//   const frameUpdateLoop = async () => {
//     for (let i = 0; i < objects.traps.length; i++) {
//       objects.traps[i].totalTimePassed += secondsPassed;
//     }
//     objects.backgroundImg.totalTimePassed -= (scrollOffsetAdjustment.x / 300).round(.001);
//     animateRunner(secondsPassed);
//     frameUpdate();
//     await null;
//   };

//   const playerUpdateLoop = async () => {
//     playerUpdate(secondsPassed);
//     await null;
//   };

//   frameUpdateLoop();
//   playerUpdateLoop();

//   // console.log(secondsPassed);
//   // window.requestAnimationFrame((timeStamp) => { update(timeStamp) });
// }

window.startUp = () => {
  loadMap();
  canvas.style.display = "none";
  scoreUpdate(10000);
  MainLoop.setUpdate(update).setDraw(draw).setEnd(end);
  MainLoop.setMaxAllowedFPS(config.fps);
};