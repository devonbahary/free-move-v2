//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

Game_Player.prototype.moveByInput = function() {
  if (this.canMove()) { // previously !this.isMoving() && this.canMove()
    var direction = this.getInputDirection();
    if (direction > 0) {
      $gameTemp.clearDestination();
    } else if ($gameTemp.isDestinationValid()){
      var x = $gameTemp.destinationX();
      var y = $gameTemp.destinationY();
      direction = this.findDirectionTo(x, y);
    }
    if (direction > 0) {
      this.executeMove(direction);
    }
  }
};

Game_Player.prototype.getInputDirection = function() {
  return Input.dir8;
};

const _Game_Player_applyCollision = Game_Player.prototype.applyCollision;
Game_Player.prototype.applyCollision = function(target) {
  _Game_Player_applyCollision.call(this, target);
  if (
    this.canStartLocalEvents() &&
    target.isEvent &&
    target.isTriggerIn([0, 1]) // action button, player touch
  ) {
    this.turnTowardCharacter(target);
    target.start();
  }
};