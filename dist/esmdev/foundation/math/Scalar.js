// src/foundation/math/Scalar.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { AbstractVector } from "./AbstractVector.js";
import { MathUtil } from "./MathUtil.js";
var Scalar_ = class extends AbstractVector {
  /**
   * Creates a new scalar instance.
   * @param v - The typed array containing the scalar value
   * @param options - Configuration object containing the array type
   * @param options.type - The typed array constructor type
   */
  constructor(v, _options) {
    super();
    this._v = v;
  }
  /**
   * Gets the scalar value as a number.
   * @returns The scalar value
   */
  getValue() {
    return this._v[0];
  }
  /**
   * Gets the scalar value wrapped in an array.
   * @returns An array containing the scalar value
   */
  getValueInArray() {
    return [this._v[0]];
  }
  /**
   * Gets the scalar value (alias for x component).
   * @returns The scalar value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Gets the raw typed array containing the scalar value.
   * @returns The underlying typed array
   */
  get raw() {
    return this._v;
  }
  /**
   * Performs strict equality comparison with another scalar.
   * Uses exact floating-point comparison without tolerance.
   * @param scalar - The scalar to compare with
   * @returns True if the scalars are exactly equal, false otherwise
   */
  isStrictEqual(scalar) {
    if (this.x === scalar.x) {
      return true;
    }
    return false;
  }
  /**
   * Performs approximate equality comparison with another scalar within a tolerance.
   * @param scalar - The scalar to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if the scalars are equal within the specified tolerance
   */
  isEqual(scalar, delta = Number.EPSILON) {
    if (Math.abs(scalar.x - this.x) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Gets the scalar value as a GLSL-compatible float string.
   * @returns The scalar value formatted as a GLSL float literal
   */
  get glslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }
  /**
   * Gets the scalar value as a GLSL-compatible integer string.
   * @returns The scalar value formatted as a GLSL integer literal
   */
  get glslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }
  /**
   * Gets the scalar value as a GLSL-compatible unsigned integer string.
   * @returns The scalar value formatted as a GLSL unsigned integer literal with 'u' suffix
   */
  get glslStrAsUint() {
    return `${Math.floor(this.x)}u`;
  }
  /**
   * Gets the scalar value as a WGSL-compatible float string.
   * @returns The scalar value formatted as a WGSL float literal
   */
  get wgslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }
  /**
   * Gets the scalar value as a WGSL-compatible integer string.
   * @returns The scalar value formatted as a WGSL integer literal
   */
  get wgslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }
  /**
   * Gets the scalar value as a WGSL-compatible unsigned integer string.
   * @returns The scalar value formatted as a WGSL unsigned integer literal with 'u' suffix
   */
  get wgslStrAsUint() {
    return `${Math.floor(this.x)}u`;
  }
  /**
   * Creates a new scalar instance from a number value.
   * @param value - The numeric value to create the scalar from
   * @param type - The typed array constructor to use
   * @returns A new scalar instance
   * @protected
   */
  static _fromCopyNumber(value, type) {
    return new this(new type([value]), { type });
  }
  /**
   * Creates a dummy (uninitialized) scalar instance.
   * @param type - The typed array constructor to use
   * @returns A new dummy scalar instance
   * @protected
   */
  static _dummy(type) {
    return new this(new type(), { type });
  }
  /**
   * Gets the composition type for scalar values.
   * @returns The scalar composition type
   */
  static get compositionType() {
    return CompositionType.Scalar;
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   * @returns The number of bytes per element
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
};
var Scalar = class _Scalar extends Scalar_ {
  /**
   * Creates a new 32-bit float scalar instance.
   * @param x - The typed array containing the scalar value
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a new scalar from a numeric value.
   * @param value - The numeric value to create the scalar from
   * @returns A new Scalar instance
   */
  static fromCopyNumber(value) {
    return super._fromCopyNumber(value, Float32Array);
  }
  /**
   * Creates a scalar with value zero.
   * @returns A new Scalar instance with value 0
   */
  static zero() {
    return super._fromCopyNumber(0, Float32Array);
  }
  /**
   * Creates a scalar with value one.
   * @returns A new Scalar instance with value 1
   */
  static one() {
    return super._fromCopyNumber(1, Float32Array);
  }
  /**
   * Creates a dummy (uninitialized) scalar instance.
   * @returns A new dummy Scalar instance
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Gets the class name for debugging and reflection purposes.
   * @returns The string "Scalar"
   */
  get className() {
    return "Scalar";
  }
  /**
   * Converts the scalar to a string representation.
   * @returns A string representation of the scalar in the format "(value)"
   */
  toString() {
    return `(${this._v[0]})`;
  }
  /**
   * Creates a deep copy of this scalar.
   * @returns A new Scalar instance with the same value
   */
  clone() {
    return new _Scalar(new Float32Array([this._v[0]]));
  }
};
var ScalarD = class _ScalarD extends Scalar_ {
  /**
   * Creates a new 64-bit float scalar instance.
   * @param x - The typed array containing the scalar value
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a new double-precision scalar from a numeric value.
   * @param value - The numeric value to create the scalar from
   * @returns A new ScalarD instance
   */
  static fromCopyNumber(value) {
    return super._fromCopyNumber(value, Float64Array);
  }
  /**
   * Creates a double-precision scalar with value zero.
   * @returns A new ScalarD instance with value 0
   */
  static zero() {
    return super._fromCopyNumber(0, Float64Array);
  }
  /**
   * Creates a double-precision scalar with value one.
   * @returns A new ScalarD instance with value 1
   */
  static one() {
    return super._fromCopyNumber(1, Float64Array);
  }
  /**
   * Creates a dummy (uninitialized) double-precision scalar instance.
   * @returns A new dummy ScalarD instance
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Creates a deep copy of this double-precision scalar.
   * @returns A new ScalarD instance with the same value
   */
  clone() {
    return new _ScalarD(new Float64Array([this._v[0]]));
  }
};
export {
  Scalar,
  ScalarD,
  Scalar as ScalarF,
  Scalar_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9TY2FsYXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IsIFR5cGVkQXJyYXksIFR5cGVkQXJyYXlDb25zdHJ1Y3RvciB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IEFic3RyYWN0VmVjdG9yIH0gZnJvbSAnLi9BYnN0cmFjdFZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTY2FsYXIgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuL01hdGhVdGlsJztcblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBzY2FsYXIgdmFsdWVzIHVzaW5nIHR5cGVkIGFycmF5cy5cbiAqIFByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvciBib3RoIDMyLWJpdCBhbmQgNjQtYml0IGZsb2F0aW5nLXBvaW50IHNjYWxhciBpbXBsZW1lbnRhdGlvbnMuXG4gKiBAdGVtcGxhdGUgVCAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0eXBlXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIFNjYWxhcl88VCBleHRlbmRzIFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcj4gZXh0ZW5kcyBBYnN0cmFjdFZlY3RvciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHNjYWxhciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHYgLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgc2NhbGFyIHZhbHVlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgYXJyYXkgdHlwZVxuICAgKiBAcGFyYW0gb3B0aW9ucy50eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHR5cGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHY6IFR5cGVkQXJyYXksIF9vcHRpb25zOiB7IHR5cGU6IFQgfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fdiA9IHY7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2NhbGFyIHZhbHVlIGFzIGEgbnVtYmVyLlxuICAgKiBAcmV0dXJucyBUaGUgc2NhbGFyIHZhbHVlXG4gICAqL1xuICBnZXRWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2FsYXIgdmFsdWUgd3JhcHBlZCBpbiBhbiBhcnJheS5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgY29udGFpbmluZyB0aGUgc2NhbGFyIHZhbHVlXG4gICAqL1xuICBnZXRWYWx1ZUluQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLl92WzBdXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2FsYXIgdmFsdWUgKGFsaWFzIGZvciB4IGNvbXBvbmVudCkuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgdmFsdWVcbiAgICovXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJhdyB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBzY2FsYXIgdmFsdWUuXG4gICAqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIHR5cGVkIGFycmF5XG4gICAqL1xuICBnZXQgcmF3KCkge1xuICAgIHJldHVybiB0aGlzLl92O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHN0cmljdCBlcXVhbGl0eSBjb21wYXJpc29uIHdpdGggYW5vdGhlciBzY2FsYXIuXG4gICAqIFVzZXMgZXhhY3QgZmxvYXRpbmctcG9pbnQgY29tcGFyaXNvbiB3aXRob3V0IHRvbGVyYW5jZS5cbiAgICogQHBhcmFtIHNjYWxhciAtIFRoZSBzY2FsYXIgdG8gY29tcGFyZSB3aXRoXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHNjYWxhcnMgYXJlIGV4YWN0bHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdHJpY3RFcXVhbChzY2FsYXI6IFNjYWxhcl88VD4pIHtcbiAgICBpZiAodGhpcy54ID09PSBzY2FsYXIueCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhcHByb3hpbWF0ZSBlcXVhbGl0eSBjb21wYXJpc29uIHdpdGggYW5vdGhlciBzY2FsYXIgd2l0aGluIGEgdG9sZXJhbmNlLlxuICAgKiBAcGFyYW0gc2NhbGFyIC0gVGhlIHNjYWxhciB0byBjb21wYXJlIHdpdGhcbiAgICogQHBhcmFtIGRlbHRhIC0gVGhlIHRvbGVyYW5jZSBmb3IgY29tcGFyaXNvbiAoZGVmYXVsdDogTnVtYmVyLkVQU0lMT04pXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHNjYWxhcnMgYXJlIGVxdWFsIHdpdGhpbiB0aGUgc3BlY2lmaWVkIHRvbGVyYW5jZVxuICAgKi9cbiAgaXNFcXVhbChzY2FsYXI6IFNjYWxhcl88VD4sIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTikge1xuICAgIGlmIChNYXRoLmFicyhzY2FsYXIueCAtIHRoaXMueCkgPCBkZWx0YSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2FsYXIgdmFsdWUgYXMgYSBHTFNMLWNvbXBhdGlibGUgZmxvYXQgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBUaGUgc2NhbGFyIHZhbHVlIGZvcm1hdHRlZCBhcyBhIEdMU0wgZmxvYXQgbGl0ZXJhbFxuICAgKi9cbiAgZ2V0IGdsc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLngpfWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2NhbGFyIHZhbHVlIGFzIGEgR0xTTC1jb21wYXRpYmxlIGludGVnZXIgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBUaGUgc2NhbGFyIHZhbHVlIGZvcm1hdHRlZCBhcyBhIEdMU0wgaW50ZWdlciBsaXRlcmFsXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCkge1xuICAgIHJldHVybiBgJHtNYXRoLmZsb29yKHRoaXMueCl9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2FsYXIgdmFsdWUgYXMgYSBHTFNMLWNvbXBhdGlibGUgdW5zaWduZWQgaW50ZWdlciBzdHJpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgdmFsdWUgZm9ybWF0dGVkIGFzIGEgR0xTTCB1bnNpZ25lZCBpbnRlZ2VyIGxpdGVyYWwgd2l0aCAndScgc3VmZml4XG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzVWludCgpIHtcbiAgICByZXR1cm4gYCR7TWF0aC5mbG9vcih0aGlzLngpfXVgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNjYWxhciB2YWx1ZSBhcyBhIFdHU0wtY29tcGF0aWJsZSBmbG9hdCBzdHJpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgdmFsdWUgZm9ybWF0dGVkIGFzIGEgV0dTTCBmbG9hdCBsaXRlcmFsXG4gICAqL1xuICBnZXQgd2dzbFN0ckFzRmxvYXQoKSB7XG4gICAgcmV0dXJuIGAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMueCl9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzY2FsYXIgdmFsdWUgYXMgYSBXR1NMLWNvbXBhdGlibGUgaW50ZWdlciBzdHJpbmcuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgdmFsdWUgZm9ybWF0dGVkIGFzIGEgV0dTTCBpbnRlZ2VyIGxpdGVyYWxcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNJbnQoKSB7XG4gICAgcmV0dXJuIGAke01hdGguZmxvb3IodGhpcy54KX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNjYWxhciB2YWx1ZSBhcyBhIFdHU0wtY29tcGF0aWJsZSB1bnNpZ25lZCBpbnRlZ2VyIHN0cmluZy5cbiAgICogQHJldHVybnMgVGhlIHNjYWxhciB2YWx1ZSBmb3JtYXR0ZWQgYXMgYSBXR1NMIHVuc2lnbmVkIGludGVnZXIgbGl0ZXJhbCB3aXRoICd1JyBzdWZmaXhcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNVaW50KCkge1xuICAgIHJldHVybiBgJHtNYXRoLmZsb29yKHRoaXMueCl9dWA7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBzY2FsYXIgaW5zdGFuY2UgZnJvbSBhIG51bWJlciB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIG51bWVyaWMgdmFsdWUgdG8gY3JlYXRlIHRoZSBzY2FsYXIgZnJvbVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgc2NhbGFyIGluc3RhbmNlXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlOdW1iZXIodmFsdWU6IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoW3ZhbHVlXSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgKHVuaW5pdGlhbGl6ZWQpIHNjYWxhciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IHNjYWxhciBpbnN0YW5jZVxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuICBzdGF0aWMgX2R1bW15KHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKCksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIGZvciBzY2FsYXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBUaGUgc2NhbGFyIGNvbXBvc2l0aW9uIHR5cGVcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9zaXRpb25UeXBlKCk6IENvbXBvc2l0aW9uVHlwZUVudW0ge1xuICAgIHJldHVybiBDb21wb3NpdGlvblR5cGUuU2NhbGFyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBieXRlcyBwZXIgY29tcG9uZW50IGluIHRoZSB1bmRlcmx5aW5nIHR5cGVkIGFycmF5LlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBlbGVtZW50XG4gICAqL1xuICBnZXQgYnl0ZXNQZXJDb21wb25lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3YuQllURVNfUEVSX0VMRU1FTlQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgc2NhbGFyIGNsYXNzIHVzaW5nIDMyLWJpdCBmbG9hdGluZy1wb2ludCBwcmVjaXNpb24uXG4gKiBSZXByZXNlbnRzIGEgc2luZ2xlIGZsb2F0aW5nLXBvaW50IHZhbHVlIHdpdGggdmFyaW91cyB1dGlsaXR5IG1ldGhvZHNcbiAqIGZvciBtYXRoZW1hdGljYWwgb3BlcmF0aW9ucyBhbmQgZm9ybWF0IGNvbnZlcnNpb25zLlxuICovXG5leHBvcnQgY2xhc3MgU2NhbGFyIGV4dGVuZHMgU2NhbGFyXzxGbG9hdDMyQXJyYXlDb25zdHJ1Y3Rvcj4gaW1wbGVtZW50cyBJU2NhbGFyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgMzItYml0IGZsb2F0IHNjYWxhciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHggLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgc2NhbGFyIHZhbHVlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBUeXBlZEFycmF5KSB7XG4gICAgc3VwZXIoeCwgeyB0eXBlOiBGbG9hdDMyQXJyYXkgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBzY2FsYXIgZnJvbSBhIG51bWVyaWMgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBudW1lcmljIHZhbHVlIHRvIGNyZWF0ZSB0aGUgc2NhbGFyIGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgU2NhbGFyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlOdW1iZXIodmFsdWU6IG51bWJlcik6IFNjYWxhciB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU51bWJlcih2YWx1ZSwgRmxvYXQzMkFycmF5KSBhcyBTY2FsYXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHNjYWxhciB3aXRoIHZhbHVlIHplcm8uXG4gICAqIEByZXR1cm5zIEEgbmV3IFNjYWxhciBpbnN0YW5jZSB3aXRoIHZhbHVlIDBcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCk6IFNjYWxhciB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU51bWJlcigwLCBGbG9hdDMyQXJyYXkpIGFzIFNjYWxhcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2NhbGFyIHdpdGggdmFsdWUgb25lLlxuICAgKiBAcmV0dXJucyBBIG5ldyBTY2FsYXIgaW5zdGFuY2Ugd2l0aCB2YWx1ZSAxXG4gICAqL1xuICBzdGF0aWMgb25lKCk6IFNjYWxhciB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU51bWJlcigxLCBGbG9hdDMyQXJyYXkpIGFzIFNjYWxhcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgKHVuaW5pdGlhbGl6ZWQpIHNjYWxhciBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgQSBuZXcgZHVtbXkgU2NhbGFyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKTogU2NhbGFyIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0MzJBcnJheSkgYXMgU2NhbGFyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIGRlYnVnZ2luZyBhbmQgcmVmbGVjdGlvbiBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgVGhlIHN0cmluZyBcIlNjYWxhclwiXG4gICAqL1xuICBnZXQgY2xhc3NOYW1lKCkge1xuICAgIHJldHVybiAnU2NhbGFyJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgc2NhbGFyIHRvIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgc2NhbGFyIGluIHRoZSBmb3JtYXQgXCIodmFsdWUpXCJcbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgKCR7dGhpcy5fdlswXX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgc2NhbGFyLlxuICAgKiBAcmV0dXJucyBBIG5ldyBTY2FsYXIgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZVxuICAgKi9cbiAgY2xvbmUoKTogU2NhbGFyIHtcbiAgICByZXR1cm4gbmV3IFNjYWxhcihuZXcgRmxvYXQzMkFycmF5KFt0aGlzLl92WzBdXSkpIGFzIFNjYWxhcjtcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSBzY2FsYXIgY2xhc3MgdXNpbmcgNjQtYml0IGZsb2F0aW5nLXBvaW50IHByZWNpc2lvbi5cbiAqIFByb3ZpZGVzIGhpZ2hlciBwcmVjaXNpb24gdGhhbiB0aGUgc3RhbmRhcmQgU2NhbGFyIGNsYXNzIGZvciBhcHBsaWNhdGlvbnNcbiAqIHJlcXVpcmluZyBkb3VibGUtcHJlY2lzaW9uIGFyaXRobWV0aWMuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2FsYXJEIGV4dGVuZHMgU2NhbGFyXzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyA2NC1iaXQgZmxvYXQgc2NhbGFyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBzY2FsYXIgdmFsdWVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGRvdWJsZS1wcmVjaXNpb24gc2NhbGFyIGZyb20gYSBudW1lcmljIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgbnVtZXJpYyB2YWx1ZSB0byBjcmVhdGUgdGhlIHNjYWxhciBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IFNjYWxhckQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weU51bWJlcih2YWx1ZTogbnVtYmVyKTogU2NhbGFyRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weU51bWJlcih2YWx1ZSwgRmxvYXQ2NEFycmF5KSBhcyBTY2FsYXJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkb3VibGUtcHJlY2lzaW9uIHNjYWxhciB3aXRoIHZhbHVlIHplcm8uXG4gICAqIEByZXR1cm5zIEEgbmV3IFNjYWxhckQgaW5zdGFuY2Ugd2l0aCB2YWx1ZSAwXG4gICAqL1xuICBzdGF0aWMgemVybygpOiBTY2FsYXJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5TnVtYmVyKDAsIEZsb2F0NjRBcnJheSkgYXMgU2NhbGFyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZG91YmxlLXByZWNpc2lvbiBzY2FsYXIgd2l0aCB2YWx1ZSBvbmUuXG4gICAqIEByZXR1cm5zIEEgbmV3IFNjYWxhckQgaW5zdGFuY2Ugd2l0aCB2YWx1ZSAxXG4gICAqL1xuICBzdGF0aWMgb25lKCk6IFNjYWxhckQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlOdW1iZXIoMSwgRmxvYXQ2NEFycmF5KSBhcyBTY2FsYXJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSAodW5pbml0aWFsaXplZCkgZG91YmxlLXByZWNpc2lvbiBzY2FsYXIgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IFNjYWxhckQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpOiBTY2FsYXJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0NjRBcnJheSkgYXMgU2NhbGFyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgZG91YmxlLXByZWNpc2lvbiBzY2FsYXIuXG4gICAqIEByZXR1cm5zIEEgbmV3IFNjYWxhckQgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZVxuICAgKi9cbiAgY2xvbmUoKTogU2NhbGFyRCB7XG4gICAgcmV0dXJuIG5ldyBTY2FsYXJEKG5ldyBGbG9hdDY0QXJyYXkoW3RoaXMuX3ZbMF1dKSkgYXMgU2NhbGFyRDtcbiAgfVxufVxuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgU2NhbGFyIGFzIFNjYWxhckYgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLHNCQUFzQjtBQUUvQixTQUFTLGdCQUFnQjtBQVFsQixJQUFNLFVBQU4sY0FBdUQsZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTzNFLFlBQVksR0FBZSxVQUF1QjtBQUNoRCxVQUFNO0FBQ04sU0FBSyxLQUFLO0FBQUEsRUFDWjtBQUFBO0FBQUE7QUFBQTtBQUFB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
