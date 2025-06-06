import type { IMutableColorRgba } from './IColor';
import type { IMutableVector4, IVector4 } from './IVector';
import { MutableVector4 } from './MutableVector4';

/**
 * A mutable RGBA color class that extends MutableVector4.
 * Represents a color with red, green, blue, and alpha components.
 * This class provides both vector-like (x, y, z, w) and color-specific (r, g, b, a) accessors.
 */
export class MutableColorRgba extends MutableVector4 implements IMutableVector4, IMutableColorRgba {
  /**
   * Gets the x component (equivalent to red component).
   * @returns The x/red value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Sets the x component (equivalent to red component).
   * @param val - The value to set
   */
  set x(val) {
    this._v[0] = val;
  }

  /**
   * Gets the y component (equivalent to green component).
   * @returns The y/green value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Sets the y component (equivalent to green component).
   * @param val - The value to set
   */
  set y(val) {
    this._v[1] = val;
  }

  /**
   * Gets the z component (equivalent to blue component).
   * @returns The z/blue value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Sets the z component (equivalent to blue component).
   * @param val - The value to set
   */
  set z(val) {
    this._v[2] = val;
  }

  /**
   * Gets the w component (equivalent to alpha component).
   * @returns The w/alpha value
   */
  get w() {
    return this._v[3];
  }

  /**
   * Sets the w component (equivalent to alpha component).
   * @param val - The value to set
   */
  set w(val) {
    this._v[3] = val;
  }

  /**
   * Gets the red component.
   * @returns The red value
   */
  get r() {
    return this._v[0];
  }

  /**
   * Sets the red component.
   * @param val - The red value to set
   */
  set r(val) {
    this._v[0] = val;
  }

  /**
   * Gets the green component.
   * @returns The green value
   */
  get g() {
    return this._v[1];
  }

  /**
   * Sets the green component.
   * @param val - The green value to set
   */
  set g(val) {
    this._v[1] = val;
  }

  /**
   * Gets the blue component.
   * @returns The blue value
   */
  get b() {
    return this._v[2];
  }

  /**
   * Sets the blue component.
   * @param val - The blue value to set
   */
  set b(val) {
    this._v[2] = val;
  }

  /**
   * Gets the alpha component.
   * @returns The alpha value
   */
  get a() {
    return this._v[3];
  }

  /**
   * Sets the alpha component.
   * @param val - The alpha value to set
   */
  set a(val) {
    this._v[3] = val;
  }

  /**
   * Creates a new MutableColorRgba with all components set to zero.
   * @returns A new MutableColorRgba instance with values [0, 0, 0, 0]
   */
  static zero() {
    return super._zero(Float32Array) as MutableColorRgba;
  }

  /**
   * Creates a new MutableColorRgba with all components set to one.
   * @returns A new MutableColorRgba instance with values [1, 1, 1, 1]
   */
  static one() {
    return super._one(Float32Array) as MutableColorRgba;
  }

  /**
   * Creates a dummy MutableColorRgba instance.
   * @returns A new MutableColorRgba instance for placeholder purposes
   */
  static dummy() {
    return super._dummy(Float32Array) as MutableColorRgba;
  }

  /**
   * Creates a normalized version of the given vector.
   * @param vec - The vector to normalize
   * @returns A new MutableColorRgba with normalized values
   */
  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as MutableColorRgba;
  }

  /**
   * Adds two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgba containing the sum
   */
  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  /**
   * Subtracts the right vector from the left vector component-wise.
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new MutableColorRgba containing the difference
   */
  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableColorRgba containing the scaled result
   */
  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as MutableColorRgba;
  }

  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgba containing the component-wise product
   */
  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableColorRgba containing the divided result
   */
  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as MutableColorRgba;
  }

  /**
   * Divides the left vector by the right vector component-wise.
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new MutableColorRgba containing the component-wise quotient
   */
  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as MutableColorRgba;
  }

  /**
   * Creates a deep copy of this MutableColorRgba instance.
   * @returns A new MutableColorRgba instance with the same values
   */
  clone(): MutableColorRgba {
    return super.clone() as MutableColorRgba;
  }
}
