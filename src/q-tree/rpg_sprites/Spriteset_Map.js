//-----------------------------------------------------------------------------
// Spriteset_Map
//
// The set of sprites on the map screen.

const Sprite_Partition = require('./Sprite_Partition');
// const Sprite_Hitbox = require('./Sprite_Hitbox');
// const Sprite_Tile = require('./Sprite_Tile');

Spriteset_Map.DISPLAY_PARTITION_GRID = JSON.parse(PluginManager.parameters('FreeMove')['display grid']);
// Spriteset_Map.DISPLAY_HITBOXES = JSON.parse(PluginManager.parameters('FreeMove')['display hitboxes']);
// Spriteset_Map.DISPLAY_TILES = JSON.parse(PluginManager.parameters('FreeMove')['display collision tiles']);


const _Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
Spriteset_Map.prototype.createLowerLayer = function() {
    _Spriteset_Map_createLowerLayer.call(this);
    this.createQTree();
    // this.createHitboxes();
    // this.createCollisionTiles();
};

// create first partition sprite
Spriteset_Map.prototype.createQTree = function() {
    if (!Spriteset_Map.DISPLAY_PARTITION_GRID) return;
    const yo = new Sprite_Partition($gameMap._qTree);
    console.log(yo);
    this.addChild(yo);
};

// Spriteset_Map.prototype.createHitboxes = function() {
//     if (!Spriteset_Map.DISPLAY_HITBOXES) return;
//     let entities = [ ...$gameMap.events(), $gamePlayer ];
//     if ($gamePlayer.followers().isVisible()) entities = [ ...entities, ...$gamePlayer.followers()._data ];

//     this._hitboxSprites = entities.map(character => new Sprite_Hitbox(character));
//     this._hitboxSprites.forEach(hitboxSprite => this.addChild(hitboxSprite));
// };

// Spriteset_Map.prototype.createCollisionTiles = function() {
//     if (!Spriteset_Map.DISPLAY_TILES) return;
//     $gameMap._tilemapCollisionObjects.forEach(collisionObject => {
//         this.addChild(new Sprite_Tile(collisionObject));
//     });
// };