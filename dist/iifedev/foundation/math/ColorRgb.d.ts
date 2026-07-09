import type { IColorRgb } from './IColor';
import type { IVector3 } from './IVector';
import { Vector3 } from './Vector3';
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
export declare class ColorRgb extends Vector3 implements IVector3, IColorRgb {
    /**
     * Gets the X component of the color (equivalent to red component).
     *
     * @returns The X/red component value
     */
    get x(): number;
    /**
     * Gets the Y component of the color (equivalent to green component).
     *
     * @returns The Y/green component value
     */
    get y(): number;
    /**
     * Gets the Z component of the color (equivalent to blue component).
     *
     * @returns The Z/blue component value
     */
    get z(): number;
    /**
     * Gets the W component of the color (always 1 for RGB colors).
     *
     * @returns Always returns 1
     */
    get w(): number;
    /**
     * Gets the red component of the color.
     *
     * @returns The red component value
     */
    get r(): number;
    /**
     * Gets the green component of the color.
     *
     * @returns The green component value
     */
    get g(): number;
    /**
     * Gets the blue component of the color.
     *
     * @returns The blue component value
     */
    get b(): number;
    /**
     * Gets the alpha component of the color (always 1 for RGB colors).
     *
     * @returns Always returns 1
     */
    get a(): number;
    /**
     * Creates a ColorRgb with all components set to zero (black).
     *
     * @returns A new ColorRgb instance with values [0, 0, 0]
     */
    static zero(): ColorRgb;
    /**
     * Creates a ColorRgb with all components set to one (white).
     *
     * @returns A new ColorRgb instance with values [1, 1, 1]
     */
    static one(): ColorRgb;
    /**
     * Creates a dummy ColorRgb instance for testing or placeholder purposes.
     *
     * @returns A new ColorRgb instance with dummy values
     */
    static dummy(): ColorRgb;
    /**
     * Normalizes a color vector to unit length.
     *
     * @param vec - The color vector to normalize
     * @returns A new normalized ColorRgb instance
     */
    static normalize(vec: IVector3): ColorRgb;
    /**
     * Adds two color vectors component-wise.
     *
     * @param l_vec - The left operand color vector
     * @param r_vec - The right operand color vector
     * @returns A new ColorRgb instance representing the sum
     */
    static add(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    /**
     * Subtracts one color vector from another component-wise.
     *
     * @param l_vec - The minuend color vector
     * @param r_vec - The subtrahend color vector
     * @returns A new ColorRgb instance representing the difference
     */
    static subtract(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    /**
     * Multiplies a color vector by a scalar value.
     *
     * @param vec - The color vector to multiply
     * @param value - The scalar value to multiply by
     * @returns A new ColorRgb instance representing the scaled color
     */
    static multiply(vec: IVector3, value: number): ColorRgb;
    /**
     * Multiplies two color vectors component-wise.
     *
     * @param l_vec - The left operand color vector
     * @param r_vec - The right operand color vector
     * @returns A new ColorRgb instance representing the component-wise product
     */
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    /**
     * Divides a color vector by a scalar value.
     *
     * @param vec - The color vector to divide
     * @param value - The scalar value to divide by
     * @returns A new ColorRgb instance representing the scaled color
     */
    static divide(vec: IVector3, value: number): ColorRgb;
    /**
     * Divides one color vector by another component-wise.
     *
     * @param l_vec - The dividend color vector
     * @param r_vec - The divisor color vector
     * @returns A new ColorRgb instance representing the component-wise quotient
     */
    static divideVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    /**
     * Computes the cross product of two color vectors.
     * Note: Cross product for colors is rarely used but available for completeness.
     *
     * @param l_vec - The left operand color vector
     * @param r_vec - The right operand color vector
     * @returns A new ColorRgb instance representing the cross product
     */
    static cross(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    /**
     * Creates a deep copy of this ColorRgb instance.
     *
     * @returns A new ColorRgb instance with the same values
     */
    clone(): ColorRgb;
}
