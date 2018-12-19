
class _Vector2<T extends TypedArray, S extends TypedArrayConstructor> {
  v: TypedArray;
  private __typedArray: S;

  constructor(typedArray:S, x:number|TypedArray, y?:number) {
    this.__typedArray = typedArray;
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else {
      this.v = new typedArray(2)
    }

    this.x = ((x as any) as number);
    this.y = ((y as any) as number);
  }

  get className() {
    return this.constructor.name;
  }

  clone() {
    return new _Vector2(this.__typedArray, this.x, this.y);
  }

  multiply(val:number) {
    this.x *= val;
    this.y *= val;

    return this;
  }

  isStrictEqual(vec:_Vector2<T, S>) {
    if (this.x === vec.x && this.y === vec.y) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: _Vector2<T, S>, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta) {
      return true;
    } else {
      return false;
    }
  }

  
  static multiply<T extends TypedArray, S extends TypedArrayConstructor>(typedArray:S, vec2:_Vector2<T, S>, val:number) {
    return new _Vector2(typedArray, vec2.x * val, vec2.y * val);
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

export class Vector2_F64 extends _Vector2<Float64Array, Float64ArrayConstructor> {
  constructor(x:number|TypedArray, y?:number) {
    super(Float64Array, x, y);
  }
}

export default Vector2_F64; // Use as `import Vector2 from '**/Vector2';`

