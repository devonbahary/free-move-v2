const magnitude = ([ x, y ] = vector) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
const dotProduct = (vectorA, vectorB) => vectorA.reduce((acc, coord, index) => acc + (coord * vectorB[index]), 0);
const vectorMultiply = (vector, scalarMult) => vector.map(scalar => scalar * scalarMult);

const angleAToB = (a, b) => Math.atan((b.y0 - a.y0) / (b.x0 - a.x0));

const normalizedVectorAToB = (a, b) => {
  const angle = angleAToB(a, b);
  return [ Math.cos(angle), Math.sin(angle) ];
};

const reflectX = vector => [ -vector[0], vector[1] ];
const reflectY = vector => [ vector[0], -vector[1] ];

// vector projection of a onto b
const vectorProjection = (vectorA, vectorB) => {
  const scalarProjection = dotProduct(vectorA, vectorB) / Math.pow(magnitude(vectorB), 2);
  return vectorMultiply(vectorB, scalarProjection);
};

// based on the following formulas:
//  m1v1 + m2v2 = m1v1' + m2v2'
//  v1 + v1' = v2 + v2'
const collisionFinalVectors = (m1, v1, m2, v2) => {
  const v1f = (v1 + (2 * v2 * m2 / m1) - (v1 * m2 / m1)) / (1 + m2 / m1);
  const v2f = v1 + v1f - v2;
  return [ v1f, v2f ];
};

const elasticCollisionVectors = (m1, v1, m2, v2) => {
  const finalXVectors = collisionFinalVectors(m1, v1[0], m2, v2[0]);
  const finalYVectors = collisionFinalVectors(m1, v1[1], m2, v2[1]);
  return [
    [ finalXVectors[0], finalYVectors[0] ],
    [ finalXVectors[1], finalYVectors[1] ],
  ];
};

const getCollidingVector = (subject, target, isXCollision) => {
  const { velocityVector } = subject;
  const isTargetTile = !target.isCharacter;
  
  if (isTargetTile) {
    return isXCollision ? reflectY(velocityVector) : reflectX(velocityVector);
  } else {
    // we use the subject's velocity vector b/c velocity is only current *during* updateMove()
    const centerOfMassVector = normalizedVectorAToB(subject, target);
    return vectorProjection(velocityVector, centerOfMassVector);
  }
};

const getTargetMassAndVector = target => {
  let mass, vector;

  if (target.isCharacter) {
    // we use the target's momentum vector b/c it reflects what the target's velocity last *was*
    mass = target.mass;
    vector = vectorMultiply(target.momentumVector, 1 / target.mass);
  } else {
    // assume tile object (infinite mass, non-moving)
    mass = 1000000;
    vector = [ 0, 0 ];
  }

  return [ mass, vector ];
};

export const getCollisionVectors = (subject, target, isXCollision) => {  
  const m1 = subject.mass;
  const v1 = getCollidingVector(subject, target, isXCollision);
  const [ m2, v2 ] = getTargetMassAndVector(target);

  return elasticCollisionVectors(m1, v1, m2, v2);
};

export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return scalar - add;
  if (Math.sign(scalar) === -1) return scalar + add;
  return 0;
};