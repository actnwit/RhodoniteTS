// src/foundation/math/MathClassUtil.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { Matrix33 } from "./Matrix33.js";
import { Matrix44 } from "./Matrix44.js";
import { MutableMatrix33 } from "./MutableMatrix33.js";
import { MutableMatrix44 } from "./MutableMatrix44.js";
import { MutableQuaternion } from "./MutableQuaternion.js";
import { MutableScalar } from "./MutableScalar.js";
import { MutableVector2 } from "./MutableVector2.js";
import { MutableVector3 } from "./MutableVector3.js";
import { MutableVector4 } from "./MutableVector4.js";
import { Quaternion } from "./Quaternion.js";
import { Scalar } from "./Scalar.js";
import { Vector2 } from "./Vector2.js";
import { Vector3 } from "./Vector3.js";
import { Vector4 } from "./Vector4.js";
import { VectorN } from "./VectorN.js";
var MathClassUtil = class {
  /**
   * Converts an array of numbers to the appropriate Vector type based on array length.
   * @param element - Array of numbers to convert
   * @returns Vector2, Vector3, or Vector4 instance based on array length, or the original element if not an array
   */
  static arrayToVector(element) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== "undefined") {
        return Vector4.fromCopyArray([element[0], element[1], element[2], element[3]]);
      }
      if (typeof element[2] !== "undefined") {
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
  static arrayToVectorOrMatrix(element) {
    if (Array.isArray(element)) {
      if (typeof element[15] !== "undefined") {
        return Matrix44.fromCopyArrayRowMajor(element);
      }
      if (typeof element[8] !== "undefined") {
        return Matrix33.fromCopyArrayRowMajor(element);
      }
      if (typeof element[3] !== "undefined") {
        return Vector4.fromCopyArray([element[0], element[1], element[2], element[3]]);
      }
      if (typeof element[2] !== "undefined") {
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
  static getImmutableValueClass(compositionType) {
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
  static getMutableValueClass(compositionType) {
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
  static cloneOfMathObjects(element) {
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
  static isAcceptableArrayForQuaternion(element) {
    if (Array.isArray(element)) {
      if (typeof element[3] !== "undefined") {
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
  static arrayToQuaternion(element) {
    return Quaternion.fromCopy4(element[0], element[1], element[2], element[3]);
  }
  /**
   * Creates a sub-array with the specified number of components from the beginning of the input array.
   * @param array - Source array to extract elements from
   * @param componentN - Number of components to extract (1-4)
   * @returns Sub-array with the specified number of elements, or single element if componentN is 1
   */
  static makeSubArray(array, componentN) {
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
  static vectorToArray(element) {
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
  static componentNumberOfVector(element) {
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
  static packNormalizedVec4ToVec2(x, y, z, w, criteria) {
    let v0 = 0;
    let v1 = 0;
    x = (x + 1) / 2;
    y = (y + 1) / 2;
    z = (z + 1) / 2;
    w = (w + 1) / 2;
    const ir = Math.floor(x * (criteria - 1));
    const ig = Math.floor(y * (criteria - 1));
    const irg = ir * criteria + ig;
    v0 = irg / criteria;
    const ib = Math.floor(z * (criteria - 1));
    const ia = Math.floor(w * (criteria - 1));
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
  static unProjectTo(windowPosX, windowPosY, windowPosZ, inversePVMat44, viewportVec4, out) {
    const input = this.pn.setComponents(
      (windowPosX - viewportVec4.x) / viewportVec4.z * 2 - 1,
      (windowPosY - viewportVec4.y) / viewportVec4.w * 2 - 1,
      2 * windowPosZ - 1,
      1
    );
    const outNonNormalized = inversePVMat44.multiplyVectorTo(input, this.qn);
    if (outNonNormalized.w === 0) {
      Logger.default.error("0 division occurred! The result is left unchanged.");
      return out;
    }
    return MutableVector3.multiplyTo(outNonNormalized, 1 / outNonNormalized.w, out);
  }
  /**
   * Performs addition operation on various mathematical types.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Left-hand side operand
   * @param rhs - Right-hand side operand
   * @returns Result of the addition operation, type depends on input types
   */
  static add(lhs, rhs) {
    if (Number.isFinite(lhs)) {
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
      const arr = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] + rhs[i];
      }
      return arr;
    }
    Logger.default.error("Non supported type!");
    return;
  }
  /**
   * Performs subtraction operation on various mathematical types.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Left-hand side operand (minuend)
   * @param rhs - Right-hand side operand (subtrahend)
   * @returns Result of the subtraction operation, type depends on input types
   */
  static subtract(lhs, rhs) {
    if (Number.isFinite(lhs)) {
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
      const arr = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] - rhs[i];
      }
      return arr;
    }
    Logger.default.error("Non supported type!");
    return;
  }
  /**
   * Multiplies various mathematical types by a scalar number.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Mathematical object to multiply
   * @param rhs - Scalar multiplier
   * @returns Result of the scalar multiplication, type depends on input type
   */
  static multiplyNumber(lhs, rhs) {
    if (Number.isFinite(lhs)) {
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
      const arr = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] * rhs;
      }
      return arr;
    }
    Logger.default.error("Non supported type!");
    return;
  }
  /**
   * Divides various mathematical types by a scalar number.
   * Supports numbers, vectors, quaternions, and arrays.
   * @param lhs - Mathematical object to divide
   * @param rhs - Scalar divisor
   * @returns Result of the scalar division, type depends on input type
   */
  static divideNumber(lhs, rhs) {
    if (Number.isFinite(lhs)) {
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
      const arr = [];
      for (let i = 0; i < lhs.length; i++) {
        arr[i] = lhs[i] / rhs;
      }
      return arr;
    }
    Logger.default.error("Non supported type!");
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
  static initWithScalar(objForDetectType, val) {
    if (Number.isFinite(objForDetectType)) {
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
      const arr = [];
      for (let i = 0; i < objForDetectType.length; i++) {
        arr[i] = val;
      }
      return arr;
    }
    Logger.default.error("Non supported type!");
    return void 0;
  }
  /**
   * Initializes a mutable mathematical object from a value using a provided Float32Array as storage.
   * This method efficiently reuses memory by using the provided array as the backing store.
   * @param val - Value to initialize from (can be various mathematical types)
   * @param floatArray - Float32Array to use as backing storage
   * @returns Mutable mathematical object using the provided array as storage
   */
  static initWithFloat32Array(val, floatArray) {
    let obj;
    if (Number.isFinite(val)) {
      const array = new Float32Array(floatArray);
      floatArray._v = void 0;
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
      floatArray._v = void 0;
      return vec;
    } else if (Array.isArray(val) || ArrayBuffer.isView(val) || ArrayBuffer.isView(val._v)) {
      return val;
    } else {
      Logger.default.error("Non supported type!");
      return void 0;
    }
    floatArray._v = void 0;
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
  static _setForce(objForDetectType, val) {
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
      if (typeof val._v === "undefined") {
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
      let valArray;
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
      Logger.default.warn("Unknown type _setForce");
    }
    return true;
  }
};
MathClassUtil.pn = MutableVector4.zero();
MathClassUtil.qn = MutableVector4.zero();
export {
  MathClassUtil
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NYXRoQ2xhc3NVdGlsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IE1hdHJpeDMzIH0gZnJvbSAnLi9NYXRyaXgzMyc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4vTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDMzIH0gZnJvbSAnLi9NdXRhYmxlTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVTY2FsYXIgfSBmcm9tICcuL011dGFibGVTY2FsYXInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjIgfSBmcm9tICcuL011dGFibGVWZWN0b3IyJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgUXVhdGVybmlvbiB9IGZyb20gJy4vUXVhdGVybmlvbic7XG5pbXBvcnQgeyBTY2FsYXIgfSBmcm9tICcuL1NjYWxhcic7XG5pbXBvcnQgeyBWZWN0b3IyIH0gZnJvbSAnLi9WZWN0b3IyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4vVmVjdG9yNCc7XG5pbXBvcnQgeyBWZWN0b3JOIH0gZnJvbSAnLi9WZWN0b3JOJztcblxuLyoqXG4gKiBVdGlsaXR5IGNsYXNzIHByb3ZpZGluZyB2YXJpb3VzIG1hdGhlbWF0aWNhbCBvcGVyYXRpb25zIGFuZCBjb252ZXJzaW9ucyBmb3IgdmVjdG9yLCBtYXRyaXgsIGFuZCBxdWF0ZXJuaW9uIHR5cGVzLlxuICogVGhpcyBjbGFzcyBjb250YWlucyBzdGF0aWMgbWV0aG9kcyBmb3IgY29udmVydGluZyBiZXR3ZWVuIGRpZmZlcmVudCBtYXRoZW1hdGljYWwgcmVwcmVzZW50YXRpb25zLFxuICogcGVyZm9ybWluZyBhcml0aG1ldGljIG9wZXJhdGlvbnMsIGFuZCBtYW5pcHVsYXRpbmcgbWF0aGVtYXRpY2FsIG9iamVjdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNYXRoQ2xhc3NVdGlsIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3I0XzA6IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjRfMTogTXV0YWJsZVZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IG9mIG51bWJlcnMgdG8gdGhlIGFwcHJvcHJpYXRlIFZlY3RvciB0eXBlIGJhc2VkIG9uIGFycmF5IGxlbmd0aC5cbiAgICogQHBhcmFtIGVsZW1lbnQgLSBBcnJheSBvZiBudW1iZXJzIHRvIGNvbnZlcnRcbiAgICogQHJldHVybnMgVmVjdG9yMiwgVmVjdG9yMywgb3IgVmVjdG9yNCBpbnN0YW5jZSBiYXNlZCBvbiBhcnJheSBsZW5ndGgsIG9yIHRoZSBvcmlnaW5hbCBlbGVtZW50IGlmIG5vdCBhbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGFycmF5VG9WZWN0b3IoZWxlbWVudDogQXJyYXk8bnVtYmVyPikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGVsZW1lbnQpKSB7XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnRbM10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV0sIGVsZW1lbnRbMl0sIGVsZW1lbnRbM11dKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudFsyXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHlBcnJheShbZWxlbWVudFswXSwgZWxlbWVudFsxXSwgZWxlbWVudFsyXV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV1dKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gYXJyYXkgb2YgbnVtYmVycyB0byB0aGUgYXBwcm9wcmlhdGUgVmVjdG9yIG9yIE1hdHJpeCB0eXBlIGJhc2VkIG9uIGFycmF5IGxlbmd0aC5cbiAgICogU3VwcG9ydHMgY29udmVyc2lvbiB0byBNYXRyaXg0NCwgTWF0cml4MzMsIFZlY3RvcjQsIFZlY3RvcjMsIG9yIFZlY3RvcjIuXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gQXJyYXkgb2YgbnVtYmVycyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIE1hdHJpeDQ0LCBNYXRyaXgzMywgVmVjdG9yNCwgVmVjdG9yMywgb3IgVmVjdG9yMiBpbnN0YW5jZSBiYXNlZCBvbiBhcnJheSBsZW5ndGgsIG9yIHRoZSBvcmlnaW5hbCBlbGVtZW50IGlmIG5vdCBhbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGFycmF5VG9WZWN0b3JPck1hdHJpeChlbGVtZW50OiBBcnJheTxudW1iZXI+KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlbWVudCkpIHtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudFsxNV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBNYXRyaXg0NC5mcm9tQ29weUFycmF5Um93TWFqb3IoZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnRbOF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBNYXRyaXgzMy5mcm9tQ29weUFycmF5Um93TWFqb3IoZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnRbM10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBWZWN0b3I0LmZyb21Db3B5QXJyYXkoW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV0sIGVsZW1lbnRbMl0sIGVsZW1lbnRbM11dKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudFsyXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHlBcnJheShbZWxlbWVudFswXSwgZWxlbWVudFsxXSwgZWxlbWVudFsyXV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFZlY3RvcjIuZnJvbUNvcHlBcnJheTIoW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV1dKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW1tdXRhYmxlIHZhbHVlIGNsYXNzIGNvbnN0cnVjdG9yIGZvciBhIGdpdmVuIGNvbXBvc2l0aW9uIHR5cGUuXG4gICAqIEBwYXJhbSBjb21wb3NpdGlvblR5cGUgLSBUaGUgY29tcG9zaXRpb24gdHlwZSBlbnVtIHZhbHVlXG4gICAqIEByZXR1cm5zIENvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgY29ycmVzcG9uZGluZyBpbW11dGFibGUgbWF0aCBjbGFzcywgb3IgdW5kZWZpbmVkIGlmIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIHN0YXRpYyBnZXRJbW11dGFibGVWYWx1ZUNsYXNzKGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSk6IEZ1bmN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuVmVjMikge1xuICAgICAgcmV0dXJuIFZlY3RvcjI7XG4gICAgfVxuICAgIGlmIChjb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5WZWMzKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMztcbiAgICB9XG4gICAgaWYgKGNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzQpIHtcbiAgICAgIHJldHVybiBWZWN0b3I0O1xuICAgIH1cbiAgICBpZiAoY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuTWF0Mykge1xuICAgICAgcmV0dXJuIE1hdHJpeDMzO1xuICAgIH1cbiAgICBpZiAoY29tcG9zaXRpb25UeXBlID09PSBDb21wb3NpdGlvblR5cGUuTWF0NCkge1xuICAgICAgcmV0dXJuIE1hdHJpeDQ0O1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG11dGFibGUgdmFsdWUgY2xhc3MgY29uc3RydWN0b3IgZm9yIGEgZ2l2ZW4gY29tcG9zaXRpb24gdHlwZS5cbiAgICogQHBhcmFtIGNvbXBvc2l0aW9uVHlwZSAtIFRoZSBjb21wb3NpdGlvbiB0eXBlIGVudW0gdmFsdWVcbiAgICogQHJldHVybnMgQ29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBjb3JyZXNwb25kaW5nIG11dGFibGUgbWF0aCBjbGFzcywgb3IgdW5kZWZpbmVkIGlmIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIHN0YXRpYyBnZXRNdXRhYmxlVmFsdWVDbGFzcyhjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZUVudW0pOiBGdW5jdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzIpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlVmVjdG9yMjtcbiAgICB9XG4gICAgaWYgKGNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzMpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlVmVjdG9yMztcbiAgICB9XG4gICAgaWYgKGNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzQpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlVmVjdG9yNDtcbiAgICB9XG4gICAgaWYgKGNvbXBvc2l0aW9uVHlwZSA9PT0gQ29tcG9zaXRpb25UeXBlLk1hdDMpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlTWF0cml4MzM7XG4gICAgfVxuICAgIGlmIChjb21wb3NpdGlvblR5cGUgPT09IENvbXBvc2l0aW9uVHlwZS5NYXQ0KSB7XG4gICAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDQ0O1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkZWVwIGNsb25lIG9mIG1hdGhlbWF0aWNhbCBvYmplY3RzIChtYXRyaWNlcyBhbmQgdmVjdG9ycykuXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gVGhlIG1hdGhlbWF0aWNhbCBvYmplY3QgdG8gY2xvbmVcbiAgICogQHJldHVybnMgQSBjbG9uZWQgaW5zdGFuY2Ugb2YgdGhlIGlucHV0IG9iamVjdCwgb3IgdGhlIG9yaWdpbmFsIGVsZW1lbnQgaWYgaXQncyBub3QgYSBtYXRoZW1hdGljYWwgb2JqZWN0XG4gICAqL1xuICBzdGF0aWMgY2xvbmVPZk1hdGhPYmplY3RzKGVsZW1lbnQ6IGFueSkge1xuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTWF0cml4NDQpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LmNsb25lKCk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgTWF0cml4MzMpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LmNsb25lKCk7XG4gICAgfVxuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgVmVjdG9yNCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQuY2xvbmUoKTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBWZWN0b3IzKSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5jbG9uZSgpO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFZlY3RvcjIpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LmNsb25lKCk7XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBhcnJheSBpcyBzdWl0YWJsZSBmb3IgcXVhdGVybmlvbiBjb252ZXJzaW9uIChoYXMgNCBlbGVtZW50cykuXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gQXJyYXkgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgYXJyYXkgaGFzIDQgZWxlbWVudHMgYW5kIGNhbiBiZSBjb252ZXJ0ZWQgdG8gYSBxdWF0ZXJuaW9uXG4gICAqL1xuICBzdGF0aWMgaXNBY2NlcHRhYmxlQXJyYXlGb3JRdWF0ZXJuaW9uKGVsZW1lbnQ6IEFycmF5PG51bWJlcj4pIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbGVtZW50KSkge1xuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50WzNdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgNC1lbGVtZW50IGFycmF5IHRvIGEgUXVhdGVybmlvbiBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGVsZW1lbnQgLSBBcnJheSBvZiA0IG51bWJlcnMgcmVwcmVzZW50aW5nIHF1YXRlcm5pb24gY29tcG9uZW50cyBbeCwgeSwgeiwgd11cbiAgICogQHJldHVybnMgUXVhdGVybmlvbiBpbnN0YW5jZSBjcmVhdGVkIGZyb20gdGhlIGFycmF5IGVsZW1lbnRzXG4gICAqL1xuICBzdGF0aWMgYXJyYXlUb1F1YXRlcm5pb24oZWxlbWVudDogQXJyYXk8bnVtYmVyPikge1xuICAgIHJldHVybiBRdWF0ZXJuaW9uLmZyb21Db3B5NChlbGVtZW50WzBdLCBlbGVtZW50WzFdLCBlbGVtZW50WzJdLCBlbGVtZW50WzNdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3ViLWFycmF5IHdpdGggdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgY29tcG9uZW50cyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGlucHV0IGFycmF5LlxuICAgKiBAcGFyYW0gYXJyYXkgLSBTb3VyY2UgYXJyYXkgdG8gZXh0cmFjdCBlbGVtZW50cyBmcm9tXG4gICAqIEBwYXJhbSBjb21wb25lbnROIC0gTnVtYmVyIG9mIGNvbXBvbmVudHMgdG8gZXh0cmFjdCAoMS00KVxuICAgKiBAcmV0dXJucyBTdWItYXJyYXkgd2l0aCB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBlbGVtZW50cywgb3Igc2luZ2xlIGVsZW1lbnQgaWYgY29tcG9uZW50TiBpcyAxXG4gICAqL1xuICBzdGF0aWMgbWFrZVN1YkFycmF5KGFycmF5OiBBcnJheTxhbnk+LCBjb21wb25lbnROOiBudW1iZXIpIHtcbiAgICBpZiAoY29tcG9uZW50TiA9PT0gNCkge1xuICAgICAgcmV0dXJuIFthcnJheVswXSwgYXJyYXlbMV0sIGFycmF5WzJdLCBhcnJheVszXV07XG4gICAgfVxuICAgIGlmIChjb21wb25lbnROID09PSAzKSB7XG4gICAgICByZXR1cm4gW2FycmF5WzBdLCBhcnJheVsxXSwgYXJyYXlbMl1dO1xuICAgIH1cbiAgICBpZiAoY29tcG9uZW50TiA9PT0gMikge1xuICAgICAgcmV0dXJuIFthcnJheVswXSwgYXJyYXlbMV1dO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdmVjdG9yIGluc3RhbmNlcyB0byBhcnJheXMgb2YgdGhlaXIgY29tcG9uZW50IHZhbHVlcy5cbiAgICogQHBhcmFtIGVsZW1lbnQgLSBWZWN0b3IyLCBWZWN0b3IzLCBWZWN0b3I0LCBvciBRdWF0ZXJuaW9uIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIEFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3IgY29tcG9uZW50cywgb3IgdGhlIG9yaWdpbmFsIGVsZW1lbnQgaWYgbm90IGEgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgdmVjdG9yVG9BcnJheShlbGVtZW50OiBWZWN0b3IyIHwgVmVjdG9yMyB8IFZlY3RvcjQgfCBRdWF0ZXJuaW9uKSB7XG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBWZWN0b3IyKSB7XG4gICAgICByZXR1cm4gW2VsZW1lbnQueCwgZWxlbWVudC55XTtcbiAgICB9XG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBWZWN0b3IzKSB7XG4gICAgICByZXR1cm4gW2VsZW1lbnQueCwgZWxlbWVudC55LCBlbGVtZW50LnpdO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFZlY3RvcjQgfHwgZWxlbWVudCBpbnN0YW5jZW9mIFF1YXRlcm5pb24pIHtcbiAgICAgIHJldHVybiBbZWxlbWVudC54LCBlbGVtZW50LnksIGVsZW1lbnQueiwgZWxlbWVudC53XTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgbnVtYmVyIG9mIGNvbXBvbmVudHMgaW4gYSB2ZWN0b3IgaW5zdGFuY2Ugb3IgYXJyYXkuXG4gICAqIEBwYXJhbSBlbGVtZW50IC0gVmVjdG9yIGluc3RhbmNlIG9yIGFycmF5IHRvIGFuYWx5emVcbiAgICogQHJldHVybnMgTnVtYmVyIG9mIGNvbXBvbmVudHMgKDIgZm9yIFZlY3RvcjIsIDMgZm9yIFZlY3RvcjMsIDQgZm9yIFZlY3RvcjQvUXVhdGVybmlvbiwgYXJyYXkgbGVuZ3RoIGZvciBhcnJheXMsIDAgZm9yIHVuc3VwcG9ydGVkIHR5cGVzKVxuICAgKi9cbiAgc3RhdGljIGNvbXBvbmVudE51bWJlck9mVmVjdG9yKGVsZW1lbnQ6IFZlY3RvcjIgfCBWZWN0b3IzIHwgVmVjdG9yNCB8IFF1YXRlcm5pb24gfCBBcnJheTxhbnk+KTogbnVtYmVyIHtcbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFZlY3RvcjIpIHtcbiAgICAgIHJldHVybiAyO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFZlY3RvcjMpIHtcbiAgICAgIHJldHVybiAzO1xuICAgIH1cbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFZlY3RvcjQgfHwgZWxlbWVudCBpbnN0YW5jZW9mIFF1YXRlcm5pb24pIHtcbiAgICAgIHJldHVybiA0O1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYWNrcyBhIG5vcm1hbGl6ZWQgNEQgdmVjdG9yIGludG8gYSAyRCB2ZWN0b3IgdXNpbmcgYSBncmlkLWJhc2VkIGVuY29kaW5nIHNjaGVtZS5cbiAgICogSW5wdXQgdmFsdWVzIG11c3QgYmUgaW4gdGhlIHJhbmdlIFstMSwgMV0gYW5kIGFyZSBjb252ZXJ0ZWQgdG8gWzAsIDFdIGludGVybmFsbHkuXG4gICAqIEBwYXJhbSB4IC0gWCBjb21wb25lbnQgb2YgdGhlIDREIHZlY3RvciAobXVzdCBiZSBpbiByYW5nZSBbLTEsIDFdKVxuICAgKiBAcGFyYW0geSAtIFkgY29tcG9uZW50IG9mIHRoZSA0RCB2ZWN0b3IgKG11c3QgYmUgaW4gcmFuZ2UgWy0xLCAxXSlcbiAgICogQHBhcmFtIHogLSBaIGNvbXBvbmVudCBvZiB0aGUgNEQgdmVjdG9yIChtdXN0IGJlIGluIHJhbmdlIFstMSwgMV0pXG4gICAqIEBwYXJhbSB3IC0gVyBjb21wb25lbnQgb2YgdGhlIDREIHZlY3RvciAobXVzdCBiZSBpbiByYW5nZSBbLTEsIDFdKVxuICAgKiBAcGFyYW0gY3JpdGVyaWEgLSBHcmlkIHJlc29sdXRpb24gZm9yIGVuY29kaW5nIChkZXRlcm1pbmVzIHByZWNpc2lvbilcbiAgICogQHJldHVybnMgQXJyYXkgb2YgMiB2YWx1ZXMgcmVwcmVzZW50aW5nIHRoZSBwYWNrZWQgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgcGFja05vcm1hbGl6ZWRWZWM0VG9WZWMyKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHc6IG51bWJlciwgY3JpdGVyaWE6IG51bWJlcikge1xuICAgIGxldCB2MCA9IDAuMDtcbiAgICBsZXQgdjEgPSAwLjA7XG5cbiAgICB4ID0gKHggKyAxKSAvIDIuMDtcbiAgICB5ID0gKHkgKyAxKSAvIDIuMDtcbiAgICB6ID0gKHogKyAxKSAvIDIuMDtcbiAgICB3ID0gKHcgKyAxKSAvIDIuMDtcblxuICAgIGNvbnN0IGlyID0gTWF0aC5mbG9vcih4ICogKGNyaXRlcmlhIC0gMS4wKSk7XG4gICAgY29uc3QgaWcgPSBNYXRoLmZsb29yKHkgKiAoY3JpdGVyaWEgLSAxLjApKTtcbiAgICBjb25zdCBpcmcgPSBpciAqIGNyaXRlcmlhICsgaWc7XG4gICAgdjAgPSBpcmcgLyBjcml0ZXJpYTtcblxuICAgIGNvbnN0IGliID0gTWF0aC5mbG9vcih6ICogKGNyaXRlcmlhIC0gMS4wKSk7XG4gICAgY29uc3QgaWEgPSBNYXRoLmZsb29yKHcgKiAoY3JpdGVyaWEgLSAxLjApKTtcbiAgICBjb25zdCBpYmEgPSBpYiAqIGNyaXRlcmlhICsgaWE7XG4gICAgdjEgPSBpYmEgLyBjcml0ZXJpYTtcblxuICAgIHJldHVybiBbdjAsIHYxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnByb2plY3RzIGEgd2luZG93IGNvb3JkaW5hdGUgdG8gd29ybGQgc3BhY2UgdXNpbmcgdGhlIGludmVyc2UgcHJvamVjdGlvbi12aWV3IG1hdHJpeC5cbiAgICogQ29udmVydHMgMkQgc2NyZWVuIGNvb3JkaW5hdGVzIHdpdGggZGVwdGggdG8gM0Qgd29ybGQgY29vcmRpbmF0ZXMuXG4gICAqIEBwYXJhbSB3aW5kb3dQb3NYIC0gWCBjb29yZGluYXRlIGluIHdpbmRvdyBzcGFjZVxuICAgKiBAcGFyYW0gd2luZG93UG9zWSAtIFkgY29vcmRpbmF0ZSBpbiB3aW5kb3cgc3BhY2VcbiAgICogQHBhcmFtIHdpbmRvd1Bvc1ogLSBaIGNvb3JkaW5hdGUgKGRlcHRoKSBpbiB3aW5kb3cgc3BhY2VcbiAgICogQHBhcmFtIGludmVyc2VQVk1hdDQ0IC0gSW52ZXJzZSBvZiB0aGUgcHJvamVjdGlvbi12aWV3IG1hdHJpeFxuICAgKiBAcGFyYW0gdmlld3BvcnRWZWM0IC0gVmlld3BvcnQgcGFyYW1ldGVycyBbeCwgeSwgd2lkdGgsIGhlaWdodF1cbiAgICogQHBhcmFtIG91dCAtIE91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgdW5wcm9qZWN0ZWQgM0Qgd29ybGQgcG9zaXRpb25cbiAgICovXG4gIHN0YXRpYyB1blByb2plY3RUbyhcbiAgICB3aW5kb3dQb3NYOiBudW1iZXIsXG4gICAgd2luZG93UG9zWTogbnVtYmVyLFxuICAgIHdpbmRvd1Bvc1o6IG51bWJlcixcbiAgICBpbnZlcnNlUFZNYXQ0NDogTWF0cml4NDQsXG4gICAgdmlld3BvcnRWZWM0OiBWZWN0b3I0LFxuICAgIG91dDogTXV0YWJsZVZlY3RvcjNcbiAgKSB7XG4gICAgY29uc3QgaW5wdXQgPSB0aGlzLl9fdG1wVmVjdG9yNF8wLnNldENvbXBvbmVudHMoXG4gICAgICAoKHdpbmRvd1Bvc1ggLSB2aWV3cG9ydFZlYzQueCkgLyB2aWV3cG9ydFZlYzQueikgKiAyIC0gMS4wLFxuICAgICAgKCh3aW5kb3dQb3NZIC0gdmlld3BvcnRWZWM0LnkpIC8gdmlld3BvcnRWZWM0LncpICogMiAtIDEuMCxcbiAgICAgIDIgKiB3aW5kb3dQb3NaIC0gMS4wLFxuICAgICAgMS4wXG4gICAgKTtcblxuICAgIGNvbnN0IG91dE5vbk5vcm1hbGl6ZWQgPSBpbnZlcnNlUFZNYXQ0NC5tdWx0aXBseVZlY3RvclRvKGlucHV0LCB0aGlzLl9fdG1wVmVjdG9yNF8xKTtcbiAgICBpZiAob3V0Tm9uTm9ybWFsaXplZC53ID09PSAwKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBsZWZ0IHVuY2hhbmdlZC4nKTtcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIE11dGFibGVWZWN0b3IzLm11bHRpcGx5VG8ob3V0Tm9uTm9ybWFsaXplZCwgMS4wIC8gb3V0Tm9uTm9ybWFsaXplZC53LCBvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGFkZGl0aW9uIG9wZXJhdGlvbiBvbiB2YXJpb3VzIG1hdGhlbWF0aWNhbCB0eXBlcy5cbiAgICogU3VwcG9ydHMgbnVtYmVycywgdmVjdG9ycywgcXVhdGVybmlvbnMsIGFuZCBhcnJheXMuXG4gICAqIEBwYXJhbSBsaHMgLSBMZWZ0LWhhbmQgc2lkZSBvcGVyYW5kXG4gICAqIEBwYXJhbSByaHMgLSBSaWdodC1oYW5kIHNpZGUgb3BlcmFuZFxuICAgKiBAcmV0dXJucyBSZXN1bHQgb2YgdGhlIGFkZGl0aW9uIG9wZXJhdGlvbiwgdHlwZSBkZXBlbmRzIG9uIGlucHV0IHR5cGVzXG4gICAqL1xuICBzdGF0aWMgYWRkKGxoczogYW55LCByaHM6IGFueSkge1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobGhzKSkge1xuICAgICAgLy8gbnVtYmVyP1xuICAgICAgcmV0dXJuIGxocyArIHJocztcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFZlY3RvcjIpIHtcbiAgICAgIHJldHVybiBWZWN0b3IyLmFkZChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBWZWN0b3IzKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMy5hZGQobGhzLCByaHMpO1xuICAgIH1cbiAgICBpZiAobGhzIGluc3RhbmNlb2YgVmVjdG9yNCkge1xuICAgICAgcmV0dXJuIFZlY3RvcjQuYWRkKGxocywgcmhzKTtcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFF1YXRlcm5pb24pIHtcbiAgICAgIHJldHVybiBRdWF0ZXJuaW9uLmFkZChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGxocykpIHtcbiAgICAgIGNvbnN0IGFycjogbnVtYmVyW10gPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFycltpXSA9IGxoc1tpXSArIHJoc1tpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb24gc3VwcG9ydGVkIHR5cGUhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHN1YnRyYWN0aW9uIG9wZXJhdGlvbiBvbiB2YXJpb3VzIG1hdGhlbWF0aWNhbCB0eXBlcy5cbiAgICogU3VwcG9ydHMgbnVtYmVycywgdmVjdG9ycywgcXVhdGVybmlvbnMsIGFuZCBhcnJheXMuXG4gICAqIEBwYXJhbSBsaHMgLSBMZWZ0LWhhbmQgc2lkZSBvcGVyYW5kIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcmhzIC0gUmlnaHQtaGFuZCBzaWRlIG9wZXJhbmQgKHN1YnRyYWhlbmQpXG4gICAqIEByZXR1cm5zIFJlc3VsdCBvZiB0aGUgc3VidHJhY3Rpb24gb3BlcmF0aW9uLCB0eXBlIGRlcGVuZHMgb24gaW5wdXQgdHlwZXNcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsaHM6IGFueSwgcmhzOiBhbnkpIHtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxocykpIHtcbiAgICAgIC8vIG51bWJlcj9cbiAgICAgIHJldHVybiBsaHMgLSByaHM7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBWZWN0b3IyKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMi5zdWJ0cmFjdChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBWZWN0b3IzKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMy5zdWJ0cmFjdChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBWZWN0b3I0KSB7XG4gICAgICByZXR1cm4gVmVjdG9yNC5zdWJ0cmFjdChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBRdWF0ZXJuaW9uKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5zdWJ0cmFjdChsaHMsIHJocyk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGxocykpIHtcbiAgICAgIGNvbnN0IGFycjogbnVtYmVyW10gPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFycltpXSA9IGxoc1tpXSAtIHJoc1tpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb24gc3VwcG9ydGVkIHR5cGUhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdmFyaW91cyBtYXRoZW1hdGljYWwgdHlwZXMgYnkgYSBzY2FsYXIgbnVtYmVyLlxuICAgKiBTdXBwb3J0cyBudW1iZXJzLCB2ZWN0b3JzLCBxdWF0ZXJuaW9ucywgYW5kIGFycmF5cy5cbiAgICogQHBhcmFtIGxocyAtIE1hdGhlbWF0aWNhbCBvYmplY3QgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIHJocyAtIFNjYWxhciBtdWx0aXBsaWVyXG4gICAqIEByZXR1cm5zIFJlc3VsdCBvZiB0aGUgc2NhbGFyIG11bHRpcGxpY2F0aW9uLCB0eXBlIGRlcGVuZHMgb24gaW5wdXQgdHlwZVxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5TnVtYmVyKGxoczogYW55LCByaHM6IG51bWJlcikge1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobGhzKSkge1xuICAgICAgLy8gbnVtYmVyP1xuICAgICAgcmV0dXJuIGxocyAqIHJocztcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFZlY3RvcjIpIHtcbiAgICAgIHJldHVybiBWZWN0b3IyLm11bHRpcGx5KGxocywgcmhzKTtcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFZlY3RvcjMpIHtcbiAgICAgIHJldHVybiBWZWN0b3IzLm11bHRpcGx5KGxocywgcmhzKTtcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFZlY3RvcjQpIHtcbiAgICAgIHJldHVybiBWZWN0b3I0Lm11bHRpcGx5KGxocywgcmhzKTtcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFF1YXRlcm5pb24pIHtcbiAgICAgIHJldHVybiBRdWF0ZXJuaW9uLm11bHRpcGx5TnVtYmVyKGxocywgcmhzKTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobGhzKSkge1xuICAgICAgY29uc3QgYXJyOiBudW1iZXJbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXJyW2ldID0gbGhzW2ldICogcmhzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycjtcbiAgICB9XG4gICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ05vbiBzdXBwb3J0ZWQgdHlwZSEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB2YXJpb3VzIG1hdGhlbWF0aWNhbCB0eXBlcyBieSBhIHNjYWxhciBudW1iZXIuXG4gICAqIFN1cHBvcnRzIG51bWJlcnMsIHZlY3RvcnMsIHF1YXRlcm5pb25zLCBhbmQgYXJyYXlzLlxuICAgKiBAcGFyYW0gbGhzIC0gTWF0aGVtYXRpY2FsIG9iamVjdCB0byBkaXZpZGVcbiAgICogQHBhcmFtIHJocyAtIFNjYWxhciBkaXZpc29yXG4gICAqIEByZXR1cm5zIFJlc3VsdCBvZiB0aGUgc2NhbGFyIGRpdmlzaW9uLCB0eXBlIGRlcGVuZHMgb24gaW5wdXQgdHlwZVxuICAgKi9cbiAgc3RhdGljIGRpdmlkZU51bWJlcihsaHM6IGFueSwgcmhzOiBudW1iZXIpIHtcbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxocykpIHtcbiAgICAgIC8vIG51bWJlcj9cbiAgICAgIHJldHVybiBsaHMgLyByaHM7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBWZWN0b3IyKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMi5tdWx0aXBseShsaHMsIDEgLyByaHMpO1xuICAgIH1cbiAgICBpZiAobGhzIGluc3RhbmNlb2YgVmVjdG9yMykge1xuICAgICAgcmV0dXJuIFZlY3RvcjMubXVsdGlwbHkobGhzLCAxIC8gcmhzKTtcbiAgICB9XG4gICAgaWYgKGxocyBpbnN0YW5jZW9mIFZlY3RvcjQpIHtcbiAgICAgIHJldHVybiBWZWN0b3I0Lm11bHRpcGx5KGxocywgMSAvIHJocyk7XG4gICAgfVxuICAgIGlmIChsaHMgaW5zdGFuY2VvZiBRdWF0ZXJuaW9uKSB7XG4gICAgICByZXR1cm4gUXVhdGVybmlvbi5tdWx0aXBseU51bWJlcihsaHMsIDEgLyByaHMpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShsaHMpKSB7XG4gICAgICBjb25zdCBhcnI6IG51bWJlcltdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxocy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhcnJbaV0gPSBsaHNbaV0gLyByaHM7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJyO1xuICAgIH1cbiAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignTm9uIHN1cHBvcnRlZCB0eXBlIScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIG1hdGhlbWF0aWNhbCBvYmplY3Qgb2YgdGhlIHNhbWUgdHlwZSBhcyB0aGUgaW5wdXQgd2l0aCBhIHNjYWxhciB2YWx1ZS5cbiAgICogRm9yIHZlY3RvcnMgYW5kIGFycmF5cywgYWxsIGNvbXBvbmVudHMgYXJlIHNldCB0byB0aGUgc2NhbGFyIHZhbHVlLlxuICAgKiBGb3IgcXVhdGVybmlvbnMsIGNyZWF0ZXMgYW4gaWRlbnRpdHkgcXVhdGVybmlvbi5cbiAgICogQHBhcmFtIG9iakZvckRldGVjdFR5cGUgLSBPYmplY3QgdXNlZCB0byBkZXRlcm1pbmUgdGhlIHRhcmdldCB0eXBlXG4gICAqIEBwYXJhbSB2YWwgLSBTY2FsYXIgdmFsdWUgdG8gaW5pdGlhbGl6ZSB3aXRoXG4gICAqIEByZXR1cm5zIE5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSB0eXBlIGFzIG9iakZvckRldGVjdFR5cGUgaW5pdGlhbGl6ZWQgd2l0aCB2YWxcbiAgICovXG4gIHN0YXRpYyBpbml0V2l0aFNjYWxhcihvYmpGb3JEZXRlY3RUeXBlOiBhbnksIHZhbDogbnVtYmVyKSB7XG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShvYmpGb3JEZXRlY3RUeXBlKSkge1xuICAgICAgLy8gbnVtYmVyP1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBWZWN0b3IyKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMi5mcm9tQ29weUFycmF5MihbdmFsLCB2YWxdKTtcbiAgICB9XG4gICAgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBWZWN0b3IzKSB7XG4gICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weUFycmF5KFt2YWwsIHZhbCwgdmFsXSk7XG4gICAgfVxuICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgVmVjdG9yNCkge1xuICAgICAgcmV0dXJuIFZlY3RvcjQuZnJvbUNvcHlBcnJheShbdmFsLCB2YWwsIHZhbCwgdmFsXSk7XG4gICAgfVxuICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgUXVhdGVybmlvbikge1xuICAgICAgcmV0dXJuIFF1YXRlcm5pb24uZnJvbUNvcHk0KDAsIDAsIDAsIDEpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpGb3JEZXRlY3RUeXBlKSkge1xuICAgICAgY29uc3QgYXJyOiBudW1iZXJbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmpGb3JEZXRlY3RUeXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFycltpXSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCdOb24gc3VwcG9ydGVkIHR5cGUhJyk7XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIG11dGFibGUgbWF0aGVtYXRpY2FsIG9iamVjdCBmcm9tIGEgdmFsdWUgdXNpbmcgYSBwcm92aWRlZCBGbG9hdDMyQXJyYXkgYXMgc3RvcmFnZS5cbiAgICogVGhpcyBtZXRob2QgZWZmaWNpZW50bHkgcmV1c2VzIG1lbW9yeSBieSB1c2luZyB0aGUgcHJvdmlkZWQgYXJyYXkgYXMgdGhlIGJhY2tpbmcgc3RvcmUuXG4gICAqIEBwYXJhbSB2YWwgLSBWYWx1ZSB0byBpbml0aWFsaXplIGZyb20gKGNhbiBiZSB2YXJpb3VzIG1hdGhlbWF0aWNhbCB0eXBlcylcbiAgICogQHBhcmFtIGZsb2F0QXJyYXkgLSBGbG9hdDMyQXJyYXkgdG8gdXNlIGFzIGJhY2tpbmcgc3RvcmFnZVxuICAgKiBAcmV0dXJucyBNdXRhYmxlIG1hdGhlbWF0aWNhbCBvYmplY3QgdXNpbmcgdGhlIHByb3ZpZGVkIGFycmF5IGFzIHN0b3JhZ2VcbiAgICovXG4gIHN0YXRpYyBpbml0V2l0aEZsb2F0MzJBcnJheSh2YWw6IGFueSwgZmxvYXRBcnJheTogRmxvYXQzMkFycmF5KSB7XG4gICAgbGV0IG9iajogYW55O1xuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUodmFsKSkge1xuICAgICAgLy8gbnVtYmVyP1xuICAgICAgY29uc3QgYXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZsb2F0QXJyYXkpO1xuICAgICAgKGZsb2F0QXJyYXkgYXMgYW55KS5fdiA9IHZvaWQgMDtcbiAgICAgIGFycmF5WzBdID0gdmFsO1xuICAgICAgcmV0dXJuIG5ldyBTY2FsYXIoYXJyYXkpO1xuICAgIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgU2NhbGFyIHx8IHZhbCBpbnN0YW5jZW9mIE11dGFibGVTY2FsYXIpIHtcbiAgICAgIGZsb2F0QXJyYXlbMF0gPSB2YWwueDtcbiAgICAgIG9iaiA9IG5ldyBNdXRhYmxlU2NhbGFyKGZsb2F0QXJyYXkpO1xuICAgIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVmVjdG9yMiB8fCB2YWwgaW5zdGFuY2VvZiBNdXRhYmxlVmVjdG9yMikge1xuICAgICAgZmxvYXRBcnJheVswXSA9IHZhbC54O1xuICAgICAgZmxvYXRBcnJheVsxXSA9IHZhbC55O1xuICAgICAgb2JqID0gbmV3IE11dGFibGVWZWN0b3IyKGZsb2F0QXJyYXkpO1xuICAgIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgVmVjdG9yMyB8fCB2YWwgaW5zdGFuY2VvZiBNdXRhYmxlVmVjdG9yMykge1xuICAgICAgZmxvYXRBcnJheVswXSA9IHZhbC54O1xuICAgICAgZmxvYXRBcnJheVsxXSA9IHZhbC55O1xuICAgICAgZmxvYXRBcnJheVsyXSA9IHZhbC56O1xuICAgICAgb2JqID0gTXV0YWJsZVZlY3RvcjMuZnJvbUZsb2F0MzJBcnJheShmbG9hdEFycmF5KTtcbiAgICB9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFZlY3RvcjQgfHwgdmFsIGluc3RhbmNlb2YgTXV0YWJsZVZlY3RvcjQpIHtcbiAgICAgIGZsb2F0QXJyYXlbMF0gPSB2YWwueDtcbiAgICAgIGZsb2F0QXJyYXlbMV0gPSB2YWwueTtcbiAgICAgIGZsb2F0QXJyYXlbMl0gPSB2YWwuejtcbiAgICAgIGZsb2F0QXJyYXlbM10gPSB2YWwudztcbiAgICAgIG9iaiA9IG5ldyBNdXRhYmxlVmVjdG9yNChmbG9hdEFycmF5KTtcbiAgICB9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFF1YXRlcm5pb24gfHwgdmFsIGluc3RhbmNlb2YgTXV0YWJsZVF1YXRlcm5pb24pIHtcbiAgICAgIGZsb2F0QXJyYXlbMF0gPSB2YWwueDtcbiAgICAgIGZsb2F0QXJyYXlbMV0gPSB2YWwueTtcbiAgICAgIGZsb2F0QXJyYXlbMl0gPSB2YWwuejtcbiAgICAgIGZsb2F0QXJyYXlbM10gPSB2YWwudztcbiAgICAgIG9iaiA9IG5ldyBNdXRhYmxlUXVhdGVybmlvbihmbG9hdEFycmF5KTtcbiAgICB9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIE1hdHJpeDMzIHx8IHZhbCBpbnN0YW5jZW9mIE11dGFibGVNYXRyaXgzMykge1xuICAgICAgb2JqID0gb2JqID09IG51bGwgPyBuZXcgTXV0YWJsZU1hdHJpeDMzKGZsb2F0QXJyYXkpIDogb2JqO1xuICAgICAgb2JqLm0wMCA9IHZhbC5tMDA7XG4gICAgICBvYmoubTAxID0gdmFsLm0wMTtcbiAgICAgIG9iai5tMDIgPSB2YWwubTAyO1xuICAgICAgb2JqLm0xMCA9IHZhbC5tMTA7XG4gICAgICBvYmoubTExID0gdmFsLm0xMTtcbiAgICAgIG9iai5tMTIgPSB2YWwubTEyO1xuICAgICAgb2JqLm0yMCA9IHZhbC5tMjA7XG4gICAgICBvYmoubTIxID0gdmFsLm0yMTtcbiAgICAgIG9iai5tMjIgPSB2YWwubTIyO1xuICAgIH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgTWF0cml4NDQgfHwgdmFsIGluc3RhbmNlb2YgTXV0YWJsZU1hdHJpeDQ0KSB7XG4gICAgICBvYmogPSBuZXcgTXV0YWJsZU1hdHJpeDQ0KGZsb2F0QXJyYXkpO1xuICAgICAgb2JqLm0wMCA9IHZhbC5tMDA7XG4gICAgICBvYmoubTAxID0gdmFsLm0wMTtcbiAgICAgIG9iai5tMDIgPSB2YWwubTAyO1xuICAgICAgb2JqLm0wMyA9IHZhbC5tMDM7XG4gICAgICBvYmoubTEwID0gdmFsLm0xMDtcbiAgICAgIG9iai5tMTEgPSB2YWwubTExO1xuICAgICAgb2JqLm0xMiA9IHZhbC5tMTI7XG4gICAgICBvYmoubTEzID0gdmFsLm0xMztcbiAgICAgIG9iai5tMjAgPSB2YWwubTIwO1xuICAgICAgb2JqLm0yMSA9IHZhbC5tMjE7XG4gICAgICBvYmoubTIyID0gdmFsLm0yMjtcbiAgICAgIG9iai5tMjMgPSB2YWwubTIzO1xuICAgICAgb2JqLm0zMCA9IHZhbC5tMzA7XG4gICAgICBvYmoubTMxID0gdmFsLm0zMTtcbiAgICAgIG9iai5tMzIgPSB2YWwubTMyO1xuICAgICAgb2JqLm0zMyA9IHZhbC5tMzM7XG4gICAgfSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBWZWN0b3JOKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5fdi5sZW5ndGg7IGkrKykge1xuICAgICAgICBmbG9hdEFycmF5W2ldID0gdmFsLl92W2ldO1xuICAgICAgfVxuICAgICAgb2JqID0gbmV3IFZlY3Rvck4oZmxvYXRBcnJheSk7XG4gICAgfSBlbHNlIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgbGV0IHZlYzogYW55O1xuICAgICAgc3dpdGNoIChmbG9hdEFycmF5Lmxlbmd0aCkge1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgdmVjID0gVmVjdG9yNC5mcm9tQ29weUZsb2F0MzJBcnJheShmbG9hdEFycmF5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHZlYyA9IFZlY3RvcjMuZnJvbUNvcHlGbG9hdDMyQXJyYXkoZmxvYXRBcnJheSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB2ZWMgPSBuZXcgVmVjdG9yMihmbG9hdEFycmF5KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHZlYyA9IG5ldyBTY2FsYXIoZmxvYXRBcnJheSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAoZmxvYXRBcnJheSBhcyBhbnkpLl92ID0gdm9pZCAwO1xuICAgICAgcmV0dXJuIHZlYztcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsKSB8fCBBcnJheUJ1ZmZlci5pc1ZpZXcodmFsKSB8fCBBcnJheUJ1ZmZlci5pc1ZpZXcodmFsLl92KSkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ05vbiBzdXBwb3J0ZWQgdHlwZSEnKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIChmbG9hdEFycmF5IGFzIGFueSkuX3YgPSB2b2lkIDA7XG5cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlZnVsbHkgc2V0cyB0aGUgaW50ZXJuYWwgdmFsdWVzIG9mIGEgbWF0aGVtYXRpY2FsIG9iamVjdCB0byBtYXRjaCBhbm90aGVyIG9iamVjdCdzIHZhbHVlcy5cbiAgICogVGhpcyBtZXRob2QgZGlyZWN0bHkgbW9kaWZpZXMgdGhlIGludGVybmFsIGFycmF5IHJlcHJlc2VudGF0aW9uIGZvciBwZXJmb3JtYW5jZS5cbiAgICogUGVyZm9ybXMgZXF1YWxpdHkgY2hlY2sgdG8gYXZvaWQgdW5uZWNlc3Nhcnkgb3BlcmF0aW9ucy5cbiAgICogQHBhcmFtIG9iakZvckRldGVjdFR5cGUgLSBUYXJnZXQgb2JqZWN0IHRvIG1vZGlmeVxuICAgKiBAcGFyYW0gdmFsIC0gU291cmNlIG9iamVjdCBvciB2YWx1ZSB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB2YWx1ZXMgd2VyZSBjaGFuZ2VkLCBmYWxzZSBpZiB0aGV5IHdlcmUgYWxyZWFkeSBlcXVhbFxuICAgKi9cbiAgc3RhdGljIF9zZXRGb3JjZShvYmpGb3JEZXRlY3RUeXBlOiBhbnksIHZhbDogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNdXRhYmxlVmVjdG9yNCB8fCBvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgVmVjdG9yNCkge1xuICAgICAgaWYgKG9iakZvckRldGVjdFR5cGUuaXNFcXVhbCh2YWwpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWwuX3ZbMF07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzFdID0gdmFsLl92WzFdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlsyXSA9IHZhbC5fdlsyXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbM10gPSB2YWwuX3ZbM107XG4gICAgfSBlbHNlIGlmIChvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgTXV0YWJsZVZlY3RvcjIgfHwgb2JqRm9yRGV0ZWN0VHlwZSBpbnN0YW5jZW9mIFZlY3RvcjIpIHtcbiAgICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlLmlzRXF1YWwodmFsKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzBdID0gdmFsLl92WzBdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlsxXSA9IHZhbC5fdlsxXTtcbiAgICB9IGVsc2UgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNdXRhYmxlVmVjdG9yMyB8fCBvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgVmVjdG9yMykge1xuICAgICAgaWYgKG9iakZvckRldGVjdFR5cGUuaXNFcXVhbCh2YWwpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWwuX3ZbMF07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzFdID0gdmFsLl92WzFdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlsyXSA9IHZhbC5fdlsyXTtcbiAgICB9IGVsc2UgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNdXRhYmxlU2NhbGFyIHx8IG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBTY2FsYXIpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsLl92ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAob2JqRm9yRGV0ZWN0VHlwZS5fdlswXSA9PT0gdmFsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob2JqRm9yRGV0ZWN0VHlwZS5fdlswXSA9PT0gdmFsLl92WzBdKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWwuX3ZbMF07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgTXV0YWJsZU1hdHJpeDMzIHx8IG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNYXRyaXgzMykge1xuICAgICAgaWYgKG9iakZvckRldGVjdFR5cGUuaXNFcXVhbCh2YWwpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWwuX3ZbMF07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzFdID0gdmFsLl92WzFdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlsyXSA9IHZhbC5fdlsyXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbM10gPSB2YWwuX3ZbM107XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzRdID0gdmFsLl92WzRdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdls1XSA9IHZhbC5fdls1XTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbNl0gPSB2YWwuX3ZbNl07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzddID0gdmFsLl92WzddO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdls4XSA9IHZhbC5fdls4XTtcbiAgICB9IGVsc2UgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNdXRhYmxlTWF0cml4NDQgfHwgb2JqRm9yRGV0ZWN0VHlwZSBpbnN0YW5jZW9mIE1hdHJpeDQ0KSB7XG4gICAgICBpZiAob2JqRm9yRGV0ZWN0VHlwZS5pc0VxdWFsKHZhbCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlswXSA9IHZhbC5fdlswXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMV0gPSB2YWwuX3ZbMV07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzJdID0gdmFsLl92WzJdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlszXSA9IHZhbC5fdlszXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbNF0gPSB2YWwuX3ZbNF07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzVdID0gdmFsLl92WzVdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdls2XSA9IHZhbC5fdls2XTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbN10gPSB2YWwuX3ZbN107XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzhdID0gdmFsLl92WzhdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdls5XSA9IHZhbC5fdls5XTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTBdID0gdmFsLl92WzEwXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTFdID0gdmFsLl92WzExXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTJdID0gdmFsLl92WzEyXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTNdID0gdmFsLl92WzEzXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTRdID0gdmFsLl92WzE0XTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMTVdID0gdmFsLl92WzE1XTtcbiAgICB9IGVsc2UgaWYgKG9iakZvckRldGVjdFR5cGUgaW5zdGFuY2VvZiBNdXRhYmxlUXVhdGVybmlvbiB8fCBvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgUXVhdGVybmlvbikge1xuICAgICAgaWYgKG9iakZvckRldGVjdFR5cGUuaXNFcXVhbCh2YWwpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbMF0gPSB2YWwuX3ZbMF07XG4gICAgICBvYmpGb3JEZXRlY3RUeXBlLl92WzFdID0gdmFsLl92WzFdO1xuICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdlsyXSA9IHZhbC5fdlsyXTtcbiAgICAgIG9iakZvckRldGVjdFR5cGUuX3ZbM10gPSB2YWwuX3ZbM107XG4gICAgfSBlbHNlIGlmIChvYmpGb3JEZXRlY3RUeXBlIGluc3RhbmNlb2YgVmVjdG9yTikge1xuICAgICAgbGV0IHZhbEFycmF5OiBUeXBlZEFycmF5O1xuICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIFZlY3Rvck4pIHtcbiAgICAgICAgdmFsQXJyYXkgPSB2YWwuX3Y7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWxBcnJheSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIGxldCBpc1NhbWUgPSB0cnVlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmpGb3JEZXRlY3RUeXBlLl92Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlLl92W2ldICE9PSB2YWxBcnJheVtpXSkge1xuICAgICAgICAgIGlzU2FtZSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNTYW1lKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqRm9yRGV0ZWN0VHlwZS5fdi5sZW5ndGg7IGkrKykge1xuICAgICAgICBvYmpGb3JEZXRlY3RUeXBlLl92W2ldID0gdmFsQXJyYXlbaV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iakZvckRldGVjdFR5cGUpKSB7XG4gICAgICBsZXQgaXNTYW1lID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqRm9yRGV0ZWN0VHlwZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob2JqRm9yRGV0ZWN0VHlwZVtpXSAhPT0gdmFsLl92W2ldKSB7XG4gICAgICAgICAgaXNTYW1lID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpc1NhbWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmpGb3JEZXRlY3RUeXBlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9iakZvckRldGVjdFR5cGVbaV0gPSB2YWwuX3ZbaV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghTnVtYmVyLmlzTmFOKG9iakZvckRldGVjdFR5cGUuX3YubGVuZ3RoKSkge1xuICAgICAgbGV0IGlzU2FtZSA9IHRydWU7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iakZvckRldGVjdFR5cGUuX3YubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlLl92W2ldICE9PSB2YWxbaV0pIHtcbiAgICAgICAgICAgIGlzU2FtZSA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChvYmpGb3JEZXRlY3RUeXBlLl92W2ldICE9PSB2YWwuX3ZbaV0pIHtcbiAgICAgICAgICAgIGlzU2FtZSA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaXNTYW1lKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqRm9yRGV0ZWN0VHlwZS5fdi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgb2JqRm9yRGV0ZWN0VHlwZS5fdltpXSA9IHZhbFtpXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvYmpGb3JEZXRlY3RUeXBlLl92W2ldID0gdmFsLl92W2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ1Vua25vd24gdHlwZSBfc2V0Rm9yY2UnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsY0FBYztBQUN2QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBT2pCLElBQU0sZ0JBQU4sTUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTekIsT0FBTyxjQUFjLFNBQXdCO0FBQzNDLFFBQUksTUFBTSxRQUFRLE9BQU8sR0FBRztBQUMxQixVQUFJLE9BQU8sUUFBUSxDQUFDLE1BQU0s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
