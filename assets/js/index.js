let canvas; // Canvas
let context; // Canvas context

let dynamics = [];
let statics = [];
let noScroll = [];

var config = {
  gravityEnabled: true,
  gravity: .1,
  jumpHeight: 2,
  defaultPlayerSpeed: 7,
  scrollDistance: 300,
  scrollOffset: {
    x: 0,
    y: 0
  }
}

var moveUp = false;
var moveLeft = false;
var moveDown = false;
var moveRight = false;
var touchedGround = false;
var lastMove = [];


// * ON LOAD --------------------------------------------------------
canvas = document.getElementById("game-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

context = canvas.getContext("2d");
context.translate(0, canvas.height);
context.scale(1, -1);

window.addEventListener('DOMContentLoaded', function () {
  // ! This is an example of how to use the sound function
  // ! Now when you click the screen the funny sound will play
  // var gameWindow = document.getElementById('game-window');
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
class dynamicObjRect {
  constructor(width, height, initPosx, initPosy, color, name = null) {
    this.width = width;
    this.height = height;
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.color = color;
    this.moveValues = {
      x: 0,
      y: 0,
      amount: 0,
      speed: 7
    };
    this.currentAnimation = null;
    this.name = name;
  }

  draw() {
    context.beginPath();
    context.rect(
      this.currentPosx,
      this.currentPosy,
      this.width,
      this.height);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
  }

  move() {
    if (this.moveValues[1] == 0) {
      return;
    }
    this.currentPosx += this.moveValues.x * this.moveValues.amount;
    this.currentPosy += this.moveValues.y * this.moveValues.amount;
  }
}

class dynamicObjImg {
  constructor(width, height, initPosx, initPosy, imgLink, name = null) {
    this.width = width;
    this.height = height;
    this.initHeight = height;
    this.initWidth = width;
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.imgLink = imgLink;
    this.moveValues = {
      x: 0,
      y: 0,
      amount: 0,
      speed: config.defaultPlayerSpeed
    };
    this.currentAnimation = null;
    this.name = name;
  }

  draw() {
    let image = new Image();
    image.src = this.imgLink;
    context.drawImage(image, this.currentPosx, this.currentPosy, this.width, this.height);
  }

  move() {
    if (this.moveValues[1] == 0) {
      return;
    }
    this.currentPosx += this.moveValues.x * this.moveValues.amount;
    this.currentPosy += this.moveValues.y * this.moveValues.amount;
  }
}

class staticObjRect {
  constructor(width, height, initPosx, initPosy, color, name = null) {
    this.width = width;
    this.height = height;
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.color = color;
    this.currentAnimation = null;
    this.name = name;
  }

  draw() {
    context.beginPath();
    context.rect(
      this.currentPosx,
      this.currentPosy,
      this.width,
      this.height);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
  }

  move() {
    if (config.scrollOffset.x == 0 && config.scrollOffset.y == 0) {
      return;
    }
    this.currentPosx += config.scrollOffset.x;
    this.currentPosy += config.scrollOffset.y;
  }
}

class staticObjImg {
  constructor(width, height, initPosx, initPosy, imgLink, name = null) {
    this.width = width;
    this.height = height;
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.imgLink = imgLink;
    this.currentAnimation = null;
    this.name = name;
  }

  draw() {
    let image = new Image();
    image.src = this.imgLink;
    context.drawImage(image, this.currentPosx, this.currentPosy, this.width, this.height);
  }

  move() {
    if (config.scrollOffset.x == 0 && config.scrollOffset.y == 0) {
      return;
    }
    this.currentPosx += config.scrollOffset.x;
    this.currentPosy += config.scrollOffset.y;
  }
}

// * FUNCTIONS --------------------------------------------------------
function noop() { /* No operation function */ }

function frameUpdate() {
  // context.save();
  // context.translate(dynamics[0].currentPosx - c.width / 2, dynamics[0].currentPosy - c.height / 2);
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (config.gravityEnabled) { playerMovementGravity(); } else { playerMovementNoGravity(); }
  for (let i = 0; i < dynamics.length; i++) {
    dynamics[i].move();
    dynamics[i].draw();
  }
  for (let i = 0; i < statics.length; i++) {
    if (!(noScroll.indexOf(statics[i]) >= 0)) { statics[i].move(); }
    statics[i].draw();
  }
  // context.restore();
}

function onKeyDown(event) {
  var keyCode = event.keyCode;
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
  var keyCode = event.keyCode;

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

function playerMovementGravity() {
  dynamics[0].moveValues.amount = dynamics[0].moveValues.speed;

  if (dynamics[0].moveValues.y > -2) {
    dynamics[0].moveValues.y -= config.gravity;
  }

  if (moveDown) {
    dynamics[0].height = dynamics[0].initHeight / 2;
  } else {
    dynamics[0].height = dynamics[0].initHeight;
  }

  if (moveLeft && moveRight) {
    dynamics[0].moveValues.x = 0;
  } else if (moveLeft) {
    dynamics[0].moveValues.x = -1;
  } else if (moveRight) {
    dynamics[0].moveValues.x = 1;
  } else if (touchedGround) {
    if (dynamics[0].moveValues.x > .1) {
      dynamics[0].moveValues.x -= .15;
    } else if (dynamics[0].moveValues.x < -.1) {
      dynamics[0].moveValues.x += .15;
    } else {
      dynamics[0].moveValues.x = 0;
    }
  }

  if (touchedGround) {
    // TODO: Wall Jumps
    // FIXME: Can jump into the top of statics and get stuck
    if (moveUp) {
      touchedGround = false;
      dynamics[0].moveValues.y = config.jumpHeight;
    }
  }

  if (detectCollision(dynamics[0]).head) {
    dynamics[0].height = dynamics[0].initHeight / 2;
  }

  let colliding = detectCollision(dynamics[0]);

  lastPos = [dynamics[0].currentPosx, dynamics[0].currentPosy];
  lastMove = [dynamics[0].moveValues.x, dynamics[0].moveValues.y];


  config.scrollOffset.x = config.scrollOffset.y = 0;
  if (colliding.border) {
    // TODO: Make bottom/top scrolling work
    // if (colliding.top) {
    //   scrollOffset.y = (dynamics[0].moveValues.y * dynamics[0].moveValues.amount) * -1;
    //   // dynamics[0].moveValues.y = -.01;
    // }
    // if (colliding.bottom) {

    //   scrollOffset.y = (dynamics[0].moveValues.y * dynamics[0].moveValues.amount) * -1;
    //   // dynamics[0].moveValues.y = .01;
    // }
    if (colliding.left) {
      config.scrollOffset.x = (dynamics[0].moveValues.x * dynamics[0].moveValues.amount) * -1;
      // dynamics[0].moveValues.x = .01;
    }
    if (colliding.right) {
      config.scrollOffset.x = (dynamics[0].moveValues.x * dynamics[0].moveValues.amount) * -1;
      // dynamics[0].moveValues.x = -.01;
    }
  }
  if (colliding.x) {
    dynamics[0].moveValues.x = 0;
    dynamics[0].currentPosx = lastPos[0];
  }
  if (colliding.y) {
    touchedGround = colliding.head ? false : true;
    dynamics[0].moveValues.y = 0;
    dynamics[0].currentPosy = lastPos[1];
  }
  if (colliding.stopWall) {
    dynamics[0].moveValues.x = -1 * lastMove[0];
    setTimeout(() => { // This makes it so the user is not "bounced" off a stop wall
      dynamics[0].moveValues.x = 0;
      dynamics[0].moveValues.amount = 0;
    }, 0);
  }
}

function playerMovementNoGravity() {
  if (moveUp || moveDown || moveLeft || moveRight) {
    dynamics[0].moveValues.amount = dynamics[0].moveValues.speed;
  } else {
    dynamics[0].moveValues.amount = 0;
    return;
  }

  dynamics[0].moveValues.x = 0;
  dynamics[0].moveValues.y = 0;

  if ((moveRight != moveLeft) && (moveUp != moveDown)) {
    if (moveRight && moveUp) {
      dynamics[0].moveValues.x = 1 / Math.sqrt(2);
      dynamics[0].moveValues.y = -1 / Math.sqrt(2);

    } else if (moveRight && moveDown) {
      dynamics[0].moveValues.x = 1 / Math.sqrt(2);
      dynamics[0].moveValues.y = 1 / Math.sqrt(2);

    } else if (moveLeft && moveUp) {
      dynamics[0].moveValues.x = -1 / Math.sqrt(2);
      dynamics[0].moveValues.y = -1 / Math.sqrt(2);

    } else {
      dynamics[0].moveValues.x = -1 / Math.sqrt(2);
      dynamics[0].moveValues.y = 1 / Math.sqrt(2);

    }
  } else if (moveRight && !moveLeft) {
    dynamics[0].moveValues.x = 1;
  } else if (moveLeft && !moveRight) {
    dynamics[0].moveValues.x = -1;
  } else if (moveUp && !moveDown) {
    dynamics[0].moveValues.y = -1;
  } else if (moveDown && !moveUp) {
    dynamics[0].moveValues.y = 1;
  } else {
    dynamics[0].moveValues.x = 0;
    dynamics[0].moveValues.y = 0;
  }

  lastPos = [dynamics[0].currentPosx, dynamics[0].currentPosy];
  lastMove = [dynamics[0].moveValues.x, dynamics[0].moveValues.y];
  let colliding = detectCollision(dynamics[0])

  if (colliding.x) {
    dynamics[0].moveValues.x = 0;
    dynamics[0].currentPosx = lastPos[0];
  }
  if (colliding.feet) {
    dynamics[0].moveValues.y = 0;
    dynamics[0].currentPosy = lastPos[1];
  }

}

function enemyMovement(params) {

}

var detectCollision = function (object) {
  let collision =
  {
    x: false,
    y: false,
    feet: false,
    head: false,
    border: false,
    borderX: false,
    borderY: false,
    stopWall: false,
    left: false,
    right: false,
    top: false,
    bottom: false
  };

  for (let i = 0; i < statics.length; i++) {
    if (
      object.currentPosx + (object.moveValues.x * object.moveValues.amount) + object.width > statics[i].currentPosx &&
      object.currentPosx + (object.moveValues.x * object.moveValues.amount) < statics[i].currentPosx + statics[i].width &&
      object.currentPosy + object.height > statics[i].currentPosy &&
      object.currentPosy < statics[i].currentPosy + statics[i].height
    ) {
      if (statics[i].name == 'stopWall') { collision.stopWall = true; }
      if (statics[i].name == 'borderWallRight') { collision.right = collision.border = true; }
      if (statics[i].name == 'borderWallLeft') { collision.left = collision.border = true; }
      collision.x = true;
    }

    if (
      object.currentPosx + object.width > statics[i].currentPosx &&
      object.currentPosx < statics[i].currentPosx + statics[i].width &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) + object.height / 2 >= statics[i].currentPosy &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) <= statics[i].currentPosy + statics[i].height
    ) {
      if (statics[i].name == 'stopWall') { collision.stopWall = true; }
      if (statics[i].name == 'borderWallTop') { collision.top = collision.border = true; }
      if (statics[i].name == 'borderWallBottom') { collision.bottom = collision.border = true; }
      collision.feet = true;
    }

    if (
      object.currentPosx + object.width > statics[i].currentPosx &&
      object.currentPosx < statics[i].currentPosx + statics[i].width &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) + object.height >= statics[i].currentPosy &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) + (object.height / 2) <= statics[i].currentPosy + statics[i].height
    ) {
      collision.head = true;
    }
  }
  collision.y = collision.feet || collision.head;
  collision.borderX = collision.left || collision.right;
  collision.borderY = collision.top || collision.bottom;
  return collision;
}

makePlayer = function () {
  console.log('makePlayer');
  dynamics.push(
    new dynamicObjImg(62 * 2, 104 * 2, canvas.width / 2, canvas.height / 2, '/assets/img/fort.png')
  );
  makePlayer = noop();
}

makeBorder = function () {
  console.log('makeBorder');

  let borderThickness = 40;
  let borderColor = 'rgba(0, 0, 0, 0)';
  // let borderColor = '#9370db';

  let noScrollStatics = [
    new staticObjRect(canvas.width, borderThickness, 0, 0, borderColor, 'borderWallBottom'),
    new staticObjRect(canvas.width, borderThickness, 0, canvas.height - borderThickness, borderColor, 'borderWallTop'),
    new staticObjRect(borderThickness, canvas.height, 0, 0, borderColor, 'borderWallLeft'),
    new staticObjRect(borderThickness, canvas.height, canvas.width - borderThickness, 0, borderColor, 'borderWallRight')
  ];

  statics = statics.concat(noScrollStatics);
  noScroll = noScroll.concat(noScrollStatics);
  makeBorder = noop();
}

makeStatics = function () {
  console.log('makeBox');
  statics = statics.concat(
    new staticObjRect(120, 120, 600, 0, '#f370db'),
    new staticObjRect(120, 20, 800, 120, '#f370db'),
    new staticObjRect(120, 20, 1000, 220, '#f370db'),
    new staticObjRect(120, 20, 1400, 120, '#f370db'),
    new staticObjRect(1000000, 40, 0, 0, '#92d03b', 'floor'),
    new staticObjRect(120, 10000, -80, 0, '#92d03b', 'stopWall')
  );
  makeStatics = noop();
}

function scrollFrame() {
  if (player.x + config.scrollDistance > offset.x + canvas.width) {
    offset.x = player.x + config.scrollDistance - canvas.width
  }
  if (player.x - config.scrollDistance < offset.x && config.scrollDistance < offset.x) {
    offset.x = player.x - config.scrollDistance
  }
  if (player.y - config.scrollDistance - player.height < offset.y && canvas.height - config.scrollDistance < offset.y) {
    offset.y = player.y - config.scrollDistance - player.height * 2;
  }
  if (canvas.height - config.scrollDistance < offset.y) {
    offset.y = canvas.height - config.scrollDistance
  }
  if (player.y + config.scrollDistance > offset.y + canvas.height) {
    offset.y = player.y + config.scrollDistance - canvas.height
  }
}

function playSound(sound) {
  // ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
  soundManager.play(sound);
}

window.testScript = function () {
  console.log('test');
  makePlayer();
  makeBorder();
  makeStatics();
  updateInterval = setInterval(frameUpdate, 16);
}