//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

import { first } from "lodash";
import { 
  isDownDirection,
  isUpDirection,
  isLeftDirection,
  isRightDirection, 
} from "../utils/directions";
import Vector from "../utils/Vector";
import { DIRECTIONS, GRAVITATIONAL_CONSTANT } from "../constants";

Game_CharacterBase.DEFAULT_WIDTH = Number(PluginManager.parameters('FreeMove')['character width']) || 1;
Game_CharacterBase.DEFAULT_HEIGHT = Number(PluginManager.parameters('FreeMove')['character height']) || 1;


Object.defineProperties(Game_CharacterBase.prototype, {
  _x: { get: function() { return (this._realX + (1 - this.width) / 2).round(); }},
  _y: { get: function() { return (this._realY + (1 - this.height)).round(); }},
  x1: { get: function() { return this._x; }},
  x0: { get: function() { return (this._x + this.width / 2).round(); }},
  x2: { get: function() { return (this._x + this.width).round(); }},
  y1: { get: function() { return this._y; }},
  y0: { get: function() { return (this._y + this.height / 2).round(); }},
  y2: { get: function() { return (this._y + this.height).round(); }},
  acceleration: { get: function() { return this.force.divide(this.mass); }}, // F = ma
  deceleration: { get: function() {
    const forceOfGravity = new Vector(GRAVITATIONAL_CONSTANT, GRAVITATIONAL_CONSTANT, GRAVITATIONAL_CONSTANT);
    const frictionalCoefficient = $gameMap.frictionalCoefficientAt(); // TODO: add pos args
    const friction = forceOfGravity.multiply(frictionalCoefficient);
    return friction;
  }},
  velocity: { get: function() { 
    const velocityOfMomentum = this.momentum.divide(this.mass);
    const attemptedMovement = velocityOfMomentum.add(this.acceleration); 
    return attemptedMovement.subtractMagnitude(this.deceleration);
  }},
});

const Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_initMembers.call(this);
  
  this.isCharacter = true;
  this.mass = 1;
  this._realZ = 0; // height above ground (used for jumping), and displayed via the y-axis
  
  this.width = Game_CharacterBase.DEFAULT_WIDTH;
  this.height = Game_CharacterBase.DEFAULT_HEIGHT;

  this.momentum = new Vector();
  this.resetForce();

  this._heading = this._direction;
};

Game_CharacterBase.prototype.resetForce = function() {
  this.force = new Vector();
};

Game_CharacterBase.prototype.applyForce = function(force) {
  this.force = this.force.add(force);
};

Game_CharacterBase.prototype.isMoving = function() {
  return this.velocity.planar().length;
};

const _Game_CharacterBase_setDirection = Game_CharacterBase.prototype.setDirection;
Game_CharacterBase.prototype.setDirection = function(d) {
  _Game_CharacterBase_setDirection.call(this, d);
  if (!this.isDirectionFixed() && d) this._heading = d;
};

// TODO: this breaks jump as a movement command
Game_CharacterBase.prototype.jumpHeight = function() {
  var th = $gameMap.tileHeight();
  return th * this._realZ;
};

Game_CharacterBase.prototype.update = function() {
  this.updateAnimation();
  this.updateMove();
};

Game_CharacterBase.prototype.updateAnimation = function() {
  if (this.isMoving()) {
    this.updateAnimationCountMoving();
  } else {
    this.updateAnimationCountNonMoving();
    this.updateStop();
  }
  if (this._animationCount < this.animationWait()) return;
  this.updatePattern();
  this._animationCount = 0;
};

// ? TODO: will realMoveSpeed() be the determinant?
Game_CharacterBase.prototype.animationWait = function() {
  return (9 - this.realMoveSpeed()) * 3;
};

Game_CharacterBase.prototype.updateAnimationCountMoving = function() {
  if (this.hasWalkAnime()) this._animationCount += 1.5;
  this.resetStopCount();
};

Game_CharacterBase.prototype.updateAnimationCountNonMoving = function() {
  if (this.hasStepAnime() || !this.isOriginalPattern()) this._animationCount++;
};

Game_CharacterBase.prototype.updateMove = function() {
  this._realX = (this._realX + this.movementXThisFrame()).round();
  this._realY = (this._realY + this.movementYThisFrame()).round();
  this._realZ = Math.max(0, (this._realZ + this.velocity.z).round());

  this.momentum = this.velocity.multiply(this.mass);
  this.resetForce();
};

Game_CharacterBase.prototype.movementXThisFrame = function() {
  const attemptedX = this.velocity.x;
  if (!attemptedX) return 0;

  let x1, x2;
  if (attemptedX > 0) {
    x1 = this.x2;
    x2 = this.x2 + attemptedX;
  } else if (attemptedX < 0) {
    x1 = this.x1 + attemptedX;
    x2 = this.x1;
  }

  const collision = first($gameMap.collisionsInBoundingBox(x1, x2, this.y1, this.y2, this));
  if (!collision) return attemptedX;
  
  let successX;
  if (attemptedX > 0) successX = collision.x1 - this.x2;
  else if (attemptedX < 0) successX = collision.x2 - this.x1;
  return successX.subtractMagnitude(0.0001);
};

Game_CharacterBase.prototype.movementYThisFrame = function() {
  const attemptedY = this.velocity.y;
  if (!attemptedY) return 0;

  let y1, y2;
  if (attemptedY > 0) {
    y1 = this.y2;
    y2 = this.y2 + attemptedY;
  } else if (attemptedY < 0) {
    y1 = this.y1 + attemptedY;
    y2 = this.y1;
  }

  const collision = first($gameMap.collisionsInBoundingBox(this.x1, this.x2, y1, y2, this));
  if (!collision) return attemptedY;
  
  let successY;
  if (attemptedY > 0) successY = collision.y1 - this.y2;
  else if (attemptedY < 0) successY = collision.y2 - this.y1;
  return successY.subtractMagnitude(0.0001);
};

Game_CharacterBase.prototype.moveStraight = function(d) {
  this.updateDirection(d);

  const forceMagnitudeToMaxSpeed = this.forceMagnitudeToMaxSpeed();
  if (!forceMagnitudeToMaxSpeed) return;
  
  let dx, dy;
  if (isLeftDirection(d)) dx = -forceMagnitudeToMaxSpeed;
  else if (isRightDirection(d)) dx = forceMagnitudeToMaxSpeed;
  if (isUpDirection(d)) dy = -forceMagnitudeToMaxSpeed;
  else if (isDownDirection(d)) dy = forceMagnitudeToMaxSpeed;

  if (dx && dy) { // diagonal distance should not exceed straight line distance
    dx = dx / Math.sqrt(2);
    dy = dy / Math.sqrt(2);
  }

  this.applyForce(new Vector(dx, dy));
  //     this.increaseSteps();
};

Game_CharacterBase.prototype.forceMagnitudeToMaxSpeed = function() {
  const accelerationToMaxSpeed = this.distancePerFrame() - this.velocity.planar().length;
  if (accelerationToMaxSpeed <= 0) return 0;
  return accelerationToMaxSpeed * this.mass; // F = ma 
};

Game_CharacterBase.prototype.updateDirection = function(dir) {
  if (this._heading === dir) return; // new direction is the change in heading

  switch (this._direction) {
    case DIRECTIONS.DOWN:
      if (isUpDirection(dir)) this.setDirection(DIRECTIONS.UP);
      else if (isLeftDirection(dir)) this.setDirection(DIRECTIONS.LEFT);
      else if (isRightDirection(dir)) this.setDirection(DIRECTIONS.RIGHT);
      break;
    case DIRECTIONS.LEFT:
      if (isRightDirection(dir)) this.setDirection(DIRECTIONS.RIGHT);
      else if (isUpDirection(dir)) this.setDirection(DIRECTIONS.UP);
      else if (isDownDirection(dir)) this.setDirection(DIRECTIONS.DOWN);
      break;
    case DIRECTIONS.RIGHT:
      if (isLeftDirection(dir)) this.setDirection(DIRECTIONS.LEFT);
      else if (isUpDirection(dir)) this.setDirection(DIRECTIONS.UP);
      else if (isDownDirection(dir)) this.setDirection(DIRECTIONS.DOWN);
      break;
    case DIRECTIONS.UP:
      if (isDownDirection(dir)) this.setDirection(DIRECTIONS.DOWN);
      else if (isLeftDirection(dir)) this.setDirection(DIRECTIONS.LEFT);
      else if (isRightDirection(dir)) this.setDirection(DIRECTIONS.RIGHT);
      break;
  }

  this._heading = dir;
};