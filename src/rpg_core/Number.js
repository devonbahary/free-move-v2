
Number.prototype.round = function() {
  return Math.sign(this) * Math.round(Math.abs(this) * 10000) / 10000;
};