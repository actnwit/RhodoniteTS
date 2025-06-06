import type { IVector3 } from './IVector';
import type { TypedArray } from '../../types/CommonTypes';

/**
 * Immutable RGB color interface with alpha channel support.
 * Represents a color with red, green, blue components and optional alpha.
 * All components are readonly and cannot be modified after creation.
 */
export interface IColorRgb {
  /** Red component of the color (0.0 to 1.0) */
  readonly r: number;
  /** Green component of the color (0.0 to 1.0) */
  readonly g: number;
  /** Blue component of the color (0.0 to 1.0) */
  readonly b: number;
  /** Alpha (transparency) component of the color (0.0 to 1.0) */
  readonly a: number;

  /**
   * Returns a string representation of the color.
   * @returns String representation of the color
   */
  toString(): string;

  /**
   * Returns an approximate string representation of the color with limited precision.
   * @returns Approximate string representation of the color
   */
  toStringApproximately(): string;

  /**
   * Converts the color to a flat array of numbers.
   * @returns Array containing the color components
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder color instance.
   * @returns True if this is a dummy color, false otherwise
   */
  isDummy(): boolean;

  /**
   * Checks if this color is equal to another vector within a given tolerance.
   * @param vec - The vector to compare with
   * @param delta - The tolerance for comparison
   * @returns True if the colors are equal within the tolerance
   */
  isEqual(vec: IVector3, delta: number): boolean;

  /**
   * Checks if this color is strictly equal to another vector.
   * @param vec - The vector to compare with
   * @returns True if the colors are exactly equal
   */
  isStrictEqual(vec: IVector3): boolean;

  /**
   * Gets the component value at the specified index.
   * @param i - The index (0=r, 1=g, 2=b, 3=a)
   * @returns The component value at the specified index
   */
  at(i: number): number;

  /**
   * Calculates the length (magnitude) of the color vector.
   * @returns The length of the color vector
   */
  length(): number;

  /**
   * Calculates the squared length of the color vector.
   * @returns The squared length of the color vector
   */
  lengthSquared(): number;

  /**
   * Calculates the distance to another vector.
   * @param vec - The target vector
   * @returns The distance to the target vector
   */
  lengthTo(vec: IVector3): number;

  /**
   * Calculates the dot product with another vector.
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   */
  dot(vec: IVector3): number;

  /**
   * Creates a copy of this color.
   * @returns A new immutable color instance with the same values
   */
  clone(): IColorRgb;
}

/**
 * Mutable RGB color interface with alpha channel support.
 * Represents a color with red, green, blue components and readonly alpha.
 * RGB components can be modified, but alpha remains readonly.
 */
export interface IMutableColorRgb {
  /** Red component of the color (0.0 to 1.0) - mutable */
  r: number;
  /** Green component of the color (0.0 to 1.0) - mutable */
  g: number;
  /** Blue component of the color (0.0 to 1.0) - mutable */
  b: number;
  /** Alpha (transparency) component of the color (0.0 to 1.0) - readonly */
  readonly a: number;

  // common with immutable colorRgb
  /**
   * Returns a string representation of the color.
   * @returns String representation of the color
   */
  toString(): string;

  /**
   * Returns an approximate string representation of the color with limited precision.
   * @returns Approximate string representation of the color
   */
  toStringApproximately(): string;

  /**
   * Converts the color to a flat array of numbers.
   * @returns Array containing the color components
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder color instance.
   * @returns True if this is a dummy color, false otherwise
   */
  isDummy(): boolean;

  /**
   * Checks if this color is equal to another vector within a given tolerance.
   * @param vec - The vector to compare with
   * @param delta - The tolerance for comparison
   * @returns True if the colors are equal within the tolerance
   */
  isEqual(vec: IVector3, delta: number): boolean;

  /**
   * Checks if this color is strictly equal to another vector.
   * @param vec - The vector to compare with
   * @returns True if the colors are exactly equal
   */
  isStrictEqual(vec: IVector3): boolean;

  /**
   * Gets the component value at the specified index.
   * @param i - The index (0=r, 1=g, 2=b, 3=a)
   * @returns The component value at the specified index
   */
  at(i: number): number;

  /**
   * Calculates the length (magnitude) of the color vector.
   * @returns The length of the color vector
   */
  length(): number;

  /**
   * Calculates the squared length of the color vector.
   * @returns The squared length of the color vector
   */
  lengthSquared(): number;

  /**
   * Calculates the distance to another vector.
   * @param vec - The target vector
   * @returns The distance to the target vector
   */
  lengthTo(vec: IVector3): number;

  /**
   * Calculates the dot product with another vector.
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   */
  dot(vec: IVector3): number;

  /**
   * Creates a copy of this color.
   * @returns A new mutable color instance with the same values
   */
  clone(): IMutableColorRgb;

  // only for mutable colorRgb
  /**
   * Gets the raw typed array representation of the color data.
   * @returns The underlying typed array containing color components
   */
  raw(): TypedArray;

  /**
   * Sets the value of a component at the specified index.
   * @param i - The index (0=r, 1=g, 2=b)
   * @param value - The new value for the component
   * @returns This color instance for method chaining
   */
  setAt(i: number, value: number): IMutableColorRgb;

  /**
   * Sets the RGB components of the color.
   * @param x - The red component value
   * @param y - The green component value
   * @param z - The blue component value
   * @returns This color instance for method chaining
   */
  setComponents(x: number, y: number, z: number): IMutableColorRgb;

  /**
   * Copies components from another vector.
   * @param vec - The source vector to copy from
   * @returns This color instance for method chaining
   */
  copyComponents(vec: IVector3): IMutableColorRgb;

  /**
   * Sets all components to zero.
   * @returns This color instance for method chaining
   */
  zero(): IMutableColorRgb;

  /**
   * Sets all components to one.
   * @returns This color instance for method chaining
   */
  one(): IMutableColorRgb;

  /**
   * Normalizes the color vector to unit length.
   * @returns This color instance for method chaining
   */
  normalize(): IMutableColorRgb;

  /**
   * Adds another vector to this color.
   * @param vec - The vector to add
   * @returns This color instance for method chaining
   */
  add(vec: IVector3): IMutableColorRgb;

  /**
   * Subtracts another vector from this color.
   * @param vec - The vector to subtract
   * @returns This color instance for method chaining
   */
  subtract(vec: IVector3): IMutableColorRgb;

  /**
   * Multiplies this color by a scalar value.
   * @param value - The scalar value to multiply by
   * @returns This color instance for method chaining
   */
  multiply(value: number): IMutableColorRgb;

  /**
   * Multiplies this color by another vector component-wise.
   * @param vec - The vector to multiply by
   * @returns This color instance for method chaining
   */
  multiplyVector(vec: IVector3): IMutableColorRgb;

  /**
   * Divides this color by a scalar value.
   * @param value - The scalar value to divide by
   * @returns This color instance for method chaining
   */
  divide(value: number): IMutableColorRgb;

  /**
   * Divides this color by another vector component-wise.
   * @param vec - The vector to divide by
   * @returns This color instance for method chaining
   */
  divideVector(vec: IVector3): IMutableColorRgb;

  /**
   * Calculates the cross product with another vector.
   * @param vec - The vector to calculate cross product with
   * @returns This color instance for method chaining
   */
  cross(vec: IVector3): IMutableColorRgb;
}

/**
 * Immutable RGBA color interface.
 * Represents a color with red, green, blue, and alpha components.
 * All components are readonly and cannot be modified after creation.
 */
export interface IColorRgba {
  /** Red component of the color (0.0 to 1.0) */
  readonly r: number;
  /** Green component of the color (0.0 to 1.0) */
  readonly g: number;
  /** Blue component of the color (0.0 to 1.0) */
  readonly b: number;
  /** Alpha (transparency) component of the color (0.0 to 1.0) */
  readonly a: number;
}

/**
 * Mutable RGBA color interface.
 * Represents a color with red, green, blue, and alpha components.
 * All components can be modified after creation.
 */
export interface IMutableColorRgba {
  /** Red component of the color (0.0 to 1.0) - mutable */
  r: number;
  /** Green component of the color (0.0 to 1.0) - mutable */
  g: number;
  /** Blue component of the color (0.0 to 1.0) - mutable */
  b: number;
  /** Alpha (transparency) component of the color (0.0 to 1.0) - mutable */
  a: number;
}
