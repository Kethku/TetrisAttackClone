export class Vector {
  constructor(x, y, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  get xy() {
    return new Vector(this.x, this.y, 0);
  }

  get yz() {
    return new Vector(0, this.y, this.z);
  }

  get xz() {
    return new Vector(this.x, 0, this.z);
  }

  get width() {
    return this.x;
  }

  get height() {
    return this.y;
  }

  distance(other) {
    return this.subtract(other).length;
  }

  add(other) {
    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other) {
    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  multiplyParts(other) {
    return new Vector(this.x * other.x, this.y * other.y, this.z * other.z);
  }

  divide(scalar) {
    return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  normalize() {
    return this.divide(this.length);
  }

  floor() {
    return new Vector(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
  }

  ceil() {
    return new Vector(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
  }
}

Vector.zero = new Vector(0, 0, 0);
Vector.one = new Vector(1, 1, 1);
Vector.half = new Vector(0.5, 0.5, 0.5);
Vector.topLeft = new Vector(0, 1);
Vector.topRight = new Vector(1, 1);
Vector.bottomRight = new Vector(1, 0);
Vector.bottomLeft = Vector.zero;

Vector.down = new Vector(0, -1);
Vector.up = new Vector(0, 1);
Vector.right = new Vector(1, 0);
Vector.left = new Vector(-1, 0);

export class Color {
  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

Color.white = new Color(1, 1, 1, 1);
Color.gray = new Color(0.5, 0.5, 0.5, 1);
Color.black = new Color(0, 0, 0, 1);
Color.clear = new Color(0, 0, 0, 0);
