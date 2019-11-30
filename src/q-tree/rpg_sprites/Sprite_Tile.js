//-----------------------------------------------------------------------------
// Sprite_Tile
//
// The sprite class for highlighted tiles.

import randomColor from 'randomcolor';

Sprite_Tile.TILE_COLOR = PluginManager.parameters('FreeMove')['tile color'] || '#ff4136';

function Sprite_Tile() {
	this.initialize.apply(this, arguments);
}

Sprite_Tile.prototype = Object.create(Sprite.prototype);
Sprite_Tile.prototype.constructor = Sprite_Tile;

Sprite_Tile.prototype.initialize = function (collisionTile) {
	Sprite.prototype.initialize.call(this);
	this._tile = null;
	this.setTile(collisionTile);
};

Sprite_Tile.prototype.setTile = function (tile) {
	this._tile = tile;
	this.width = Math.max(1, $gameMap.tileWidth() * (tile.x2 - tile.x1));
	this.height = Math.max(1, $gameMap.tileHeight() * (tile.y2 - tile.y1));
	this.bitmap = new Bitmap(this.width, this.height);
	this.bitmap.paintOpacity = 125;
	if (Sprite_Tile.TILE_COLOR === 'random') this.bitmap.fillAll(randomColor());
	else this.bitmap.fillAll(Sprite_Tile.TILE_COLOR);
};

Sprite_Tile.prototype.update = function () {
	Sprite.prototype.update.call(this);
	this.updatePosition();
};

Sprite_Tile.prototype.updatePosition = function () {
	if (!this._tile) return;
	this.x = this.screenX();
	this.y = this.screenY();
};

Sprite_Tile.prototype.scrolledX = function () {
	return $gameMap.adjustX(this._tile.x1);
};

Sprite_Tile.prototype.scrolledY = function () {
	return $gameMap.adjustY(this._tile.y1);
};

Sprite_Tile.prototype.screenX = function () {
	return Math.round(this.scrolledX() * $gameMap.tileWidth());
};

Sprite_Tile.prototype.screenY = function () {
	return Math.round(this.scrolledY() * $gameMap.tileHeight());
};

export default Sprite_Tile;