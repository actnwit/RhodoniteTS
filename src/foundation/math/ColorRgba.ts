import { Vector4 } from './Vector4';
import { IVector4 } from './IVector';
import { IColorRgba } from './IColor';
import { Array4 } from '../../types/CommonTypes';

/**
 * A RGBA color class that extends Vector4 to provide color-specific functionality.
 * Represents colors with red, green, blue, and alpha (transparency) components,
 * each ranging from 0.0 to 1.0.
 *
 * @example
 * ```typescript
 * // Create a red color with full opacity
 * const red = ColorRgba.fromCopy4(1.0, 0.0, 0.0, 1.0);
 *
 * // Create from array
 * const blue = ColorRgba.fromCopyArray([0.0, 0.0, 1.0, 1.0]);
 * ```
 */
export class ColorRgba extends Vector4 implements IVector4, IColorRgba {
  /**
   * Creates a new ColorRgba instance from a Float32Array.
   *
   * @param r - A Float32Array containing RGBA values [r, g, b, a]
   */
  constructor(r: Float32Array) {
    super(r);
  }

  /**
   * Gets the x component (equivalent to red component).
   *
   * @returns The x/red component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the y component (equivalent to green component).
   *
   * @returns The y/green component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Gets the z component (equivalent to blue component).
   *
   * @returns The z/blue component value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Gets the w component (equivalent to alpha component).
   *
   * @returns The w/alpha component value
   */
  get w() {
    return this._v[3];
  }

  /**
   * Gets the red component of the color.
   *
   * @returns The red component value (0.0 to 1.0)
   */
  get r() {
    return this._v[0];
  }

  /**
   * Gets the green component of the color.
   *
   * @returns The green component value (0.0 to 1.0)
   */
  get g() {
    return this._v[1];
  }

  /**
   * Gets the blue component of the color.
   *
   * @returns The blue component value (0.0 to 1.0)
   */
  get b() {
    return this._v[2];
  }

  /**
   * Gets the alpha (transparency) component of the color.
   *
   * @returns The alpha component value (0.0 = transparent, 1.0 = opaque)
   */
  get a() {
    return this._v[3];
  }

  /**
   * Creates a zero color (black with zero alpha).
   *
   * @returns A new ColorRgba instance with all components set to 0
   */
  static zero() {
    return super._zero(Float32Array) as ColorRgba;
  }

  /**
   * Creates a color with all components set to 1 (white with full opacity).
   *
   * @returns A new ColorRgba instance with all components set to 1
   */
  static one() {
    return super._one(Float32Array) as ColorRgba;
  }

  /**
   * Creates a dummy color instance for initialization purposes.
   *
   * @returns A new ColorRgba instance with dummy values
   */
  static dummy() {
    return super._dummy(Float32Array) as ColorRgba;
  }

  /**
   * Normalizes a color vector to unit length.
   *
   * @param vec - The color vector to normalize
   * @returns A new normalized ColorRgba instance
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as ColorRgba;
  }

  /**
   * Adds two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgba instance representing the sum
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  /**
   * Subtracts the right color vector from the left color vector component-wise.
   *
   * @param l_vec - The left operand color vector (minuend)
   * @param r_vec - The right operand color vector (subtrahend)
   * @returns A new ColorRgba instance representing the difference
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  /**
   * Multiplies a color vector by a scalar value.
   *
   * @param vec - The color vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new ColorRgba instance representing the scaled color
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as ColorRgba;
  }

  /**
   * Multiplies two color vectors component-wise (component multiplication).
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgba instance representing the component-wise product
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  /**
   * Divides a color vector by a scalar value.
   *
   * @param vec - The color vector to divide
   * @param value - The scalar value to divide by
   * @returns A new ColorRgba instance representing the scaled color
   * @throws Error if value is zero
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as ColorRgba;
  }

  /**
   * Divides the left color vector by the right color vector component-wise.
   *
   * @param l_vec - The left operand color vector (dividend)
   * @param r_vec - The right operand color vector (divisor)
   * @returns A new ColorRgba instance representing the component-wise quotient
   * @throws Error if any component of r_vec is zero
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as ColorRgba;
  }

  /**
   * Creates a deep copy of this color.
   *
   * @returns A new ColorRgba instance with the same component values
   */
  clone(): ColorRgba {
    return super.clone() as ColorRgba;
  }

  /**
   * Creates a new ColorRgba instance from an array of numbers.
   *
   * @param array - An array containing RGBA values [r, g, b, a]
   * @returns A new ColorRgba instance created from the array
   */
  static fromCopyArray(array: Array<number>): ColorRgba {
    return this._fromCopyArray(array, Float32Array) as ColorRgba;
  }

  /**
   * Creates a new ColorRgba instance from a 4-element tuple array.
   *
   * @param array - A 4-element tuple containing RGBA values [r, g, b, a]
   * @returns A new ColorRgba instance created from the tuple
   */
  static fromCopyArray4(array: Array4<number>): ColorRgba {
    return this._fromCopyArray4(array, Float32Array) as ColorRgba;
  }

  /**
   * Creates a new ColorRgba instance from individual RGBA component values.
   *
   * @param x - The red component value
   * @param y - The green component value
   * @param z - The blue component value
   * @param w - The alpha component value
   * @returns A new ColorRgba instance with the specified component values
   */
  static fromCopy4(x: number, y: number, z: number, w: number): ColorRgba {
    return this._fromCopy4(x, y, z, w, Float32Array) as ColorRgba;
  }

  /**
   * Creates a new ColorRgba instance by copying values from another 4D vector.
   *
   * @param vec4 - The source vector to copy from
   * @returns A new ColorRgba instance with copied values
   */
  static fromCopyVector4(vec4: IVector4): ColorRgba {
    return this._fromCopyVector4(vec4, Float32Array) as ColorRgba;
  }
}

/**
 * Predefined constant for white color with full opacity (1, 1, 1, 1).
 */
export const ConstRgbaWhite = new ColorRgba(new Float32Array([1, 1, 1, 1]));

/**
 * Predefined constant for black color with full opacity (0, 0, 0, 1).
 */
export const ConstRgbaBlack = new ColorRgba(new Float32Array([0, 0, 0, 1]));
