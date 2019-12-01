import { DIRECTIONS } from "./constants";

export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return scalar - add;
  if (Math.sign(scalar) === -1) return scalar + add;
  return 0;
};

const vectorMultiply = (vector, scalarMult) => vector.map(scalar => scalar * scalarMult);

const dotProduct = (vectorA, vectorB) => vectorA.reduce((acc, coord, index) => acc + (coord * vectorB[index]), 0);

const magnitude = ([ x, y ] = vector) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

const vectorProjection = (vectorA, vectorB) => {
  const magnitudeB = magnitude(vectorB);
  const length = dotProduct(vectorA, vectorB) / magnitudeB;
  return vectorMultiply(vectorB, length / magnitudeB);
};

const angleAToB = (a, b) => Math.atan((b.y0 - a.y0) / (b.x0 - a.x0));

const vectorAToB = (a, b) => {
  const angle = angleAToB(a, b);
  return [ Math.cos(angle), Math.sin(angle) ];
};

export const getCollisionVector = (subject, target) => {
  const centerOfMassVector = vectorAToB(subject, target);
  return vectorProjection(subject.velocityVector, centerOfMassVector);
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

export const isDiagonal = dir => {
  return ![ DIRECTIONS.LEFT, DIRECTIONS.RIGHT, DIRECTIONS.UP, DIRECTIONS.DOWN ].includes(dir);
}