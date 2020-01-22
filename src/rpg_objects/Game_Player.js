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

Game_Player.prototype.updateDashing = function() {
  // was previously an early return here when isMoving() that prevented in-stride change
  if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled()) {
      this._dashing = this.isDashButtonPressed() || $gameTemp.isDestinationValid();
  } else {
      this._dashing = false;
  }
};

Game_Player.prototype.getInputDirection = function() {
  return Input.dir8;
};

Game_Player.prototype.onCollisionWith = function(collider) {
  Game_CharacterBase.prototype.onCollisionWith.call(this, collider);
  if (
    collider.isEvent &&
    collider.isTriggerIn([ 1, 2 ]) && // player touch, event touch
    this.canStartLocalEvents()
  ) {
    this.turnTowardCharacter(collider);
    collider.start();
  }
}