import Vector from "./utils/Vector";

export const DIRECTIONS = {
  DOWN_LEFT: 1,
  DOWN: 2,
  DOWN_RIGHT: 3,
  LEFT: 4,
  RIGHT: 6,
  UP_LEFT: 7,
  UP: 8,
  UP_RIGHT: 9,
};

export const GRAVITATIONAL_CONSTANT = 0.01; // acceleration

export const GRAVITATIONAL_FORCE = new Vector(0, 0, -GRAVITATIONAL_CONSTANT);