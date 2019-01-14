import Vector2 from "./Vector2";
import ImmutableVector3 from "./ImmutableVector3";
import Vector4 from "./Vector4";
import Vector3 from "./Vector3";
import { CompositionType } from "../definitions/CompositionType";

export default class MutableVector3 extends ImmutableVector3 implements Vector3 {
  constructor(x: number|TypedArray|Vector2|Vector3|Vector4, y?: number, z?: number) {
    super(x as any, y, z);
  }

  static get compositionType() {
    return CompositionType.Vec3;
  }


  zero() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    return this;
  }

  one() {
    this.x = 1;
    this.y = 1;
    this.z = 1;

    return this;
  }



  /**
   * to square length
   */
  lengthSquared() {
    return this.x*this.x + this.y*this.y + this.z*this.z;
  }


  /**
   * cross product
   */
  cross(v:ImmutableVector3) {
    var x = this.y*v.z - this.z*v.y;
    var y = this.z*v.x - this.x*v.z;
    var z = this.x*v.y - this.y*v.x;

    this.x = x;
    this.y = y;
    this.z = z;

    return this;
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
   * add value
   */
  add(v:ImmutableVector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

    /**
   * subtract
   */
  subtract(v:ImmutableVector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
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
      console.error("0 division occured!");
      this.x = Infinity;
      this.y = Infinity;
      this.z = Infinity;
    }

    return this;
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
  multiplyVector(vec:ImmutableVector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;

    return this;
  }

    /**
   * divide vector
   */
  divideVector(vec3:ImmutableVector3) {
    this.x /= vec3.x;
    this.y /= vec3.y;
    this.z /= vec3.z;

    return this;
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
