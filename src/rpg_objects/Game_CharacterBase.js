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
import { Vector } from "../utils/vectors";
import { DIRECTIONS, GRAVITATIONAL_CONSTANT } from "../constants";

Game_CharacterBase.DEFAULT_WIDTH = Number(PluginManager.parameters('FreeMove')['character width']) || 1;
Game_CharacterBase.DEFAULT_HEIGHT = Number(PluginManager.parameters('FreeMove')['character height']) || 1;


Object.defineProperties(Game_CharacterBase.prototype, {
  _acceleration: {
    get: function() {
      const forceX = this.momentum.x + this.force.x;
      const netForceX = forceX.subtractMagnitude(this._frictionalForce);
      const accelerationX = (netForceX && Math.sign(forceX) === Math.sign(netForceX)) ? netForceX / this.mass : 0;

      const forceY = this.momentum.y + this.force.y;
      const netForceY = forceY.subtractMagnitude(this._frictionalForce);
      const accelerationY = (netForceY && Math.sign(forceY) === Math.sign(netForceY)) ? netForceY / this.mass: 0;

      const accelerationZ = (this.momentum.z + this.force.z) / this.mass;

      return new Vector(accelerationX, accelerationY, accelerationZ);
    }
  },
  _frictionalForce: { get: function() { return this.isGrounded() ? this.mass * GRAVITATIONAL_CONSTANT : 0; }},
  _topSpeed: { get: function() { return this.distancePerFrame(); }},
  _x: { get: function() { return (this._realX + (1 - this.width) / 2).round(); }},
  _y: { get: function() { return (this._realY + (1 - this.height)).round(); }},
  x1: { get: function() { return this._x; }},
  x0: { get: function() { return (this._x + this.width / 2).round(); }},
  x2: { get: function() { return (this._x + this.width).round(); }},
  y1: { get: function() { return this._y; }},
  y0: { get: function() { return (this._y + this.height / 2).round(); }},
  y2: { get: function() { return (this._y + this.height).round(); }},
  velocity: { get: function() { 
    const { x, y, z } = this._acceleration;
    return new Vector(x, y, z); 
  }},
});

const Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_initMembers.call(this);
  
  this.isCharacter = true;
  this.mass = 1; // ↑↓  
  this._realZ = 0; // height above ground (used for jumping), and displayed via the y-axis

  this.resetForces();
  this.setMomentum(0, 0, 0);
  
  this.width = Game_CharacterBase.DEFAULT_WIDTH;
  this.height = Game_CharacterBase.DEFAULT_HEIGHT;

  this._heading = this._direction;
};

Game_CharacterBase.prototype.resetForces = function() {
  this.force = new Vector();
};

Game_CharacterBase.prototype.applyForce = function(forceX, forceY, forceZ = 0) {
  this.force = this.force.add(new Vector(forceX, forceY, forceZ));
};

Game_CharacterBase.prototype.isMoving = function() {
  return this.velocity.length;
};

// TODO: this breaks jump as a movement command
Game_CharacterBase.prototype.jumpHeight = function() {
  var th = $gameMap.tileHeight();
  return th * this._realZ;
};

Game_CharacterBase.prototype.applyGravitationalForce = function() {
  if (this._realZ <= 0) return;
  this.applyForce(0, 0, -(this.mass * GRAVITATIONAL_CONSTANT));
};

Game_CharacterBase.prototype.update = function() {
  this.applyGravitationalForce();
  if (this.isStopping()) this.updateStop();
  this.updateAnimation();
  this.updateMove();
  this.resetForces();
};

Game_CharacterBase.prototype.applyCollision = function(target, isXCollision) {
  // const [ colliderFinalVelocities, collidedFinalVelocities ] = getCollisionVectors(this, target, isXCollision);

  // if (target.isCharacter) target.applyForce(...collidedFinalVelocities);
  // this.setMomentum(...colliderFinalVelocities, this._velocityZ);
};

Game_CharacterBase.prototype.updateMove = function() {
  let collision, movementX, movementY, movementZ;
  
  [ movementX, collision ] = this.moveInXDir();
  if (collision) return this.applyCollision(collision, true);

  [ movementY, collision ] = this.moveInYDir();
  if (collision) return this.applyCollision(collision, false);

  movementZ = this.moveInZDir();

  this.setMomentum(movementX, movementY, movementZ);

  // legacy
  if (!this.isMoving()) this.refreshBushDepth();
};

Game_CharacterBase.prototype.moveInXDir = function() {
  let successfulMovementX, collision;
  if (!this.velocity.x) {
    successfulMovementX = 0;
  } else {
    [ successfulMovementX, collision ] = this.getMovementXResult();
    this._realX = (this._realX + successfulMovementX).round();
  }

  return [ successfulMovementX, collision ];
};

Game_CharacterBase.prototype.moveInYDir = function() {
  let successfulMovementY, collision;
  if (!this.velocity.y) {
    successfulMovementY = 0;
  } else {
    [ successfulMovementY, collision ] = this.getMovementYResult();
    this._realY = (this._realY + successfulMovementY).round();
  }
  
  return [ successfulMovementY, collision ]; 
};

Game_CharacterBase.prototype.moveInZDir = function() {
  if (!this.velocity.z) return 0;

  const successfulMovementZ = this.toleranceInZDir();
  this._realZ = (this._realZ + successfulMovementZ).round();

  return successfulMovementZ;
};

Game_CharacterBase.prototype.getMovementXResult = function() {
  const isMovingRight = this.velocity.x > 0;

  const collisionInXDir = () => {
    if (!this.velocity.x) return null;  

    const collisionObjectsInPath = this.getCollisionObjectsInPathX();
    const closestCollisions = collisionObjectsInPath.sort((a, b) => a ? a.x1 - b.x1 : b.x2 - a.x2);
    return first(closestCollisions);
  };

  const closestCollision = collisionInXDir();

  let movementX;
  if (!closestCollision) {
    movementX = this.velocity.x;
  } else {
    const dxFromClosest = isMovingRight ? closestCollision.x1 - this.x2 : closestCollision.x2 - this.x1;
    const toleranceX = dxFromClosest.subtractMagnitude(0.0001);
    movementX = isMovingRight ? toleranceX.clamp(0, this.velocity.x) : toleranceX.clamp(this.velocity.x, 0);
  }

  return [ movementX, closestCollision ];
};

Game_CharacterBase.prototype.getMovementYResult = function() {
  const isMovingDown = this.velocity.y > 0;

  const collisionInYDir = () => {
    if (!this.velocity.y) return null;

    const collisionObjectsInPath = this.getCollisionObjectsInPathY();
    const closestCollisions = collisionObjectsInPath.sort((a, b) => isMovingDown ? a.y1 - b.y1 : b.y2 - a.y2)
    return first(closestCollisions);
  };

  const closestCollision = collisionInYDir();

  let movementY;
  if (!closestCollision) {
    movementY = this.velocity.y;
  } else {
    const dyFromClosest = isMovingDown ? closestCollision.y1 - this.y2 : closestCollision.y2 - this.y1;
    const toleranceY = dyFromClosest.subtractMagnitude(0.0001);
    movementY = isMovingDown ? toleranceY.clamp(0, this.velocity.y) : toleranceY.clamp(this.velocity.y, 0);
  }

  return [ movementY, closestCollision ];
};

Game_CharacterBase.prototype.toleranceInZDir = function() {
  const willPassThroughFloor = this._realZ + this.velocity.z < 0;
  return willPassThroughFloor ? -this._realZ : this._velocityZ;
};

Game_CharacterBase.prototype.getCollisionObjectsInPathX = function() {
  if (!this.velocity.x) return [];
  
  let minX, maxX;
  switch (Math.sign(this.velocity.x)) {
    case -1: 
      minX = this.x1 + this.velocity.x;
      maxX = this.x1;
      break;
    case 0:
      minX = this.x1;
      maxX = this.x2;
      break;
    case 1:
      minX = this.x2;
      maxX = this.x2 + this.velocity.x;
  }

  return $gameMap.collisionsInBoundingBox(minX, maxX, this.y1, this.y2, this);
};

Game_CharacterBase.prototype.getCollisionObjectsInPathY = function() {
  if (!this.velocity.y) return [];

  let minY, maxY;
  switch (Math.sign(this.velocity.y)) {
    case -1:
      minY = this.y1 + this.velocity.y;
      maxY = this.y1;
      break;
    case 0:
      minY = this.y1;
      maxY = this.y2;
      break;
    case 1:
      minY = this.y2;
      maxY = this.y2 + this.velocity.y;
      break;
  }

  return $gameMap.collisionsInBoundingBox(this.x1, this.x2, minY, maxY, this);
};

Game_CharacterBase.prototype.setMomentum = function(...velocities) {
  this.momentum = new Vector(...velocities.map(v => v * this.mass));
};

Game_CharacterBase.prototype.moveStraight = function(dir) {
  const topSpeed = isDiagonal(dir) ? this._topSpeed * Math.sqrt(2) / 2 : this._topSpeed;
  
  const exceedsTopSpeed = (currentVelocity, force) => Math.abs(currentVelocity + force) > (topSpeed);
  const isSameDirection = (force1, force2) => Math.sign(force1) === Math.sign(force2);

  const forceToTopSpeedX = () => {
    return Math.sign(this.momentum.x) * Math.max(0, ((this.mass * topSpeed) - Math.abs(this.momentum.x) + this._frictionalForce));
  };

  const forceToTopSpeedY = () => {
    return Math.sign(this.momentum.y) * Math.max(0, ((this.mass * topSpeed) - Math.abs(this.momentum.y) + this._frictionalForce));
  };

  const speed = topSpeed;
  
  let forceX = 0;
  let forceY = 0;

  if (isLeftDirection(dir)) forceX = -speed;
  else if (isRightDirection(dir)) forceX = speed;

  if (isDownDirection(dir)) forceY = speed;
  else if (isUpDirection(dir)) forceY = -speed;    

  const exceedsTopSpeedX = exceedsTopSpeed(this.velocity.x, forceX);
  if (exceedsTopSpeedX && isSameDirection(this.velocity.x, forceX)) forceX = forceToTopSpeedX();
  else if (exceedsTopSpeedX) forceX = 0;

  const exceedsTopSpeedY = exceedsTopSpeed(this.velocity.y, forceY);
  if (exceedsTopSpeedY && isSameDirection(this.velocity.y, forceY)) forceY = forceToTopSpeedY();
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