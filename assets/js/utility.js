// * UTILITY FUNCTIONS ------------------------------------------------
const noop = () => { /* No operation function */ }

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

const lerp = (start, end, speed) => {
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