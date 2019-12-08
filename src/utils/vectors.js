export class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  add(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
  };

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  };

  get length() {
    return Math.sqrt(this.dot(this));
  };
};


const MIN_VECTOR_MAGNITUDE = 0.0001;

const magnitude = ([ x, y ] = vector) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
const dotProduct = (vectorA, vectorB) => vectorA.reduce((acc, coord, index) => acc + (coord * vectorB[index]), 0);
const vectorMultiply = (vector, scalarMult) => vector.map(scalar => scalar * scalarMult);
const resultantVector = (...vectors) => vectors.reduce((acc, vector) => [ acc[0] + vector[0], acc[1] + vector[1]], [0, 0]);

const angleAToB = (a, b) => Math.atan((b.y0 - a.y0) / (b.x0 - a.x0));

const vectorAngle = vector => Math.atan(vector[1], vector[0]);

const getUnitVector = vector => vectorMultiply(vector, 1 / magnitude(vector));

const normalVectorFromAngle = angle => [ Math.cos(angle), Math.sin(angle) ];

const normalizedVectorAToB = (a, b) => {
  const angle = angleAToB(a, b);
  return normalVectorFromAngle(angle);
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

const getCollidingAndReboundVectors = (subject, target, isXCollision) => {
  const { velocity } = subject;
  const isTargetTile = !target.isCharacter;
  
  let collidingVector, reboundVector;
  if (isTargetTile) {
    collidingVector = isXCollision ? reflectY(velocity) : reflectX(velocity);
    reboundVector = [ 0, 0 ];
  } else {
    // we use the subject's velocity vector b/c velocity is only current *during* updateMove()
    const centerOfMassVector = normalizedVectorAToB(subject, target);
    collidingVector = vectorProjection(velocity, centerOfMassVector);

    if (magnitude(collidingVector).round() === 0) {
      // if a collision barely glances, a collision happens nonetheless and prevents movement
      // for the collider, so we must do the bare minimum to affect the collided 
      const unitCollidingVector = getUnitVector(collidingVector);
      collidingVector = vectorMultiply(unitCollidingVector, MIN_VECTOR_MAGNITUDE); 
      reboundVector = resultantVector(velocity, vectorMultiply(collidingVector, -1));
    } else {
      const velocityMagnitude = magnitude(velocity);
      const collidingMagnitude = magnitude(collidingVector);
      const normalCollidingVector = vectorMultiply(collidingVector, collidingMagnitude);
      const oppositeCollidingVector = vectorMultiply(normalCollidingVector, -1);
      reboundVector = vectorMultiply(oppositeCollidingVector, velocityMagnitude - collidingMagnitude);
    }
  }
  
  return [ collidingVector, reboundVector ];
};

const getTargetMassAndVector = target => {
  let mass, vector;

  if (target.isCharacter) {
    // we use the target's momentum vector b/c it reflects what the target's velocity last *was*
    mass = target.mass;
    vector = vectorMultiply(target.momentum, 1 / target.mass);
  } else {
    // assume tile object (infinite mass, non-moving)
    mass = 1000000;
    vector = [ 0, 0 ];
  }

  return [ mass, vector ];
};

export const getCollisionVectors = (subject, target, isXCollision) => {  
  const m1 = subject.mass;
  const [ collidingVector, reboundVector ] = getCollidingAndReboundVectors(subject, target, isXCollision);
  const [ m2, v2 ] = getTargetMassAndVector(target);

  const [ colliderVector, collidedVector ] = elasticCollisionVectors(m1, collidingVector, m2, v2);

  const colliderWithReboundVector = resultantVector(colliderVector, reboundVector);

  return [ colliderWithReboundVector, collidedVector ];
};

export const subtractScalar = (scalar, add) => {
  if (Math.sign(scalar) === 1) return scalar - add;
  if (Math.sign(scalar) === -1) return scalar + add;
  return 0;
};