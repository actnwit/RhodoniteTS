// src/foundation/math/MutableColorRgb.ts
import { MutableVector3 } from "./MutableVector3.js";
var MutableColorRgb = class extends MutableVector3 {
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
    return super._zero(Float32Array);
  }
  /**
   * Creates a new MutableColorRgb with all components set to one (white).
   * @returns A new MutableColorRgb instance with RGB values [1, 1, 1]
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy MutableColorRgb instance for placeholder purposes.
   * @returns A new MutableColorRgb instance for dummy use
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized version of the given vector as a MutableColorRgb.
   * @param vec - The vector to normalize
   * @returns A new normalized MutableColorRgb instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two vectors component-wise and returns the result as a MutableColorRgb.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the sum of the input vectors
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise.
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new MutableColorRgb with the difference of the input vectors
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableColorRgb with the scaled vector
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableColorRgb with the divided vector
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides two vectors component-wise.
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new MutableColorRgb with the component-wise division
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Computes the cross product of two vectors.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgb with the cross product result
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a deep copy of this MutableColorRgb instance.
   * @returns A new MutableColorRgb instance with the same RGB values
   */
  clone() {
    return super.clone();
  }
};
export {
  MutableColorRgb
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlQ29sb3JSZ2IudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgSU11dGFibGVDb2xvclJnYiB9IGZyb20gJy4vSUNvbG9yJztcbmltcG9ydCB0eXBlIHsgSU11dGFibGVWZWN0b3IzLCBJVmVjdG9yMyB9IGZyb20gJy4vSVZlY3Rvcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4vTXV0YWJsZVZlY3RvcjMnO1xuXG4vKipcbiAqIEEgbXV0YWJsZSBSR0IgY29sb3IgY2xhc3MgdGhhdCBleHRlbmRzIE11dGFibGVWZWN0b3IzLlxuICogUmVwcmVzZW50cyBhIGNvbG9yIHdpdGggcmVkLCBncmVlbiwgYW5kIGJsdWUgY29tcG9uZW50cywgd2l0aCBhbHBoYSBhbHdheXMgc2V0IHRvIDEuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGJvdGggdmVjdG9yLWJhc2VkIG9wZXJhdGlvbnMgYW5kIGNvbG9yLXNwZWNpZmljIGFjY2Vzc29ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIE11dGFibGVDb2xvclJnYiBleHRlbmRzIE11dGFibGVWZWN0b3IzIGltcGxlbWVudHMgSU11dGFibGVWZWN0b3IzLCBJTXV0YWJsZUNvbG9yUmdiIHtcbiAgLyoqXG4gICAqIEdldHMgdGhlIFggY29tcG9uZW50IChzYW1lIGFzIHJlZCBjb21wb25lbnQpLlxuICAgKiBAcmV0dXJucyBUaGUgWC9yZWQgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFggY29tcG9uZW50IChzYW1lIGFzIHJlZCBjb21wb25lbnQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldCBmb3IgWC9yZWQgY29tcG9uZW50XG4gICAqL1xuICBzZXQgeCh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWSBjb21wb25lbnQgKHNhbWUgYXMgZ3JlZW4gY29tcG9uZW50KS5cbiAgICogQHJldHVybnMgVGhlIFkvZ3JlZW4gY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFkgY29tcG9uZW50IChzYW1lIGFzIGdyZWVuIGNvbXBvbmVudCkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0IGZvciBZL2dyZWVuIGNvbXBvbmVudFxuICAgKi9cbiAgc2V0IHkodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzFdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFogY29tcG9uZW50IChzYW1lIGFzIGJsdWUgY29tcG9uZW50KS5cbiAgICogQHJldHVybnMgVGhlIFovYmx1ZSBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB6KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgWiBjb21wb25lbnQgKHNhbWUgYXMgYmx1ZSBjb21wb25lbnQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldCBmb3IgWi9ibHVlIGNvbXBvbmVudFxuICAgKi9cbiAgc2V0IHoodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzJdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFcgY29tcG9uZW50IChhbHdheXMgMSBmb3IgUkdCIGNvbG9ycykuXG4gICAqIEByZXR1cm5zIEFsd2F5cyByZXR1cm5zIDFcbiAgICovXG4gIGdldCB3KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmVkIGNvbG9yIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIHJlZCBjb21wb25lbnQgdmFsdWUgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgcigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJlZCBjb2xvciBjb21wb25lbnQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgcmVkIGNvbXBvbmVudCB2YWx1ZSAodHlwaWNhbGx5IDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ3JlZW4gY29sb3IgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZ3JlZW4gY29tcG9uZW50IHZhbHVlICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgZ2V0IGcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBncmVlbiBjb2xvciBjb21wb25lbnQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgZ3JlZW4gY29tcG9uZW50IHZhbHVlICh0eXBpY2FsbHkgMC4wIHRvIDEuMClcbiAgICovXG4gIHNldCBnKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsxXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBibHVlIGNvbG9yIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGJsdWUgY29tcG9uZW50IHZhbHVlICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgZ2V0IGIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBibHVlIGNvbG9yIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSBibHVlIGNvbXBvbmVudCB2YWx1ZSAodHlwaWNhbGx5IDAuMCB0byAxLjApXG4gICAqL1xuICBzZXQgYih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMl0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYWxwaGEgY29tcG9uZW50IChhbHdheXMgMSBmb3IgUkdCIGNvbG9ycykuXG4gICAqIEByZXR1cm5zIEFsd2F5cyByZXR1cm5zIDFcbiAgICovXG4gIGdldCBhKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlQ29sb3JSZ2Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gemVybyAoYmxhY2spLlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlQ29sb3JSZ2IgaW5zdGFuY2Ugd2l0aCBSR0IgdmFsdWVzIFswLCAwLCAwXVxuICAgKi9cbiAgc3RhdGljIHplcm8oKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlQ29sb3JSZ2Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gb25lICh3aGl0ZSkuXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYiBpbnN0YW5jZSB3aXRoIFJHQiB2YWx1ZXMgWzEsIDEsIDFdXG4gICAqL1xuICBzdGF0aWMgb25lKCk6IE11dGFibGVDb2xvclJnYiB7XG4gICAgcmV0dXJuIHN1cGVyLl9vbmUoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IE11dGFibGVDb2xvclJnYiBpbnN0YW5jZSBmb3IgcGxhY2Vob2xkZXIgcHVycG9zZXMuXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYiBpbnN0YW5jZSBmb3IgZHVtbXkgdXNlXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIHZlY3RvciBhcyBhIE11dGFibGVDb2xvclJnYi5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgTXV0YWJsZUNvbG9yUmdiIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVZlY3RvcjMpOiBNdXRhYmxlQ29sb3JSZ2Ige1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0IGFzIGEgTXV0YWJsZUNvbG9yUmdiLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiIHdpdGggdGhlIHN1bSBvZiB0aGUgaW5wdXQgdmVjdG9yc1xuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IE11dGFibGVDb2xvclJnYiB7XG4gICAgcmV0dXJuIHN1cGVyLl9hZGQobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHZlY3RvciBmcm9tIHRoZSBsZWZ0IHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3IgKG1pbnVlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvciAoc3VidHJhaGVuZClcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiIHdpdGggdGhlIGRpZmZlcmVuY2Ugb2YgdGhlIGlucHV0IHZlY3RvcnNcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IE11dGFibGVDb2xvclJnYiB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiIHdpdGggdGhlIHNjYWxlZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseSh2ZWM6IElWZWN0b3IzLCB2YWx1ZTogbnVtYmVyKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlQ29sb3JSZ2Igd2l0aCB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBhIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYiB3aXRoIHRoZSBkaXZpZGVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGRpdmlkZSh2ZWM6IElWZWN0b3IzLCB2YWx1ZTogbnVtYmVyKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvciAoZGl2aWRlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvciAoZGl2aXNvcilcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiIHdpdGggdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKTogTXV0YWJsZUNvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiIHdpdGggdGhlIGNyb3NzIHByb2R1Y3QgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgY3Jvc3MobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpOiBNdXRhYmxlQ29sb3JSZ2Ige1xuICAgIHJldHVybiBzdXBlci5fY3Jvc3MobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgTXV0YWJsZUNvbG9yUmdiIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlQ29sb3JSZ2IgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSBSR0IgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiBNdXRhYmxlQ29sb3JSZ2Ige1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIE11dGFibGVDb2xvclJnYjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsc0JBQXNCO0FBT3hCLElBQU0sa0JBQU4sY0FBOEIsZUFBNEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSy9GLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsS0FBYTtBQUNqQixTQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLElB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
