// * SHARED ENUMERATORS -----------------------------------------------
const GameObjectType = {
  NONE: null,
  SOLID: 'Solid',
  BACKGROUND: 'Background',
  TRAP: 'Trap',
  PLAYER: 'Player',
  TOKEN: 'Token',
  WATERFALL: 'Waterfall',
  TEXT: 'Text',
};

const KEY = {
  BACKSPACE: 8,
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  SPACE: 32,
  PAGEUP: 33,
  PAGEDOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  INSERT: 45,
  DELETE: 46,
  ZERO: 48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
  A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
  TILDA: 192
};

const Colors = {
  transparent: 'rgba(0, 0, 0, 0)',
};


// * SHARED CLASSES --------------------------------------------------
class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  Lerp(start = new Vector2(0, 0), end = new Vector2(0, 0), speed = 1) {
    this.x = Lerp(start.x, end.x, speed);
    this.y = Lerp(start.y, end.y, speed);
  }

  Add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }
}


// * SHARED VARIABLES -------------------------------------------------
// TODO: Change ROOT once off of own domain
var ROOT = window.location.pathname;
ROOT = '/';

var pressedKeys = [];

const config = {
  gravity: .5,
  maxVelocity: 2,
  minVelocity: .001,
  debug: true,
  maxFPS: 60,
  defWidth: 1920,
  defHeight: 1080,
}

var gameObjects = [];

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

var map = {};
$.getJSON(
  {
    async: false,
    url: ROOT + 'assets/json/map.json',
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

var spriteSheets = {};
$.getJSON(
  {
    async: false,
    url: ROOT + 'assets/json/sprite-sheet.json',
    success: function (data) {
      spriteSheets = data;
    }
  }
)


// * UTILITY LISTENERS ------------------------------------------------
window.addEventListener('resize', () => {
  // This resizes the canvas to fit the window while maintaining the aspect ratio set in the config dictionary
  let canvasScale = Math.min(innerWidth / config.defWidth, innerHeight / config.defHeight);
  canvas.style.width = (canvas.width = Math.floor(config.defWidth * canvasScale)) + "px";
  canvas.style.height = (canvas.height = Math.floor(config.defHeight * canvasScale)) + "px";

  canvas.width = config.defWidth;
  canvas.height = config.defHeight;

  // After the canvas is resized, this re-draws the canvas elements
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gameObjects.forEach((x, i) => {
    x.draw();
  });
  console.log("Resized canvas");
});

window.addEventListener('DOMContentLoaded', function () { console.log("DOM loaded"); });

$(window).focus(function () { MainLoop.start(); });
$(window).blur(function () { MainLoop.stop(); });


// * UTILITY FUNCTIONS ------------------------------------------------
const noop = () => { /* No operation function */ }

const rectIntersect = (obj1, obj2) => {
  // collisionTypes = {
  //   rightCollision: false,
  //   leftCollision: false,
  //   topCollision: false,
  //   bottomCollision: false,
  // }

  let x1 = obj1.pos.x;
  let y1 = obj1.pos.y;
  let w1 = obj1.w;
  let h1 = obj1.h;

  let x2 = obj2.pos.x;
  let y2 = obj2.pos.y;
  let w2 = obj2.w;
  let h2 = obj2.h;

  // Check x and y for overlap
  if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2) {
    return false;
  }
  return true;
}

const updateClipboard = (newClip) => {
  navigator.clipboard.writeText(newClip).then(function () {
    /* clipboard successfully set */
  }, function () {
    /* clipboard write failed */
  });
}

const returnMoveValues = (entity) => {
  return {
    x: entity.moveValues.x,
    y: entity.moveValues.y,
    amount: entity.moveValues.amount,

    totMovX: entity.moveValues.x * entity.moveValues.amount,
    totMovY: entity.moveValues.y * entity.moveValues.amount,

    newx: entity.posx + (entity.moveValues.x * entity.moveValues.amount),
    newy: entity.posy + (entity.moveValues.y * entity.moveValues.amount)
  }
}

const Lerp = (start, end, speed) => {
  return start + (end - start) * speed;
}

const oscillator = (time, frequency = 1, amplitude = 1, phase = 0, offset = 0) => {
  return Math.sin(time * frequency * Math.PI * 2 + phase * Math.PI * 2) * amplitude + offset;
}

const getRandom = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.random() * (max - min) + min; //The maximum is exclusive and the minimum is inclusive
}