//import GLBoost from './../../globals';
import Vector2 from './Vector2';
import Vector4 from './ImmutableVector4';
import is from '../misc/IsUtil';
import Vector3 from './Vector3';

export default class ImmutableVector3 implements Vector3 {
  v: TypedArray;

  constructor(x?:number|TypedArray|Vector2|Vector3|Vector4|Array<number>|null, y?:number, z?:number) {
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

  isStrictEqual(vec:ImmutableVector3) {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: ImmutableVector3, delta: number = Number.EPSILON) {
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
    return new ImmutableVector3(0, 0, 0);
  }

  static one() {
    return new ImmutableVector3(1, 1, 1);
  }

  static dummy() {
    return new ImmutableVector3(null);
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  clone() {
    return new ImmutableVector3(this.x, this.y, this.z);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  /**
   * to square length(static verison)
   */
  static lengthSquared(vec3:ImmutableVector3) {
    return vec3.x*vec3.x + vec3.y*vec3.y + vec3.z*vec3.z;
  }

  lengthTo(vec3:ImmutableVector3) {
    var deltaX = vec3.x - this.x;
    var deltaY = vec3.y - this.y;
    var deltaZ = vec3.z - this.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  static lengthBtw(lhv:ImmutableVector3, rhv:ImmutableVector3) {
    var deltaX = rhv.x - lhv.x;
    var deltaY = rhv.y - lhv.y;
    var deltaZ = rhv.z - lhv.z;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  }

  /**
   * dot product
   */
  dotProduct(vec3:ImmutableVector3) {
      return this.x * vec3.x + this.y * vec3.y + this.z * vec3.z;
  }

  /**
   * dot product(static version)
   */
  static dotProduct(lv:ImmutableVector3, rv:ImmutableVector3) {
    return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z;
  }

  /**
  * cross product(static version)
  */
  static cross(lv:ImmutableVector3, rv:ImmutableVector3) {
    var x = lv.y*rv.z - lv.z*rv.y;
    var y = lv.z*rv.x - lv.x*rv.z;
    var z = lv.x*rv.y - lv.y*rv.x;

    return new ImmutableVector3(x, y, z);
  }


  /**
   * normalize(static version)
   */
  static normalize(vec3:ImmutableVector3) {
    var length = vec3.length();
    var newVec = new ImmutableVector3(vec3.x, vec3.y, vec3.z);
    newVec = ImmutableVector3.divide(newVec, length);

    return newVec;
  }


  /**
   * add value（static version）
   */
  static add(lv:ImmutableVector3, rv:ImmutableVector3) {
    return new ImmutableVector3(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z);
  }


  /**
   * subtract(subtract)
   */
  static subtract(lv:ImmutableVector3, rv:ImmutableVector3) {
    return new ImmutableVector3(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z);
  }



  /**
   * divide(static version)
   */
  static divide(vec3:ImmutableVector3, val:number) {
    if (val !== 0) {
      return new ImmutableVector3(vec3.x / val, vec3.y / val, vec3.z / val);
    } else {
      console.error("0 division occured!");
      return new ImmutableVector3(Infinity, Infinity, Infinity);
    }
  }

  /**
   * multiply(static version)
   */
  static multiply(vec3:ImmutableVector3, val:number) {
    return new ImmutableVector3(vec3.x * val, vec3.y * val, vec3.z * val);
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVector(vec3:ImmutableVector3, vec:ImmutableVector3) {
    return new ImmutableVector3(vec3.x * vec.x, vec3.y * vec.y, vec3.z * vec.z);
  }

  static angleOfVectors(lhv:ImmutableVector3, rhv:ImmutableVector3) {
    let cos_sita = ImmutableVector3.dotProduct(lhv, rhv) / ( lhv.length() * rhv.length() );

    let sita = Math.acos(cos_sita);

    return sita;
  }

  /**
   * divide vector(static version)
   */
  static divideVector(lvec3:ImmutableVector3, rvec3:ImmutableVector3) {
    return new ImmutableVector3(lvec3.x / rvec3.x, lvec3.y / rvec3.y, lvec3.z / rvec3.z);
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
