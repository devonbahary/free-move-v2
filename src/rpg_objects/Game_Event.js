//-----------------------------------------------------------------------------
// Game_Event
//
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.

Game_Event.DEFAULT_IS_IMMOVABLE = JSON.parse(PluginManager.parameters('FreeMove')['immovable']);

const _Game_Event_initMembers = Game_Event.prototype.initMembers;
Game_Event.prototype.initMembers = function() {
  _Game_Event_initMembers.call(this);
  this.isEvent = true;
};

const _Game_Event_initPhysics = Game_Event.prototype.initPhysics;
Game_Event.prototype.initPhysics = function() {
  _Game_Event_initPhysics.call(this);
  if (Game_Event.DEFAULT_IS_IMMOVABLE) this.elasticity = 0;
};