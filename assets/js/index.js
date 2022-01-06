// ! Feel free to remove any of these and add your own functions

window.addEventListener('DOMContentLoaded', function () {
  // ! This is an example of how to use the sound function
  // ! Now when you click the screen the funny sound will play
  var gameWindow = document.getElementById('game-window');
  gameWindow.addEventListener('click', function () { 
    playSound('trombone');
  });
});

function playerMovement(params) {
  
}

function playerCollision(params) {

}

function enemyMovement(params) {

}

function enemyCollision(params) {

}

// * Modified from: https://stackoverflow.com/questions/9419263/how-to-play-audio
function playSound(sound) {
  soundManager.play(sound);
}

soundManager.onready(function () {
  soundManager.createSound({
    id: 'trombone',
    url: '/assets/sound/FX68GWY-funny-trombone-slide-accent.mp3'
  });

  // playSound('trombone');
});