const magnitude = ([ x, y ] = vector) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
const dotProduct = (vectorA, vectorB) => vectorA.reduce((acc, coord, index) => acc + (coord * vectorB[index]), 0);
const vectorMultiply = (vector, scalarMult) => vector.map(scalar => scalar * scalarMult);

const angleAToB = (a, b) => Math.atan((b.y0 - a.y0) / (b.x0 - a.x0));

const vectorAToB = (a, b) => {
  const angle = angleAToB(a, b);
  return [ Math.cos(angle), Math.sin(angle) ];
};

// vector projection of a onto b
const vectorProjection = (vectorA, vectorB) => {
  const magnitudeB = magnitude(vectorB);
  const scalarProjection = dotProduct(vectorA, vectorB) / magnitudeB;
  const unitVectorB = vectorMultiply(vectorB, 1 / magnitudeB);
  return vectorMultiply(unitVectorB, scalarProjection);
};

// based on the following formulas:
//  m1v1 + m2v2 = m1v1' + m2v2'
//  v1 + v1' = v2 + v2'
const collisionFinalVectors = (m1, v1, m2, v2) => {
  const v1f = (v1 + (2 * v2 * m2 / m1) - (v1 * m2 / m1)) / (1 + m2 / m1);
  const v2f = v1 + v1f - v2;
  return [ v1f, v2f ];
};

const elasticCollisionVectors = (m1, vector1, m2, vector2) => {
  const finalXVectors = collisionFinalVectors(m1, vector1[0], m2, vector2[0]);
  const finalYVectors = collisionFinalVectors(m1, vector1[1], m2, vector2[1]);
  return [
    [ finalXVectors[0], finalYVectors[0] ],
    [ finalXVectors[1], finalYVectors[1] ],
  ];
};

export const getCollisionVectors = (subject, target) => {
  const centerOfMassVector = vectorAToB(subject, target);
  const collidingVector = vectorProjection(subject.velocityVector, centerOfMassVector);

  return elasticCollisionVectors(subject.mass, collidingVector, target.mass, target.momentumVector);
};

export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return scalar - add;
  if (Math.sign(scalar) === -1) return scalar + add;
  return 0;
};