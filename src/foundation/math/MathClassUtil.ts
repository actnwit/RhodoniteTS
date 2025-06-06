import type { TypedArray } from '../../types/CommonTypes';
import type { CompositionTypeEnum } from '../definitions/CompositionType';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { Matrix33 } from './Matrix33';
import { Matrix44 } from './Matrix44';
import { MutableMatrix33 } from './MutableMatrix33';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableScalar } from './MutableScalar';
import { MutableVector2 } from './MutableVector2';
import { MutableVector3 } from './MutableVector3';
import { MutableVector4 } from './MutableVector4';
import { Quaternion } from './Quaternion';
import { Scalar } from './Scalar';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';
import { VectorN } from './VectorN';

/**
 * Utility class providing various mathematical operations and conversions for vector, matrix, and quaternion types.
 * This class contains static methods for converting between different mathematical representations,
 * performing arithmetic operations, and manipulating mathematical objects.
 */
export class MathClassUtil {
  private static __tmpVector4_0: MutableVector4 = MutableVector4.zero();
  private static __tmpVector4_1: MutableVector4 = MutableVector4.zero();

  /**
   * Converts an array of numbers to the appropriate Vector type based on array length.
   * @param element - Array of numbers to convert
   * @returns Vector2, Vector3, or Vector4 instance based on array length, or the original element if not an array
   */
  static arrayToVector(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== 'undefined') {
        return Vector4.fromCopyArray([element[0], element[1], element[2], element[3]]);
      }
      if (typeof element[2] !== 'undefined') {
        return Vector3.fromCopyArray([element[0], element[1], element[2]]);
      }
      return Vector2.fromCopyArray2([element[0], element[1]]);
    }
    return element;
  }

  /**
   * Converts an array of numbers to the appropriate Vector or Matrix type based on array length.
   * Supports conversion to Matrix44, Matrix33, Vector4, Vector3, or Vector2.
   * @param element - Array of numbers to convert
   * @returns Matrix44, Matrix33, Vector4, Vector3, or Vector2 instance based on array length, or the original element if not an array
   */
  static arrayToVectorOrMatrix(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[15] !== 'undefined') {
        return Matrix44.fromCopyArrayRowMajor(element);
      }
      if (typeof element[8] !== 'undefined') {
        return Matrix33.fromCopyArrayRowMajor(element);
      }
      if (typeof element[3] !== 'undefined') {
        return Vector4.fromCopyArray([element[0], element[1], element[2], element[3]]);
      }
      if (typeof element[2] !== 'undefined') {
        return Vector3.fromCopyArray([element[0], element[1], element[2]]);
      }
      return Vector2.fromCopyArray2([element[0], element[1]]);
    }
    return element;
  }

  /**
   * Gets the immutable value class constructor for a given composition type.
   * @param compositionType - The composition type enum value
   * @returns Constructor function for the corresponding immutable math class, or undefined if not supported
   */
  static getImmutableValueClass(compositionType: CompositionTypeEnum): Function | undefined {
    if (compositionType === CompositionType.Vec2) {
      return Vector2;
    }
    if (compositionType === CompositionType.Vec3) {
      return Vector3;
    }
    if (compositionType === CompositionType.Vec4) {
      return Vector4;
    }
    if (compositionType === CompositionType.Mat3) {
      return Matrix33;
    }
    if (compositionType === CompositionType.Mat4) {
      return Matrix44;
    }
    return void 0;
  }

  /**
   * Gets the mutable value class constructor for a given composition type.
   * @param compositionType - The composition type enum value
   * @returns Constructor function for the corresponding mutable math class, or undefined if not supported
   */
  static getMutableValueClass(compositionType: CompositionTypeEnum): Function | undefined {
    if (compositionType === CompositionType.Vec2) {
      return MutableVector2;
    }
    if (compositionType === CompositionType.Vec3) {
      return MutableVector3;
    }
    if (compositionType === CompositionType.Vec4) {
      return MutableVector4;
    }
    if (compositionType === CompositionType.Mat3) {
      return MutableMatrix33;
    }
    if (compositionType === CompositionType.Mat4) {
      return MutableMatrix44;
    }
    return void 0;
  }

  /**
   * Creates a deep clone of mathematical objects (matrices and vectors).
   * @param element - The mathematical object to clone
   * @returns A cloned instance of the input object, or the original element if it's not a mathematical object
   */
  static cloneOfMathObjects(element: any) {
    if (element instanceof Matrix44) {
      return element.clone();
    }
    if (element instanceof Matrix33) {
      return element.clone();
    }
    if (element instanceof Vector4) {
      return element.clone();
    }
    if (element instanceof Vector3) {
      return element.clone();
    }
    if (element instanceof Vector2) {
      return element.clone();
    }
    return element;
  }

  /**
   * Checks if an array is suitable for quaternion conversion (has 4 elements).
   * @param element - Array to check
   * @returns True if the array has 4 elements and can be converted to a quaternion
   */
  static isAcceptableArrayForQuaternion(element: Array<number>) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== 'undefined') {
        return true;
      }
    }
    return false;
  }

  /**
   * Converts a 4-element array to a Quaternion instance.
   * @param element - Array of 4 numbers representing quaternion components [x, y, z, w]
   * @returns Quaternion instance created from the array elements
   */
  static arrayToQuaternion(element: Array<number>) {
    return Quaternion.fromCopy4(element[0], element[1], element[2], element[3]);
  }

  /**
   * Creates a sub-array with the specified number of components from the beginning of the input array.
   * @param array - Source array to extract elements from
   * @param componentN - Number of components to extract (1-4)
   * @returns Sub-array with the specified number of elements, or single element if componentN is 1
   */
  static makeSubArray(array: Array<any>, componentN: number) {
    if (componentN === 4) {
      return [array[0], array[1], array[2], array[3]];
    }
    if (componentN === 3) {
      return [array[0], array[1], array[2]];
    }
    if (componentN === 2) {
      return [array[0], array[1]];
    }
    return array[0];
  }

  /**
   * Converts vector instances to arrays of their component values.
   * @param element - Vector2, Vector3, Vector4, or Quaternion instance
   * @returns Array representation of the vector components, or the original element if not a vector
   */
  static vectorToArray(element: Vector2 | Vector3 | Vector4 | Quaternion) {
    if (element instanceof Vector2) {
      return [element.x, element.y];
    }
    if (element instanceof Vector3) {
      return [element.x, element.y, element.z];
    }
    if (element instanceof Vector4 || element instanceof Quaternion) {
      return [element.x, element.y, element.z, element.w];
    }
    return element;
  }

  /**
   * Determines the number of components in a vector instance or array.
   * @param element - Vector instance or array to analyze
   * @returns Number of components (2 for Vector2, 3 for Vector3, 4 for Vector4/Quaternion, array length for arrays, 0 for unsupported types)
   */
  static componentNumberOfVector(element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>): number {
    if (element instanceof Vector2) {
      return 2;
    }
    if (element instanceof Vector3) {
      return 3;
    }
    if (element instanceof Vector4 || element instanceof Quaternion) {
      return 4;
    }
    if (Array.isArray(element)) {
      return element.length;
    }
    return 0;
  }

  /**
   * Packs a normalized 4D vector into a 2D vector using a grid-based encoding scheme.
   * Input values must be in the range [-1, 1] and are converted to [0, 1] internally.
   * @param x - X component of the 4D vector (must be in range [-1, 1])
   * @param y - Y component of the 4D vector (must be in range [-1, 1])
   * @param z - Z component of the 4D vector (must be in range [-1, 1])
   * @param w - W component of the 4D vector (must be in range [-1, 1])
   * @param criteria - Grid resolution for encoding (determines precision)
   * @returns Array of 2 values representing the packed vector
   */
  static packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number) {
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

  /**
   * Unprojects a window coordinate to world space using the inverse projection-view matrix.
   * Converts 2D screen coordinates with depth to 3D world coordinates.
   * @param windowPosX - X coordinate in window space
   * @param windowPosY - Y coordinate in window space
   * @param windowPosZ - Z coordinate (depth) in window space
   * @param inversePVMat44 - Inverse of the projection-view matrix
   * @param viewportVec4 - Viewport parameters [x, y, width, height]
   * @param out - Output vector to store the result
   * @returns The unprojected 3D world position
   */
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

    const outNonNormalized = inversePVMat44.multiplyVectorTo(input, this.__tmpVector4_1);
    if (outNonNormalized.w === 0) {
      Logger.error('0 division occurred!');
    }

    return MutableVector3.multiplyTo(outNonNormalized, 1.0 / outNonNormalized.w, out);
  }

  /**
   * Performs addition operation on various mathematical types.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Left-hand side operand
   * @param rhs - Right-hand side operand
   * @returns Result of the addition operation, type depends on input types
   */
  static add(lhs: any, rhs: any) {
    if (Number.isFinite(lhs)) {
      // number?
      return lhs + rhs;
    }
    if (lhs instanceof Vector2) {
      return Vector2.add(lhs, rhs);
    }
    if (lhs instanceof Vector3) {
      return Vector3.add(lhs, rhs);
    }
    if (lhs instanceof Vector4) {
      return Vector4.add(lhs, rhs);
    }
    if (lhs instanceof Quaternion) {
      return Quaternion.add(lhs, rhs);
    }
    if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] + rhs[i];
      }
      return arr;
    }
    Logger.error('Non supported type!');
    return;
  }

  /**
   * Performs subtraction operation on various mathematical types.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Left-hand side operand (minuend)
   * @param rhs - Right-hand side operand (subtrahend)
   * @returns Result of the subtraction operation, type depends on input types
   */
  static subtract(lhs: any, rhs: any) {
    if (Number.isFinite(lhs)) {
      // number?
      return lhs - rhs;
    }
    if (lhs instanceof Vector2) {
      return Vector2.subtract(lhs, rhs);
    }
    if (lhs instanceof Vector3) {
      return Vector3.subtract(lhs, rhs);
    }
    if (lhs instanceof Vector4) {
      return Vector4.subtract(lhs, rhs);
    }
    if (lhs instanceof Quaternion) {
      return Quaternion.subtract(lhs, rhs);
    }
    if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] - rhs[i];
      }
      return arr;
    }
    Logger.error('Non supported type!');
    return;
  }

  /**
   * Multiplies various mathematical types by a scalar number.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Mathematical object to multiply
   * @param rhs - Scalar multiplier
   * @returns Result of the scalar multiplication, type depends on input type
   */
  static multiplyNumber(lhs: any, rhs: number) {
    if (Number.isFinite(lhs)) {
      // number?
      return lhs * rhs;
    }
    if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, rhs);
    }
    if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, rhs);
    }
    if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, rhs);
    }
    if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, rhs);
    }
    if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] * rhs;
      }
      return arr;
    }
    Logger.error('Non supported type!');
    return;
  }

  /**
   * Divides various mathematical types by a scalar number.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Mathematical object to divide
   * @param rhs - Scalar divisor
   * @returns Result of the scalar division, type depends on input type
   */
  static divideNumber(lhs: any, rhs: number) {
    if (Number.isFinite(lhs)) {
      // number?
      return lhs / rhs;
    }
    if (lhs instanceof Vector2) {
      return Vector2.multiply(lhs, 1 / rhs);
    }
    if (lhs instanceof Vector3) {
      return Vector3.multiply(lhs, 1 / rhs);
    }
    if (lhs instanceof Vector4) {
      return Vector4.multiply(lhs, 1 / rhs);
    }
    if (lhs instanceof Quaternion) {
      return Quaternion.multiplyNumber(lhs, 1 / rhs);
    }
    if (Array.isArray(lhs)) {
      const arr: number[] = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] / rhs;
      }
      return arr;
    }
    Logger.error('Non supported type!');
    return;
  }

  /**
   * Initializes a mathematical object of the same type as the input with a scalar value.
   * For vectors and arrays, all components are set to the scalar value.
   * For quaternions, creates an identity quaternion.
   * @param objForDetectType - Object used to determine the target type
   * @param val - Scalar value to initialize with
   * @returns New instance of the same type as objForDetectType initialized with val
   */
  static initWithScalar(objForDetectType: any, val: number) {
    if (Number.isFinite(objForDetectType)) {
      // number?
      return val;
    }
    if (objForDetectType instanceof Vector2) {
      return Vector2.fromCopyArray2([val, val]);
    }
    if (objForDetectType instanceof Vector3) {
      return Vector3.fromCopyArray([val, val, val]);
    }
    if (objForDetectType instanceof Vector4) {
      return Vector4.fromCopyArray([val, val, val, val]);
    }
    if (objForDetectType instanceof Quaternion) {
      return Quaternion.fromCopy4(0, 0, 0, 1);
    }
    if (Array.isArray(objForDetectType)) {
      const arr: number[] = [];
      for (let i = 0; i < objForDetectType.length; i++) {
        arr[i] = val;
      }
      return arr;
    }
    Logger.error('Non supported type!');
    return void 0;
  }

  /**
   * Initializes a mutable mathematical object from a value using a provided Float32Array as storage.
   * This method efficiently reuses memory by using the provided array as the backing store.
   * @param val - Value to initialize from (can be various mathematical types)
   * @param floatArray - Float32Array to use as backing storage
   * @returns Mutable mathematical object using the provided array as storage
   */
  static initWithFloat32Array(val: any, floatArray: Float32Array) {
    let obj;
    if (Number.isFinite(val)) {
      // number?
      const array = new Float32Array(floatArray);
      (floatArray as any)._v = void 0;
      array[0] = val;
      return new Scalar(array);
    }
    if (val instanceof Scalar || val instanceof MutableScalar) {
      floatArray[0] = val.x;
      obj = new MutableScalar(floatArray);
    } else if (val instanceof Vector2 || val instanceof MutableVector2) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      obj = new MutableVector2(floatArray);
    } else if (val instanceof Vector3 || val instanceof MutableVector3) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      obj = MutableVector3.fromFloat32Array(floatArray);
    } else if (val instanceof Vector4 || val instanceof MutableVector4) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableVector4(floatArray);
    } else if (val instanceof Quaternion || val instanceof MutableQuaternion) {
      floatArray[0] = val.x;
      floatArray[1] = val.y;
      floatArray[2] = val.z;
      floatArray[3] = val.w;
      obj = new MutableQuaternion(floatArray);
    } else if (val instanceof Matrix33 || val instanceof MutableMatrix33) {
      obj = obj == null ? new MutableMatrix33(floatArray) : obj;
      obj.m00 = val.m00;
      obj.m01 = val.m01;
      obj.m02 = val.m02;
      obj.m10 = val.m10;
      obj.m11 = val.m11;
      obj.m12 = val.m12;
      obj.m20 = val.m20;
      obj.m21 = val.m21;
      obj.m22 = val.m22;
    } else if (val instanceof Matrix44 || val instanceof MutableMatrix44) {
      obj = new MutableMatrix44(floatArray);
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
    } else if (val instanceof VectorN) {
      for (let i = 0; i < val._v.length; i++) {
        floatArray[i] = val._v[i];
      }
      obj = new VectorN(floatArray);
    } else if (val == null) {
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
    } else if (Array.isArray(val) || ArrayBuffer.isView(val) || ArrayBuffer.isView(val._v)) {
      return val;
    } else {
      Logger.error('Non supported type!');
      return void 0;
    }
    (floatArray as any)._v = void 0;

    return obj;
  }

  /**
   * Forcefully sets the internal values of a mathematical object to match another object's values.
   * This method directly modifies the internal array representation for performance.
   * Performs equality check to avoid unnecessary operations.
   * @param objForDetectType - Target object to modify
   * @param val - Source object or value to copy from
   * @returns True if values were changed, false if they were already equal
   */
  static _setForce(objForDetectType: any, val: any): boolean {
    if (objForDetectType instanceof MutableVector4 || objForDetectType instanceof Vector4) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
    } else if (objForDetectType instanceof MutableVector2 || objForDetectType instanceof Vector2) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
    } else if (objForDetectType instanceof MutableVector3 || objForDetectType instanceof Vector3) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
    } else if (objForDetectType instanceof MutableScalar || objForDetectType instanceof Scalar) {
      if (typeof val._v === 'undefined') {
        if (objForDetectType._v[0] === val) {
          return false;
        }
        objForDetectType._v[0] = val;
      } else {
        if (objForDetectType._v[0] === val._v[0]) {
          return false;
        }
        objForDetectType._v[0] = val._v[0];
      }
    } else if (objForDetectType instanceof MutableMatrix33 || objForDetectType instanceof Matrix33) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
      objForDetectType._v[0] = val._v[0];
      objForDetectType._v[1] = val._v[1];
      objForDetectType._v[2] = val._v[2];
      objForDetectType._v[3] = val._v[3];
      objForDetectType._v[4] = val._v[4];
      objForDetectType._v[5] = val._v[5];
      objForDetectType._v[6] = val._v[6];
      objForDetectType._v[7] = val._v[7];
      objForDetectType._v[8] = val._v[8];
    } else if (objForDetectType instanceof MutableMatrix44 || objForDetectType instanceof Matrix44) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
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
    } else if (objForDetectType instanceof MutableQuaternion || objForDetectType instanceof Quaternion) {
      if (objForDetectType.isEqual(val)) {
        return false;
      }
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
      let isSame = true;
      for (let i = 0; i < objForDetectType._v.length; i++) {
        if (objForDetectType._v[i] !== valArray[i]) {
          isSame = false;
          break;
        }
      }
      if (isSame) {
        return false;
      }
      for (let i = 0; i < objForDetectType._v.length; i++) {
        objForDetectType._v[i] = valArray[i];
      }
    } else if (Array.isArray(objForDetectType)) {
      let isSame = true;
      for (let i = 0; i < objForDetectType.length; i++) {
        if (objForDetectType[i] !== val._v[i]) {
          isSame = false;
          break;
        }
      }
      if (isSame) {
        return false;
      }
      for (let i = 0; i < objForDetectType.length; i++) {
        objForDetectType[i] = val._v[i];
      }
    } else if (!Number.isNaN(objForDetectType._v.length)) {
      let isSame = true;
      for (let i = 0; i < objForDetectType._v.length; i++) {
        if (Array.isArray(val)) {
          if (objForDetectType._v[i] !== val[i]) {
            isSame = false;
            break;
          }
        } else {
          if (objForDetectType._v[i] !== val._v[i]) {
            isSame = false;
            break;
          }
        }
      }
      if (isSame) {
        return false;
      }
      for (let i = 0; i < objForDetectType._v.length; i++) {
        if (Array.isArray(val)) {
          objForDetectType._v[i] = val[i];
        } else {
          objForDetectType._v[i] = val._v[i];
        }
      }
    } else {
      Logger.warn('Unknown type _setForce');
    }

    return true;
  }
}
