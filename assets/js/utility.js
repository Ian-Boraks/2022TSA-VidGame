// * SHARED ENUMERATORS -----------------------------------------------
const GameObjectType = {
  None: null,
  Solid: 'Solid',
  Background: 'Background',
  Trap: 'Trap',
  Player: 'Player',
  Token: 'Token',
  Waterfall: 'Waterfall',
  Text: 'Text',
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

window.addEventListener('DOMContentLoaded', function () {
  console.log("DOM loaded");
});


// * UTILITY FUNCTIONS ------------------------------------------------
const noop = () => { /* No operation function */ }

const rectIntersect = (obj1, obj2) => {
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

Number.prototype.round = (num, roundUp = false) => {
  if (roundUp) {
    return Math.ceil(this / num) * num;
  } else {
    return Math.round(this / num) * num;
  }
}

Object.prototype.getKeysByValue = (selection) => {
  // console.log(
  //   Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)))
  // );
  return Object.keys(Object.fromEntries(Object.entries(this).filter((element) => element[1][0] == selection)));
}

Array.prototype.filterArray = (value) => {
  return this.filter(function (ele) {
    return ele != value;
  });
}

Array.prototype.removeArray = (what) => {
  const index = this.indexOf(what)
  if (index > -1) { this.splice(index, 1); }
};

Object.prototype.removeDict = (what) => {
  let keyList = Object.keys(this);
  if (this == objects) {
    keyList.removeArray("player");
    keyList.removeArray("origin");
    keyList.removeArray("bounds");
    keyList.removeArray("backgroundImg")
  }
  for (let i = 0; i < keyList.length; i++) {
    this[keyList[i]].removeArray(what);
  }
};

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