import { DIRECTIONS } from "../constants";

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

export const isDiagonal = dir => {
  return ![ DIRECTIONS.LEFT, DIRECTIONS.RIGHT, DIRECTIONS.UP, DIRECTIONS.DOWN ].includes(dir);
}