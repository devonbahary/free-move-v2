//-----------------------------------------------------------------------------
// Game_CharacterBase
//
// The superclass of Game_Character. It handles basic information, such as
// coordinates and images, shared by all characters.

import { 
  isDownDirection,
  isUpDirection,
  isLeftDirection,
  isRightDirection, 
  isDiagonal,
  subtractScalar,
} from "../utils";
import { 
  DIRECTIONS,  
  GRAVITATIONAL_CONSTANT,
} from "../constants";


Object.defineProperties(Game_CharacterBase.prototype, {
  _x: { get: function() { return this._realX; }},
  _y: { get: function() { return this._realY; }},
  _frictionalForce: { get: function() { return this.isGrounded() ? this._mass * GRAVITATIONAL_CONSTANT : 0; }},
  _accelerationX: { 
    get: function() { 
      const force = this._momentumX + this._forceX;
      const netForce = subtractScalar(force, this._frictionalForce);
      return (netForce && Math.sign(force) === Math.sign(netForce)) ? netForce / this._mass : 0;
    }
  },
  _accelerationY: { 
    get: function() { 
      const force = this._momentumY + this._forceY;
      const netForce = subtractScalar(force, this._frictionalForce);
      return (netForce && Math.sign(force) === Math.sign(netForce)) ? netForce / this._mass: 0;
    }
  },
  _accelerationZ: { get: function() { return (this._momentumZ + this._forceZ) / this._mass; }},
  _velocityX: { get: function() { return this._accelerationX.round(); }},
  _velocityY: { get: function() { return this._accelerationY.round(); }},
  _velocityZ: { get: function() { return this._accelerationZ.round(); }},
  _topSpeed: { get: function() { return this.distancePerFrame(); }},
});

const Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_initMembers.call(this);
  
  this._mass = 1; // ↑↓  
  this._realZ = 0; // height above ground (used for jumping), and displayed via the y-axis

  this.setForces();
  this.setMomentum();
  
  this._heading = this._direction;
};

Game_CharacterBase.prototype.setForces = function(forceX = 0, forceY = 0, forceZ = 0) {
  this._forceX = forceX;
  this._forceY = forceY;
  this._forceZ = forceZ;
};

Game_CharacterBase.prototype.applyForce = function(forceX, forceY, forceZ = 0) {
  this._forceX += forceX;
  this._forceY += forceY;
  this._forceZ += forceZ;
};

Game_CharacterBase.prototype.isMoving = function() {
  return this._velocityX || this._velocityY || this._velocityZ;
};

Game_Character.prototype.applyGravitationalForce = function() {
  if (this._realZ <= 0) return;
  this.applyForce(0, 0, -(this._mass * GRAVITATIONAL_CONSTANT));
};

Game_CharacterBase.prototype.update = function() {
  this.applyGravitationalForce();
  if (this.isStopping()) this.updateStop();
  this.updateAnimation();
  this.updateMove();
  this.setForces();
};

Game_CharacterBase.prototype.updateMove = function() {
  let successfulMovementZ = 0;
  if (this._velocityX) this._realX += this._velocityX;
  if (this._velocityY) this._realY += this._velocityY;
  if (this._velocityZ) {
    successfulMovementZ = (this._realZ + this._velocityZ < 0) ? -this._realZ : this._velocityZ;
    this._realZ += successfulMovementZ;
    this._realY -= successfulMovementZ;
  }

  this.setMomentum(this._velocityX, this._velocityY, successfulMovementZ);

  // legacy
  if (!this.isMoving()) this.refreshBushDepth();
};

Game_Character.prototype.setMomentum = function(velocityX = 0, velocityY = 0, velocityZ = 0) {
  this._momentumX = velocityX * this._mass;
  this._momentumY = velocityY * this._mass;
  this._momentumZ = velocityZ * this._mass;
};

Game_CharacterBase.prototype.moveStraight = function(dir) {
  const topSpeed = isDiagonal(dir) ? this._topSpeed * Math.sqrt(2) / 2 : this._topSpeed;
  
  const exceedsTopSpeed = (currentVelocity, force) => Math.abs(currentVelocity + force) > (topSpeed);
  const isSameDirection = (force1, force2) => Math.sign(force1) === Math.sign(force2);

  const forceToTopSpeedX = () => {
    return Math.sign(this._momentumX) * Math.max(0, ((this._mass * topSpeed) - Math.abs(this._momentumX) + this._frictionalForce));
  };

  const forceToTopSpeedY = () => {
    return Math.sign(this._momentumY) * Math.max(0, ((this._mass * topSpeed) - Math.abs(this._momentumY) + this._frictionalForce));
  };

  const speed = topSpeed;
  
  let forceX = 0;
  let forceY = 0;

  if (isLeftDirection(dir)) forceX = -speed;
  else if (isRightDirection(dir)) forceX = speed;

  if (isDownDirection(dir)) forceY = speed;
  else if (isUpDirection(dir)) forceY = -speed;    

  const exceedsTopSpeedX = exceedsTopSpeed(this._velocityX, forceX);
  if (exceedsTopSpeedX && isSameDirection(this._velocityX, forceX)) forceX = forceToTopSpeedX();
  else if (exceedsTopSpeedX) forceX = 0;

  const exceedsTopSpeedY = exceedsTopSpeed(this._velocityY, forceY);
  if (exceedsTopSpeedY && isSameDirection(this._velocityY, forceY)) forceY = forceToTopSpeedY();
  else if (exceedsTopSpeedY) forceY = 0;

  this.updateDirection(dir);
  this.applyForce(forceX, forceY);
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

Game_CharacterBase.prototype.isGrounded = function() {
  return this._realZ === 0;
};

Game_CharacterBase.prototype.canMove = function() {
  return this.isGrounded();
};