//=============================================================================
// FreeMove
//=============================================================================

/*:
 * @plugindesc Grid-free movement.
 * 
 * @param  QTree
 * 
 * @param   display grid
 * @desc    Turn ON to display partition grid (testing purposes).
 * @type    boolean
 * @default false
 * @parent  QTree
 * 
 * @param   grid border color
 * @desc    Specify CSS hex color (e.g., "#ff4136") for partition grid lines.
 * @type    text
 * @default blue
 * @parent  QTree
 * 
 * @param   grid border thickness
 * @desc    Specify thickness of grid lines (in pixels).
 * @type    number
 * @default 4
 * @parent  QTree
 * 
 * @param   max entities
 * @desc    Max number of entities to allow in a QTree before partitioning into smaller Leaves.
 * @type    number
 * @default 2
 * @min     1
 * @parent  QTree
 * 
 * @param   min Leaf size
 * @desc    The smallest dimension (width/height) a Leaf can be reduced to in tiles/
 * @type    number
 * @default 1
 * @min     1
 * @parent  QTree
 * 
 * 
 * 
 * @param   Tilemap
 * 
 * @param   display collision tiles
 * @desc    Turn ON to display collision tiles (testing purposes).
 * @type    boolean
 * @default false
 * @parent  Tilemap
 * 
 * @param   tile color
 * @desc    Specify CSS color (e.g., "blue", "#ff4136") for tiles. Use 'random' to view individual tiles.
 * @type    text
 * @default #ff4136
 * @parent  Tilemap
 * 
 *
 * 
 * @param   Characters
 * 
 * @param   display hitboxes
 * @desc    Turn ON to display hitboxes (testing purposes).
 * @type    boolean
 * @default false
 * @parent  Characters
 * 
 * @param   hitbox color
 * @desc    Specify CSS color (e.g., "blue", "#ff4136") for tiles. Use 'random' to view individual tiles.
 * @type    text
 * @default blue
 * @parent  Characters
 * 
 * @param   character hitbox radius
 * @desc    Default distance (in tiles) from center of characters used to calculate square hitbox.
 * @type    number
 * @decimals 2
 * @default 0.5
 * @max     5
 * @min     0.1
 * @parent  Characters
 * 
*/

import "./rpg_core/Number";
import "./rpg_objects/Game_CharacterBase";
import "./rpg_objects/Game_Player";
