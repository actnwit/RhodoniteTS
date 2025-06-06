import { MutableVector3 } from './MutableVector3';
import { type IVector3, IVector4, type IMutableVector3 } from './IVector';
import type { IMutableColorRgb } from './IColor';

/**
 * A mutable RGB color class that extends MutableVector3.
 * Represents a color with red, green, and blue components, with alpha always set to 1.
 * This class provides both vector-based operations and color-specific accessors.
 */
export class MutableColorRgb extends MutableVector3 implements IMutableVector3, IMutableColorRgb {
  /**
   * Creates a new MutableColorRgb instance.
   * @param r - Float32Array containing the RGB values [r, g, b]
   */
  constructor(r: Float32Array) {
    super(r);
  }

  /**
   * Gets the X component (same as red component).
   * @returns The X/red component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Sets the X component (same as red component).
   * @param val - The value to set for X/red component
   */
  set x(val) {
    this._v[0] = val;
  }

  /**
   * Gets the Y component (same as green component).
   * @returns The Y/green component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Sets the Y component (same as green component).
   * @param val - The value to set for Y/green component
   */
  set y(val) {
    this._v[1] = val;
  }

  /**
   * Gets the Z component (same as blue component).
   * @returns The Z/blue component value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Sets the Z component (same as blue component).
   * @param val - The value to set for Z/blue component
   */
  set z(val) {
    this._v[2] = val;
  }

  /**
   * Gets the W component (always 1 for RGB colors).
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }

  /**
   * Gets the red color component.
   * @returns The red component value (0.0 to 1.0)
   */
  get r() {
    return this._v[0];
  }

  /**
   * Sets the red color component.
   * @param val - The red component value (typically 0.0 to 1.0)
   */
  set r(val) {
    this._v[0] = val;
  }

  /**
   * Gets the green color component.
   * @returns The green component value (0.0 to 1.0)
   */
  get g() {
    return this._v[1];
  }

  /**
   * Sets the green color component.
   * @param val - The green component value (typically 0.0 to 1.0)
   */
  set g(val) {
    this._v[1] = val;
  }

  /**
   * Gets the blue color component.
   * @returns The blue component value (0.0 to 1.0)
   */
  get b() {
    return this._v[2];
  }

  /**
   * Sets the blue color component.
   * @param val - The blue component value (typically 0.0 to 1.0)
   */
  set b(val) {
    this._v[2] = val;
  }

  /**
   * Gets the alpha component (always 1 for RGB colors).
   * @returns Always returns 1
   */
  get a() {
    return 1;
  }

  /**
   * Creates a new MutableColorRgb with all components set to zero (black).
   * @returns A new MutableColorRgb instance with RGB values [0, 0, 0]
   */
  static zero() {
    return super._zero(Float32Array) as MutableColorRgb;
  }

  /**
   * Creates a new MutableColorRgb with all components set to one (white).
   * @returns A new MutableColorRgb instance with RGB values [1, 1, 1]
   */
  static one() {
    return super._one(Float32Array) as MutableColorRgb;
  }

  /**
   * Creates a dummy MutableColorRgb instance for placeholder purposes.
   * @returns A new MutableColorRgb instance for dummy use
   */
  static dummy() {
    return super._dummy(Float32Array) as MutableColorRgb;
  }

  /**
   * Creates a normalized version of the given vector as a MutableColorRgb.
   * @param vec - The vector to normalize
   * @returns A new normalized MutableColorRgb instance
   */
  static normalize(vec: IVector3) {
    return super._normalize(vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Adds two vectors component-wise and returns the result as a MutableColorRgb.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the sum of the input vectors
   */
  static add(l_vec: IVector3, r_vec: IVector3) {
    return super._add(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Subtracts the right vector from the left vector component-wise.
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new MutableColorRgb with the difference of the input vectors
   */
  static subtract(l_vec: IVector3, r_vec: IVector3) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableColorRgb with the scaled vector
   */
  static multiply(vec: IVector3, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableColorRgb;
  }

  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableColorRgb with the divided vector
   */
  static divide(vec: IVector3, value: number) {
    return super._divide(vec, value, Float32Array) as MutableColorRgb;
  }

  /**
   * Divides two vectors component-wise.
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new MutableColorRgb with the component-wise division
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Computes the cross product of two vectors.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the cross product result
   */
  static cross(l_vec: IVector3, r_vec: IVector3) {
    return super._cross(l_vec, r_vec, Float32Array) as MutableColorRgb;
  }

  /**
   * Creates a deep copy of this MutableColorRgb instance.
   * @returns A new MutableColorRgb instance with the same RGB values
   */
  clone(): MutableColorRgb {
    return super.clone() as MutableColorRgb;
  }
}
