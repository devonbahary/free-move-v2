export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return scalar - add;
  if (Math.sign(scalar) === -1) return scalar + add;
  return 0;
};

const vectorMultiply = (vector, scalarMult) => vector.map(scalar => scalar * scalarMult);

const dotProduct = (vectorA, vectorB) => vectorA.reduce((acc, coord, index) => acc + (coord * vectorB[index]), 0);

const magnitude = ([ x, y ] = vector) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

// vector projection of a onto b
const vectorProjection = (vectorA, vectorB) => {
  const magnitudeB = magnitude(vectorB);
  const scalarProjection = dotProduct(vectorA, vectorB) / magnitudeB;
  const unitVectorB = vectorMultiply(vectorB, 1 / magnitudeB);
  return vectorMultiply(unitVectorB, scalarProjection);
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