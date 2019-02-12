//import GLBoost from './../../globals';
import Vector2 from './Vector2';
import Vector4 from './Vector4';
import is from '../misc/IsUtil';
import {IVector3} from './IVector';
import { CompositionType } from '../definitions/CompositionType';

export default class Vector3 implements IVector3 {
  v: TypedArray;

  constructor(x?:number|TypedArray|Vector2|IVector3|Vector4|Array<number>|null, y?:number, z?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new Float32Array(0);
      return;
    } else {
      this.v = new Float32Array(3);
    }

    if (is.not.exist(x)) {
      this.v[0] = 0;
      this.v[1] = 0;
      this.v[2] = 0;
    } else if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
    } else if (typeof (x as any).w !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
    } else if (typeof (x as any).z !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
    } else if (typeof (x as any).y !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = 0;
    } else {
      this.v[0] = ((x as any) as number);
      this.v[1] = ((y as any) as number);
      this.v[2] = ((z as any) as number);
    }
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Vec3;
  }

  isStrictEqual(vec:Vector3) {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector3, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta &&
      Math.abs(vec.z - this.z) < delta) {
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

  static one() {
    return new Vector3(1, 1, 1);
  }

  static dummy() {
    return new Vector3(null);
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  copyComponents(vec: Vector3) {
    this.v[0] = vec.v[0];
    this.v[1] = vec.v[1];
    this.v[2] = vec.v[2];
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
  * cross product(static version)
  */
  static cross(lv:Vector3, rv:Vector3) {
    var x = lv.y*rv.z - lv.z*rv.y;
    var y = lv.z*rv.x - lv.x*rv.z;
    var z = lv.x*rv.y - lv.y*rv.x;

    return lv.constructor(x, y, z);
  }


  /**
   * normalize(static version)
   */
  static normalize(vec3:Vector3) {
    var length = vec3.length();
    var newVec = vec3.constructor(vec3.x, vec3.y, vec3.z);
    newVec = Vector3.divide(newVec, length);

    return newVec;
  }


  /**
   * add value（static version）
   */
  static add(lv:Vector3, rv:Vector3) {
    return lv.constructor(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
  }


  /**
   * subtract(subtract)
   */
  static subtract(lv:Vector3, rv:Vector3) {
    return lv.constructor(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
  }



  /**
   * divide(static version)
   */
  static divide(vec3:Vector3, val:number) {
    if (val !== 0) {
      return vec3.constructor(vec3.x / val, vec3.y / val, vec3.z / val);
    } else {
      console.error("0 division occured!");
      return vec3.constructor(Infinity, Infinity, Infinity);
    }
  }

  /**
   * multiply(static version)
   */
  static multiply(vec3:Vector3, val:number) {
    return vec3.constructor(vec3.x * val, vec3.y * val, vec3.z * val);
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVector(vec3:Vector3, vec:Vector3) {
    return vec3.constructor(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
  }

  static angleOfVectors(lhv:Vector3, rhv:Vector3) {
    let cos_sita = Vector3.dotProduct(lhv, rhv) / ( lhv.length() * rhv.length() );

    let sita = Math.acos(cos_sita);

    return sita;
  }

  /**
   * divide vector(static version)
   */
  static divideVector(lvec3:Vector3, rvec3:Vector3) {
    return lvec3.constructor(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
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

  get y() {
    return this.v[1];
  }

  get z() {
    return this.v[2];
  }


  get raw() {
    return this.v;
  }
}

//GLBoost['Vector3'] = Vector3;
