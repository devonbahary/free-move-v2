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
  isDiagonal, 
} from "../utils/directions";
import Vector from "../utils/Vector";
import { DIRECTIONS, GRAVITATIONAL_CONSTANT, GRAVITATIONAL_FORCE } from "../constants";
import { RectangleHitbox } from "../utils/Hitbox";

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
  z: { get: function() { return this._realZ; }},
  acceleration: { get: function() { 
    const velocityOfMomentum = this.velocityOfMomentum;
    const accelerationDueToForce = this.force.divide(this.mass); // F = ma

    // friction can reduce or zero-out attempted movement, but not reverse it
    const attemptedMovement = velocityOfMomentum.add(accelerationDueToForce); 

    const oppositionalVector = new Vector(-Math.sign(attemptedMovement.x), -Math.sign(attemptedMovement.y));
    const frictionalCoefficient = this.isGrounded ? $gameMap.frictionalCoefficientAt() : 0; // TODO: add pos args
    const friction = oppositionalVector.multiply(frictionalCoefficient * GRAVITATIONAL_CONSTANT);

    const netAcceleration = accelerationDueToForce.add(friction);
    const movementWithFriction = velocityOfMomentum.add(netAcceleration);

    // if friction would reverse the intended direction, zero-out movement in that direction
    if (Math.sign(attemptedMovement.x) !== Math.sign(movementWithFriction.x)) netAcceleration.x = -velocityOfMomentum.x;
    if (Math.sign(attemptedMovement.y) !== Math.sign(movementWithFriction.y)) netAcceleration.y = -velocityOfMomentum.y;

    return netAcceleration.add(GRAVITATIONAL_FORCE); // gravity acts always
  }}, 
  accelerationToMaxSpeed: { get: function() { return Math.max(0, this.distancePerFrame() - this.velocity.planar().length); }},
  velocity: { get: function() { return this.velocityOfMomentum.add(this.acceleration); }},
  velocityOfMomentum: { get: function() { return this.momentum.divide(this.mass); }},
  isGrounded: { get: function() { return this._realZ <= 0; }},
});

const Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_initMembers.call(this);

  this._heading = this._direction;
  this._realZ = 0; // height above ground (used for jumping), and displayed via the y-axis
  
  this.width = Game_CharacterBase.DEFAULT_WIDTH;
  this.height = Game_CharacterBase.DEFAULT_HEIGHT;

  this.isCharacter = true;

  this.initPhysics();
};

Game_CharacterBase.prototype.initPhysics = function() {
  this.mass = 1;
  this.elasticity = 0.5;
  this.setMomentum();
  this.resetForce();
};

Game_CharacterBase.prototype.setMomentum = function(velocity = new Vector()) {
  this.momentum = velocity.multiply(this.mass);
}; 

Game_CharacterBase.prototype.setMomentumAfterCollision = function(velocity) {
  this.setMomentum(velocity.multiply(this.elasticity));
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
  const prevCoordinates = new Vector(this._realX, this._realY, this._realZ);

  let collision;
  collision = this.moveInX();
  if (collision) return this.applyCollision(collision); 

  collision = this.moveInY();
  if (collision) return this.applyCollision(collision); 

  this._realZ = Math.max(0, (this._realZ + this.velocity.z).round());
  
  const newCoordinates = new Vector(this._realX, this._realY, this._realZ);

  this.setMomentum(newCoordinates.subtract(prevCoordinates));
  this.resetForce();
};

Game_CharacterBase.prototype.move = function(vector) {
  this.updateDirection(vector.direction);
  this.applyForce(vector.multiply(this.mass)); // F = ma
  this.increaseSteps();
};

Game_CharacterBase.prototype.applyCollision = function(target) {
  const [ colliderVector, collidedVector ] = Vector.getCollisionVectors(this, target);
  if (target.isCharacter) {
    target.setMomentumAfterCollision(collidedVector);
    target.onCollisionWith(this);
    this.onCollisionWith(target);
  }
  this.setMomentumAfterCollision(colliderVector);
  this.resetForce();
};

Game_CharacterBase.prototype.onCollisionWith = function(collider) {
  // to be used in child classes
}

Game_CharacterBase.prototype.moveInX = function() {
  const [ dx, collision ] = this.moveResultX();
  this._realX = (this._realX + dx).round();
  return collision;
};

Game_CharacterBase.prototype.moveResultX = function() {
  const dx = this.velocity.x;
  if (!dx) return [ 0 ];

  let dir;
  if (dx > 0) dir = DIRECTIONS.RIGHT;
  else if (dx < 0) dir = DIRECTIONS.LEFT;
  const movementPath = new RectangleHitbox(this, dir, dx);

  const collision = first($gameMap.entitiesInBoundingBox(movementPath, this));
  if (!collision) return [ dx ];
  
  let successX;
  if (dx > 0) successX = collision.x1 - this.x2;
  else if (dx < 0) successX = collision.x2 - this.x1;
  successX = successX.subtractMagnitude(0.0001);

  return [ successX, collision ];
};

Game_CharacterBase.prototype.moveInY = function() {
  const [ dy, collision ] = this.moveResultY();
  this._realY = (this._realY + dy).round();
  return collision;
};

Game_CharacterBase.prototype.moveResultY = function() {
  const dy = this.velocity.y;
  if (!dy) return [ 0 ];

  let dir;
  if (dy > 0) dir = DIRECTIONS.DOWN;
  else if (dy < 0) dir = DIRECTIONS.UP;

  const movementPath = new RectangleHitbox(this, dir, dy);

  const collision = first($gameMap.entitiesInBoundingBox(movementPath, this));
  if (!collision) return [ dy ];
  
  let successY;
  if (dy > 0) successY = collision.y1 - this.y2;
  else if (dy < 0) successY = collision.y2 - this.y1;
  successY = successY.subtractMagnitude(0.0001);

  return [ successY, collision ];
};

Game_CharacterBase.prototype.moveStraight = function(d) {
  const distance = this.accelerationToMaxSpeed;
  if (!distance) return;
  
  let dx = 0;
  let dy = 0;
  if (isLeftDirection(d)) dx = -distance;
  else if (isRightDirection(d)) dx = distance;
  if (isUpDirection(d)) dy = -distance;
  else if (isDownDirection(d)) dy = distance;
 
  if (isDiagonal(d)) {
    const velocityXMag = this.velocity.x.abs();
    const velocityYMag = this.velocity.y.abs();

    const dxToMaxSpeed = (Math.sign(dx) * Math.sqrt(2) * distance) - this.velocity.x;
    const dyToMaxSpeed = (Math.sign(dy) * Math.sqrt(2) * distance) - this.velocity.y;

    if (
      Math.sign(dx) === Math.sign(dxToMaxSpeed) && 
      Math.sign(dy) === Math.sign(dyToMaxSpeed) &&
      (Math.pow(dxToMaxSpeed, 2) + Math.pow(dyToMaxSpeed, 2)) <= Math.pow(distance, 2)
    ) {
      dx = dxToMaxSpeed;
      dy = dyToMaxSpeed;
    } else if (velocityYMag > velocityXMag) { // catch dx up to dy
      const angle = Math.atan(0.001 / dxToMaxSpeed.abs());
      dx = Math.sign(dx) * Math.cos(angle) * distance;
      dy = Math.sign(dy) * Math.sin(angle) * distance;
    } else if (velocityXMag > velocityYMag) { // catch dy up to dx
      const angle = Math.atan(dyToMaxSpeed.abs() / 0.001);
      dx = Math.sign(dx) * Math.cos(angle) * distance;
      dy = Math.sign(dy) * Math.sin(angle) * distance;
    } else {
      dx /= Math.sqrt(2);
      dy /= Math.sqrt(2);
    }
  } else {
    dx /= Math.sqrt(2);
    dy /= Math.sqrt(2);
  }
    
  const acceleration = new Vector(dx, dy);
  this.move(acceleration);
};

Game_CharacterBase.prototype.updateDirection = function(dir) {
  if (!dir || this._heading === dir) return; // new direction is the change in heading

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

Game_CharacterBase.prototype.distanceFromCenterWith = function(char) {
  return (char.x0 - this.x0).abs() + (char.y0 - this.y0).abs() + (char.z - this.z).abs();
};