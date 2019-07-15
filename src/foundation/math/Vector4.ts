//import GLBoost from '../../globals';
import Vector2 from './Vector2';
import Vector3 from './Vector3';
import {IVector4, IVector3} from './IVector';
import { CompositionType } from '../definitions/CompositionType';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';

export class Vector4_<T extends TypedArrayConstructor> implements IVector4 {
  v: TypedArray;

  constructor(x:number|TypedArray|Vector2|IVector3|IVector4|Array<number>|null, y:number, z:number, w:number, {type}: {type: T}) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof (x as any).w !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
      this.v[3] = (x as any).w;
    } else if (typeof (x as any).z !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
      this.v[3] = 1;
    } else if (typeof (x as any).y !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = 0;
      this.v[3] = 1;
    } else {
      this.v[0] = ((x as any) as number);
      this.v[1] = ((y as any) as number);
      this.v[2] = ((z as any) as number);
      this.v[3] = ((w as any) as number);
    }
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec:Vector4_<T>): boolean {
    if (this.v[0] === vec.v[0] && this.v[1] === vec.v[1] && this.v[2] === vec.v[2] && this.v[3] === vec.v[3]) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector4_<T>, delta: number = Number.EPSILON) {
    if (Math.abs(vec.v[0] - this.v[0]) < delta &&
      Math.abs(vec.v[1] - this.v[1]) < delta &&
      Math.abs(vec.v[2] - this.v[2]) < delta &&
      Math.abs(vec.v[3] - this.v[3]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  clone() {
    return new (this.constructor as any)(this.x, this.y, this.z, this.w);
  }

  /**
   * Zero Vector
   */
  static zero() {
    return new (this as any)(0, 0, 0, 1);
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
  }


  copyComponents(vec: Vector4_<T>) {
    this.v[0] = vec.v[0];
    this.v[1] = vec.v[1];
    this.v[2] = vec.v[2];
    this.v[3] = vec.v[3];
  }

  /**
   * add value（static version）
   */
  static add(lv:IVector4, rv:IVector4) {
    return new (lv.constructor as any)(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z + rv.z);
  }


  static subtract(lv:IVector4, rv:IVector4) {
    return new (lv.constructor as any)(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w  - rv.w);
  }
  /**
   * add value except w component（static version）
   */
  static addWithOutW(lv:IVector4, rv:IVector4) {
    return new (lv.constructor as any)(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.z);
  }

  static multiply(vec4:IVector4, val:number) {
    return new (vec4.constructor as any)(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
  }

  static multiplyVector(vec4:IVector4, vec:IVector4) {
    return new (vec4.constructor as any)(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
  }


  static divide(vec4:IVector4, val:number) {
    if (val !== 0) {
      return new (vec4.constructor as any)(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
    } else {
      console.warn("0 division occured!");
      return new (vec4.constructor as any)(Infinity, Infinity, Infinity, Infinity);
    }
  }

  static divideVector(lvec4:IVector4, rvec4:IVector4) {
    return new (lvec4.constructor as any)(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
  }

  static normalize(vec4:IVector4) {
    const length = vec4.length();
    let newVec = new (vec4.constructor as any)(vec4.x, vec4.y, vec4.z, vec4.w);
    newVec = Vector4_.divide(newVec, length);

    return newVec;
  }


  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
  }

  get x():number {
    return this.v[0];
  }

  get y():number {
    return this.v[1];
  }

  get z():number {
    return this.v[2];
  }

  get w():number {
    return this.v[3];
  }

}

export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
  constructor(x:number|TypedArray|Vector2|IVector3|Vector4|Array<number>|null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, {type: Float32Array})
  }

  static zeroWithWOne() {
    return new Vector4(0, 0, 0, 1);
  }

  static zero() {
    return new Vector4(0, 0, 0, 0);
  }

  static one() {
    return new Vector4(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4(null, 0, 0, 0);
  }

  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }
}

export class Vector4d extends Vector4_<Float64ArrayConstructor> {
  constructor(x:number|TypedArray|Vector2|IVector3|Vector4|Array<number>|null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, {type: Float64Array})
  }

  static zeroWithWOne() {
    return new Vector4d(0, 0, 0, 1);
  }

  static zero() {
    return new Vector4d(0, 0, 0, 0);
  }

  static one() {
    return new Vector4d(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4d(null, 0, 0, 0);
  }

  clone() {
    return new Vector4d(this.x, this.y, this.z, this.w);
  }
}

export type Vector4f = Vector4;
