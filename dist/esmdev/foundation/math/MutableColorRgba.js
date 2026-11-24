// src/foundation/math/MutableColorRgba.ts
import { MutableVector4 } from "./MutableVector4.js";
var MutableColorRgba = class extends MutableVector4 {
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
    return super._zero(Float32Array);
  }
  /**
   * Creates a new MutableColorRgba with all components set to one.
   * @returns A new MutableColorRgba instance with values [1, 1, 1, 1]
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy MutableColorRgba instance.
   * @returns A new MutableColorRgba instance for placeholder purposes
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized version of the given vector.
   * @param vec - The vector to normalize
   * @returns A new MutableColorRgba with normalized values
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgba containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise.
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new MutableColorRgba containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new MutableColorRgba containing the scaled result
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new MutableColorRgba containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new MutableColorRgba containing the divided result
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides the left vector by the right vector component-wise.
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new MutableColorRgba containing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a deep copy of this MutableColorRgba instance.
   * @returns A new MutableColorRgba instance with the same values
   */
  clone() {
    return super.clone();
  }
};
export {
  MutableColorRgba
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9NdXRhYmxlQ29sb3JSZ2JhLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IElNdXRhYmxlQ29sb3JSZ2JhIH0gZnJvbSAnLi9JQ29sb3InO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvcjQsIElWZWN0b3I0IH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi9NdXRhYmxlVmVjdG9yNCc7XG5cbi8qKlxuICogQSBtdXRhYmxlIFJHQkEgY29sb3IgY2xhc3MgdGhhdCBleHRlbmRzIE11dGFibGVWZWN0b3I0LlxuICogUmVwcmVzZW50cyBhIGNvbG9yIHdpdGggcmVkLCBncmVlbiwgYmx1ZSwgYW5kIGFscGhhIGNvbXBvbmVudHMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGJvdGggdmVjdG9yLWxpa2UgKHgsIHksIHosIHcpIGFuZCBjb2xvci1zcGVjaWZpYyAociwgZywgYiwgYSkgYWNjZXNzb3JzLlxuICovXG5leHBvcnQgY2xhc3MgTXV0YWJsZUNvbG9yUmdiYSBleHRlbmRzIE11dGFibGVWZWN0b3I0IGltcGxlbWVudHMgSU11dGFibGVWZWN0b3I0LCBJTXV0YWJsZUNvbG9yUmdiYSB7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSB4IGNvbXBvbmVudCAoZXF1aXZhbGVudCB0byByZWQgY29tcG9uZW50KS5cbiAgICogQHJldHVybnMgVGhlIHgvcmVkIHZhbHVlXG4gICAqL1xuICBnZXQgeCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHggY29tcG9uZW50IChlcXVpdmFsZW50IHRvIHJlZCBjb21wb25lbnQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgc2V0IHgodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzBdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHkgY29tcG9uZW50IChlcXVpdmFsZW50IHRvIGdyZWVuIGNvbXBvbmVudCkuXG4gICAqIEByZXR1cm5zIFRoZSB5L2dyZWVuIHZhbHVlXG4gICAqL1xuICBnZXQgeSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHkgY29tcG9uZW50IChlcXVpdmFsZW50IHRvIGdyZWVuIGNvbXBvbmVudCkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBzZXQgeSh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMV0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeiBjb21wb25lbnQgKGVxdWl2YWxlbnQgdG8gYmx1ZSBjb21wb25lbnQpLlxuICAgKiBAcmV0dXJucyBUaGUgei9ibHVlIHZhbHVlXG4gICAqL1xuICBnZXQgeigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHogY29tcG9uZW50IChlcXVpdmFsZW50IHRvIGJsdWUgY29tcG9uZW50KS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHNldCB6KHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlsyXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3IGNvbXBvbmVudCAoZXF1aXZhbGVudCB0byBhbHBoYSBjb21wb25lbnQpLlxuICAgKiBAcmV0dXJucyBUaGUgdy9hbHBoYSB2YWx1ZVxuICAgKi9cbiAgZ2V0IHcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlszXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB3IGNvbXBvbmVudCAoZXF1aXZhbGVudCB0byBhbHBoYSBjb21wb25lbnQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgc2V0IHcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzNdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlZCBjb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSByZWQgdmFsdWVcbiAgICovXG4gIGdldCByKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmVkIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSByZWQgdmFsdWUgdG8gc2V0XG4gICAqL1xuICBzZXQgcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3ZbMF0gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ3JlZW4gY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgZ3JlZW4gdmFsdWVcbiAgICovXG4gIGdldCBnKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ3JlZW4gY29tcG9uZW50LlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGdyZWVuIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgc2V0IGcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzFdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJsdWUgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgYmx1ZSB2YWx1ZVxuICAgKi9cbiAgZ2V0IGIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBibHVlIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSBibHVlIHZhbHVlIHRvIHNldFxuICAgKi9cbiAgc2V0IGIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl92WzJdID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFscGhhIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGFscGhhIHZhbHVlXG4gICAqL1xuICBnZXQgYSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFscGhhIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSBhbHBoYSB2YWx1ZSB0byBzZXRcbiAgICovXG4gIHNldCBhKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fdlszXSA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE11dGFibGVDb2xvclJnYmEgd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gemVyby5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiYSBpbnN0YW5jZSB3aXRoIHZhbHVlcyBbMCwgMCwgMCwgMF1cbiAgICovXG4gIHN0YXRpYyB6ZXJvKCk6IE11dGFibGVDb2xvclJnYmEge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNdXRhYmxlQ29sb3JSZ2JhIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIG9uZS5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiYSBpbnN0YW5jZSB3aXRoIHZhbHVlcyBbMSwgMSwgMSwgMV1cbiAgICovXG4gIHN0YXRpYyBvbmUoKTogTXV0YWJsZUNvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHN1cGVyLl9vbmUoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSBNdXRhYmxlQ29sb3JSZ2JhIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlQ29sb3JSZ2JhIGluc3RhbmNlIGZvciBwbGFjZWhvbGRlciBwdXJwb3Nlc1xuICAgKi9cbiAgc3RhdGljIGR1bW15KCk6IE11dGFibGVDb2xvclJnYmEge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYmEgd2l0aCBub3JtYWxpemVkIHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3I0KTogTXV0YWJsZUNvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHN1cGVyLl9ub3JtYWxpemUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYmEgY29udGFpbmluZyB0aGUgc3VtXG4gICAqL1xuICBzdGF0aWMgYWRkKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KTogTXV0YWJsZUNvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHN1cGVyLl9hZGQobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSByaWdodCB2ZWN0b3IgZnJvbSB0aGUgbGVmdCB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3IgKHN1YnRyYWhlbmQpXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYmEgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KTogTXV0YWJsZUNvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYmEgY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpOiBNdXRhYmxlQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiYSBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpOiBNdXRhYmxlQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBNdXRhYmxlQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBNdXRhYmxlQ29sb3JSZ2JhIGNvbnRhaW5pbmcgdGhlIGRpdmlkZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpOiBNdXRhYmxlQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIE11dGFibGVDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGUgbGVmdCB2ZWN0b3IgYnkgdGhlIHJpZ2h0IHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3IgKGRpdmlkZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3IgKGRpdmlzb3IpXG4gICAqIEByZXR1cm5zIEEgbmV3IE11dGFibGVDb2xvclJnYmEgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcXVvdGllbnRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpOiBNdXRhYmxlQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgTXV0YWJsZUNvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgTXV0YWJsZUNvbG9yUmdiYSBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgQSBuZXcgTXV0YWJsZUNvbG9yUmdiYSBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIHZhbHVlc1xuICAgKi9cbiAgY2xvbmUoKTogTXV0YWJsZUNvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHN1cGVyLmNsb25lKCkgYXMgTXV0YWJsZUNvbG9yUmdiYTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsc0JBQXNCO0FBT3hCLElBQU0sbUJBQU4sY0FBK0IsZUFBNkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS2pHLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLEVBQUUsS0FBYTtBQUNqQixTQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLElBQVk7QUFDZCxXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxFQUFFLEtBQWE7QUFDakIsU0FBSyxHQUFHLENBQUMsSUFBSTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksRUFBRSxLQUFhO0FBQ2pCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNs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
