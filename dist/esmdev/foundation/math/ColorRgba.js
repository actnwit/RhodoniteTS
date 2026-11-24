// src/foundation/math/ColorRgba.ts
import { Vector4 } from "./Vector4.js";
var ColorRgba = class extends Vector4 {
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
    return super._zero(Float32Array);
  }
  /**
   * Creates a color with all components set to 1 (white with full opacity).
   *
   * @returns A new ColorRgba instance with all components set to 1
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy color instance for initialization purposes.
   *
   * @returns A new ColorRgba instance with dummy values
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Normalizes a color vector to unit length.
   *
   * @param vec - The color vector to normalize
   * @returns A new normalized ColorRgba instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgba instance representing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the right color vector from the left color vector component-wise.
   *
   * @param l_vec - The left operand color vector (minuend)
   * @param r_vec - The right operand color vector (subtrahend)
   * @returns A new ColorRgba instance representing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a color vector by a scalar value.
   *
   * @param vec - The color vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new ColorRgba instance representing the scaled color
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two color vectors component-wise (component multiplication).
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgba instance representing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a color vector by a scalar value.
   *
   * @param vec - The color vector to divide
   * @param value - The scalar value to divide by
   * @returns A new ColorRgba instance representing the scaled color
   * @throws Error if value is zero
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides the left color vector by the right color vector component-wise.
   *
   * @param l_vec - The left operand color vector (dividend)
   * @param r_vec - The right operand color vector (divisor)
   * @returns A new ColorRgba instance representing the component-wise quotient
   * @throws Error if any component of r_vec is zero
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a deep copy of this color.
   *
   * @returns A new ColorRgba instance with the same component values
   */
  clone() {
    return super.clone();
  }
  /**
   * Creates a new ColorRgba instance from an array of numbers.
   *
   * @param array - An array containing RGBA values [r, g, b, a]
   * @returns A new ColorRgba instance created from the array
   */
  static fromCopyArray(array) {
    return this._fromCopyArray(array, Float32Array);
  }
  /**
   * Creates a new ColorRgba instance from a 4-element tuple array.
   *
   * @param array - A 4-element tuple containing RGBA values [r, g, b, a]
   * @returns A new ColorRgba instance created from the tuple
   */
  static fromCopyArray4(array) {
    return this._fromCopyArray4(array, Float32Array);
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
  static fromCopy4(x, y, z, w) {
    return this._fromCopy4(x, y, z, w, Float32Array);
  }
  /**
   * Creates a new ColorRgba instance by copying values from another 4D vector.
   *
   * @param vec4 - The source vector to copy from
   * @returns A new ColorRgba instance with copied values
   */
  static fromCopyVector4(vec4) {
    return this._fromCopyVector4(vec4, Float32Array);
  }
};
var ConstRgbaWhite = new ColorRgba(new Float32Array([1, 1, 1, 1]));
var ConstRgbaBlack = new ColorRgba(new Float32Array([0, 0, 0, 1]));
export {
  ColorRgba,
  ConstRgbaBlack,
  ConstRgbaWhite
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9Db2xvclJnYmEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQXJyYXk0IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJQ29sb3JSZ2JhIH0gZnJvbSAnLi9JQ29sb3InO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yNCB9IGZyb20gJy4vSVZlY3Rvcic7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi9WZWN0b3I0JztcblxuLyoqXG4gKiBBIFJHQkEgY29sb3IgY2xhc3MgdGhhdCBleHRlbmRzIFZlY3RvcjQgdG8gcHJvdmlkZSBjb2xvci1zcGVjaWZpYyBmdW5jdGlvbmFsaXR5LlxuICogUmVwcmVzZW50cyBjb2xvcnMgd2l0aCByZWQsIGdyZWVuLCBibHVlLCBhbmQgYWxwaGEgKHRyYW5zcGFyZW5jeSkgY29tcG9uZW50cyxcbiAqIGVhY2ggcmFuZ2luZyBmcm9tIDAuMCB0byAxLjAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIENyZWF0ZSBhIHJlZCBjb2xvciB3aXRoIGZ1bGwgb3BhY2l0eVxuICogY29uc3QgcmVkID0gQ29sb3JSZ2JhLmZyb21Db3B5NCgxLjAsIDAuMCwgMC4wLCAxLjApO1xuICpcbiAqIC8vIENyZWF0ZSBmcm9tIGFycmF5XG4gKiBjb25zdCBibHVlID0gQ29sb3JSZ2JhLmZyb21Db3B5QXJyYXkoWzAuMCwgMC4wLCAxLjAsIDEuMF0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2xvclJnYmEgZXh0ZW5kcyBWZWN0b3I0IGltcGxlbWVudHMgSVZlY3RvcjQsIElDb2xvclJnYmEge1xuICAvKipcbiAgICogR2V0cyB0aGUgeCBjb21wb25lbnQgKGVxdWl2YWxlbnQgdG8gcmVkIGNvbXBvbmVudCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB4L3JlZCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHkgY29tcG9uZW50IChlcXVpdmFsZW50IHRvIGdyZWVuIGNvbXBvbmVudCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB5L2dyZWVuIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeiBjb21wb25lbnQgKGVxdWl2YWxlbnQgdG8gYmx1ZSBjb21wb25lbnQpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgei9ibHVlIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHooKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdyBjb21wb25lbnQgKGVxdWl2YWxlbnQgdG8gYWxwaGEgY29tcG9uZW50KS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHcvYWxwaGEgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgdygpIHtcbiAgICByZXR1cm4gdGhpcy5fdlszXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByZWQgY29tcG9uZW50IG9mIHRoZSBjb2xvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlZCBjb21wb25lbnQgdmFsdWUgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBncmVlbiBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZ3JlZW4gY29tcG9uZW50IHZhbHVlICgwLjAgdG8gMS4wKVxuICAgKi9cbiAgZ2V0IGcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmx1ZSBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmx1ZSBjb21wb25lbnQgdmFsdWUgKDAuMCB0byAxLjApXG4gICAqL1xuICBnZXQgYigpIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbHBoYSAodHJhbnNwYXJlbmN5KSBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxwaGEgY29tcG9uZW50IHZhbHVlICgwLjAgPSB0cmFuc3BhcmVudCwgMS4wID0gb3BhcXVlKVxuICAgKi9cbiAgZ2V0IGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbM107XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHplcm8gY29sb3IgKGJsYWNrIHdpdGggemVybyBhbHBoYSkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byAwXG4gICAqL1xuICBzdGF0aWMgemVybygpIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNvbG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDEgKHdoaXRlIHdpdGggZnVsbCBvcGFjaXR5KS5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2JhIGluc3RhbmNlIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICovXG4gIHN0YXRpYyBvbmUoKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9vbmUoRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IGNvbG9yIGluc3RhbmNlIGZvciBpbml0aWFsaXphdGlvbiBwdXJwb3Nlcy5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2JhIGluc3RhbmNlIHdpdGggZHVtbXkgdmFsdWVzXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kdW1teShGbG9hdDMyQXJyYXkpIGFzIENvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgY29sb3IgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGNvbG9yIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBDb2xvclJnYmEgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gY29sb3IgdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCBjb2xvciB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgY29sb3IgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fYWRkKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSByaWdodCBjb2xvciB2ZWN0b3IgZnJvbSB0aGUgbGVmdCBjb2xvciB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgY29sb3IgdmVjdG9yIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCBjb2xvciB2ZWN0b3IgKHN1YnRyYWhlbmQpXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fc3VidHJhY3QobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIENvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgY29sb3IgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGNvbG9yIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHNjYWxlZCBjb2xvclxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIGNvbG9yIHZlY3RvcnMgY29tcG9uZW50LXdpc2UgKGNvbXBvbmVudCBtdWx0aXBsaWNhdGlvbikuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgY29sb3IgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIGNvbG9yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYmEgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBhIGNvbG9yIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBjb2xvciB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHNjYWxlZCBjb2xvclxuICAgKiBAdGhyb3dzIEVycm9yIGlmIHZhbHVlIGlzIHplcm9cbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yNCwgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlKHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhlIGxlZnQgY29sb3IgdmVjdG9yIGJ5IHRoZSByaWdodCBjb2xvciB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgY29sb3IgdmVjdG9yIChkaXZpZGVuZClcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgY29sb3IgdmVjdG9yIChkaXZpc29yKVxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYmEgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQtd2lzZSBxdW90aWVudFxuICAgKiBAdGhyb3dzIEVycm9yIGlmIGFueSBjb21wb25lbnQgb2Ygcl92ZWMgaXMgemVyb1xuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlVmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIGNvbG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYmEgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSBjb21wb25lbnQgdmFsdWVzXG4gICAqL1xuICBjbG9uZSgpOiBDb2xvclJnYmEge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIENvbG9yUmdiYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSBmcm9tIGFuIGFycmF5IG9mIG51bWJlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFuIGFycmF5IGNvbnRhaW5pbmcgUkdCQSB2YWx1ZXMgW3IsIGcsIGIsIGFdXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSBjcmVhdGVkIGZyb20gdGhlIGFycmF5XG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IENvbG9yUmdiYSB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ29sb3JSZ2JhIGluc3RhbmNlIGZyb20gYSA0LWVsZW1lbnQgdHVwbGUgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEEgNC1lbGVtZW50IHR1cGxlIGNvbnRhaW5pbmcgUkdCQSB2YWx1ZXMgW3IsIGcsIGIsIGFdXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSBjcmVhdGVkIGZyb20gdGhlIHR1cGxlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTQoYXJyYXk6IEFycmF5NDxudW1iZXI+KTogQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheTQoYXJyYXksIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ29sb3JSZ2JhIGluc3RhbmNlIGZyb20gaW5kaXZpZHVhbCBSR0JBIGNvbXBvbmVudCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIHJlZCBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHkgLSBUaGUgZ3JlZW4gY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB6IC0gVGhlIGJsdWUgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB3IC0gVGhlIGFscGhhIGNvbXBvbmVudCB2YWx1ZVxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYmEgaW5zdGFuY2Ugd2l0aCB0aGUgc3BlY2lmaWVkIGNvbXBvbmVudCB2YWx1ZXNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTQoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyKTogQ29sb3JSZ2JhIHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHk0KHgsIHksIHosIHcsIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2JhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ29sb3JSZ2JhIGluc3RhbmNlIGJ5IGNvcHlpbmcgdmFsdWVzIGZyb20gYW5vdGhlciA0RCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWM0IC0gVGhlIHNvdXJjZSB2ZWN0b3IgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiYSBpbnN0YW5jZSB3aXRoIGNvcGllZCB2YWx1ZXNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weVZlY3RvcjQodmVjNDogSVZlY3RvcjQpOiBDb2xvclJnYmEge1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weVZlY3RvcjQodmVjNCwgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYmE7XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVkZWZpbmVkIGNvbnN0YW50IGZvciB3aGl0ZSBjb2xvciB3aXRoIGZ1bGwgb3BhY2l0eSAoMSwgMSwgMSwgMSkuXG4gKi9cbmV4cG9ydCBjb25zdCBDb25zdFJnYmFXaGl0ZSA9IG5ldyBDb2xvclJnYmEobmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMSwgMV0pKTtcblxuLyoqXG4gKiBQcmVkZWZpbmVkIGNvbnN0YW50IGZvciBibGFjayBjb2xvciB3aXRoIGZ1bGwgb3BhY2l0eSAoMCwgMCwgMCwgMSkuXG4gKi9cbmV4cG9ydCBjb25zdCBDb25zdFJnYmFCbGFjayA9IG5ldyBDb2xvclJnYmEobmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGVBQWU7QUFnQmpCLElBQU0sWUFBTixjQUF3QixRQUF3QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1yRSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLE9BQU87QUFDWixXQUFPLE1BQU0sTUFBTSxZQUFZO0FBQUEsRUFDakM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLE1BQU07QUFDWCxXQUFPLE1BQU0sS0FBSyxZQUFZO0FBQUEsRUFDaEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLFFBQVE7QUFDYixXQUFPLE1BQU0sT0FBTyxZQUFZO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sVUFBVSxLQUFlO0FBQzlCLFdBQU8sTUFBTSxXQUFXLEtBQUssWUFBWTtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sSUFBSSxPQUFpQixPQUFpQjtBQUMzQyxXQUFPLE1BQU0sS0FBSyxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sU0FBUyxPQUFpQixPQUFpQjtBQUNoRCxXQUFPLE1BQU0sVUFBVSxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ25EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sU0FBUyxLQUFlLE9BQWU7QUFDNUMsV0FBTyxNQUFNLFVBQVUsS0FBSyxPQUFPLFlBQVk7QUFBQSxFQUNqRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLGVBQWUsT0FBaUIsT0FBaUI7QUFDdEQsV0FBTyxNQUFNLGdCQUFnQixPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBTyxPQUFPLEtBQWUsT0FBZTtBQUMxQyxXQUFPLE1BQU0sUUFBUSxLQUFLLE9BQU8sWUFBWTtBQUFBLEVBQy9DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBTyxhQUFhLE9BQWlCLE9BQWlCO0FBQ3BELFdBQU8sTUFBTSxjQUFjLE9BQU8sT0FBTyxZQUFZO0FBQUEsRUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxRQUFtQjtBQUNqQixXQUFPLE1BQU0sTUFBTTtBQUFBLEVBQ3JCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFPLGNBQWMsT0FBaUM7QUFDcEQsV0FBTyxLQUFLLGVBQWUsT0FBTyxZQUFZO0FBQUEsRUFDaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sZUFBZSxPQUFrQztBQUN0RCxXQUFPLEtBQUssZ0JBQWdCLE9BQU8sWUFBWTtBQUFBLEVBQ2pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFPLFVBQVUsR0FBVyxHQUFXLEdBQVcsR0FBc0I7QUFDdEUsV0FBTyxLQUFLLFdBQVcsR0FBRyxHQUFHLEdBQUcsR0FBRyxZQUFZO0FBQUEsRUFDakQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sZ0JBQWdCLE1BQTJCO0FBQ2hELFdBQU8sS0FBSyxpQkFBaUIsTUFBTSxZQUFZO0FBQUEsRUFDakQ7QUFDRjtBQUtPLElBQU0saUJBQWlCLElBQUksVUFBVSxJQUFJLGFBQWEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUtuRSxJQUFNLGlCQUFpQixJQUFJLFVBQVUsSUFBSSxhQUFhLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
