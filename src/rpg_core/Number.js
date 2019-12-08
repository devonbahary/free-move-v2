Number.prototype.abs = function() {
  return Math.abs(this);
};

Number.prototype.round = function() {
  return Math.sign(this) * Math.round(Math.abs(this) * 10000) / 10000;
};

Number.prototype.subtractMagnitude = function(sub) {
  if (Math.sign(this) === 1) return this - sub;
  if (Math.sign(this) === -1) return this + sub;
  return 0;
};