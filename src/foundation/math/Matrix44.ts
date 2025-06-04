import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';
import { IMatrix, IMatrix33, IMatrix44 } from './IMatrix';
import { CompositionType } from '../definitions/CompositionType';
import { MutableVector3 } from './MutableVector3';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableVector4 } from './MutableVector4';
import { IVector3 } from './IVector';
import { IVector4 } from './IVector';
import { MathUtil } from './MathUtil';
import { IdentityMatrix44 } from './IdentityMatrix44';
import { AbstractMatrix } from './AbstractMatrix';
import { Array16, ArrayType } from '../../types/CommonTypes';
import { mulThatAndThisToOutAsMat44_offsetAsComposition } from './raw/raw_extension';
import { IQuaternion } from './IQuaternion';
import { Logger } from '../misc/Logger';

/* eslint-disable prettier/prettier */
const FloatArray = Float32Array;
type FloatArray = Float32Array;

/**
 * Represents a 4x4 matrix stored in column-major order (OpenGL/WebGL style).
 * This class provides immutable matrix operations and is used for 3D transformations
 * including translation, rotation, and scaling.
 *
 * @example
 * ```typescript
 * const identity = Matrix44.identity();
 * const translation = Matrix44.translate(Vector3.fromCopyArray([1, 2, 3]));
 * const result = Matrix44.multiply(identity, translation);
 * ```
 */
export class Matrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
  /**
   * Creates a new Matrix44 instance.
   * @param m - A Float32Array containing 16 matrix elements in column-major order
   */
  constructor(m: FloatArray) {
    super();
    this._v = m;
  }

  /**
   * Gets the matrix element at row 0, column 0.
   * @returns The m00 component of the matrix
   */
  public get m00() {
    return this._v[0];
  }

  /**
   * Gets the matrix element at row 1, column 0.
   * @returns The m10 component of the matrix
   */
  public get m10() {
    return this._v[1];
  }

  /**
   * Gets the matrix element at row 2, column 0.
   * @returns The m20 component of the matrix
   */
  public get m20() {
    return this._v[2];
  }

  /**
   * Gets the matrix element at row 3, column 0.
   * @returns The m30 component of the matrix
   */
  public get m30() {
    return this._v[3];
  }

  /**
   * Gets the matrix element at row 0, column 1.
   * @returns The m01 component of the matrix
   */
  public get m01() {
    return this._v[4];
  }

  /**
   * Gets the matrix element at row 1, column 1.
   * @returns The m11 component of the matrix
   */
  public get m11() {
    return this._v[5];
  }

  /**
   * Gets the matrix element at row 2, column 1.
   * @returns The m21 component of the matrix
   */
  public get m21() {
    return this._v[6];
  }

  /**
   * Gets the matrix element at row 3, column 1.
   * @returns The m31 component of the matrix
   */
  public get m31() {
    return this._v[7];
  }

  /**
   * Gets the matrix element at row 0, column 2.
   * @returns The m02 component of the matrix
   */
  public get m02() {
    return this._v[8];
  }

  /**
   * Gets the matrix element at row 1, column 2.
   * @returns The m12 component of the matrix
   */
  public get m12() {
    return this._v[9];
  }

  /**
   * Gets the matrix element at row 2, column 2.
   * @returns The m22 component of the matrix
   */
  public get m22() {
    return this._v[10];
  }

  /**
   * Gets the matrix element at row 3, column 2.
   * @returns The m32 component of the matrix
   */
  public get m32() {
    return this._v[11];
  }

  /**
   * Gets the matrix element at row 0, column 3.
   * @returns The m03 component of the matrix
   */
  public get m03() {
    return this._v[12];
  }

  /**
   * Gets the matrix element at row 1, column 3.
   * @returns The m13 component of the matrix
   */
  public get m13() {
    return this._v[13];
  }

  /**
   * Gets the matrix element at row 2, column 3.
   * @returns The m23 component of the matrix
   */
  public get m23() {
    return this._v[14];
  }

  /**
   * Gets the matrix element at row 3, column 3.
   * @returns The m33 component of the matrix
   */
  public get m33() {
    return this._v[15];
  }

  /**
   * Gets the X component of the translation vector from this matrix.
   * @returns The X translation value
   */
  public get translateX() {
    return this._v[12];
  }

  /**
   * Gets the Y component of the translation vector from this matrix.
   * @returns The Y translation value
   */
  public get translateY() {
    return this._v[13];
  }

  /**
   * Gets the Z component of the translation vector from this matrix.
   * @returns The Z translation value
   */
  public get translateZ() {
    return this._v[14];
  }

  /**
   * Gets the composition type for this matrix class.
   * @returns The composition type enum value
   */
  static get compositionType() {
    return CompositionType.Mat4;
  }

  /**
   * Converts the matrix to a GLSL mat4 string representation with float precision.
   * @returns A GLSL-compatible string representation of the matrix
   */
  get glslStrAsFloat() {
    return `mat4(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[9])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[10])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[11])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[12])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[13])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[14])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[15])})`;
  }

  /**
   * Converts the matrix to a GLSL mat4 string representation with integer values.
   * @returns A GLSL-compatible string representation of the matrix with integer values
   */
  get glslStrAsInt() {
    return `mat4(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])}, ${Math.floor(this._v[9])}, ${Math.floor(this._v[10])}, ${Math.floor(this._v[11])}, ${Math.floor(this._v[12])}, ${Math.floor(this._v[13])}, ${Math.floor(this._v[14])}, ${Math.floor(this._v[15])})`;
  }

  /**
   * Converts the matrix to a WGSL mat4x4f string representation with float precision.
   * @returns A WGSL-compatible string representation of the matrix
   */
  get wgslStrAsFloat() {
    return `mat4x4f(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[4])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[5])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[6])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[7])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[8])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[9])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[10])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[11])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[12])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[13])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[14])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[15])})`;
  }

  /**
   * Converts the matrix to a WGSL mat4x4i string representation with integer values.
   * @returns A WGSL-compatible string representation of the matrix with integer values
   */
  get wgslStrAsInt() {
    return `mat4x4i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])}, ${Math.floor(this._v[4])}, ${Math.floor(this._v[5])}, ${Math.floor(this._v[6])}, ${Math.floor(this._v[7])}, ${Math.floor(this._v[8])}, ${Math.floor(this._v[9])}, ${Math.floor(this._v[10])}, ${Math.floor(this._v[11])}, ${Math.floor(this._v[12])}, ${Math.floor(this._v[13])}, ${Math.floor(this._v[14])}, ${Math.floor(this._v[15])})`;
  }

  /**
   * Creates a zero matrix (all elements are 0).
   * @returns A new Matrix44 instance with all elements set to 0
   */
  static zero() {
    return Matrix44.fromCopy16RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Creates a 4x4 identity matrix.
   * @returns A new IdentityMatrix44 instance representing the identity matrix
   */
  static identity() {
    return new IdentityMatrix44();
  }

  /**
   * Creates a dummy matrix with zero-length array (for placeholder purposes).
   * @returns A new Matrix44 instance with an empty array
   */
  static dummy() {
    return new this(new Float32Array(0));
  }

  /**
   * Creates a transpose matrix from the given matrix.
   * For identity matrices, returns the same matrix since transpose of identity is identity.
   * @param mat - The matrix to transpose
   * @returns A new Matrix44 instance representing the transposed matrix
   */
  static transpose(mat: IMatrix44) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }

    return Matrix44.fromCopyFloat32ArrayRowMajor(mat._v);
  }

  /**
   * Creates an inverse matrix from the given matrix.
   * Uses optimized computation for 4x4 matrix inversion.
   * @param mat - The matrix to invert
   * @returns A new Matrix44 instance representing the inverted matrix
   * @throws Logs an error if the matrix is not invertible (determinant is 0)
   */
  static invert(mat: IMatrix44): IMatrix44 {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }
    const invDet = 1 / det;

    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) * invDet;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) * invDet;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) * invDet;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) * invDet;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) * invDet;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) * invDet;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) * invDet;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) * invDet;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) * invDet;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) * invDet;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) * invDet;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) * invDet;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) * invDet;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) * invDet;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) * invDet;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) * invDet;

    return Matrix44.fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Computes the inverse of a matrix and stores the result in an output matrix.
   * This is the mutable version of the invert method for performance optimization.
   * @param mat - The matrix to invert
   * @param outMat - The output matrix to store the result
   * @returns The output matrix containing the inverted matrix
   * @throws Logs an error if the matrix is not invertible (determinant is 0)
   */
  static invertTo(mat: IMatrix44, outMat: MutableMatrix44) {
    if (mat.isIdentityMatrixClass) {
      return outMat.copyComponents(mat);
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      Logger.error('the determinant is 0!');
    }
    const invDet = 1 / det;

    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) * invDet;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) * invDet;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) * invDet;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) * invDet;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) * invDet;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) * invDet;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) * invDet;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) * invDet;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) * invDet;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) * invDet;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) * invDet;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) * invDet;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) * invDet;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) * invDet;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) * invDet;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) * invDet;

    return outMat.setComponents(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Creates a translation matrix from a 3D vector.
   * @param vec - The translation vector
   * @returns A new Matrix44 instance representing the translation transformation
   */
  static translate(vec: Vector3) {
    return Matrix44.fromCopy16RowMajor(
      1,
      0,
      0,
      vec._v[0],
      0,
      1,
      0,
      vec._v[1],
      0,
      0,
      1,
      vec._v[2],
      0,
      0,
      0,
      1
    );
  }

  /**
   * Creates a rotation matrix around the X-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the X-axis rotation
   */
  static rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1);
  }

  /**
   * Creates a rotation matrix around the Y-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the Y-axis rotation
   */
  static rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0, 0, 0, 0, 1);
  }

  /**
   * Creates a rotation matrix around the Z-axis.
   * @param radian - The rotation angle in radians
   * @returns A new Matrix44 instance representing the Z-axis rotation
   */
  static rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  /**
   * Creates a rotation matrix from Euler angles (XYZ order).
   * Applies rotations in the order: X, then Y, then Z.
   * @param x - Rotation around X-axis in radians
   * @param y - Rotation around Y-axis in radians
   * @param z - Rotation around Z-axis in radians
   * @returns A new Matrix44 instance representing the combined rotation
   */
  static rotateXYZ(x: number, y: number, z: number) {
    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const cosZ = Math.cos(z);
    const sinZ = Math.sin(z);

    // const x00 = 1;
    // const x01 = 0;
    // const x02 = 0;
    // const x10 = 0;
    const x11 = cosX;
    const x12 = -sinX;
    // const x20 = 0;
    const x21 = sinX;
    const x22 = cosX;

    const y00 = cosY;
    // const y01 = 0;
    const y02 = sinY;
    // const y10 = 0;
    // const y11 = 1;
    // const y12 = 0;
    const y20 = -sinY;
    // const y21 = 0;
    const y22 = cosY;

    const z00 = cosZ;
    const z01 = -sinZ;
    // const z02 = 0;
    const z10 = sinZ;
    const z11 = cosZ;
    // const z12 = 0;
    // const z20 = 0;
    // const z21 = 0;
    // const z22 = 1;

    // Y * X
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    //const yx10 = 0;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;

    // Z * Y * X
    const m00 = z00 * yx00;
    const m01 = z00 * yx01 + z01 * yx11;
    const m02 = z00 * yx02 + z01 * yx12;
    const m10 = z10 * yx00;
    const m11 = z10 * yx01 + z11 * yx11;
    const m12 = z10 * yx02 + z11 * yx12;
    const m20 = yx20;
    const m21 = yx21;
    const m22 = yx22;

    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return Matrix44.fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Creates a rotation matrix from a 3D vector containing Euler angles.
   * @param vec - A vector containing rotation angles [x, y, z] in radians
   * @returns A new Matrix44 instance representing the rotation
   */
  static rotate(vec: IVector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Creates a scaling matrix from a 3D vector.
   * @param vec - The scaling factors for each axis [x, y, z]
   * @returns A new Matrix44 instance representing the scaling transformation
   */
  static scale(vec: IVector3) {
    return Matrix44.fromCopy16RowMajor(
      vec._v[0],
      0,
      0,
      0,
      0,
      vec._v[1],
      0,
      0,
      0,
      0,
      vec._v[2],
      0,
      0,
      0,
      0,
      1
    );
  }

  /**
   * Multiplies two 4x4 matrices and returns the result.
   * Optimized to handle identity matrices efficiently.
   * @param l_mat - The left matrix in the multiplication
   * @param r_mat - The right matrix in the multiplication
   * @returns A new Matrix44 instance representing the matrix product (l_mat * r_mat)
   */
  static multiply(l_mat: IMatrix44, r_mat: IMatrix44): IMatrix44 {
    if (l_mat.isIdentityMatrixClass) {
      return r_mat;
    } else if (r_mat.isIdentityMatrixClass) {
      return l_mat;
    }

    const lv = (l_mat as Matrix44)._v;
    const rv = (r_mat as Matrix44)._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];

    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];

    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];

    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];

    return Matrix44.fromCopy16RowMajor(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Multiplies two 4x4 matrices and stores the result in an output matrix.
   * This is the mutable version of the multiply method for performance optimization.
   * @param l_mat - The left matrix in the multiplication
   * @param r_mat - The right matrix in the multiplication
   * @param outMat - The output matrix to store the result
   * @returns The output matrix containing the multiplication result
   */
  static multiplyTo(l_mat: IMatrix44, r_mat: IMatrix44, outMat: MutableMatrix44) {
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    } else if (r_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(l_mat);
    }

    const lv = (l_mat as Matrix44)._v;
    const rv = (r_mat as Matrix44)._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];

    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];

    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];

    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];

    return outMat.setComponents(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Multiplies a matrix with data from a typed array and stores the result.
   * This method is optimized for working with raw array data.
   * @param l_mat - The left matrix in the multiplication
   * @param r_array - The right operand as a typed array
   * @param outMat - The output matrix to store the result
   * @param offsetAsComposition - The offset in the array for composition data
   * @returns The output matrix containing the multiplication result
   */
  static multiplyTypedArrayTo(
    l_mat: IMatrix44,
    r_array: ArrayType,
    outMat: MutableMatrix44,
    offsetAsComposition: number
  ) {
    (r_array as any)[mulThatAndThisToOutAsMat44_offsetAsComposition](
      offsetAsComposition,
      l_mat._v,
      0,
      outMat._v
    );

    return outMat;
  }

  /**
   * Creates a rotation matrix from a quaternion and stores it in an output matrix.
   * @param quat - The quaternion representing the rotation
   * @param outMat - The output matrix to store the result
   * @returns The output matrix containing the rotation matrix
   */
  static fromQuaternionTo(quat: IQuaternion, outMat: MutableMatrix44) {
    const sx = quat._v[0] * quat._v[0];
    const sy = quat._v[1] * quat._v[1];
    const sz = quat._v[2] * quat._v[2];
    const cx = quat._v[1] * quat._v[2];
    const cy = quat._v[0] * quat._v[2];
    const cz = quat._v[0] * quat._v[1];
    const wx = quat._v[3] * quat._v[0];
    const wy = quat._v[3] * quat._v[1];
    const wz = quat._v[3] * quat._v[2];

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    const m03 = 0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    const m13 = 0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return outMat.setComponents(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  /**
   * Converts the matrix to a human-readable string representation.
   * Elements are displayed in row-major order for intuitive reading.
   * @returns A formatted string representation of the matrix
   */
  toString() {
    return (
      this._v[0] +
      ' ' +
      this._v[4] +
      ' ' +
      this._v[8] +
      ' ' +
      this._v[12] +
      ' \n' +
      this._v[1] +
      ' ' +
      this._v[5] +
      ' ' +
      this._v[9] +
      ' ' +
      this._v[13] +
      ' \n' +
      this._v[2] +
      ' ' +
      this._v[6] +
      ' ' +
      this._v[10] +
      ' ' +
      this._v[14] +
      ' \n' +
      this._v[3] +
      ' ' +
      this._v[7] +
      ' ' +
      this._v[11] +
      ' ' +
      this._v[15] +
      ' \n'
    );
  }

  /**
   * Converts the matrix to a human-readable string with rounded values.
   * Uses financial rounding for better readability of floating-point numbers.
   * @returns A formatted string representation with approximated values
   */
  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[4]) +
      ' ' +
      MathUtil.financial(this._v[8]) +
      ' ' +
      MathUtil.financial(this._v[12]) +
      ' \n' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[5]) +
      ' ' +
      MathUtil.financial(this._v[9]) +
      ' ' +
      MathUtil.financial(this._v[13]) +
      ' \n' +
      MathUtil.financial(this._v[2]) +
      ' ' +
      MathUtil.financial(this._v[6]) +
      ' ' +
      MathUtil.financial(this._v[10]) +
      ' ' +
      MathUtil.financial(this._v[14]) +
      ' \n' +
      MathUtil.financial(this._v[3]) +
      ' ' +
      MathUtil.financial(this._v[7]) +
      ' ' +
      MathUtil.financial(this._v[11]) +
      ' ' +
      MathUtil.financial(this._v[15]) +
      ' \n'
    );
  }

  /**
   * Flattens the matrix into a regular JavaScript array.
   * Elements are returned in column-major order (WebGL compatible).
   * @returns An array containing all 16 matrix elements
   */
  flattenAsArray() {
    return [
      this._v[0],
      this._v[1],
      this._v[2],
      this._v[3],
      this._v[4],
      this._v[5],
      this._v[6],
      this._v[7],
      this._v[8],
      this._v[9],
      this._v[10],
      this._v[11],
      this._v[12],
      this._v[13],
      this._v[14],
      this._v[15],
    ];
  }

  /**
   * Checks if this is a dummy matrix (empty array).
   * @returns true if the matrix has no elements, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if this matrix is approximately equal to another matrix.
   * @param mat - The matrix to compare with
   * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
   * @returns true if matrices are approximately equal within the given tolerance
   */
  isEqual(mat: IMatrix44, delta: number = Number.EPSILON) {
    const v = (mat as Matrix44)._v;
    if (
      Math.abs(v[0] - this._v[0]) < delta &&
      Math.abs(v[1] - this._v[1]) < delta &&
      Math.abs(v[2] - this._v[2]) < delta &&
      Math.abs(v[3] - this._v[3]) < delta &&
      Math.abs(v[4] - this._v[4]) < delta &&
      Math.abs(v[5] - this._v[5]) < delta &&
      Math.abs(v[6] - this._v[6]) < delta &&
      Math.abs(v[7] - this._v[7]) < delta &&
      Math.abs(v[8] - this._v[8]) < delta &&
      Math.abs(v[9] - this._v[9]) < delta &&
      Math.abs(v[10] - this._v[10]) < delta &&
      Math.abs(v[11] - this._v[11]) < delta &&
      Math.abs(v[12] - this._v[12]) < delta &&
      Math.abs(v[13] - this._v[13]) < delta &&
      Math.abs(v[14] - this._v[14]) < delta &&
      Math.abs(v[15] - this._v[15]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if this matrix is exactly equal to another matrix.
   * Uses strict equality comparison for all elements.
   * @param mat - The matrix to compare with
   * @returns true if matrices are exactly equal, false otherwise
   */
  isStrictEqual(mat: IMatrix44) {
    if (
      mat._v[0] === this._v[0] &&
      mat._v[1] === this._v[1] &&
      mat._v[2] === this._v[2] &&
      mat._v[3] === this._v[3] &&
      mat._v[4] === this._v[4] &&
      mat._v[5] === this._v[5] &&
      mat._v[6] === this._v[6] &&
      mat._v[7] === this._v[7] &&
      mat._v[8] === this._v[8] &&
      mat._v[9] === this._v[9] &&
      mat._v[10] === this._v[10] &&
      mat._v[11] === this._v[11] &&
      mat._v[12] === this._v[12] &&
      mat._v[13] === this._v[13] &&
      mat._v[14] === this._v[14] &&
      mat._v[15] === this._v[15]
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets a matrix element at the specified row and column.
   * @param row_i - The row index (0-3)
   * @param column_i - The column index (0-3)
   * @returns The matrix element at the given position
   */
  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 4];
  }

  /**
   * Calculates the determinant of this 4x4 matrix.
   * @returns The determinant value
   */
  determinant() {
    return (
      this._v[0] * this._v[5] * this._v[10] * this._v[15] +
      this._v[0] * this._v[9] * this._v[14] * this._v[7] +
      this._v[0] * this._v[13] * this._v[6] * this._v[11] +
      this._v[4] * this._v[1] * this._v[14] * this._v[11] +
      this._v[4] * this._v[9] * this._v[2] * this._v[15] +
      this._v[4] * this._v[13] * this._v[10] * this._v[3] +
      this._v[8] * this._v[1] * this._v[6] * this._v[15] +
      this._v[8] * this._v[5] * this._v[14] * this._v[3] +
      this._v[8] * this._v[13] * this._v[2] * this._v[7] +
      this._v[12] * this._v[1] * this._v[10] * this._v[7] +
      this._v[12] * this._v[5] * this._v[2] * this._v[11] +
      this._v[12] * this._v[9] * this._v[6] * this._v[3] -
      this._v[0] * this._v[5] * this._v[14] * this._v[11] -
      this._v[0] * this._v[9] * this._v[6] * this._v[15] -
      this._v[0] * this._v[13] * this._v[10] * this._v[7] -
      this._v[4] * this._v[1] * this._v[10] * this._v[15] -
      this._v[4] * this._v[9] * this._v[14] * this._v[3] -
      this._v[4] * this._v[13] * this._v[2] * this._v[11] -
      this._v[8] * this._v[1] * this._v[14] * this._v[7] -
      this._v[8] * this._v[5] * this._v[2] * this._v[15] -
      this._v[8] * this._v[13] * this._v[6] * this._v[3] -
      this._v[12] * this._v[1] * this._v[6] * this._v[11] -
      this._v[12] * this._v[5] * this._v[10] * this._v[3] -
      this._v[12] * this._v[9] * this._v[2] * this._v[7]
    );
  }

  /**
   * Multiplies this matrix with a 4D vector and returns the result.
   * @param vec - The 4D vector to multiply
   * @returns A new Vector4 containing the multiplication result
   */
  multiplyVector(vec: IVector4): IVector4 {
    const x =
      this._v[0] * vec._v[0] +
      this._v[4] * vec._v[1] +
      this._v[8] * vec._v[2] +
      this._v[12] * vec._v[3];
    const y =
      this._v[1] * vec._v[0] +
      this._v[5] * vec._v[1] +
      this._v[9] * vec._v[2] +
      this._v[13] * vec._v[3];
    const z =
      this._v[2] * vec._v[0] +
      this._v[6] * vec._v[1] +
      this._v[10] * vec._v[2] +
      this._v[14] * vec._v[3];
    const w =
      this._v[3] * vec._v[0] +
      this._v[7] * vec._v[1] +
      this._v[11] * vec._v[2] +
      this._v[15] * vec._v[3];

    return Vector4.fromCopyArray([x, y, z, w]);
  }

  /**
   * Multiplies this matrix with a 4D vector and stores the result in an output vector.
   * @param vec - The 4D vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the multiplication result
   */
  multiplyVectorTo(vec: IVector4, outVec: MutableVector4) {
    const x =
      this._v[0] * vec._v[0] +
      this._v[4] * vec._v[1] +
      this._v[8] * vec._v[2] +
      this._v[12] * vec._v[3];
    const y =
      this._v[1] * vec._v[0] +
      this._v[5] * vec._v[1] +
      this._v[9] * vec._v[2] +
      this._v[13] * vec._v[3];
    const z =
      this._v[2] * vec._v[0] +
      this._v[6] * vec._v[1] +
      this._v[10] * vec._v[2] +
      this._v[14] * vec._v[3];
    const w =
      this._v[3] * vec._v[0] +
      this._v[7] * vec._v[1] +
      this._v[11] * vec._v[2] +
      this._v[15] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    outVec._v[3] = w;

    return outVec;
  }

  /**
   * Multiplies this matrix with a 4D vector and stores the XYZ components in a 3D vector.
   * @param vec - The 4D vector to multiply
   * @param outVec - The output 3D vector to store the XYZ components
   * @returns The output vector containing the XYZ components of the result
   */
  multiplyVectorToVec3(vec: IVector4, outVec: MutableVector3) {
    const x =
      this._v[0] * vec._v[0] +
      this._v[4] * vec._v[1] +
      this._v[8] * vec._v[2] +
      this._v[12] * vec._v[3];
    const y =
      this._v[1] * vec._v[0] +
      this._v[5] * vec._v[1] +
      this._v[9] * vec._v[2] +
      this._v[13] * vec._v[3];
    const z =
      this._v[2] * vec._v[0] +
      this._v[6] * vec._v[1] +
      this._v[10] * vec._v[2] +
      this._v[14] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;

    return outVec;
  }

  /**
   * Multiplies this matrix with a 3D vector (treating it as a point with w=1).
   * @param vec - The 3D vector to multiply
   * @returns A new Vector3 containing the transformed point
   */
  multiplyVector3(vec: IVector3): IVector3 {
    const x =
      this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12]; // regards vec.w(vec._v[3]) as 1
    const y =
      this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z =
      this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];

    return Vector3.fromCopyArray([x, y, z]);
  }

  /**
   * Multiplies this matrix with a 3D vector and stores the result (treating it as a point with w=1).
   * @param vec - The 3D vector to multiply
   * @param outVec - The output vector to store the result
   * @returns The output vector containing the transformed point
   */
  multiplyVector3To(vec: IVector3, outVec: MutableVector3) {
    const x =
      this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12]; // regards vec.w(vec._v[3]) as 1
    const y =
      this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z =
      this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;

    return outVec;
  }

  /**
   * Extracts the translation vector from this transformation matrix.
   * @returns A new Vector3 containing the translation components
   */
  getTranslate() {
    return Vector3.fromCopyArray([this._v[12], this._v[13], this._v[14]]);
  }

  /**
   * Extracts the translation vector from this matrix and stores it in an output vector.
   * @param outVec - The output vector to store the translation
   * @returns The output vector containing the translation components
   */
  getTranslateTo(outVec: MutableVector3) {
    outVec._v[0] = this._v[12];
    outVec._v[1] = this._v[13];
    outVec._v[2] = this._v[14];
    return outVec;
  }

  /**
   * Extracts the scale factors from this transformation matrix.
   * @returns A new Vector3 containing the scale components for each axis
   */
  getScale() {
    return Vector3.fromCopyArray([
      Math.hypot(this._v[0], this._v[1], this._v[2]),
      Math.hypot(this._v[4], this._v[5], this._v[6]),
      Math.hypot(this._v[8], this._v[9], this._v[10]),
    ]);
  }

  /**
   * Extracts the scale factors from this matrix and stores them in an output vector.
   * @param outVec - The output vector to store the scale factors
   * @returns The output vector containing the scale components
   */
  getScaleTo(outVec: MutableVector3) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[1], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[4], this._v[5], this._v[6]);
    outVec._v[2] = Math.hypot(this._v[8], this._v[9], this._v[10]);
    return outVec;
  }

  /**
   * Converts this transformation matrix to Euler angles (XYZ rotation order).
   * @returns A Vector3 containing the Euler angles [x, y, z] in radians
   */
  toEulerAngles(): Vector3 {
    let rotate: Vector3;
    if (Math.abs(this._v[2]) !== 1.0) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      rotate = Vector3.fromCopyArray([x, y, z]);
    } else if (this._v[2] === -1.0) {
      rotate = Vector3.fromCopyArray([Math.atan2(this._v[4], this._v[8]), Math.PI / 2.0, 0.0]);
    } else {
      rotate = Vector3.fromCopyArray([Math.atan2(-this._v[4], -this._v[8]), -Math.PI / 2.0, 0.0]);
    }

    return rotate;
  }

  /**
   * Converts this transformation matrix to Euler angles and stores them in an output vector.
   * @param outVec3 - The output vector to store the Euler angles
   * @returns The output vector containing the Euler angles [x, y, z] in radians
   */
  toEulerAnglesTo(outVec3: MutableVector3) {
    if (Math.abs(this._v[2]) !== 1.0) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      outVec3._v[0] = x;
      outVec3._v[1] = y;
      outVec3._v[2] = z;
    } else if (this._v[2] === -1.0) {
      outVec3._v[0] = Math.atan2(this._v[4], this._v[8]);
      outVec3._v[1] = Math.PI / 2.0;
      outVec3._v[2] = 0.0;
    } else {
      outVec3._v[0] = Math.atan2(-this._v[4], -this._v[8]);
      outVec3._v[1] = -Math.PI / 2.0;
      outVec3._v[2] = 0.0;
    }

    return outVec3;
  }

  /**
   * Creates a deep copy of this matrix.
   * @returns A new Matrix44 instance with the same values
   */
  clone() {
    return (this.constructor as any).fromCopy16RowMajor(
      this._v[0],
      this._v[4],
      this._v[8],
      this._v[12],
      this._v[1],
      this._v[5],
      this._v[9],
      this._v[13],
      this._v[2],
      this._v[6],
      this._v[10],
      this._v[14],
      this._v[3],
      this._v[7],
      this._v[11],
      this._v[15]
    ) as Matrix44;
  }

  /**
   * Extracts the rotation part of this transformation matrix.
   * Removes scaling effects to get pure rotation.
   * @returns A new Matrix44 containing only the rotation transformation
   */
  getRotate() {
    // const quat = Quaternion.fromMatrix(this);
    // const rotateMat = (this.constructor as any).fromCopyQuaternion(quat) as Matrix44;
    const scaleX = Math.hypot(this._v[0], this._v[1], this._v[2]);
    const scaleY = Math.hypot(this._v[4], this._v[5], this._v[6]);
    const scaleZ = Math.hypot(this._v[8], this._v[9], this._v[10]);

    const mat = Matrix44.fromCopy16RowMajor(
      this._v[0] / scaleX,
      this._v[4],
      this._v[8],
      0,
      this._v[1],
      this._v[5] / scaleY,
      this._v[9],
      0,
      this._v[2],
      this._v[6],
      this._v[10] / scaleZ,
      0,
      0,
      0,
      0,
      1
    );
    return mat;
  }

  /**
   * Creates a matrix from 16 individual values in row-major order.
   * This is the most intuitive way to specify matrix values, as you can
   * write them in the same 4x4 layout as they appear visually.
   * Note that internally, WebGL uses column-major storage.
   *
   * @param m00 - Element at row 0, column 0
   * @param m01 - Element at row 0, column 1
   * @param m02 - Element at row 0, column 2
   * @param m03 - Element at row 0, column 3
   * @param m10 - Element at row 1, column 0
   * @param m11 - Element at row 1, column 1
   * @param m12 - Element at row 1, column 2
   * @param m13 - Element at row 1, column 3
   * @param m20 - Element at row 2, column 0
   * @param m21 - Element at row 2, column 1
   * @param m22 - Element at row 2, column 2
   * @param m23 - Element at row 2, column 3
   * @param m30 - Element at row 3, column 0
   * @param m31 - Element at row 3, column 1
   * @param m32 - Element at row 3, column 2
   * @param m33 - Element at row 3, column 3
   * @returns A new Matrix44 instance
   */
  static fromCopy16RowMajor(
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number
  ) {
    const v = new Float32Array(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from 16 individual values in column-major order.
   * This matches the internal storage format used by WebGL.
   *
   * @param m00 - Element at row 0, column 0
   * @param m10 - Element at row 1, column 0
   * @param m20 - Element at row 2, column 0
   * @param m30 - Element at row 3, column 0
   * @param m01 - Element at row 0, column 1
   * @param m11 - Element at row 1, column 1
   * @param m21 - Element at row 2, column 1
   * @param m31 - Element at row 3, column 1
   * @param m02 - Element at row 0, column 2
   * @param m12 - Element at row 1, column 2
   * @param m22 - Element at row 2, column 2
   * @param m32 - Element at row 3, column 2
   * @param m03 - Element at row 0, column 3
   * @param m13 - Element at row 1, column 3
   * @param m23 - Element at row 2, column 3
   * @param m33 - Element at row 3, column 3
   * @returns A new Matrix44 instance
   */
  static fromCopy16ColumnMajor(
    m00: number,
    m10: number,
    m20: number,
    m30: number,
    m01: number,
    m11: number,
    m21: number,
    m31: number,
    m02: number,
    m12: number,
    m22: number,
    m32: number,
    m03: number,
    m13: number,
    m23: number,
    m33: number
  ) {
    const v = new Float32Array(16);
    v[0] = m00;
    v[4] = m01;
    v[8] = m02;
    v[12] = m03;
    v[1] = m10;
    v[5] = m11;
    v[9] = m12;
    v[13] = m13;
    v[2] = m20;
    v[6] = m21;
    v[10] = m22;
    v[14] = m23;
    v[3] = m30;
    v[7] = m31;
    v[11] = m32;
    v[15] = m33;
    return new Matrix44(v);
  }

  /**
   * Creates a new matrix by copying another Matrix44 instance.
   * @param mat - The source matrix to copy
   * @returns A new Matrix44 instance with copied values
   */
  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(16);
    v.set(mat._v);
    return new Matrix44(v);
  }

  /**
   * Creates a matrix directly from a Float32Array in column-major order.
   * The array is used directly without copying (shares the same memory).
   * @param float32Array - A Float32Array containing 16 matrix elements
   * @returns A new Matrix44 instance using the provided array
   */
  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new Matrix44(float32Array);
  }

  /**
   * Creates a matrix from a Float32Array in column-major order with copying.
   * @param float32Array - A Float32Array containing 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(16);
    v.set(float32Array);
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from a Float32Array in row-major order with copying.
   * The input array is assumed to be in row-major order and will be converted
   * to column-major order for internal storage.
   * @param array - A Float32Array containing 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new Matrix44(v);
  }

  /**
   * Creates a 4x4 matrix from a 3x3 matrix by embedding it in the upper-left corner.
   * The resulting matrix has the 3x3 matrix in the upper-left, with the bottom-right
   * element set to 1 and other elements set to 0.
   * @param mat - The 3x3 matrix to embed
   * @returns A new Matrix44 instance
   */
  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(16);
    v[0] = mat._v[0];
    v[4] = mat._v[3];
    v[8] = mat._v[6];
    v[12] = 0;
    v[1] = mat._v[1];
    v[5] = mat._v[4];
    v[9] = mat._v[7];
    v[13] = 0;
    v[2] = mat._v[2];
    v[6] = mat._v[5];
    v[10] = mat._v[8];
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from a fixed-size array (Array16) in column-major order.
   * @param array - An Array16 containing exactly 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static fromCopyArray16ColumnMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from a variable-length array in column-major order.
   * @param array - An array containing at least 16 matrix elements
   * @returns A new Matrix44 instance with copied values
   */
  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from a fixed-size array (Array16) in row-major order.
   * The input array is converted from row-major to column-major order.
   * @param array - An Array16 containing exactly 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static fromCopyArray16RowMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new Matrix44(v);
  }

  /**
   * Creates a matrix from a variable-length array in row-major order.
   * The input array is converted from row-major to column-major order.
   * @param array - An array containing at least 16 matrix elements in row-major order
   * @returns A new Matrix44 instance with converted values
   */
  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v[0] = array[0];
    v[4] = array[1];
    v[8] = array[2];
    v[12] = array[3];
    v[1] = array[4];
    v[5] = array[5];
    v[9] = array[6];
    v[13] = array[7];
    v[2] = array[8];
    v[6] = array[9];
    v[10] = array[10];
    v[14] = array[11];
    v[3] = array[12];
    v[7] = array[13];
    v[11] = array[14];
    v[15] = array[15];
    return new Matrix44(v);
  }

  /**
   * Creates a rotation matrix from a quaternion.
   * @param q - The quaternion representing the rotation
   * @returns A new Matrix44 instance representing the rotation transformation
   */
  static fromCopyQuaternion(q: IQuaternion) {
    const sx = q._v[0] * q._v[0];
    const sy = q._v[1] * q._v[1];
    const sz = q._v[2] * q._v[2];
    const cx = q._v[1] * q._v[2];
    const cy = q._v[0] * q._v[2];
    const cz = q._v[0] * q._v[1];
    const wx = q._v[3] * q._v[0];
    const wy = q._v[3] * q._v[1];
    const wz = q._v[3] * q._v[2];
    const v = new Float32Array(16);
    v[0] = 1.0 - 2.0 * (sy + sz);
    v[4] = 2.0 * (cz - wz);
    v[8] = 2.0 * (cy + wy);
    v[12] = 0;
    v[1] = 2.0 * (cz + wz);
    v[5] = 1.0 - 2.0 * (sx + sz);
    v[9] = 2.0 * (cx - wx);
    v[13] = 0;
    v[2] = 2.0 * (cy - wy);
    v[6] = 2.0 * (cx + wx);
    v[10] = 1.0 - 2.0 * (sx + sy);
    v[14] = 0;
    v[3] = 0;
    v[7] = 0;
    v[11] = 0;
    v[15] = 1;

    return new Matrix44(v);
  }
}
