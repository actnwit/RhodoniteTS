import Vector2 from './Vector2';
import Vector3 from './Vector3';
import Vector4 from './Vector4';
import Quaternion from './Quaternion';
import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import { CompositionTypeEnum } from '../main';
import { CompositionType } from '../definitions/CompositionType';
import MutableMatrix44 from './MutableMatrix44';
import MutableMatrix33 from './MutableMatrix33';
import MutableVector4 from './MutableVector4';
import MutableVector3 from './MutableVector3';
import MutableVector2 from './MutableVector2';
import Scalar from './Scalar';
import MutableQuaternion from './MutableQuaterion';
import MutableScalar from './MutableScalar';
import VectorN from './VectorN';

export default class MathClassUtil {
  constructor() {

  }


  static arrayToVector(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof (element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof (element[2]) !== 'undefined') {
        return new Vector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static arrayToVectorOrMatrix(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof (element[15]) !== 'undefined') {
        return new Matrix44(element);
      } else if (typeof (element[8]) !== 'undefined') {
        return new Matrix33(element);
      } else if (typeof (element[3]) !== 'undefined') {
        return new Vector4(element[0], element[1], element[2], element[3]);
      } else if (typeof (element[2]) !== 'undefined') {
        return new Vector3(element[0], element[1], element[2]);
      } else {
        return new Vector2(element[0], element[1]);
      }
    } else {
      return element;
    }
  }

  static getImmutableValueClass(compositionType: CompositionTypeEnum): Function | undefined {
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

  static getMutableValueClass(compositionType: CompositionTypeEnum): Function | undefined {
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
      if (typeof (element[3]) !== 'undefined') {
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
      return [element.x, element.v];
    } else if (element instanceof Vector3) {
      return [element.x, element.v, element.z];
    } else if (element instanceof Vector4 || element instanceof Quaternion) {
      return [element.x, element.v, element.z, element.w];
    } else {
      return element;
    }
  }

  /**
   * discriminate which Vector instance
   * @param element any Vector instance
   * @return number of Vector instance
   */
  static compomentNumberOfVector(element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>): number {
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
  static packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number) {
    let v0 = 0.0;
    let v1 = 0.0;

    x = (x + 1) / 2.0;
    y = (y + 1) / 2.0;
    z = (z + 1) / 2.0;
    w = (w + 1) / 2.0;

    let ir = Math.floor(x * (criteria - 1.0));
    let ig = Math.floor(y * (criteria - 1.0));
    let irg = ir * criteria + ig;
    v0 = irg / criteria;

    let ib = Math.floor(z * (criteria - 1.0));
    let ia = Math.floor(w * (criteria - 1.0));
    let iba = ib * criteria + ia;
    v1 = iba / criteria;

    return [v0, v1];
  }

  static unProject(windowPosVec3: Vector3, inversePVMat44: Matrix44, viewportVec4: Vector4) {
    const input = new Vector4(
      (windowPosVec3.x - viewportVec4.x) / viewportVec4.z * 2 - 1.0,
      (windowPosVec3.y - viewportVec4.y) / viewportVec4.w * 2 - 1.0,
      //      (windowPosVec3.z - zNear) / (zFar - zNear),
      2 * windowPosVec3.z - 1.0,
      1.0
    );

    const PVMat44 = inversePVMat44;//Matrix44.transpose(inversePVMat44);

    const out = PVMat44.multiplyVector(input);
    //    const a = input.x * PVMat44.m03 + input.y * PVMat44.m13 + input.z * PVMat44.m23 + PVMat44.m33;
    //    const a = input.x * PVMat44.m30 + input.y * PVMat44.m31 + input.z * PVMat44.m32 + PVMat44.m33;

    if (out.w === 0) {
      console.warn("Zero division!");
    }

    const output = new Vector3(Vector4.multiply(out, 1 / out.w));

    return output;
  }

  static add(lhs: any, rhs: any) {
    if (isFinite(lhs)) { // number?
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
    }
  }

  static subtract(lhs: any, rhs: any) {
    if (isFinite(lhs)) { // number?
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
    }
  }

  static multiplyNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) { // number?
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
    }
  }
  static divideNumber(lhs: any, rhs: number) {
    if (isFinite(lhs)) { // number?
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
    }
  }

  static initWithScalar(objForDetectType: any, val: number) {
    if (isFinite(objForDetectType)) { // number?
      return val;
    } else if (objForDetectType instanceof Vector2) {
      return new Vector2(val, val);
    } else if (objForDetectType instanceof Vector3) {
      return new Vector3(val, val, val);
    } else if (objForDetectType instanceof Vector4) {
      return new Vector4(val, val, val, val);
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

  static initWithFloat32Array(objForDetectType: any, val: any, floatArray: Float32Array, compositionType: CompositionTypeEnum) {
    let obj;
    if (isFinite(objForDetectType)) { // number?
      const array = new Float32Array(floatArray);
      (floatArray as any).v = void 0;
      array[0] = val;
      return new Scalar(array);
    } else if (objForDetectType instanceof Scalar || objForDetectType instanceof MutableScalar) {
      floatArray[0] = val.x;
      obj = new MutableScalar(floatArray);
    } else if (objForDetectType instanceof Vector2 || objForDetectType instanceof MutableVector2) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      obj = new MutableVector2(floatArray);
    } else if (objForDetectType instanceof Vector3 || objForDetectType instanceof MutableVector3) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      obj = new MutableVector3(floatArray);
    } else if (objForDetectType instanceof Vector4 || objForDetectType instanceof MutableVector4) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableVector4(floatArray);
    } else if (objForDetectType instanceof Quaternion || objForDetectType instanceof MutableQuaternion) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableQuaternion(floatArray);
    } else if (objForDetectType instanceof Matrix33 || objForDetectType instanceof MutableMatrix33) {
      obj = (obj == null) ? new MutableMatrix33(floatArray, false, true) : obj;
      obj.m00 = val.m00;
      obj.m01 = val.m01;
      obj.m02 = val.m02;
      obj.m10 = val.m10;
      obj.m11 = val.m11;
      obj.m12 = val.m12;
      obj.m20 = val.m20;
      obj.m21 = val.m21;
      obj.m22 = val.m22;
    } else if (objForDetectType instanceof Matrix44 || objForDetectType instanceof MutableMatrix44) {
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
      obj = new VectorN(floatArray);
    } else if (objForDetectType == null) {
      let vec;
      switch (floatArray.length) {
        case 4: vec = new Vector4(floatArray); break;
        case 3: vec = new Vector3(floatArray); break;
        case 2: vec = new Vector2(floatArray); break;
        case 1: vec = new Scalar(floatArray); break;
      }
      (floatArray as any).v = void 0;
      return vec;
    } else if (Array.isArray(objForDetectType) || ArrayBuffer.isView(objForDetectType) || ArrayBuffer.isView(objForDetectType.v)) {
      return objForDetectType;
    } else {
      console.error('Non supported type!');
      return void 0;
    }
    (floatArray as any).v = void 0;

    return obj;
  }

  static _setForce(objForDetectType: any, val: any): void {
    let obj = objForDetectType as any;

    if (objForDetectType instanceof Vector4 || objForDetectType instanceof MutableVector4) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
      objForDetectType.v[2] = val.v[2];
      objForDetectType.v[3] = val.v[3];
    } else if (objForDetectType instanceof Vector3 || objForDetectType instanceof MutableVector3) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
      objForDetectType.v[2] = val.v[2];
    } else if (objForDetectType instanceof Vector2 || objForDetectType instanceof MutableVector2) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
    } else if (objForDetectType instanceof Scalar || objForDetectType instanceof MutableScalar) {
      if (typeof val.v === 'undefined') {
        objForDetectType.v[0] = val;
      } else {
        objForDetectType.v[0] = val.v[0];
      }
    } else if (objForDetectType instanceof Matrix33 || objForDetectType instanceof MutableMatrix33) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
      objForDetectType.v[2] = val.v[2];
      objForDetectType.v[3] = val.v[3];
      objForDetectType.v[4] = val.v[4];
      objForDetectType.v[5] = val.v[5];
      objForDetectType.v[6] = val.v[6];
      objForDetectType.v[7] = val.v[7];
      objForDetectType.v[8] = val.v[8];
    } else if (objForDetectType instanceof Matrix44 || objForDetectType instanceof MutableMatrix44) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
      objForDetectType.v[2] = val.v[2];
      objForDetectType.v[3] = val.v[3];
      objForDetectType.v[4] = val.v[4];
      objForDetectType.v[5] = val.v[5];
      objForDetectType.v[6] = val.v[6];
      objForDetectType.v[7] = val.v[7];
      objForDetectType.v[8] = val.v[8];
      objForDetectType.v[9] = val.v[9];
      objForDetectType.v[10] = val.v[10];
      objForDetectType.v[11] = val.v[11];
      objForDetectType.v[12] = val.v[12];
      objForDetectType.v[13] = val.v[13];
      objForDetectType.v[14] = val.v[14];
      objForDetectType.v[15] = val.v[15];
    } else if (objForDetectType instanceof Quaternion || objForDetectType instanceof MutableQuaternion) {
      objForDetectType.v[0] = val.v[0];
      objForDetectType.v[1] = val.v[1];
      objForDetectType.v[2] = val.v[2];
      objForDetectType.v[3] = val.v[3];
    } else if (objForDetectType instanceof VectorN) {
      let valArray: Float32Array;
      if (val instanceof VectorN) {
        valArray = val.v;
      } else {
        valArray = val;
      }
      for (let i = 0; i < valArray.length; i++) {
        objForDetectType.v[i] = valArray[i];
      }
    } else if (Array.isArray(objForDetectType)) {
      for (let i = 0; i < objForDetectType.length; i++) {
        objForDetectType[i] = val.v[i];
      }
    } else if (!isNaN(objForDetectType.v.length)) {
      for (let i = 0; i < objForDetectType.v.length; i++) {
        if (Array.isArray(val)) {
          objForDetectType.v[i] = val[i];
        } else {
          objForDetectType.v[i] = val.v[i];
        }
      }
    } else {
      console.warn('Unknown type _setForce');
    }

    // maybe objForDetectType is number
  }
}

