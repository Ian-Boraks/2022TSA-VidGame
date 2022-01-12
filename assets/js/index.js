let objects = {
  player: null,
  solids: [],
  ladders: [],
  slopes: [],
  frozen: [],
  nonFrozen: [],
};

const config = {
  gravityEnabled: true,
  gravity: .1,
  jumpHeight: 2,
  defaultPlayerSpeed: 7,
  scrollDistance: 300,
}

let scrollOffset = {
  x: 0,
  y: 0
}

let [moveUp, moveLeft, moveDown, moveRight] = [false, false, false, false];
let touchedGround = false;
let lastMove = [];


// * ON LOAD --------------------------------------------------------
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
        this.imgLink = styles[1];
        this.img = new Image();
        this.img.src = this.imgLink;
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
        context.drawImage(this.img, this.posx, this.posy, this.width, this.height);
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
        if (scrollOffset.x == 0 && scrollOffset.y == 0) { return; }
        this.posx += scrollOffset.x;
        this.posy += scrollOffset.y;
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
      moveRight = true;
      break;
    case 83: //s
      moveDown = true;
      break;
    case 65: //a
      moveLeft = true;
      break;
    case 87: //w
      moveUp = true;
      break;
    case 13: //enter
      keyEnter = true;
      // testScript();
      break;
  }
}

function onKeyUp(event) {
  let keyCode = event.keyCode;

  switch (keyCode) {
    case 68: //d
      moveRight = false;
      break;
    case 83: //s
      moveDown = false;
      break;
    case 65: //a
      moveLeft = false;
      break;
    case 87: //w
      moveUp = false;
      break;
    case 13: //enter
      keyEnter = false;
      break;
  }
}

// * FUNCTIONS --------------------------------------------------------
function noop() { /* No operation function */ }

function frameUpdate() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (config.gravityEnabled) { playerMovementGravity(); } else { playerMovementNoGravity(); }
  for (let i = 0; i < objects.nonFrozen.length; i++) {
    objects.nonFrozen[i].move();
    objects.nonFrozen[i].draw();
  }
  for (let i = 0; i < objects.frozen.length; i++) {
    objects.frozen[i].draw();
  }
}

function playerMovementGravity() {
  objects.player.moveValues.amount = objects.player.moveValues.speed;

  if (objects.player.moveValues.y > -2) {
    objects.player.moveValues.y -= config.gravity;
  }

  if (moveDown) {
    objects.player.height = objects.player.initHeight / 2;
  } else {
    objects.player.height = objects.player.initHeight;
  }

  if (moveLeft && moveRight) {
    objects.player.moveValues.x = 0;
  } else if (moveLeft) {
    objects.player.moveValues.x = -1;
  } else if (moveRight) {
    objects.player.moveValues.x = 1;
  } else if (touchedGround) {
    if (objects.player.moveValues.x > .1) {
      objects.player.moveValues.x -= .15;
    } else if (objects.player.moveValues.x < -.1) {
      objects.player.moveValues.x += .15;
    } else {
      objects.player.moveValues.x = 0;
    }
  }

  if (touchedGround) {
    // TODO: Wall Jumps
    // FIXME: Can jump into the top of objects.solids and get stuck
    if (moveUp) {
      touchedGround = false;
      objects.player.moveValues.y = config.jumpHeight;
    }
  }

  if (detectCollision(objects.player, objects.solids).top) {
    objects.player.height = objects.player.initHeight / 2;
  }

  scrollOffset.x = scrollOffset.y = 0;

  let colliding = detectCollision(objects.player, objects.solids);
  if (colliding.collision) {
    if (colliding.border && !detectCollision(objects.player, objects.solids).stopWall) {
      // TODO: Make bottom/top scrolling work
      if (colliding.borderLeft) {
        scrollOffset.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1;
      }
      if (colliding.borderRight) {
        scrollOffset.x = (objects.player.moveValues.x * objects.player.moveValues.amount) * -1;
      }
    }
    // FIXME: Make this not jittery
    if (colliding.x) {
      objects.player.posx = objects.player.lastPos[0];
      objects.player.moveValues.x = (objects.player.moveValues.x * -1);
    }
    if (colliding.y) {
      touchedGround = colliding.top ? false : true;
      objects.player.posy = objects.player.lastPos[1];
    }
  }
}

function playerMovementNoGravity() {
  if (moveUp || moveDown || moveLeft || moveRight) {
    objects.player.moveValues.amount = objects.player.moveValues.speed;
  } else {
    objects.player.moveValues.amount = 0;
    return;
  }

  objects.player.moveValues.x = 0;
  objects.player.moveValues.y = 0;

  if ((moveRight != moveLeft) && (moveUp != moveDown)) {
    if (moveRight && moveUp) {
      objects.player.moveValues.x = 1 / Math.sqrt(2);
      objects.player.moveValues.y = -1 / Math.sqrt(2);

    } else if (moveRight && moveDown) {
      objects.player.moveValues.x = 1 / Math.sqrt(2);
      objects.player.moveValues.y = 1 / Math.sqrt(2);

    } else if (moveLeft && moveUp) {
      objects.player.moveValues.x = -1 / Math.sqrt(2);
      objects.player.moveValues.y = -1 / Math.sqrt(2);

    } else {
      objects.player.moveValues.x = -1 / Math.sqrt(2);
      objects.player.moveValues.y = 1 / Math.sqrt(2);

    }
  } else if (moveRight && !moveLeft) {
    objects.player.moveValues.x = 1;
  } else if (moveLeft && !moveRight) {
    objects.player.moveValues.x = -1;
  } else if (moveUp && !moveDown) {
    objects.player.moveValues.y = -1;
  } else if (moveDown && !moveUp) {
    objects.player.moveValues.y = 1;
  } else {
    objects.player.moveValues.x = 0;
    objects.player.moveValues.y = 0;
  }

  lastPos = [objects.player.posx, objects.player.posy];
  lastMove = [objects.player.moveValues.x, objects.player.moveValues.y];
  let colliding = detectCollision(objects.player)

  if (colliding.x) {
    objects.player.moveValues.x = 0;
    objects.player.posx = lastPos[0];
  }
  if (colliding.bottom) {
    objects.player.moveValues.y = 0;
    objects.player.posy = lastPos[1];
  }

}

let detectCollision = function (entity, checkArray = []) {
  let collision = {
    collision: false,
    bottom: false,
    top: false,
    right: false,
    left: false,
    x: false,
    y: false,

    stopWall: false,

    border: false,
    borderTop: false,
    borderBottom: false,
    borderRight: false,
    borderLeft: false,
    borderX: false,
    borderY: false,
  };

  for (let i = 0; i < checkArray.length; i++) {
    if (
      entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width / 2 > checkArray[i].posx &&
      entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
      entity.posy + entity.height > checkArray[i].posy &&
      entity.posy < checkArray[i].posy + checkArray[i].height
    ) {
      if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
      if (checkArray[i].mainType == 'borderWallLeft') { collision.borderLeft = true; }
      collision.left = true;
    }

    if (
      entity.posx + (entity.moveValues.x * entity.moveValues.amount) + entity.width > checkArray[i].posx &&
      entity.posx + (entity.moveValues.x * entity.moveValues.amount) < checkArray[i].posx + checkArray[i].width &&
      entity.posy + entity.height > checkArray[i].posy &&
      entity.posy < checkArray[i].posy + checkArray[i].height
    ) {
      if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
      if (checkArray[i].mainType == 'borderWallRight') { collision.borderRight = true; }
      collision.right = true;
    }

    if (
      entity.posx + entity.width > checkArray[i].posx &&
      entity.posx < checkArray[i].posx + checkArray[i].width &&
      entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height / 2 >= checkArray[i].posy &&
      entity.posy + (entity.moveValues.y * entity.moveValues.amount) <= checkArray[i].posy + checkArray[i].height
    ) {
      if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
      if (checkArray[i].mainType == 'borderWallBottom') { collision.borderBottom = true; }
      collision.bottom = true;
    }

    if (
      entity.posx + entity.width > checkArray[i].posx &&
      entity.posx < checkArray[i].posx + checkArray[i].width &&
      entity.posy + (entity.moveValues.y * entity.moveValues.amount) + entity.height >= checkArray[i].posy &&
      entity.posy + (entity.moveValues.y * entity.moveValues.amount) + (entity.height / 2) <= checkArray[i].posy + checkArray[i].height
    ) {
      if (checkArray[i].mainType == 'stopWall') { collision.stopWall = true; }
      if (checkArray[i].mainType == 'borderWallTop') { collision.borderTop = true; }
      collision.top = true;
    }
  }
  collision.y = collision.bottom || collision.top;
  collision.x = collision.right || collision.left;
  collision.collision = collision.x || collision.y;

  collision.borderX = collision.borderLeft || collision.borderRight;
  collision.borderY = collision.borderTop || collision.borderBottom;
  collision.border = collision.borderX || collision.borderY;

  // console.log(collision);
  return collision;
}

makePlayer = function () {
  console.log('makePlayer');

  new entity(62 * 2, 104 * 2, canvas.width / 2, canvas.height / 2, ['img', '/assets/img/fort.png'], ['player']);

  makePlayer = noop();
}

makeBorder = function () {
  console.log('makeBorder');

  let borderThickness = 40;
  let borderColor = 'rgba(0, 0, 0, 0)';
  // let borderColor = '#9370db';

  new entity(canvas.width, borderThickness, 0, 0, ['draw', borderColor], ['borderWallBottom', 'solid', 'frozen']);
  new entity(canvas.width, borderThickness, 0, canvas.height - borderThickness, ['draw', borderColor], ['borderWallTop', 'solid', 'frozen']);
  new entity(borderThickness, canvas.height, 0, 0, ['draw', borderColor], ['borderWallLeft', 'solid', 'frozen']);
  new entity(borderThickness, canvas.height, canvas.width - borderThickness, 0, ['draw', borderColor], ['borderWallRight', 'solid', 'frozen']);

  makeBorder = noop();
}

makeBox = function () {
  console.log('makeBox');

  new entity(120, 120, 600, 0, ['draw', '#f370db']);
  new entity(120, 20, 800, 120, ['draw', '#f370db']);
  new entity(120, 20, 1000, 220, ['draw', '#f370db']);
  new entity(120, 20, 1400, 120, ['draw', '#f370db']);
  new entity(1000000, 40, 0, 0, ['draw', '#92d03b'], ['floor', 'solid']);
  new entity(120, 10000, -80, 0, ['draw', '#92d03b'], ['stopWall', 'solid']);

  makeBox = noop();
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

window.testScript = function () {
  console.log('test');
  makePlayer();
  makeBorder();
  makeBox();
  updateInterval = setInterval(frameUpdate, 16);
}