export class Vector {
  static zero = new Vector(0, 0, 0);
  static one = new Vector(1, 1, 1);
  static half = new Vector(0.5, 0.5, 0.5);
  static center = Vector.half;
  static topLeft = new Vector(0, 1);
  static topRight = new Vector(1, 1);
  static bottomRight = new Vector(1, 0);
  static bottomLeft = Vector.zero;

  static down = new Vector(0, -1);
  static up = new Vector(0, 1);
  static right = new Vector(1, 0);
  static left = new Vector(-1, 0);

  public x: number;
  public y: number;
  public z: number;

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

  withX(x: number) {
    return new Vector(x, this.y, this.z);
  }

  withY(y: number) {
    return new Vector(this.x, y, this.z);
  }

  withZ(z: number) {
    return new Vector(this.x, this.y, z);
  }

  clone() {
    return new Vector(this.x, this.y, this.z);
  }

  distance(other: Vector) {
    return this.subtract(other).length;
  }

  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector) {
    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  multiply(scalar: number) {
    return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  multiplyParts(other: Vector) {
    return new Vector(this.x * other.x, this.y * other.y, this.z * other.z);
  }

  divide(scalar: number) {
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

  within(center: Vector, dimensions: Vector) {
    let halfWidth = dimensions.width / 2;
    let halfHeight = dimensions.height / 2;
    return this.x >= center.x - halfWidth && this.x <= center.x + halfWidth &&
           this.y >= center.y - halfHeight && this.y <= center.y + halfHeight;
  }

  adjacentTo(other: Vector) {
    return (Math.abs(this.x - other.x) == 1 &&
            this.y - other.y == 0) ||
           (Math.abs(this.y - other.y) == 1 &&
            this.x - other.x == 0);
  }

  equals(other: Vector) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }
}

export class Color {
  static white = new Color(1, 1, 1, 1);
  static gray = new Color(0.5, 0.5, 0.5, 1);
  static black = new Color(0, 0, 0, 1);
  static clear = new Color(0, 0, 0, 0);

  public r: number;
  public g: number;
  public b: number;
  public a: number;

  constructor(r: number, g: number, b: number, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}
