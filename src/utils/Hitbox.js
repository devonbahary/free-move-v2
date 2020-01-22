//-----------------------------------------------------------------------------
// Hitbox
//

import { DIRECTIONS } from "../constants";


export class RectangleHitbox {
  constructor(char, direction = char.direction(), distance) {
    distance = distance.abs();
    switch (direction) {
      case DIRECTIONS.DOWN:
        this.x1 = char.x1;
        this.x2 = char.x2;
        this.y1 = char.y2;
        this.y2 = char.y2 + distance;
        break;
      case DIRECTIONS.LEFT:
        this.x1 = char.x1 - distance;
        this.x2 = char.x1;
        this.y1 = char.y1;
        this.y2 = char.y2;
        break;
      case DIRECTIONS.RIGHT:
        this.x1 = char.x2;
        this.x2 = char.x2 + distance;
        this.y1 = char.y1;
        this.y2 = char.y2;
        break;
      case DIRECTIONS.UP:
        this.x1 = char.x1;
        this.x2 = char.x2;
        this.y1 = char.y1 - distance;
        this.y2 = char.y1;
        break;
      default:
        throw new Error(`cannot create RectangleHitbox for object with direction ${direction}`);
    }
  }
};
