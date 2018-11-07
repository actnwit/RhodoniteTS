//import GLBoost from './../../globals';
import MathUtil from './MathUtil';
import Vector2 from './Vector2';
import Vector4 from './Vector4';
import is from '../misc/IsUtil';

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

export default class Vector3 {
  v: TypedArray;

  constructor(x:number|TypedArray|Vector2|Vector3|Vector4, y?:number, z?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else {
      this.v = new Float32Array(3);
    }

    if (is.not.exist(x)) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    } else if (Array.isArray(x)) {
      this.x = x[0];
      this.y = x[1];
      this.z = x[2];
    } else if (typeof (x as any).w !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = (x as any).z;
    } else if (typeof (x as any).z !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = (x as any).z;
    } else if (typeof (x as any).y !== 'undefined') {
      this.x = (x as any).x;
      this.y = (x as any).y;
      this.z = 0;
    } else {
      this.x = ((x as any) as number);
      this.y = ((y as any) as number);
      this.z = ((z as any) as number);
    }
  }

  get className() {
    return this.constructor.name;
  }

  isEqual(vec:Vector3) {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Zero Vector
   */
  static zero() {
    return new Vector3(0, 0, 0);
  }



  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  /*
   * disabled for now because Safari's Function.prototype.length is not configurable yet.
   */
  /*
  static length(vec3) {
    return Math.sqrt(vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z);
  }
  */

  /**
   * to square length
   */
  lengthSquared() {
    return this.x*this.x + this.y*this.y + this.z*this.z;
  }

  /**
   * to square length(static verison)
   */
  static lengthSquared(vec3:Vector3) {
    return vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z;
  }

  lengthTo(vec3:Vector3) {
    var deltaX = vec3.x - this.x;
    var deltaY = vec3.y - this.y;
    var deltaZ = vec3.z - this.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  static lengthBtw(lhv:Vector3, rhv:Vector3) {
    var deltaX = rhv.x - lhv.x;
    var deltaY = rhv.y - lhv.y;
    var deltaZ = rhv.z - lhv.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  /**
   * dot product
   */
  dotProduct(vec3:Vector3) {
      return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
  }

  /**
   * dot product(static version)
   */
  static dotProduct(lv:Vector3, rv:Vector3) {
    return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
  }

  /**
   * cross product
   */
  cross(v:Vector3) {
    var x = this.y*v.z - this.z*v.y;
    var y = this.z*v.x - this.x*v.z;
    var z = this.x*v.y - this.y*v.x;

    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  /**
  * cross product(static version)
  */
  static cross(lv:Vector3, rv:Vector3) {
    var x = lv.y*rv.z - lv.z*rv.y;
    var y = lv.z*rv.x - lv.x*rv.z;
    var z = lv.x*rv.y - lv.y*rv.x;

    return new Vector3(x, y, z);
  }

  /**
   * normalize
   */
  normalize() {
    var length = this.length();
    this.divide(length);

    return this;
  }

  /**
   * normalize(static version)
   */
  static normalize(vec3:Vector3) {
    var length = vec3.length();
    var newVec = new Vector3(vec3.x, vec3.y, vec3.z);
    newVec.divide(length);

    return newVec;
  }

  /**
   * add value
   */
  add(v:Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  /**
   * add value（static version）
   */
  static add(lv:Vector3, rv:Vector3) {
    return new Vector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
  }

  /**
   * subtract
   */
  subtract(v:Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
  }

  /**
   * subtract(subtract)
   */
  static subtract(lv:Vector3, rv:Vector3) {
    return new Vector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
  }

  /**
   * divide
   */
  divide(val:number) {
    if (val !== 0) {
      this.x /= val;
      this.y /= val;
      this.z /= val;
    } else {
      console.warn("0 division occured!");
      this.x = Infinity;
      this.y = Infinity;
      this.z = Infinity;
    }

    return this;
  }

  /**
   * divide(static version)
   */
  static divide(vec3:Vector3, val:number) {
    if (val !== 0) {
      return new Vector3(vec3.x / val, vec3.y / val, vec3.z / val);
    } else {
      console.warn("0 division occured!");
      return new Vector3(Infinity, Infinity, Infinity);
    }
  }

  /**
   * multiply
   */
  multiply(val:number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;

    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec:Vector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;

    return this;
  }

  /**
   * multiply(static version)
   */
  static multiply(vec3:Vector3, val:number) {
    return new Vector3(vec3.x * val, vec3.y * val, vec3.z * val);
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVector(vec3:Vector3, vec:Vector3) {
    return new Vector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
  }

  static angleOfVectors(lhv:Vector3, rhv:Vector3) {
    let cos_sita = Vector3.dotProduct(lhv, rhv) / ( lhv.length() * rhv.length() );

    let sita = Math.acos(cos_sita);

    if (GLBoost["VALUE_ANGLE_UNIT"] === GLBoost.DEGREE) {
      sita = MathUtil.radianToDegree(sita);
    }

    return sita;
  }

  /**
   * divide vector
   */
  divideVector(vec3:Vector3) {
    this.x /= vec3.x;
    this.y /= vec3.y;
    this.z /= vec3.z;

    return this;
  }

  /**
   * divide vector(static version)
   */
  static divideVector(lvec3:Vector3, rvec3:Vector3) {
    return new Vector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
  }

  /**
   * change to string
   */
  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z +')';
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

  get z() {
    return this.v[2];
  }

  set z(z:number) {
    this.v[2] = z;
  }

  get raw() {
    return this.v;
  }
}

//GLBoost['Vector3'] = Vector3;
