var listener = new window.keypress.Listener();

// UP KEYS -------------------------------------------------------------
listener.register_combo({
  "keys": "a",
  "on_keydown": () => {

    pressedKeys.push(KEY.A);
  },
  "on_keyup": () => {

    pressedKeys.indexOf(KEY.A) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.A), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "left",
  "on_keydown": () => {

    pressedKeys.push(KEY.LEFT);
  },
  "on_keyup": () => {

    pressedKeys.indexOf(KEY.LEFT) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.LEFT), 1) : null;
  },
  prevent_repeat: true
});


// DOWN KEYS -------------------------------------------------------------
listener.register_combo({
  "keys": "s",
  "on_keydown": () => {
    pressedKeys.push(KEY.S);
    player.crouch(true);
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.S) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.S), 1) : null;
    player.crouch(false);
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "down",
  "on_keydown": () => {
    pressedKeys.push(KEY.DOWN);
    player.crouch(true);
    player.isCrouched = true;
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.DOWN) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.DOWN), 1) : null;
    player.crouch(false);
    player.isCrouched = false;
  },
  prevent_repeat: true
});


// RIGHT KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "d",
  "on_keydown": () => {
    pressedKeys.push(KEY.D);
  },
  "on_keyup": () => {

    pressedKeys.indexOf(KEY.D) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.D), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "right",
  "on_keydown": () => {
    pressedKeys.push(KEY.RIGHT);
  },
  "on_keyup": () => {

    pressedKeys.indexOf(KEY.RIGHT) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.RIGHT), 1) : null;
  },
  prevent_repeat: true
});


// UP KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "space",
  "on_keydown": () => {
    pressedKeys.push(KEY.SPACE);
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.SPACE) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.SPACE), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "w",
  "on_keydown": () => {
    pressedKeys.push(KEY.W);
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.W) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.W), 1) : null;
  },
  prevent_repeat: true
});

listener.register_combo({
  "keys": "up",
  "on_keydown": () => {
    pressedKeys.push(KEY.UP);
  },
  "on_keyup": () => {
    pressedKeys.indexOf(KEY.UP) > -1 ? pressedKeys.splice(pressedKeys.indexOf(KEY.UP), 1) : null;
  },
  prevent_repeat: true
});

// RESET KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "r",
  "on_keyup": () => {
    player.respawn();
  },
  prevent_repeat: true,
  is_exclusive: true
});

// RESTART KEYS ------------------------------------------------------------
listener.register_combo({
  "keys": "ctrl r",
  "on_keydown": () => {
    document.location.reload();
  },
  prevent_repeat: true,
  is_exclusive: true
});

listener.register_combo({
  "keys": "ctrl shift r",
  "on_keydown": () => {
    document.location.reload(true);
  },
  prevent_repeat: true,
  is_exclusive: true,
  is_unordered: true
});
