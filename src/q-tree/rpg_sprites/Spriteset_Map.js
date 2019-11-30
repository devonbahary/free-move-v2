//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

import Sprite_Partition from './Sprite_Partition';
import Sprite_Hitbox from './Sprite_Hitbox';
import Sprite_Tile from './Sprite_Tile';

Spriteset_Map.DISPLAY_PARTITION_GRID = JSON.parse(PluginManager.parameters('FreeMove')['display grid']);
Spriteset_Map.DISPLAY_HITBOXES = JSON.parse(PluginManager.parameters('FreeMove')['display hitboxes']);
Spriteset_Map.DISPLAY_TILES = JSON.parse(PluginManager.parameters('FreeMove')['display collision tiles']);


const Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
Spriteset_Map.prototype.createLowerLayer = function() {
	Spriteset_Map_createLowerLayer.call(this);
	this.createQTree();
	this.createCollisionTiles();
	this.createHitboxes();
};

Spriteset_Map.prototype.createQTree = function() {
	if (!Spriteset_Map.DISPLAY_PARTITION_GRID) return;

	this.addChild(new Sprite_Partition($gameMap.qTree));
};

Spriteset_Map.prototype.createCollisionTiles = function() {
	if (!Spriteset_Map.DISPLAY_TILES) return;

	$gameMap._tilemapCollisionObjects.forEach(collisionObject => {
		this.addChild(new Sprite_Tile(collisionObject));
	});
};

Spriteset_Map.prototype.createHitboxes = function() {
	if (!Spriteset_Map.DISPLAY_HITBOXES) return;

	const entities = [ 
		$gamePlayer,
		...$gameMap.events(),
		...$gameMap.vehicles(),
	];
	if ($gamePlayer.followers().isVisible()) entities.push(...$gamePlayer.followers()._data);

	entities.forEach(character => {
		const spriteHitbox = new Sprite_Hitbox(character);
		this.addChild(spriteHitbox);
	});
};

