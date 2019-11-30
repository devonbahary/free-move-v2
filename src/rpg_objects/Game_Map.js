//-----------------------------------------------------------------------------
// Game_Map
//
// The game object class for a map. It contains scrolling and passage
// determination functions.

import QTree from "../q-tree";

const Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
  Game_Map_setup.call(this, mapId);
  this.setupQTree();
  this.setupTilemapCollisionProperties();
};

Game_Map.prototype.setupQTree = function() {
  this.qTree = new QTree(0, this.width(), 0, this.height());
  
  this.qTree.addEntity($gamePlayer);
  this._events.forEach(event => this.qTree.addEntity(event));
};

Game_Map.prototype.setupTilemapCollisionProperties = function() {
  const tilemapProperty2DArray = this.getTilemapProperty2DArray();
  this.setupTilemapCollisionObjects(tilemapProperty2DArray);
  this.setupTilemapCollisionGrid();
};

// TODO: if the need to reference the tilemapProperty2DArray comes up in the future, re-make property of Game_Map
Game_Map.prototype.getTilemapProperty2DArray = function() {
  const tilemapProperty2DArray = {};

  for (let y = 0; y < $gameMap.height(); y++) {
    tilemapProperty2DArray[y] = {};

    // record passability in each direction for this tile
    for (let x = 0; x <= $gameMap.width(); x++) {
      const tile = {
        2: this.isValid(x, y + 1) && this.isPassable(x, y, 2),
        4: this.isValid(x - 1, y) && this.isPassable(x, y, 4),
        6: this.isValid(x + 1, y) && this.isPassable(x, y, 6),
        8: this.isValid(x, y - 1) && this.isPassable(x, y, 8)
      };
      tilemapProperty2DArray[y][x] = tile;
    }

  }

  return tilemapProperty2DArray;
};

Game_Map.prototype.setupTilemapCollisionObjects = function(tilemapProperty2DArray) {
  // get tilemap collision objects from tiles that are wholly impassable
  const getTileCollisionObjects = collisionTiles2DArray => {
    const tilemapCollisonObjects = [];
    
    for (let y = 0; y < $gameMap.height(); y++) {
      for (let x = 0; x < $gameMap.width(); x++) {
        if (!collisionTiles2DArray[y][x]) continue;
  
        const potentialObject = {
          x1: x,
          x2: null,
          y1: y,
          y2: null
        };
  
        spanObject:
          for (let spanY = y; spanY < $gameMap.height(); spanY++) {
            // span right 
            for (let spanX = x; spanX <= $gameMap.width(); spanX++) {
              if (potentialObject.x2 && spanX > potentialObject.x2) break spanObject;
              if (!$gameMap.isValid(spanX, spanY) || !collisionTiles2DArray[spanY][spanX]) {
                if (!potentialObject.x2) potentialObject.x2 = spanX;
                if (potentialObject.x2 === spanX) potentialObject.y2 = spanY + 1;
                if (spanX < potentialObject.x2) break spanObject;
                break;
              } 
            }
          }
        
        let coveredNewGround = false;
        checkForNewGround:
          for (let spanY = potentialObject.y1; spanY < potentialObject.y2; spanY++) {
            for (let spanX = potentialObject.x1; spanX < potentialObject.x2; spanX++) {
              if (collisionTiles2DArray[spanY][spanX] === 1) coveredNewGround = true;
              collisionTiles2DArray[spanY][spanX] = 2;
            }
          }
        
        if (coveredNewGround) tilemapCollisonObjects.push(potentialObject);
      }
    }

    return tilemapCollisonObjects;
  };

  // trim tilemap collision objects such that none overlap (this way, an entity only has to caculate
  // collision with one tilemap collision object in any given tile)
  const getTrimmedTileCollisionObjects = collisionObjects => collisionObjects.reduce((acc, objectA) => {
    let overlapX1, overlapX2;
    for (let spanX = objectA.x1; spanX < objectA.x2; spanX++) {
      let entireColumnOverlapped = true;
      for (let spanY = objectA.y1; spanY < objectA.y2; spanY++) {
        const isAnotherCollisionObjectSpanningThisColumn = collisionObjects.some(objectB => 
          objectA !== objectB && 
          spanX >= objectB.x1 && 
          spanX < objectB.x2 && 
          spanY >= objectB.y1 && 
          spanY < objectB.y2
        );

        if (!isAnotherCollisionObjectSpanningThisColumn) {
          entireColumnOverlapped = false;
          break;  
        } 
      }

      if (entireColumnOverlapped && !overlapX1) {
        overlapX1 = spanX;
        overlapX2 = spanX + 1;
      } else if (entireColumnOverlapped && overlapX2) {
        overlapX2++;
      } else if (!entireColumnOverlapped && overlapX1 && overlapX1 === objectA.x1) {
        objectA.x1 = overlapX2;
        break;
      }
      
      if (overlapX2 === objectA.x2) {
        objectA.x2 = overlapX1;
        break;
      }
    }

    return [ ...acc, objectA ];
  }, []);

  // get tile border collision objects (one-way impassability)
  const getTileBorderCollisionObjects = (tilemapProperty2DArray) => {
    const tileBorderCollisionObjects = [];
    for (let y = 0; y < $gameMap.height(); y++) {
      for (let x = 0; x < $gameMap.width(); x++) {
        const tileProperties = tilemapProperty2DArray[y][x];

        // is not a tile border collision object if no border is passable (already covered by 
        // regular tilemap collision objects)
        if (Object.entries(tileProperties).every(([ dir, isPassable]) => !isPassable)) continue;

        Object.entries(tileProperties).forEach(([ dir, isPassable ]) => {
          if (isPassable) return;

          switch(Number(dir)) {
            case 2:
              return tileBorderCollisionObjects.push({ 
                x1: x, 
                x2: x + 1, 
                y1: y + 1, 
                y2: y + 1 
              });
            case 4:
              return tileBorderCollisionObjects.push({ 
                x1: x, 
                x2: x, 
                y1: y, 
                y2: y + 1 
              });
            case 6:
              return tileBorderCollisionObjects.push({ 
                x1: x + 1, 
                x2: x + 1, 
                y1: y, 
                y2: y + 1 
              });
            case 8:
              return tileBorderCollisionObjects.push({ 
                x1: x, 
                x2: x + 1, 
                y1: y, 
                y2: y 
              });
          }
        });
      }
    }
    return tileBorderCollisionObjects;
  };

  // find entirely impassable tiles
  const collisionTiles2DArray = [];
  for (let y = 0; y < $gameMap.height(); y++) {
    collisionTiles2DArray.push([]);
    for (let x = 0; x <= $gameMap.width(); x++) {
      const tileProperties = tilemapProperty2DArray[y][x]
      const hasPassabilityInSomeDirection = Object.entries(tileProperties).some(([ dir, isPassable ]) => isPassable);
      // 1 is a collision tile, 0 is a passable tile
      collisionTiles2DArray[y].push(hasPassabilityInSomeDirection ? 0 : 1);
    }
  }

  const tileCollisionObjects = getTileCollisionObjects(collisionTiles2DArray);
  const trimmedTileCollisionObjects = getTrimmedTileCollisionObjects(tileCollisionObjects);
  const tileBorderCollisionObjects = getTileBorderCollisionObjects(tilemapProperty2DArray);
  
  this._tilemapCollisionObjects = [ ...trimmedTileCollisionObjects, ...tileBorderCollisionObjects ];
};

// used to point at a tile in hashmap fashion and return the collision objects there
Game_Map.prototype.setupTilemapCollisionGrid = function() {
  this._tilemapCollisionGrid = {};
  for (let y = 0; y < $gameMap.height() + 1; y++) {
    this._tilemapCollisionGrid[y] = {};
    for (let x = 0; x < $gameMap.width() + 1; x++) {
      const tilemapCollisionObjectsAtPos = this._tilemapCollisionObjects.filter(object => 
        object.x1 <= x + 1 && 
        object.x2 >= x && 
        object.y1 <= y + 1 && 
        object.y2 >= y
      );
      this._tilemapCollisionGrid[y][x] = tilemapCollisionObjectsAtPos;
    }
  }
};

Game_Map.prototype.collisionsInBoundingBox = function(x1, x2, y1, y2) {
  const collisionObjects = [];

  const minX = Math.max(0, Math.floor(x1));
  const maxX = Math.min(Math.ceil(x2), this.width() + 1);
  const minY = Math.max(0, Math.floor(y1));
  const maxY = Math.min(Math.ceil(y2), this.height() + 1);

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const uniqueCollisionObjectsAtPos = this._tilemapCollisionGrid[y][x].filter(collisionObject => 
        !collisionObjects.includes(collisionObject) &&
        collisionObject.x1 <= x2 &&
        collisionObject.x2 >= x1 &&
        collisionObject.y1 <= y2 &&
        collisionObject.y2 >= y1
      );
      if (!uniqueCollisionObjectsAtPos.length) continue;

      collisionObjects.push(...uniqueCollisionObjectsAtPos);
    }
  }

  return collisionObjects;
};

const Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function(sceneActive) {
  Game_Map_update.call(this, sceneActive);
  this.qTree.update();
};