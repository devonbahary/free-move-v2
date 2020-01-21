const getTileCollisionResult = (subject, tile) => {
  const { x, y, z } = subject.velocity;
  const isXCollision = (tile.x2 - subject.x1).abs() <= 0.0001 || (tile.x1 - subject.x2).abs() <= 0.0001;
  const colliderVector = isXCollision ? new Vector(-x, y, z) : new Vector(x, -y, z);
  return [ colliderVector ];
};

const finalVectorForElasticCollisionBetweenTwoMovingObjects = (v1, m1, x1, v2, m2, x2) => {
  const posDiffVector = x1.subtract(x2);
  const coefficient = (2 * m2 / (m1 + m2));
  const dotProduct = v1.subtract(v2).dot(posDiffVector);
  return v1.subtract(posDiffVector.multiply(coefficient * dotProduct / Math.pow(posDiffVector.length, 2)));
};

const getCharCollisionResult = (subject, target) => {
  const { velocity: v1, mass: m1 } = subject;
  const { velocityOfMomentum: v2, mass: m2 } = target;
  
  const x1 = new Vector(subject.x0, subject.y0);
  const x2 = new Vector(target.x0, target.y0);

  const v1Prime = finalVectorForElasticCollisionBetweenTwoMovingObjects(v1, m1, x1, v2, m2, x2);
  const v2Prime = finalVectorForElasticCollisionBetweenTwoMovingObjects(v2, m2, x2, v1, m1, x1);

  return [ v1Prime, v2Prime ];
};

const roundFour = num => Math.round(num * 1000) / 1000;

export default class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  get unit() {
    return this.divide(this.length);
  };

  get perpendicularUnit() {
    return new Vector(this.y, -this.x).unit;
  };

  get length() {
    return Math.sqrt(this.dot(this));
  };

  static getCollisionVectors(subject, target) {
    if (!target.isCharacter) return getTileCollisionResult(subject, target);
    return getCharCollisionResult(subject, target);
  };

  static projection(vectorA, vectorB) { // vector projection of this vectorA onto vectorB
    return vectorB.multiply(vectorA.dot(vectorB) / Math.pow(vectorB.length, 2));
  };

  static angleBetween(vectorA, vectorB) {
    return Math.acos(vectorA.dot(vectorB) / (vectorA.length * vectorB.length));
  };

  add(v) {
    return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
  };

  subtract(v) {
    return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
  };

  subtractMagnitude(v) {
    return new Vector(this.x.subtractMagnitude(v.x), this.y.subtractMagnitude(v.y), this.z.subtractMagnitude(v.z));
  }

  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  };

  planar() { // x, y component
    return new Vector(this.x, this.y);
  }

  divide(scalar) {
    return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
  };

  equals(v) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  };

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  };

  toString(v) {
    return `<${roundFour(this.x)}, ${roundFour(this.y)}` + (this.z ? `, ${roundFour(this.z)}` : ``) + `>`;
  }
};
