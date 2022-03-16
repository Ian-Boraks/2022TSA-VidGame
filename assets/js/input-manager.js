var listener = new window.keypress.Listener();

// UP KEYS -------------------------------------------------------------
listener.register_combo({
  "keys": "a",
  "on_keydown": () => {
    pressedKeys.push(KEY.A);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.setupSprite('idleL');
    pressedKeys.indexOf(KEY.A) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.A), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "left", // ! NOTE: This key is being treated as a duplicate of "a"
  "on_keydown": () => {
    pressedKeys.push(KEY.A);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.setupSprite('idleL');
    pressedKeys.indexOf(KEY.A) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.A), 1) : null;
  },
  prevent_repeat: true
});


// DOWN KEYS -------------------------------------------------------------
listener.register_combo({
  "keys": "s",
  "on_keydown": () => {
    pressedKeys.push(KEY.S);
    player.isCrouched = true;
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.isCrouched = false;
    pressedKeys.indexOf(KEY.S) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.S), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "down", // ! NOTE: This key is being treated as a duplicate of "s"
  "on_keydown": () => {
    pressedKeys.push(KEY.S);
    player.isCrouched = true;
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.isCrouched = false;
    pressedKeys.indexOf(KEY.S) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.S), 1) : null;
  },
  prevent_repeat: true
});


// RIGHT KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "d",
  "on_keydown": () => {
    pressedKeys.push(KEY.D);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.setupSprite('idleR');
    pressedKeys.indexOf(KEY.D) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.D), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "right", // ! NOTE: This key is being treated as a duplicate of "d"
  "on_keydown": () => {
    pressedKeys.push(KEY.D);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.setupSprite('idleR');
    pressedKeys.indexOf(KEY.D) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.D), 1) : null;
  },
  prevent_repeat: true
});


// UP KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "space",
  "on_keydown": () => {
    pressedKeys.push(KEY.SPACE);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.SPACE) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.SPACE), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "w", // ! NOTE: This key is being treated as a duplicate of "space"
  "on_keydown": () => {
    pressedKeys.push(KEY.SPACE);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.SPACE) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.SPACE), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "up", // ! NOTE: This key is being treated as a duplicate of "space"
  "on_keydown": () => {
    pressedKeys.push(KEY.SPACE);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.SPACE) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.SPACE), 1) : null;
  },
  prevent_repeat: true
});

// RESET KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "r", // ! NOTE: This key is being treated as a duplicate of "space"
  "on_keydown": () => {
    pressedKeys.push(KEY.R);
    pressedKeys = [... new Set(pressedKeys)];
  },
  "on_keyup": () => {
    player.respawn();
    pressedKeys.indexOf(KEY.R) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.R), 1) : null;
  },
  prevent_repeat: true
});