const config = {
  gravityEnabled: true,
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

let keys = {
  dKey: false,
  sKey: false,
  aKey: false,
  spaceKey: false,
};

let lastMove = [];
let lastPos = [];

let backgroundMusicPlaying = false;


// * ON LOAD --------------------------------------------------------
// alert("To use the editor, press enter.\nEditor controls:\nClick+Drag to make solid\nShift+Click+Drag to make ladder\nPress enter again to exit and to have map changes output to console\n\n\nGame Controls:\nSpace to jump\nA to move left\nD to move right\nS to crouch");

const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

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

  context.translate(0, canvas.height);
  context.scale(1, -1);

  if (objects.borders.length != 0) {
    objects.borders.forEach(
      border => {
        // console.log(border);
        objects.borders = objects.borders.filterArray(border);
        objects.frozen = objects.frozen.filterArray(border);
        objects.solids = objects.solids.filterArray(border);
      }
    );
    makeBorder();
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
  testScript();
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
    if (types.indexOf('border') > -1) { objects.borders.push(this); }

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
      keys.aKey = true;
      break;
    case 87: //w
      keys.wKey = true;
      break;
    case 13: //enter
      keys.enterKey = true;
      editorMode = !editorMode;
      alert(editorMode ? "Editor Mode is: on" : "Editor Mode is: off");
      window.dispatchEvent(new Event('resize'));
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
      let length = boxHolder.length;
      if (editorMode && length > 0) {
        if (keys.ctrlKey && boxHolder[length - 1]['types'][0] == 'solid') {
          boxHolder.pop();
          objects.solids.pop();
          objects.nonFrozen.pop();
          console.log('removed solid');
          break;
        } else if (keys.ctrlKey && boxHolder[length - 1]['types'][0] == 'ladder') {
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
      keys.ctrlKey = true;
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
function noop() { /* No operation function */ }

function frameUpdate() {
  context.clearRect(0, 0, canvas.width, canvas.height);
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
  if (!keys.sKey) { player.crouched = false; }

  for (let i = 0; i < keysDown.length; i++) {
    switch (keysDown[i]) {
      case 'dKey':
        moveValues.x = 1;
        if (player.touchedGround) { switchAnimation(player, 'walkR', 2); }
        playerDirection = 'right';
        break;
      case 'sKey':
        player.crouched = true;
        break;
      case 'aKey':
        moveValues.x = -1;
        if (player.touchedGround) { switchAnimation(player, 'walkL', 2); }
        playerDirection = 'left';
        break;
      case 'spaceKey':
        if (player.touchedGround) {
          // TODO: Wall Jumps
          // playSound('trombone');
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

let detectCollision = function (entity, checkArray = [], moveEntity = true) {
  // TODO: Remove depreciated STOPWALL & FLOOR collision detection
  // FIXME: 
  let splitHitBoxOffset = 3;
  let collision = {
    ladder: false,
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

  // console.log(collision);
  return collision;
}

makePlayer = function () {
  if (!objects.player) {
    new entity(100, 200, 310, 310, ['img', 'player', 'idleR'], ['player']);
  }
  if (!objects.origin) {
    objects.origin = new entity(10, 10, 0, 0, ["draw", "#23f"], ["solid"]);
  }
}

makeBorder = function () {
  let borderThickness = config.borderThickness;
  let borderColor = 'rgba(0, 0, 0, 0)';
  // let borderColor = 'rgba(255, 255, 255, 0.5)';

  new entity(canvas.width, borderThickness, 0, 0, ['draw', borderColor], ['borderWallBottom', 'border', 'solid', 'frozen']);
  new entity(canvas.width, borderThickness, 0, canvas.height - borderThickness, ['draw', borderColor], ['borderWallTop', 'border', 'solid', 'frozen']);
  new entity(borderThickness - 60, canvas.height, 0, 0, ['draw', borderColor], ['borderWallLeft', 'border', 'solid', 'frozen']);
  new entity(borderThickness, canvas.height, canvas.width - borderThickness, 0, ['draw', borderColor], ['borderWallRight', 'border', 'solid', 'frozen']);
  context.font = "16px Arial";
  context.fillStyle = "#0095DD";
  context.fillText("Score: " + 2, 100, 200);
}

function loadMap(mapID = "init") {
  objects = {
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
  makeBorder();
  makePlayer();
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

window.testScript = function () {
  console.log('test');
  loadMap();
  updateInterval = setInterval(frameUpdate, 16);
}