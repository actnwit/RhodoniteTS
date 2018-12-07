export default class Vector2 {
  v: TypedArray;

  constructor(x:number|TypedArray, y?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else {
      this.v = new Float32Array(2)
    }

    this.x = ((x as any) as number);
    this.y = ((y as any) as number);
  }

  get className() {
    return this.constructor.name;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  multiply(val:number) {
    this.x *= val;
    this.y *= val;

    return this;
  }

  isStrictEqual(vec:Vector2) {
    if (this.x === vec.x && this.y === vec.y) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector2, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta) {
      return true;
    } else {
      return false;
    }
  }

  static multiply(vec2:Vector2, val:number) {
    return new Vector2(vec2.x * val, vec2.y * val);
  }

  get x() {
    return this.v[0];
  }

  set x(x:number) {
    this.v[0] = x;
  }

  get y() {
    return this.v[1];
  }

  set y(y:number) {
    this.v[1] = y;
  }

  get raw() {
    return this.v;
  }
}

// GLBoost["Vector2"] = Vector2;
