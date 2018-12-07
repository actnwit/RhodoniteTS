//import GLBoost from '../../globals';
import Vector2 from './Vector2';
import Vector3 from './Vector3';

export default class Vector4 {
  v: TypedArray;

  constructor(x:number|TypedArray|Vector2|Vector3|Vector4, y?:number, z?:number, w?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else {
      this.v = new Float32Array(4);
    }

    if (!(x != null)) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else if (Array.isArray(x)) {
      this.x = x[0];
      this.y = x[1];
      this.z = x[2];
      this.w = x[3];
    } else if (typeof (x as any).w !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = (x as any).z;
      this.w = (x as any).w;
    } else if (typeof (x as any).z !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = (x as any).z;
      this.w = 1;
    } else if (typeof (x as any).y !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = 0;
      this.w = 1;
    } else {
      this.x = ((x as any) as number);
      this.y = ((y as any) as number);
      this.z = ((z as any) as number);
      this.w = ((w as any) as number);
    }
  }

  get className() {
    return this.constructor.name;
  }

  isStrictEqual(vec:Vector4): boolean {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z && this.w === vec.w) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector4, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta &&
      Math.abs(vec.z - this.z) < delta &&
      Math.abs(vec.w - this.w) < delta) {
      return true;
    } else {
      return false;
    }
  }

  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }

  /**
   * Zero Vector
   */
  static zero() {
    return new Vector4(0, 0, 0, 1);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
  }

  normalize() {
    var length = this.length();
    this.divide(length);

    return this;
  }

  static normalize(vec4:Vector4) {
    var length = vec4.length();
    var newVec = new Vector4(vec4.x, vec4.y, vec4.z, vec4.w);
    newVec.divide(length);

    return newVec;
  }
  
  /**
   * add value
   */
  add(v:Vector4) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;
    
    return this;
  }

  /**
   * add value（static version）
   */
  static add(lv:Vector4, rv:Vector4) {
    return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z + rv.z);
  }

  /**
   * add value except w component
   */
  addWithOutW(v:Vector4|Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    
    return this;
  }

  subtract(v:Vector4) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;

    return this;
  }

  static subtract(lv:Vector4, rv:Vector4) {
    return new Vector4(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w  - rv.w);
  }
  /**
   * add value except w component（static version）
   */
  static addWithOutW(lv:Vector4, rv:Vector4) {
    return new Vector4(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z);
  }

  multiply(val:number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;
    this.w *= val;
    
    return this;
  }

  multiplyVector(vec:Vector4) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    this.w *= vec.w;
    
    return this;
  }

  static multiply(vec4:Vector4, val:number) {
    return new Vector4(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
  }

  static multiplyVector(vec4:Vector4, vec:Vector4) {
    return new Vector4(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
  }


  divide(val:number) {
    if (val !== 0) {
      this.x /= val;
      this.y /= val;
      this.z /= val;
      this.w /= val;
    } else {
      console.warn("0 division occured!");
      this.x = Infinity;
      this.y = Infinity;
      this.z = Infinity;
      this.w = Infinity;
    }
    return this;
  }

  static divide(vec4:Vector4, val:number) {
    if (val !== 0) {
      return new Vector4(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
    } else {
      console.warn("0 division occured!");
      return new Vector4(Infinity, Infinity, Infinity, Infinity);
    }
  }

  divideVector(vec4:Vector4) {
    this.x /= vec4.x;
    this.y /= vec4.y;
    this.z /= vec4.z;
    this.w /= vec4.w;

    return this;
  }

  static divideVector(lvec4:Vector4, rvec4:Vector4) {
    return new Vector4(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
  }

  get x():number {
    return this.v[0];
  }

  set x(x:number) {
    this.v[0] = x;
  }

  get y():number {
    return this.v[1];
  }

  set y(y:number) {
    this.v[1] = y;
  }

  get z():number {
    return this.v[2];
  }

  set z(z:number) {
    this.v[2] = z;
  }

  get w():number {
    return this.v[3];
  }

  set w(w:number) {
    this.v[3] = w;
  }

  get raw() {
    return this.v;
  }
}

// GLBoost["Vector4"] = Vector4;
