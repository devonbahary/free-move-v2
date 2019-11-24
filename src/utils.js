import { DIRECTIONS } from "./constants";


const round = num => Math.round(num * 1000) / 1000;

export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return round(scalar - add);
  if (Math.sign(scalar) === -1) return round(scalar + add);
  return 0;
};

export const limitScalar = (scalar, limit) => {
  if (Math.abs(scalar) > limit) return Math.sign(scalar) * limit;
  return scalar;
};

export const isDownDirection = dir => {
  return [ DIRECTIONS.DOWN_LEFT, DIRECTIONS.DOWN, DIRECTIONS.DOWN_RIGHT ].includes(dir);
};

export const isLeftDirection = dir => {
  return [ DIRECTIONS.DOWN_LEFT, DIRECTIONS.LEFT, DIRECTIONS.UP_LEFT ].includes(dir);
};

export const isRightDirection = dir => {
  return [ DIRECTIONS.DOWN_RIGHT, DIRECTIONS.RIGHT, DIRECTIONS.UP_RIGHT ].includes(dir);
};

export const isUpDirection = dir => {
  return [ DIRECTIONS.UP_LEFT, DIRECTIONS.UP, DIRECTIONS.UP_RIGHT ].includes(dir);
};

export const isHorzDirection = dir => {
  return ![ DIRECTIONS.DOWN, DIRECTIONS.UP ].includes(dir);
};

export const isVertDirection = dir => {
  return [ DIRECTIONS.LEFT, DIRECTIONS.RIGHT ].includes(dir);
};