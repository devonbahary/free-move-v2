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
} from "../utils/directions";
import Vector from "../utils/Vector";
import { DIRECTIONS } from "../constants";

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
});

const Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
  Game_CharacterBase_initMembers.call(this);
  
  this.isCharacter = true;
  this.mass = 1;
  this._realZ = 0; // height above ground (used for jumping), and displayed via the y-axis
  
  this.width = Game_CharacterBase.DEFAULT_WIDTH;
  this.height = Game_CharacterBase.DEFAULT_HEIGHT;

  this.initializeMovementVectors();

  this._heading = this._direction;
};

Game_CharacterBase.prototype.initializeMovementVectors = function() {
  this.velocity = new Vector();
};

Game_CharacterBase.prototype.isMoving = function() {
  return this.velocity.length;
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
  this._realX += this.velocity.x;
  this._realY += this.velocity.y;
  this._realZ += this.velocity.z;

  this.velocity = new Vector(0, 0);
};

Game_CharacterBase.prototype.moveStraight = function(d) {
  this.updateDirection(d);
  
  let dx, dy;
  if (isLeftDirection(d)) dx = -this.distancePerFrame();
  else if (isRightDirection(d)) dx = this.distancePerFrame();
  if (isUpDirection(d)) dy = -this.distancePerFrame();
  else if (isDownDirection(d)) dy = this.distancePerFrame();

  // this.setMovementSuccess(this.canPass(this._x, this._y, d));
  // if (this.isMovementSucceeded()) {
  //     this.setDirection(d);
  //     this._x = $gameMap.roundXWithDirection(this._x, d);
  //     this._y = $gameMap.roundYWithDirection(this._y, d);
  //     this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(d));
  //     this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(d));
  //     this.increaseSteps();
  // } else {
  //     this.setDirection(d);
  //     this.checkEventTriggerTouchFront(d);
  // }
  this.velocity = new Vector(dx, dy);
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