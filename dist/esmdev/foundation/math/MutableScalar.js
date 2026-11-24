// src/foundation/math/MutableScalar.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Scalar_ } from "./Scalar.js";
var MutableScalar_ = class extends Scalar_ {
  /**
   * Creates a new mutable scalar with the specified value and type.
   * @param x - The typed array containing the scalar value
   * @param options - Configuration object containing the array type
   * @param options.type - The typed array constructor to use
   */
  constructor(x, { type }) {
    super(x, { type });
  }
  /**
   * Copies the components from another scalar to this scalar.
   * @param vec - The source scalar to copy from
   */
  copyComponents(vec) {
    this._v[0] = vec._v[0];
  }
  /**
   * Gets the x component (scalar value).
   * @returns The scalar value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Sets the x component (scalar value).
   * @param x - The new scalar value
   */
  set x(x) {
    this._v[0] = x;
  }
  /**
   * Gets the y component (always 0 for scalars).
   * @returns Always returns 0
   */
  get y() {
    return 0;
  }
  /**
   * Gets the z component (always 0 for scalars).
   * @returns Always returns 0
   */
  get z() {
    return 0;
  }
  /**
   * Gets the w component (always 1 for scalars).
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }
  /**
   * Converts the scalar to a string representation.
   * @returns A string representation of the scalar in the format "(value)"
   */
  toString() {
    return `(${this._v[0]})`;
  }
  /**
   * Sets the scalar value.
   * @param value - The new scalar value
   * @returns This scalar instance for method chaining
   */
  setValue(value) {
    this.x = value;
    return this;
  }
  /**
   * Gets the composition type for this scalar.
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
var MutableScalar = class _MutableScalar extends MutableScalar_ {
  /**
   * Creates a new mutable scalar with 32-bit float precision.
   * @param x - The typed array containing the scalar value
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a copy of this scalar.
   * @returns A new MutableScalar instance with the same value
   */
  clone() {
    return new _MutableScalar(new Float32Array([this.x]));
  }
  /**
   * Creates a scalar with value 1.
   * @returns A new MutableScalar instance with value 1
   */
  static one() {
    return new _MutableScalar(new Float32Array([1]));
  }
  /**
   * Creates a dummy scalar with no data.
   * @returns A new MutableScalar instance with empty array
   */
  static dummy() {
    return new _MutableScalar(new Float32Array([]));
  }
  /**
   * Creates a scalar with value 0.
   * @returns A new MutableScalar instance with value 0
   */
  static zero() {
    return new _MutableScalar(new Float32Array([0]));
  }
  /**
   * Gets the class name for debugging and serialization purposes.
   * @returns The string "MutableScalar"
   */
  get className() {
    return "MutableScalar";
  }
};
var MutableScalarD = class _MutableScalarD extends MutableScalar_ {
  /**
   * Creates a new mutable scalar with 64-bit float precision.
   * @param x - The typed array containing the scalar value
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a copy of this scalar.
   * @returns A new MutableScalarD instance with the same value
   */
  clone() {
    return new _MutableScalarD(new Float64Array([this.x]));
  }
  /**
   * Creates a scalar with value 1.
   * @returns A new MutableScalarD instance with value 1
   */
  static one() {
    return new _MutableScalarD(new Float64Array([1]));
  }
  /**
   * Creates a dummy scalar with no data.
   * @returns A new MutableScalarD instance with empty array
   */
  static dummy() {
    return new _MutableScalarD(new Float64Array([]));
  }
  /**
   * Creates a scalar with value 0.
   * @returns A new MutableScalarD instance with value 0
   */
  static zero() {
    return new _MutableScalarD(new Float64Array([0]));
  }
};
export {
  MutableScalar,
  MutableScalarD,
  MutableScalar as MutableScalarF,
  MutableScalar_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlU2NhbGFyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFR5cGVkQXJyYXksIFR5cGVkQXJyYXlDb25zdHJ1Y3RvciB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFNjYWxhcl8gfSBmcm9tICcuL1NjYWxhcic7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgbXV0YWJsZSBzY2FsYXIgdmFsdWVzIHdpdGggdHlwZWQgYXJyYXkgYmFja2luZy5cbiAqIFRoaXMgY2xhc3MgZXh0ZW5kcyB0aGUgaW1tdXRhYmxlIFNjYWxhcl8gY2xhc3MgdG8gcHJvdmlkZSBtdXRhYmxlIG9wZXJhdGlvbnMuXG4gKiBAdGVtcGxhdGUgVCAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0eXBlIChGbG9hdDMyQXJyYXksIEZsb2F0NjRBcnJheSwgZXRjLilcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZVNjYWxhcl88VCBleHRlbmRzIFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcj4gZXh0ZW5kcyBTY2FsYXJfPFQ+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgbXV0YWJsZSBzY2FsYXIgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlIGFuZCB0eXBlLlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBzY2FsYXIgdmFsdWVcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBjb250YWluaW5nIHRoZSBhcnJheSB0eXBlXG4gICAqIEBwYXJhbSBvcHRpb25zLnR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBUeXBlZEFycmF5LCB7IHR5cGUgfTogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcih4LCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBjb21wb25lbnRzIGZyb20gYW5vdGhlciBzY2FsYXIgdG8gdGhpcyBzY2FsYXIuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgc291cmNlIHNjYWxhciB0byBjb3B5IGZyb21cbiAgICovXG4gIGNvcHlDb21wb25lbnRzKHZlYzogU2NhbGFyXzxUPikge1xuICAgIHRoaXMuX3ZbMF0gPSB2ZWMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeCBjb21wb25lbnQgKHNjYWxhciB2YWx1ZSkuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgdmFsdWVcbiAgICovXG4gIGdldCB4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgeCBjb21wb25lbnQgKHNjYWxhciB2YWx1ZSkuXG4gICAqIEBwYXJhbSB4IC0gVGhlIG5ldyBzY2FsYXIgdmFsdWVcbiAgICovXG4gIHNldCB4KHg6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMF0gPSB4O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHkgY29tcG9uZW50IChhbHdheXMgMCBmb3Igc2NhbGFycykuXG4gICAqIEByZXR1cm5zIEFsd2F5cyByZXR1cm5zIDBcbiAgICovXG4gIGdldCB5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeiBjb21wb25lbnQgKGFsd2F5cyAwIGZvciBzY2FsYXJzKS5cbiAgICogQHJldHVybnMgQWx3YXlzIHJldHVybnMgMFxuICAgKi9cbiAgZ2V0IHooKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3IGNvbXBvbmVudCAoYWx3YXlzIDEgZm9yIHNjYWxhcnMpLlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAxXG4gICAqL1xuICBnZXQgdygpOiBudW1iZXIge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBzY2FsYXIgdG8gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzY2FsYXIgaW4gdGhlIGZvcm1hdCBcIih2YWx1ZSlcIlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCgke3RoaXMuX3ZbMF19KWA7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgc2NhbGFyIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgbmV3IHNjYWxhciB2YWx1ZVxuICAgKiBAcmV0dXJucyBUaGlzIHNjYWxhciBpbnN0YW5jZSBmb3IgbWV0aG9kIGNoYWluaW5nXG4gICAqL1xuICBzZXRWYWx1ZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy54ID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9zaXRpb24gdHlwZSBmb3IgdGhpcyBzY2FsYXIuXG4gICAqIEByZXR1cm5zIFRoZSBzY2FsYXIgY29tcG9zaXRpb24gdHlwZVxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb3NpdGlvblR5cGUoKTogQ29tcG9zaXRpb25UeXBlRW51bSB7XG4gICAgcmV0dXJuIENvbXBvc2l0aW9uVHlwZS5TY2FsYXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBjb21wb25lbnQgaW4gdGhlIHVuZGVybHlpbmcgdHlwZWQgYXJyYXkuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgYnl0ZXMgcGVyIGVsZW1lbnRcbiAgICovXG4gIGdldCBieXRlc1BlckNvbXBvbmVudCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92LkJZVEVTX1BFUl9FTEVNRU5UO1xuICB9XG59XG5cbi8qKlxuICogTXV0YWJsZSBzY2FsYXIgY2xhc3Mgd2l0aCAzMi1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYSBtdXRhYmxlIHNjYWxhciB2YWx1ZSBiYWNrZWQgYnkgYSBGbG9hdDMyQXJyYXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXRhYmxlU2NhbGFyIGV4dGVuZHMgTXV0YWJsZVNjYWxhcl88RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgbXV0YWJsZSBzY2FsYXIgd2l0aCAzMi1iaXQgZmxvYXQgcHJlY2lzaW9uLlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBzY2FsYXIgdmFsdWVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIHNjYWxhci5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhciBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIHZhbHVlXG4gICAqL1xuICBjbG9uZSgpOiBNdXRhYmxlU2NhbGFyIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbdGhpcy54XSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzY2FsYXIgd2l0aCB2YWx1ZSAxLlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlU2NhbGFyIGluc3RhbmNlIHdpdGggdmFsdWUgMVxuICAgKi9cbiAgc3RhdGljIG9uZSgpOiBNdXRhYmxlU2NhbGFyIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVTY2FsYXIobmV3IEZsb2F0MzJBcnJheShbMV0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgc2NhbGFyIHdpdGggbm8gZGF0YS5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhciBpbnN0YW5jZSB3aXRoIGVtcHR5IGFycmF5XG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKTogTXV0YWJsZVNjYWxhciB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlU2NhbGFyKG5ldyBGbG9hdDMyQXJyYXkoW10pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2NhbGFyIHdpdGggdmFsdWUgMC5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhciBpbnN0YW5jZSB3aXRoIHZhbHVlIDBcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCk6IE11dGFibGVTY2FsYXIge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVNjYWxhcihuZXcgRmxvYXQzMkFycmF5KFswXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgZm9yIGRlYnVnZ2luZyBhbmQgc2VyaWFsaXphdGlvbiBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgVGhlIHN0cmluZyBcIk11dGFibGVTY2FsYXJcIlxuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnTXV0YWJsZVNjYWxhcic7XG4gIH1cbn1cblxuLyoqXG4gKiBNdXRhYmxlIHNjYWxhciBjbGFzcyB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBhIG11dGFibGUgc2NhbGFyIHZhbHVlIGJhY2tlZCBieSBhIEZsb2F0NjRBcnJheSBmb3IgaGlnaGVyIHByZWNpc2lvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVTY2FsYXJEIGV4dGVuZHMgTXV0YWJsZVNjYWxhcl88RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgbXV0YWJsZSBzY2FsYXIgd2l0aCA2NC1iaXQgZmxvYXQgcHJlY2lzaW9uLlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSBzY2FsYXIgdmFsdWVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIHNjYWxhci5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhckQgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZVxuICAgKi9cbiAgY2xvbmUoKTogTXV0YWJsZVNjYWxhckQge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVNjYWxhckQobmV3IEZsb2F0NjRBcnJheShbdGhpcy54XSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzY2FsYXIgd2l0aCB2YWx1ZSAxLlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlU2NhbGFyRCBpbnN0YW5jZSB3aXRoIHZhbHVlIDFcbiAgICovXG4gIHN0YXRpYyBvbmUoKTogTXV0YWJsZVNjYWxhckQge1xuICAgIHJldHVybiBuZXcgTXV0YWJsZVNjYWxhckQobmV3IEZsb2F0NjRBcnJheShbMV0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgc2NhbGFyIHdpdGggbm8gZGF0YS5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhckQgaW5zdGFuY2Ugd2l0aCBlbXB0eSBhcnJheVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCk6IE11dGFibGVTY2FsYXJEIHtcbiAgICByZXR1cm4gbmV3IE11dGFibGVTY2FsYXJEKG5ldyBGbG9hdDY0QXJyYXkoW10pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2NhbGFyIHdpdGggdmFsdWUgMC5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZVNjYWxhckQgaW5zdGFuY2Ugd2l0aCB2YWx1ZSAwXG4gICAqL1xuICBzdGF0aWMgemVybygpOiBNdXRhYmxlU2NhbGFyRCB7XG4gICAgcmV0dXJuIG5ldyBNdXRhYmxlU2NhbGFyRChuZXcgRmxvYXQ2NEFycmF5KFswXSkpO1xuICB9XG59XG5cbi8qKlxuICogQWxpYXMgZm9yIHRoZSAzMi1iaXQgKEZsb2F0MzJBcnJheSkgaW1wbGVtZW50YXRpb24sIG1ha2luZyB0aGUgcHJlY2lzaW9uIGV4cGxpY2l0LlxuICovXG5leHBvcnQgeyBNdXRhYmxlU2NhbGFyIGFzIE11dGFibGVTY2FsYXJGIH07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyx1QkFBaUQ7QUFDMUQsU0FBUyxlQUFlO0FBUWpCLElBQU0saUJBQU4sY0FBOEQsUUFBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTzlFLFlBQVksR0FBZSxFQUFFLEtBQUssR0FBZ0I7QUFDaEQsVUFBTSxHQUFHLEVBQUUsS0FBSyxDQUFDO0FBQUEsRUFDbkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsZUFBZSxLQUFpQjtBQUM5QixTQUFLLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksRUFBRSxHQUFXO0FBQ2YsU0FBSyxHQUFHLENBQUMsSUFBSTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBbUI7QUFDakIsV0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFBQSxFQUN2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFNBQVMsT0FBZTtBQUN0QixTQUFLLElBQUk7QUFDVCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxXQUFXLGtCQUF1QztBQUNoRCxXQUFPLGdCQUFnQjtBQUFBLEVBQ3pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksb0JBQTRCO0FBQzlCLFdBQU8sS0FBSyxHQUFHO0FBQUEsRUFDakI7QUFDRjtBQU1PLElBQU0sZ0JBQU4sTUFBTSx1QkFBc0IsZUFBd0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS3pFLFlBQVksR0FBZTtBQUN6QixVQUFNLEdBQUcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUFBLEVBQ2pDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFFBQXVCO0FBQ3JCLFdBQU8sSUFBSSxlQUFjLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUNyRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLE1BQXFCO0FBQzFCLFdBQU8sSUFBSSxlQUFjLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsRUFDaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsT0FBTyxRQUF1QjtBQUM1QixXQUFPLElBQUksZUFBYyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUMvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLE9BQXNCO0FBQzNCLFdBQU8sSUFBSSxlQUFjLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsRUFDaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxZQUFvQjtBQUN0QixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBTU8sSUFBTSxpQkFBTixNQUFNLHdCQUF1QixlQUF3QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLMUUsWUFBWSxHQUFlO0FBQ3pCLFVBQU0sR0FBRyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQUEsRUFDakM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsUUFBd0I7QUFDdEIsV0FBTyxJQUFJLGdCQUFlLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUN0RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLE1BQXNCO0FBQzNCLFdBQU8sSUFBSSxnQkFBZSxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ2pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE9BQU8sUUFBd0I7QUFDN0IsV0FBTyxJQUFJLGdCQUFlLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ2hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE9BQU8sT0FBdUI7QUFDNUIsV0FBTyxJQUFJLGdCQUFlLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsRUFDakQ7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
