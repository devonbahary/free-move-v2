//-----------------------------------------------------------------------------
// Game_Player
//
// The game object class for the player. It contains event starting
// determinants and map scrolling functions.

import { first } from "lodash";
import { DIRECTIONS } from "../constants";
import { RectangleHitbox } from "../utils/Hitbox";

const EVENT_TRIGGER_REACH = 0.5;

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

const _Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
  _Game_Player_update.call(this, sceneActive);
  if (sceneActive) this.processInputCommands();
};

Game_Player.prototype.processInputCommands = function() {
  if (!this.canMove()) return;
  if (this.triggerButtonAction()) return;
  // ..add other inputs
};

Game_Player.prototype.updateNonmoving = function(wasMoving) {
  return; // there is nothing we want to update in nonmoving that we do not in isMoving
};

Game_Player.prototype.getInputDirection = function() {
  return Input.dir8;
};

Game_Player.prototype.checkEventTriggerHere = function(triggers) {
  if (!this.canStartLocalEvents()) return;

  const eventTriggerPath = new RectangleHitbox(this, this.direction(), EVENT_TRIGGER_REACH);

  const entities = $gameMap.entitiesInBoundingBox(eventTriggerPath, this)
    .filter(e => e.isEvent && e.isTriggerIn(triggers))
    .sort((a, b) => this.distanceFromCenterWith(a) - this.distanceFromCenterWith(b));
  
  const closestEventWithTrigger = first(entities);
  if (closestEventWithTrigger) closestEventWithTrigger.start();
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