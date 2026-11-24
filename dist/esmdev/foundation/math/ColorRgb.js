// src/foundation/math/ColorRgb.ts
import { Vector3 } from "./Vector3.js";
var ColorRgb = class extends Vector3 {
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
    return super._zero(Float32Array);
  }
  /**
   * Creates a ColorRgb with all components set to one (white).
   *
   * @returns A new ColorRgb instance with values [1, 1, 1]
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy ColorRgb instance for testing or placeholder purposes.
   *
   * @returns A new ColorRgb instance with dummy values
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Normalizes a color vector to unit length.
   *
   * @param vec - The color vector to normalize
   * @returns A new normalized ColorRgb instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts one color vector from another component-wise.
   *
   * @param l_vec - The minuend color vector
   * @param r_vec - The subtrahend color vector
   * @returns A new ColorRgb instance representing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a color vector by a scalar value.
   *
   * @param vec - The color vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new ColorRgb instance representing the scaled color
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two color vectors component-wise.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a color vector by a scalar value.
   *
   * @param vec - The color vector to divide
   * @param value - The scalar value to divide by
   * @returns A new ColorRgb instance representing the scaled color
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides one color vector by another component-wise.
   *
   * @param l_vec - The dividend color vector
   * @param r_vec - The divisor color vector
   * @returns A new ColorRgb instance representing the component-wise quotient
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Computes the cross product of two color vectors.
   * Note: Cross product for colors is rarely used but available for completeness.
   *
   * @param l_vec - The left operand color vector
   * @param r_vec - The right operand color vector
   * @returns A new ColorRgb instance representing the cross product
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a deep copy of this ColorRgb instance.
   *
   * @returns A new ColorRgb instance with the same values
   */
  clone() {
    return super.clone();
  }
};
export {
  ColorRgb
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9Db2xvclJnYi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBJQ29sb3JSZ2IgfSBmcm9tICcuL0lDb2xvcic7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuL1ZlY3RvcjMnO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gUkdCIGNvbG9yIHdpdGggcmVkLCBncmVlbiwgYW5kIGJsdWUgY29tcG9uZW50cy5cbiAqIEV4dGVuZHMgVmVjdG9yMyB0byBwcm92aWRlIG1hdGhlbWF0aWNhbCBvcGVyYXRpb25zIG9uIGNvbG9yIHZhbHVlcy5cbiAqIEVhY2ggY29tcG9uZW50IGlzIHN0b3JlZCBhcyBhIGZsb2F0aW5nLXBvaW50IHZhbHVlLCB0eXBpY2FsbHkgaW4gdGhlIHJhbmdlIFswLCAxXS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgcmVkID0gbmV3IENvbG9yUmdiKG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDBdKSk7XG4gKiBjb25zdCBncmVlbiA9IENvbG9yUmdiLmFkZChyZWQsIG5ldyBDb2xvclJnYihuZXcgRmxvYXQzMkFycmF5KFswLCAxLCAwXSkpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQ29sb3JSZ2IgZXh0ZW5kcyBWZWN0b3IzIGltcGxlbWVudHMgSVZlY3RvcjMsIElDb2xvclJnYiB7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSBYIGNvbXBvbmVudCBvZiB0aGUgY29sb3IgKGVxdWl2YWxlbnQgdG8gcmVkIGNvbXBvbmVudCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBYL3JlZCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFkgY29tcG9uZW50IG9mIHRoZSBjb2xvciAoZXF1aXZhbGVudCB0byBncmVlbiBjb21wb25lbnQpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgWS9ncmVlbiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFogY29tcG9uZW50IG9mIHRoZSBjb2xvciAoZXF1aXZhbGVudCB0byBibHVlIGNvbXBvbmVudCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBaL2JsdWUgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeigpIHtcbiAgICByZXR1cm4gdGhpcy5fdlsyXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBXIGNvbXBvbmVudCBvZiB0aGUgY29sb3IgKGFsd2F5cyAxIGZvciBSR0IgY29sb3JzKS5cbiAgICpcbiAgICogQHJldHVybnMgQWx3YXlzIHJldHVybnMgMVxuICAgKi9cbiAgZ2V0IHcoKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmVkIGNvbXBvbmVudCBvZiB0aGUgY29sb3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByZWQgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBncmVlbiBjb21wb25lbnQgb2YgdGhlIGNvbG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZ3JlZW4gY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgZygpIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBibHVlIGNvbXBvbmVudCBvZiB0aGUgY29sb3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBibHVlIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IGIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYWxwaGEgY29tcG9uZW50IG9mIHRoZSBjb2xvciAoYWx3YXlzIDEgZm9yIFJHQiBjb2xvcnMpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbHdheXMgcmV0dXJucyAxXG4gICAqL1xuICBnZXQgYSgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgQ29sb3JSZ2Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gemVybyAoYmxhY2spLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYiBpbnN0YW5jZSB3aXRoIHZhbHVlcyBbMCwgMCwgMF1cbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIENvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBDb2xvclJnYiB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byBvbmUgKHdoaXRlKS5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2IgaW5zdGFuY2Ugd2l0aCB2YWx1ZXMgWzEsIDEsIDFdXG4gICAqL1xuICBzdGF0aWMgb25lKCkge1xuICAgIHJldHVybiBzdXBlci5fb25lKEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IENvbG9yUmdiIGluc3RhbmNlIGZvciB0ZXN0aW5nIG9yIHBsYWNlaG9sZGVyIHB1cnBvc2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYiBpbnN0YW5jZSB3aXRoIGR1bW15IHZhbHVlc1xuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgY29sb3IgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGNvbG9yIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBDb2xvclJnYiBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9ub3JtYWxpemUodmVjLCBGbG9hdDMyQXJyYXkpIGFzIENvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIGNvbG9yIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgY29sb3IgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIGNvbG9yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYiBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fYWRkKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgb25lIGNvbG9yIHZlY3RvciBmcm9tIGFub3RoZXIgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBtaW51ZW5kIGNvbG9yIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc3VidHJhaGVuZCBjb2xvciB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2IgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBkaWZmZXJlbmNlXG4gICAqL1xuICBzdGF0aWMgc3VidHJhY3QobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX3N1YnRyYWN0KGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgY29sb3IgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGNvbG9yIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiIGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgc2NhbGVkIGNvbG9yXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkodmVjLCB2YWx1ZSwgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byBjb2xvciB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIGNvbG9yIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCBjb2xvciB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2IgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBDb2xvclJnYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgY29sb3IgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGNvbG9yIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2IgaW5zdGFuY2UgcmVwcmVzZW50aW5nIHRoZSBzY2FsZWQgY29sb3JcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlKHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBvbmUgY29sb3IgdmVjdG9yIGJ5IGFub3RoZXIgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBkaXZpZGVuZCBjb2xvciB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIGRpdmlzb3IgY29sb3IgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IENvbG9yUmdiIGluc3RhbmNlIHJlcHJlc2VudGluZyB0aGUgY29tcG9uZW50LXdpc2UgcXVvdGllbnRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgQ29sb3JSZ2I7XG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIGNvbG9yIHZlY3RvcnMuXG4gICAqIE5vdGU6IENyb3NzIHByb2R1Y3QgZm9yIGNvbG9ycyBpcyByYXJlbHkgdXNlZCBidXQgYXZhaWxhYmxlIGZvciBjb21wbGV0ZW5lc3MuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgY29sb3IgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIGNvbG9yIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBDb2xvclJnYiBpbnN0YW5jZSByZXByZXNlbnRpbmcgdGhlIGNyb3NzIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBjcm9zcyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBzdXBlci5fY3Jvc3MobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIENvbG9yUmdiO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkZWVwIGNvcHkgb2YgdGhpcyBDb2xvclJnYiBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgQ29sb3JSZ2IgaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCk6IENvbG9yUmdiIHtcbiAgICByZXR1cm4gc3VwZXIuY2xvbmUoKSBhcyBDb2xvclJnYjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsZUFBZTtBQWFqQixJQUFNLFdBQU4sY0FBdUIsUUFBdUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNbkUsSUFBSSxJQUFJO0FBQ04sV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFJO0FBQ04sV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFJO0FBQ04sV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFJO0FBQ04sV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLElBQUk7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sT0FBTztBQUNaLFdBQU8sTUFBTSxNQUFNLFlBQVk7QUFBQSxFQUNqQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sTUFBTTtBQUNYLFdBQU8sTUFBTSxLQUFLLFlBQVk7QUFBQSxFQUNoQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sUUFBUTtBQUNiLFdBQU8sTUFBTSxPQUFPLFlBQVk7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsT0FBTyxVQUFVLEtBQWU7QUFDOUIsV0FBTyxNQUFNLFdBQVcsS0FBSyxZQUFZO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyxJQUFJLE9BQWlCLE9BQWlCO0FBQzNDLFdBQU8sTUFBTSxLQUFLLE9BQU8sT0FBTyxZQUFZO0FBQUEsRUFDOUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyxTQUFTLE9BQWlCLE9BQWlCO0FBQ2hELFdBQU8sTUFBTSxVQUFVLE9BQU8sT0FBTyxZQUFZO0FBQUEsRUFDbkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyxTQUFTLEtBQWUsT0FBZTtBQUM1QyxXQUFPLE1BQU0sVUFBVSxLQUFLLE9BQU8sWUFBWTtBQUFBLEVBQ2pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sZUFBZSxPQUFpQixPQUFpQjtBQUN0RCxXQUFPLE1BQU0sZ0JBQWdCLE9BQU8sT0FBTyxZQUFZO0FBQUEsRUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBTyxPQUFPLEtBQWUsT0FBZTtBQUMxQyxXQUFPLE1BQU0sUUFBUSxLQUFLLE9BQU8sWUFBWTtBQUFBLEVBQy9DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQU8sYUFBYSxPQUFpQixPQUFpQjtBQUNwRCxXQUFPLE1BQU0sY0FBYyxPQUFPLE9BQU8sWUFBWTtBQUFBLEVBQ3ZEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBTyxNQUFNLE9BQWlCLE9BQWlCO0FBQzdDLFdBQU8sTUFBTSxPQUFPLE9BQU8sT0FBTyxZQUFZO0FBQUEsRUFDaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxRQUFrQjtBQUNoQixXQUFPLE1BQU0sTUFBTTtBQUFBLEVBQ3JCO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
