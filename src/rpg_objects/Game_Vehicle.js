//-----------------------------------------------------------------------------
// Game_Vehicle
//
// The game object class for a vehicle.

Game_Vehicle.WIDTH = 1;
Game_Vehicle.HEIGHT = 1;

const Game_Vehicle_initMembers = Game_Vehicle.prototype.initMembers;
Game_Vehicle.prototype.initMembers = function() {
  Game_Vehicle_initMembers.call(this);
  this.width = Game_Vehicle.WIDTH;
  this.height = Game_Vehicle.HEIGHT;
};