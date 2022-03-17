// * SHARED CLASSES --------------------------------------------------
class Vec2 {

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  Lerp(start = new Vec2(0, 0), end = new Vec2(0, 0), speed = 1) {
    this.x = Lerp(start.x, end.x, speed);
    this.y = Lerp(start.y, end.y, speed);
  }

  Add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }
}


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
  SCROLL: 'Scroll',
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
  BLUE: 'blue',
  RED: 'red',
  TRANSPARENT: 'rgba(0, 0, 0, 0)',
  OVERLAY: 'rgba(0, 0, 0, 0.6)',
  DEBUG_GREY: 'rgba(128, 128, 128, .2)',
  DEBUG_PINK: 'rgba(255, 0, 255, .2)',
};

const Config = {
  GRAVITY: .5,
  MAX_VELOCITY: new Vec2(10, 20),
  MIN_VELOCITY: .001,
  DEBUG: false,
  ANIMATION_SPEED: 10,
  MAX_FPS: 60,
  RATIO_W: 1920,
  RATIO_H: 1080,
}


// * SHARED VARIABLES -------------------------------------------------
// TODO (ROOT): Change ROOT once off of own domain
var ROOT = window.location.pathname;
ROOT = '/';

var pressedKeys = [];

var gameObjects = [];
var scrollBorders = [];
var gameWorld = [];

var scrollAmount = new Vec2(0, 0);
var scrollTotal = new Vec2(0, 0);

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


// * SOUND FUNCTIONS --------------------------------------------------
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
    url: ROOT + 'assets/sound/CHIPTUNE_The_Old_Tower_Inn.mp3',
    onfinish: function () { playSound('backgroundMusic1'); },
    volume: 70
  });
  soundManager.createSound({
    id: 'backgroundMusic1',
    url: ROOT + 'assets/sound/CHIPTUNE_Minstrel_Dance.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic2'); }, 2000) },
    volume: 70
  });
  soundManager.createSound({
    id: 'backgroundMusic2',
    url: ROOT + 'assets/sound/CHIPTUNE_The_Bards_Tale.mp3',
    onfinish: function () { setTimeout(() => { playSound('backgroundMusic'); }, 2000) },
    volume: 70
  });
  soundManager.createSound({
    id: 'trombone',
    url: ROOT + 'assets/sound/FX68GWY-funny-trombone-slide-accent.mp3',
    autoLoad: false,
  });
  soundManager.createSound({
    id: 'pickUp',
    url: ROOT + 'assets/sound/mixkit-arcade-mechanical-bling-210.wav',
    volume: 50
  });
  soundManager.createSound({
    id: 'jump',
    url: ROOT + 'assets/sound/mixkit-player-jumping-in-a-video-game-2043.wav',
    volume: 30
  });
  soundManager.createSound({
    id: 'wallJump',
    url: ROOT + 'assets/sound/mixkit-video-game-spin-jump-2648.wav',
    volume: 50,
    autoLoad: false
  });
  soundManager.createSound({
    id: 'death',
    url: ROOT + 'assets/sound/163442__under7dude__man-dying.wav',
    volume: 100,
  });
});


// * UTILITY LISTENERS ------------------------------------------------
window.addEventListener('resize', () => {
  // This resizes the canvas to fit the window while maintaining the aspect ratio set in the config dictionary
  let canvasScale = Math.min(innerWidth / Config.RATIO_W, innerHeight / Config.RATIO_H);
  canvas.style.width = (canvas.width = Math.floor(Config.RATIO_W * canvasScale)) + "px";
  canvas.style.height = (canvas.height = Math.floor(Config.RATIO_H * canvasScale)) + "px";

  canvas.width = Config.RATIO_W;
  canvas.height = Config.RATIO_H;

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

const createGO = (GO) => {
  let tempGO;
  switch (GO.class) {
    case "SolidRect":
      tempGO = new SolidRect(
        new Vec2(eval(GO.pos[0]), eval(GO.pos[1])),
        new Vec2(eval(GO.size[0]), eval(GO.size[1])),
        eval(GO.color),
        GO.fixed
      );
      break;
    case "ScrollBorder":
      tempGO = new ScrollBorder(
        new Vec2(eval(GO.pos[0]), eval(GO.pos[1])),
        new Vec2(eval(GO.size[0]), eval(GO.size[1])),
        GO.fixed
      );
      scrollBorders.push(tempGO);
      break;
    case "BackgroundRect":
      tempGO = new BackgroundRect(
        new Vec2(eval(GO.pos[0]), eval(GO.pos[1])),
        new Vec2(eval(GO.size[0]), eval(GO.size[1])),
        eval(GO.color),
        GO.fixed
      );
      break;
    default:
      console.error(`${GO.class} is not a valid class`);
      break;
  }
  return;
}