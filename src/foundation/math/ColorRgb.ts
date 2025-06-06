import { Vector3 } from './Vector3';
import type { IVector3 } from './IVector';
import type { IColorRgb } from './IColor';

/**
 * Represents an RGB color with red, green, and blue components.
 * Extends Vector3 to provide mathematical operations on color values.
 * Each component is stored as a floating-point value, typically in the range [0, 1].
 *
 * @example
 * ```typescript
 * const red = new ColorRgb(new Float32Array([1, 0, 0]));
 * const green = ColorRgb.add(red, new ColorRgb(new Float32Array([0, 1, 0])));
 * ```
 */
export class ColorRgb extends Vector3 implements IVector3, IColorRgb {
  /**
   * Creates a new ColorRgb instance.
   *
   * @param r - A Float32Array containing the RGB values [red, green, blue]
   */
  constructor(r: Float32Array) {
    super(r);
  }

  /**
   * Gets the X component of the color (equivalent to red component).
   *
   * @returns The X/red component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the Y component of the color (equivalent to green component).
   *
   * @returns The Y/green component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Gets the Z component of the color (equivalent to blue component).
   *
   * @returns The Z/blue component value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Gets the W component of the color (always 1 for RGB colors).
   *
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }

  /**
   * Gets the red component of the color.
   *
   * @returns The red component value
   */
  get r() {
    return this._v[0];
  }

  /**
   * Gets the green component of the color.
   *
   * @returns The green component value
   */
  get g() {
    return this._v[1];
  }

  /**
   * Gets the blue component of the color.
   *
   * @returns The blue component value
   */
  get b() {
    return this._v[2];
  }

  /**
   * Gets the alpha component of the color (always 1 for RGB colors).
   *
   * @returns Always returns 1
   */
  get a() {
    return 1;
  }

  /**
   * Creates a ColorRgb with all components set to zero (black).
   *
   * @returns A new ColorRgb instance with values [0, 0, 0]
   */
  static zero() {
    return super._zero(Float32Array) as ColorRgb;
  }

  /**
   * Creates a ColorRgb with all components set to one (white).
   *
   * @returns A new ColorRgb instance with values [1, 1, 1]
   */
  static one() {
    return super._one(Float32Array) as ColorRgb;
  }

  /**
   * Creates a dummy ColorRgb instance for testing or placeholder purposes.
   *
   * @returns A new ColorRgb instance with dummy values
   */
  static dummy() {
    return super._dummy(Float32Array) as ColorRgb;
  }

  /**
   * Normalizes a color vector to unit length.
   *
   * @param vec - The color vector to normalize
   * @returns A new normalized ColorRgb instance
   */
  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as ColorRgb;
  }

  /**
   * Adds two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the sum
   */
  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  /**
   * Subtracts one color vector from another component-wise.
   *
   * @param l_vec - The minuend color vector
   * @param r_vec - The subtrahend color vector
   * @returns A new ColorRgb instance representing the difference
   */
  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  /**
   * Multiplies a color vector by a scalar value.
   *
   * @param vec - The color vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new ColorRgb instance representing the scaled color
   */
  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as ColorRgb;
  }

  /**
   * Multiplies two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  /**
   * Divides a color vector by a scalar value.
   *
   * @param vec - The color vector to divide
   * @param value - The scalar value to divide by
   * @returns A new ColorRgb instance representing the scaled color
   */
  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as ColorRgb;
  }

  /**
   * Divides one color vector by another component-wise.
   *
   * @param l_vec - The dividend color vector
   * @param r_vec - The divisor color vector
   * @returns A new ColorRgb instance representing the component-wise quotient
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  /**
   * Computes the cross product of two color vectors.
   * Note: Cross product for colors is rarely used but available for completeness.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the cross product
   */
  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as ColorRgb;
  }

  /**
   * Creates a deep copy of this ColorRgb instance.
   *
   * @returns A new ColorRgb instance with the same values
   */
  clone(): ColorRgb {
    return super.clone() as ColorRgb;
  }
}
