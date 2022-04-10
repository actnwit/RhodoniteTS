import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';
import Quaternion from './Quaternion';
import { Matrix33 } from './Matrix33';
import { Matrix44 } from './Matrix44';
import {CompositionTypeEnum} from '../definitions/CompositionType';
import {CompositionType} from '../definitions/CompositionType';
import MutableMatrix44 from './MutableMatrix44';
import { MutableMatrix33 } from './MutableMatrix33';
import { MutableVector4 } from './MutableVector4';
import { MutableVector3 } from './MutableVector3';
import { MutableVector2 } from './MutableVector2';
import { Scalar } from './Scalar';
import MutableQuaternion from './MutableQuaternion';
import { MutableScalar } from './MutableScalar';
import VectorN from './VectorN';
import {TypedArray} from '../../types/CommonTypes';

export default class MathClassUtil {
  private static __tmpVector4_0: MutableVector4 = MutableVector4.zero();
  private static __tmpVector4_1: MutableVector4 = MutableVector4.zero();

  constructor() {}

  static arrayToVector(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== 'undefined') {
        return Vector4.fromCopyArray([
          element[0],
          element[1],
          element[2],
          element[3],
        ]);
      } else if (typeof element[2] !== 'undefined') {
        return Vector3.fromCopyArray([element[0], element[1], element[2]]);
      } else {
        return Vector2.fromCopyArray2([element[0], element[1]]);
      }
    } else {
      return element;
    }
  }

  static arrayToVectorOrMatrix(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[15] !== 'undefined') {
        return new Matrix44(element);
      } else if (typeof element[8] !== 'undefined') {
        return new Matrix33(element);
      } else if (typeof element[3] !== 'undefined') {
        return Vector4.fromCopyArray([
          element[0],
          element[1],
          element[2],
          element[3],
        ]);
      } else if (typeof element[2] !== 'undefined') {
        return Vector3.fromCopyArray([element[0], element[1], element[2]]);
      } else {
        return Vector2.fromCopyArray2([element[0], element[1]]);
      }
    } else {
      return element;
    }
  }

  static getImmutableValueClass(
    compositionType: CompositionTypeEnum
  ): Function | undefined {
    if (compositionType === CompositionType.Vec2) {
      return Vector2;
    } else if (compositionType === CompositionType.Vec3) {
      return Vector3;
    } else if (compositionType === CompositionType.Vec4) {
      return Vector4;
    } else if (compositionType === CompositionType.Mat3) {
      return Matrix33;
    } else if (compositionType === CompositionType.Mat4) {
      return Matrix44;
    }
    return void 0;
  }

  static getMutableValueClass(
    compositionType: CompositionTypeEnum
  ): Function | undefined {
    if (compositionType === CompositionType.Vec2) {
      return MutableVector2;
    } else if (compositionType === CompositionType.Vec3) {
      return MutableVector3;
    } else if (compositionType === CompositionType.Vec4) {
      return MutableVector4;
    } else if (compositionType === CompositionType.Mat3) {
      return MutableMatrix33;
    } else if (compositionType === CompositionType.Mat4) {
      return MutableMatrix44;
    } else {
      return void 0;
    }
  }

  static cloneOfMathObjects(element: any) {
    if (element instanceof Matrix44) {
      return element.clone();
    } else if (element instanceof Matrix33) {
      return element.clone();
    } else if (element instanceof Vector4) {
      return element.clone();
    } else if (element instanceof Vector3) {
      return element.clone();
    } else if (element instanceof Vector2) {
      return element.clone();
    } else {
      return element;
    }
  }

  static isAcceptableArrayForQuaternion(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== 'undefined') {
        return true;
      }
    }
    return false;
  }

  static arrayToQuaternion(element: Array<number>) {
    return new Quaternion(element[0], element[1], element[2], element[3]);
  }

  static makeSubArray(array: Array<any>, componentN: number) {
    if (componentN === 4) {
      return [array[0], array[1], array[2], array[3]];
    } else if (componentN === 3) {
      return [array[0], array[1], array[2]];
    } else if (componentN === 2) {
      return [array[0], array[1]];
    } else {
      return array[0];
    }
  }

  static vectorToArray(element: Vector2 | Vector3 | Vector4 | Quaternion) {
    if (element instanceof Vector2) {
      return [element.x, element.y];
    } else if (element instanceof Vector3) {
      return [element.x, element.y, element.z];
    } else if (element instanceof Vector4 || element instanceof Quaternion) {
      return [element.x, element.y, element.z, element.w];
    } else {
      return element;
    }
  }

  /**
   * discriminate which Vector instance
   * @param element any Vector instance
   * @return number of Vector instance
   */
  static componentNumberOfVector(
    element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>
  ): number {
    if (element instanceof Vector2) {
      return 2;
    } else if (element instanceof Vector3) {
      return 3;
    } else if (element instanceof Vector4 || element instanceof Quaternion) {
      return 4;
    } else if (Array.isArray(element)) {
      return element.length;
    } else {
      return 0;
    }
  }

  // values range must be [-1, 1]
  static packNormalizedVec4ToVec2(
    x: number,
    y: number,
    z: number,
    w: number,
    criteria: number
  ) {
    let v0 = 0.0;
    let v1 = 0.0;

    x = (x + 1) / 2.0;
    y = (y + 1) / 2.0;
    z = (z + 1) / 2.0;
    w = (w + 1) / 2.0;

    const ir = Math.floor(x * (criteria - 1.0));
    const ig = Math.floor(y * (criteria - 1.0));
    const irg = ir * criteria + ig;
    v0 = irg / criteria;

    const ib = Math.floor(z * (criteria - 1.0));
    const ia = Math.floor(w * (criteria - 1.0));
    const iba = ib * criteria + ia;
    v1 = iba / criteria;

    return [v0, v1];
  }

  static unProjectTo(
    windowPosX: number,
    windowPosY: number,
    windowPosZ: number,
    inversePVMat44: Matrix44,
    viewportVec4: Vector4,
    out: MutableVector3
  ) {
    const input = this.__tmpVector4_0.setComponents(
      ((windowPosX - viewportVec4.x) / viewportVec4.z) * 2 - 1.0,
      ((windowPosY - viewportVec4.y) / viewportVec4.w) * 2 - 1.0,
      2 * windowPosZ - 1.0,
      1.0
    );

    const outNonNormalized = inversePVMat44.multiplyVectorTo(
      input,
      this.__tmpVector4_1
    );
    if (outNonNormalized.w === 0) {
      console.error('0 division occurred!');
    }

    return MutableVector3.multiplyTo(
      outNonNormalized,
      1.0 / outNonNormalized.w,
      out
    );
  }

  static add(lhs: any, rhs: any) {
    if (isFinite(lhs)) {
      // number?
      return lhs + rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.add(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.add(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.add(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.add(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] + rhs[i];
      }
      return arr;
    } else {
      console.error('Non supported type!');
      return;
    }
  }

  static subtract(lhs: any, rhs: any) {
    if (isFinite(lhs)) {
      // number?
      return lhs - rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.subtract(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.subtract(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.subtract(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.subtract(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] - rhs[i];
      }
      return arr;
    } else {
      console.error('Non supported type!');
      return;
    }
  }

  static multiplyNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) {
      // number?
      return lhs * rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] * rhs;
      }
      return arr;
    } else {
      console.error('Non supported type!');
      return;
    }
  }
  static divideNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) {
      // number?
      return lhs / rhs;
    } else if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, 1 / rhs);
    } else if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, 1 / rhs);
    } else if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, 1 / rhs);
    } else if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, 1 / rhs);
    } else if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] / rhs;
      }
      return arr;
    } else {
      console.error('Non supported type!');
      return;
    }
  }

  static initWithScalar(objForDetectType: any, val: number) {
    if (isFinite(objForDetectType)) {
      // number?
      return val;
    } else if (objForDetectType instanceof Vector2) {
      return Vector2.fromCopyArray2([val, val]);
    } else if (objForDetectType instanceof Vector3) {
      return Vector3.fromCopyArray([val, val, val]);
    } else if (objForDetectType instanceof Vector4) {
      return Vector4.fromCopyArray([val, val, val, val]);
    } else if (objForDetectType instanceof Quaternion) {
      return new Quaternion(0, 0, 0, 1);
    } else if (Array.isArray(objForDetectType)) {
      const arr: number[] = [];
      for (let i = 0; i < objForDetectType.length; i++) {
        arr[i] = val;
      }
      return arr;
    } else {
      console.error('Non supported type!');
      return void 0;
    }
  }

  static initWithFloat32Array(
    objForDetectType: any,
    val: any,
    floatArray: Float32Array,
    compositionType: CompositionTypeEnum
  ) {
    let obj;
    if (isFinite(objForDetectType)) {
      // number?
      const array = new Float32Array(floatArray);
      (floatArray as any)._v = void 0;
      array[0] = val;
      return new Scalar(array);
    } else if (
      objForDetectType instanceof Scalar ||
      objForDetectType instanceof MutableScalar
    ) {
      floatArray[0] = val.x;
      obj = new MutableScalar(floatArray);
    } else if (
      objForDetectType instanceof Vector2 ||
      objForDetectType instanceof MutableVector2
    ) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      obj = new MutableVector2(floatArray);
    } else if (
      objForDetectType instanceof Vector3 ||
      objForDetectType instanceof MutableVector3
    ) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      obj = MutableVector3.fromFloat32Array(floatArray);
    } else if (
      objForDetectType instanceof Vector4 ||
      objForDetectType instanceof MutableVector4
    ) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableVector4(floatArray);
    } else if (
      objForDetectType instanceof Quaternion ||
      objForDetectType instanceof MutableQuaternion
    ) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableQuaternion(floatArray);
    } else if (
      objForDetectType instanceof Matrix33 ||
      objForDetectType instanceof MutableMatrix33
    ) {
      obj = obj == null ? new MutableMatrix33(floatArray, false, true) : obj;
      obj.m00 = val.m00;
      obj.m01 = val.m01;
      obj.m02 = val.m02;
      obj.m10 = val.m10;
      obj.m11 = val.m11;
      obj.m12 = val.m12;
      obj.m20 = val.m20;
      obj.m21 = val.m21;
      obj.m22 = val.m22;
    } else if (
      objForDetectType instanceof Matrix44 ||
      objForDetectType instanceof MutableMatrix44
    ) {
      obj = new MutableMatrix44(floatArray, false, true);
      obj.m00 = val.m00;
      obj.m01 = val.m01;
      obj.m02 = val.m02;
      obj.m03 = val.m03;
      obj.m10 = val.m10;
      obj.m11 = val.m11;
      obj.m12 = val.m12;
      obj.m13 = val.m13;
      obj.m20 = val.m20;
      obj.m21 = val.m21;
      obj.m22 = val.m22;
      obj.m23 = val.m23;
      obj.m30 = val.m30;
      obj.m31 = val.m31;
      obj.m32 = val.m32;
      obj.m33 = val.m33;
    } else if (objForDetectType instanceof VectorN) {
      for (let i = 0; i < val._v.length; i++) {
        floatArray[i] = val._v[i];
      }
      obj = new VectorN(floatArray);
    } else if (objForDetectType == null) {
      let vec;
      switch (floatArray.length) {
        case 4:
          vec = Vector4.fromCopyFloat32Array(floatArray);
          break;
        case 3:
          vec = Vector3.fromCopyFloat32Array(floatArray);
          break;
        case 2:
          vec = new Vector2(floatArray);
          break;
        case 1:
          vec = new Scalar(floatArray);
          break;
      }
      (floatArray as any)._v = void 0;
      return vec;
    } else if (
      Array.isArray(objForDetectType) ||
      ArrayBuffer.isView(objForDetectType) ||
      ArrayBuffer.isView(objForDetectType._v)
    ) {
      return objForDetectType;
    } else {
      console.error('Non supported type!');
      return void 0;
    }
    (floatArray as any)._v = void 0;

    return obj;
  }

  static _setForce(objForDetectType: any, val: any): void {
    const obj = objForDetectType as any;

    if (
      objForDetectType instanceof Vector4 ||
      objForDetectType instanceof MutableVector4
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
    } else if (
      objForDetectType instanceof Vector3 ||
      objForDetectType instanceof MutableVector3
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
    } else if (
      objForDetectType instanceof Vector2 ||
      objForDetectType instanceof MutableVector2
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
    } else if (
      objForDetectType instanceof Scalar ||
      objForDetectType instanceof MutableScalar
    ) {
      if (typeof val._v === 'undefined') {
        objForDetectType._v[0] = val;
      } else {
        objForDetectType._v[0] = val._v[0];
      }
    } else if (
      objForDetectType instanceof Matrix33 ||
      objForDetectType instanceof MutableMatrix33
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
      objForDetectType._v[4] = val._v[4];
      objForDetectType._v[5] = val._v[5];
      objForDetectType._v[6] = val._v[6];
      objForDetectType._v[7] = val._v[7];
      objForDetectType._v[8] = val._v[8];
    } else if (
      objForDetectType instanceof Matrix44 ||
      objForDetectType instanceof MutableMatrix44
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
      objForDetectType._v[4] = val._v[4];
      objForDetectType._v[5] = val._v[5];
      objForDetectType._v[6] = val._v[6];
      objForDetectType._v[7] = val._v[7];
      objForDetectType._v[8] = val._v[8];
      objForDetectType._v[9] = val._v[9];
      objForDetectType._v[10] = val._v[10];
      objForDetectType._v[11] = val._v[11];
      objForDetectType._v[12] = val._v[12];
      objForDetectType._v[13] = val._v[13];
      objForDetectType._v[14] = val._v[14];
      objForDetectType._v[15] = val._v[15];
    } else if (
      objForDetectType instanceof Quaternion ||
      objForDetectType instanceof MutableQuaternion
    ) {
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
    } else if (objForDetectType instanceof VectorN) {
      let valArray: TypedArray;
      if (val instanceof VectorN) {
        valArray = val._v;
      } else {
        valArray = val;
      }
      for (let i = 0; i < valArray.length; i++) {
        objForDetectType._v[i] = valArray[i];
      }
    } else if (Array.isArray(objForDetectType)) {
      for (let i = 0; i < objForDetectType.length; i++) {
        objForDetectType[i] = val._v[i];
      }
    } else if (!isNaN(objForDetectType._v.length)) {
      for (let i = 0; i < objForDetectType._v.length; i++) {
        if (Array.isArray(val)) {
          objForDetectType._v[i] = val[i];
        } else {
          objForDetectType._v[i] = val._v[i];
        }
      }
    } else {
      console.warn('Unknown type _setForce');
    }

    // maybe objForDetectType is number
  }
}
