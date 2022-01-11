// ! Feel free to remove any of these and add your own functions

let c; // Canvas
let context; // Canvas context

let mainPlayer;
let dynamics = [];
let statics = [];
let noScroll = [];

var gravityEnabled = true;
var gravity = .1;
var touchedGround = false;
var scrollDistance = 300;
var scrollOffset = {
  x: 0,
  y: 0
}

var moveUp = false;
var moveLeft = false;
var moveDown = false;
var moveRight = false;
var lastMove = [];


// * ON LOAD --------------------------------------------------------
c = document.getElementById("game-canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;

context = c.getContext("2d");
context.translate(0, c.height);
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
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.imgLink = imgLink;
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
    if (scrollOffset.x == 0 && scrollOffset.y == 0) {
      return;
    }
    this.currentPosx += scrollOffset.x;
    this.currentPosy += scrollOffset.y;
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
    if (scrollOffset.x == 0 && scrollOffset.y == 0) {
      return;
    }
    this.currentPosx += scrollOffset.x;
    this.currentPosy += scrollOffset.y;
  }
}

// * FUNCTIONS --------------------------------------------------------
function frameUpdate() {
  // context.save();
  // context.translate(dynamics[0].currentPosx - c.width / 2, dynamics[0].currentPosy - c.height / 2);
  context.clearRect(0, 0, c.width, c.height);
  if (gravityEnabled) { playerMovementGravity(); } else { playerMovementNoGravity(); }
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
    dynamics[0].moveValues.y -= gravity;
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
    //   TODO: Wall Jumps
    // if ((moveUp != moveRight) && (moveUp != moveLeft)) {
    //   if (moveRight && moveUp) {
    //     dynamics[0].moveValues.x = 1 / Math.sqrt(2);
    //     dynamics[0].moveValues.y = -1 / Math.sqrt(2);
    //   } else {
    //     dynamics[0].moveValues.x = 1 / Math.sqrt(2);
    //     dynamics[0].moveValues.y = 1 / Math.sqrt(2);
    //   }
    // } else if (moveUp) {
    //   touchedGround = false;
    //   dynamics[0].moveValues.y = 1;
    // }
    if (moveUp) {
      touchedGround = false;
      dynamics[0].moveValues.y = 2;
    }
  }

  lastPos = [dynamics[0].currentPosx, dynamics[0].currentPosy];
  lastMove = [dynamics[0].moveValues.x, dynamics[0].moveValues.y];
  let colliding = collision(dynamics[0]);

  scrollOffset.x = scrollOffset.y = 0;
  if (colliding.border) {
    if (colliding.top) {
      scrollOffset.y = (dynamics[0].moveValues.y * dynamics[0].moveValues.amount) * -1;
    }
    if (colliding.bottom) {
      scrollOffset.y = (dynamics[0].moveValues.y * dynamics[0].moveValues.amount) * -1;
    }
    if (colliding.left) {
      scrollOffset.x = (dynamics[0].moveValues.x * dynamics[0].moveValues.amount) * -1;
    }
    if (colliding.right) {
      scrollOffset.x = (dynamics[0].moveValues.x * dynamics[0].moveValues.amount) * -1;
    }
  }
  if (colliding.x) {
    dynamics[0].moveValues.x = 0;
    dynamics[0].currentPosx = lastPos[0];
  }
  if (colliding.y) {
    touchedGround = true;
    dynamics[0].moveValues.y = 0;
    dynamics[0].currentPosy = lastPos[1];
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
  let colliding = collision(dynamics[0])

  if (colliding.x) {
    dynamics[0].moveValues.x = 0;
    dynamics[0].currentPosx = lastPos[0];
  }
  if (colliding.y) {
    dynamics[0].moveValues.y = 0;
    dynamics[0].currentPosy = lastPos[1];
  }

}

function enemyMovement(params) {

}

var collision = function (object) {
  let colliding =
  {
    x: false,
    y: false,
    border: false,
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
      if (statics[i].name == 'borderWallRight') { colliding.right = colliding.border = true; }
      if (statics[i].name == 'borderWallLeft') { colliding.left = colliding.border = true; }
      colliding.x = true;
    }

    if (
      object.currentPosx + object.width > statics[i].currentPosx &&
      object.currentPosx < statics[i].currentPosx + statics[i].width &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) + object.height >= statics[i].currentPosy &&
      object.currentPosy + (object.moveValues.y * object.moveValues.amount) <= statics[i].currentPosy + statics[i].height
    ) {
      if (statics[i].name == 'borderWallTop') { colliding.top = colliding.border = true; }
      if (statics[i].name == 'borderWallBottom') { colliding.bottom = colliding.border = true; }
      colliding.y = true;
    }

  }
  return colliding;
}

function makePlayer() {
  console.log('makePlayer');
  mainPlayer = new dynamicObjImg(62 * 2, 104 * 2, c.width / 2, c.height / 2, '/assets/img/fort.png');
  dynamics.push(mainPlayer);
}

function makeBorder() {
  console.log('makeBorder');

  let noScrollStatics = [
    stopWallLeft = new staticObjRect(10, 10000, 0, 0, '#92d03b', 'stopWallLeft'),
    borderWallBottom = new staticObjRect(c.width, 10, 0, 0, '#92303b', 'borderWallBottom'),
    borderWallTop = new staticObjRect(c.width, 10, 0, c.height - 10, '#2370db', 'borderWallTop'),
    borderWallLeft = new staticObjRect(10, c.height, 0, 0, '#0ffafb', 'borderWallLeft'),
    borderWallRight = new staticObjRect(10, c.height, c.width - 10, 0, '#9370db', 'borderWallRight')
  ];

  statics = statics.concat(noScrollStatics);
  noScroll = noScroll.concat(noScrollStatics);
}

function makeBox() {
  console.log('makeBox');
  statics = statics.concat(
    box = new staticObjRect(120, 120, c.width / 2, 0, '#f370db'),
    floor = new staticObjRect(1000000, 10, -50000, 20, '#92d03b', 'floor')
  );
}

function scrollFrame() {
  if (player.x + scrollDistance > offset.x + c.width) {
    offset.x = player.x + scrollDistance - c.width
  }
  if (player.x - scrollDistance < offset.x && scrollDistance < offset.x) {
    offset.x = player.x - scrollDistance
  }
  if (player.y - scrollDistance - player.height < offset.y && c.height - scrollDistance < offset.y) {
    offset.y = player.y - scrollDistance - player.height * 2;
  }
  if (c.height - scrollDistance < offset.y) {
    offset.y = c.height - scrollDistance
  }
  if (player.y + scrollDistance > offset.y + c.height) {
    offset.y = player.y + scrollDistance - c.height
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
  makeBox();
  updateInterval = setInterval(frameUpdate, 16);
}