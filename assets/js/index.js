// ! Feel free to remove any of these and add your own functions

let c; // Canvas
let ctx; // Canvas context

let mainPlayer;
let entities = [];

var keyW = false;
var keyA = false;
var keyS = false;
var keyD = false;


// * ON LOAD --------------------------------------------------------
c = document.getElementById("game-canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
ctx = c.getContext("2d");

window.addEventListener('DOMContentLoaded', function () {
  // ! This is an example of how to use the sound function
  // ! Now when you click the screen the funny sound will play
  var gameWindow = document.getElementById('game-window');
  gameWindow.addEventListener('click', function () {
    playSound('trombone');
  });
});

soundManager.onready(function () {
  // ! All sound effects need to be loaded with this function before they can be played
  soundManager.createSound({
    id: 'trombone',
    url: '/assets/sound/FX68GWY-funny-trombone-slide-accent.mp3'
  });
});

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

function onKeyDown(event) {
  var keyCode = event.keyCode;
  switch (keyCode) {
    case 68: //d
      keyD = true;
      break;
    case 83: //s
      keyS = true;
      break;
    case 65: //a
      keyA = true;
      break;
    case 87: //w
      keyW = true;
      break;
  }
}

function onKeyUp(event) {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 68: //d
      keyD = false;
      break;
    case 83: //s
      keyS = false;
      break;
    case 65: //a
      keyA = false;
      break;
    case 87: //w
      keyW = false;
      break;
  }
}

// * CLASSES ----------------------------------------------------------
class entity {
  constructor(height, width, initPosx, initPosy, color) {
    this.height = height;
    this.width = width;
    this.currentPosx = initPosx;
    this.currentPosy = initPosy;
    this.color = color;
    this.moveValues = {
      x: 0,
      y: 0,
      amount: 0
    };
    this.currentAnimation = null;
  }

  draw() {
    ctx.beginPath();
    ctx.rect(
      this.currentPosx,
      this.currentPosy,
      this.width,
      this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  move() {
    if (this.moveValues[1] == 0) {
      return;
    }
    this.currentPosx += this.moveValues.x * this.moveValues.amount;
    this.currentPosy += this.moveValues.y * this.moveValues.amount;
  }
}

// * FUNCTIONS --------------------------------------------------------
function frameUpdate() {
  ctx.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < entities.length; i++) {
    entities[i].move(entities[i].moveVector, entities[i].moveAmount);
    entities[i].draw();
  }
}

function playerMovement() {
  if (keyW == true) {
    entities[0].moveValues.y = 10;
  }
  if (keyA == true) {
    entities[0].moveValues.x = 10;
  }
  if (keyS == true) {
    entities[0].moveValues.x = -10;
  }
  if (keyD == true) {
    entities[0].moveValues.y = -10;
  }
  if (keyW == false && keyA == false && keyS == false && keyD == false) {
    entities[0].moveValues.amount = 0;
    entities[0].moveValues.x = 0;
    entities[0].moveValues.y = 0;
  } else {
    entities[0].moveValues.amount = 1;
  }
}

function playerCollision(params) {

}

function enemyMovement(params) {

}

function enemyCollision(params) {

}

window.makePlayer = function () {
  mainPlayer = new entity(10, 10, c.width/2, c.height/2, '#9370db');
  npc1 = new entity(10, 10, 10, 10, '#3366ff');
  entities.push(mainPlayer);
  entities.push(npc1);
}

window.testScript = function () {
  makePlayer();
  updateInterval = setInterval(frameUpdate, 16);
  playerMoveInterval = setInterval(playerMovement, 16);
}



// ? Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
function playSound(sound) {
  soundManager.play(sound);
}