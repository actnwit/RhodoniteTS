// src/foundation/math/AbstractQuaternion.ts
var AbstractQuaternion = class {
  constructor() {
    /**
     * Internal typed array storage for quaternion components [x, y, z, w].
     * @protected
     */
    this._v = new Float32Array();
  }
  /**
   * Gets the class name of the quaternion implementation.
   * @returns The name of the constructor function
   */
  get className() {
    return this.constructor.name;
  }
  /**
   * Gets the x component (i coefficient) of the quaternion.
   * @returns The x component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Gets the y component (j coefficient) of the quaternion.
   * @returns The y component value
   */
  get y() {
    return this._v[1];
  }
  /**
   * Gets the z component (k coefficient) of the quaternion.
   * @returns The z component value
   */
  get z() {
    return this._v[2];
  }
  /**
   * Gets the w component (scalar part) of the quaternion.
   * @returns The w component value
   */
  get w() {
    return this._v[3];
  }
  /**
   * Gets the component at the specified index.
   * @param i - The index (0=x, 1=y, 2=z, 3=w)
   * @returns The component value at the given index
   */
  at(i) {
    return this._v[i];
  }
  /**
   * Calculates the magnitude (length) of the quaternion.
   * @returns The Euclidean norm of the quaternion
   */
  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2], this._v[3]);
  }
  /**
   * Calculates the squared magnitude of the quaternion.
   * This is more efficient than length() when you only need to compare magnitudes.
   * @returns The squared Euclidean norm of the quaternion
   */
  lengthSquared() {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2 + this._v[3] ** 2;
  }
  /**
   * Converts the quaternion to a string representation.
   * @returns String representation of the quaternion
   * @throws Error - Method must be implemented by subclass
   */
  toString() {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the quaternion to an approximate string representation.
   * Useful for debugging when exact precision is not required.
   * @returns Approximate string representation of the quaternion
   * @throws Error - Method must be implemented by subclass
   */
  toStringApproximately() {
    throw new Error("Method not implemented.");
  }
  /**
   * Flattens the quaternion components into a plain number array.
   * @returns Array containing [x, y, z, w] components
   * @throws Error - Method must be implemented by subclass
   */
  flattenAsArray() {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this quaternion is a dummy/placeholder instance.
   * @returns True if this is a dummy quaternion, false otherwise
   * @throws Error - Method must be implemented by subclass
   */
  isDummy() {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this quaternion is approximately equal to another quaternion within a tolerance.
   * @param vec - The quaternion to compare against
   * @param delta - Optional tolerance value for comparison
   * @returns True if quaternions are approximately equal, false otherwise
   * @throws Error - Method must be implemented by subclass
   */
  isEqual(_vec, _delta) {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this quaternion is exactly equal to another quaternion.
   * @param vec - The quaternion to compare against
   * @returns True if quaternions are exactly equal, false otherwise
   * @throws Error - Method must be implemented by subclass
   */
  isStrictEqual(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the quaternion to Euler angles and stores the result in the output vector.
   * @param out - The mutable vector to store the resulting Euler angles
   * @returns The output vector containing the Euler angles
   * @throws Error - Method must be implemented by subclass
   */
  toEulerAnglesTo(_out) {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the quaternion to Euler angles.
   * @returns A new vector containing the Euler angles
   * @throws Error - Method must be implemented by subclass
   */
  toEulerAngles() {
    throw new Error("Method not implemented.");
  }
  /**
   * Transforms a 3D vector by this quaternion rotation.
   * @param vec - The vector to transform
   * @returns A new transformed vector
   * @throws Error - Method must be implemented by subclass
   */
  transformVector3(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Transforms a 3D vector by this quaternion rotation and stores the result in the output vector.
   * @param vec - The vector to transform
   * @param out - The mutable vector to store the result
   * @returns The output vector containing the transformed result
   * @throws Error - Method must be implemented by subclass
   */
  transformVector3To(_vec, _out) {
    throw new Error("Method not implemented.");
  }
  /**
   * Transforms a 3D vector by the inverse of this quaternion rotation.
   * @param vec - The vector to transform
   * @returns A new vector transformed by the inverse rotation
   * @throws Error - Method must be implemented by subclass
   */
  transformVector3Inverse(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculates the dot product between this quaternion and another quaternion.
   * The dot product of two quaternions gives a scalar value that represents
   * the cosine of half the angle between them when both quaternions are unit quaternions.
   * @param quat - The quaternion to compute the dot product with
   * @returns The dot product result
   */
  dot(quat) {
    return this._v[0] * quat._v[0] + this._v[1] * quat._v[1] + this._v[2] * quat._v[2] + this._v[3] * quat._v[3];
  }
  /**
   * Creates a deep copy of this quaternion.
   * @returns A new quaternion instance with the same values
   * @throws Error - Method must be implemented by subclass
   */
  clone() {
    throw new Error("Method not implemented.");
  }
};
export {
  AbstractQuaternion
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9BYnN0cmFjdFF1YXRlcm5pb24udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgVHlwZWRBcnJheSB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgSVF1YXRlcm5pb24gfSBmcm9tICcuL0lRdWF0ZXJuaW9uJztcbmltcG9ydCB0eXBlIHsgSU11dGFibGVWZWN0b3IzLCBJVmVjdG9yMyB9IGZyb20gJy4vSVZlY3Rvcic7XG5cbi8qKlxuICogQWJzdHJhY3QgYmFzZSBjbGFzcyBmb3IgcXVhdGVybmlvbiBpbXBsZW1lbnRhdGlvbnMuXG4gKlxuICogUXVhdGVybmlvbnMgYXJlIGEgbWF0aGVtYXRpY2FsIHN5c3RlbSB0aGF0IGV4dGVuZHMgY29tcGxleCBudW1iZXJzIGFuZCBhcmUgY29tbW9ubHkgdXNlZFxuICogaW4gM0QgZ3JhcGhpY3MgZm9yIHJlcHJlc2VudGluZyByb3RhdGlvbnMuIEEgcXVhdGVybmlvbiBjb25zaXN0cyBvZiBmb3VyIGNvbXBvbmVudHMgKHgsIHksIHosIHcpXG4gKiB3aGVyZSAoeCwgeSwgeikgcmVwcmVzZW50cyB0aGUgdmVjdG9yIHBhcnQgYW5kIHcgcmVwcmVzZW50cyB0aGUgc2NhbGFyIHBhcnQuXG4gKlxuICogVGhpcyBhYnN0cmFjdCBjbGFzcyBwcm92aWRlcyBjb21tb24gZnVuY3Rpb25hbGl0eSBhbmQgaW50ZXJmYWNlIGZvciBhbGwgcXVhdGVybmlvbiBpbXBsZW1lbnRhdGlvbnNcbiAqIHdoaWxlIGxlYXZpbmcgc3BlY2lmaWMgb3BlcmF0aW9ucyB0byBiZSBpbXBsZW1lbnRlZCBieSBjb25jcmV0ZSBzdWJjbGFzc2VzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQWJzdHJhY3RRdWF0ZXJuaW9uIGltcGxlbWVudHMgSVF1YXRlcm5pb24ge1xuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZSBvZiB0aGUgcXVhdGVybmlvbiBpbXBsZW1lbnRhdGlvbi5cbiAgICogQHJldHVybnMgVGhlIG5hbWUgb2YgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAqL1xuICBnZXQgY2xhc3NOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeCBjb21wb25lbnQgKGkgY29lZmZpY2llbnQpIG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgeCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeSBjb21wb25lbnQgKGogY29lZmZpY2llbnQpIG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgeSBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgeiBjb21wb25lbnQgKGsgY29lZmZpY2llbnQpIG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgeiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB6KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdyBjb21wb25lbnQgKHNjYWxhciBwYXJ0KSBvZiB0aGUgcXVhdGVybmlvbi5cbiAgICogQHJldHVybnMgVGhlIHcgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgdygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCAoMD14LCAxPXksIDI9eiwgMz13KVxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHZhbHVlIGF0IHRoZSBnaXZlbiBpbmRleFxuICAgKi9cbiAgYXQoaTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbWFnbml0dWRlIChsZW5ndGgpIG9mIHRoZSBxdWF0ZXJuaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgRXVjbGlkZWFuIG5vcm0gb2YgdGhlIHF1YXRlcm5pb25cbiAgICovXG4gIGxlbmd0aCgpIHtcbiAgICByZXR1cm4gTWF0aC5oeXBvdCh0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdLCB0aGlzLl92WzNdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIG1hZ25pdHVkZSBvZiB0aGUgcXVhdGVybmlvbi5cbiAgICogVGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGxlbmd0aCgpIHdoZW4geW91IG9ubHkgbmVlZCB0byBjb21wYXJlIG1hZ25pdHVkZXMuXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIEV1Y2xpZGVhbiBub3JtIG9mIHRoZSBxdWF0ZXJuaW9uXG4gICAqL1xuICBsZW5ndGhTcXVhcmVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF0gKiogMiArIHRoaXMuX3ZbMV0gKiogMiArIHRoaXMuX3ZbMl0gKiogMiArIHRoaXMuX3ZbM10gKiogMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgcXVhdGVybmlvbiB0byBhIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBxdWF0ZXJuaW9uXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc1xuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHF1YXRlcm5pb24gdG8gYW4gYXBwcm94aW1hdGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKiBVc2VmdWwgZm9yIGRlYnVnZ2luZyB3aGVuIGV4YWN0IHByZWNpc2lvbiBpcyBub3QgcmVxdWlyZWQuXG4gICAqIEByZXR1cm5zIEFwcHJveGltYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcXVhdGVybmlvblxuICAgKiBAdGhyb3dzIEVycm9yIC0gTWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3NcbiAgICovXG4gIHRvU3RyaW5nQXBwcm94aW1hdGVseSgpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVucyB0aGUgcXVhdGVybmlvbiBjb21wb25lbnRzIGludG8gYSBwbGFpbiBudW1iZXIgYXJyYXkuXG4gICAqIEByZXR1cm5zIEFycmF5IGNvbnRhaW5pbmcgW3gsIHksIHosIHddIGNvbXBvbmVudHNcbiAgICogQHRocm93cyBFcnJvciAtIE1ldGhvZCBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzXG4gICAqL1xuICBmbGF0dGVuQXNBcnJheSgpOiBudW1iZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHF1YXRlcm5pb24gaXMgYSBkdW1teS9wbGFjZWhvbGRlciBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIGlzIGEgZHVtbXkgcXVhdGVybmlvbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc1xuICAgKi9cbiAgaXNEdW1teSgpOiBib29sZWFuIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgcXVhdGVybmlvbiBpcyBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIGFub3RoZXIgcXVhdGVybmlvbiB3aXRoaW4gYSB0b2xlcmFuY2UuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgcXVhdGVybmlvbiB0byBjb21wYXJlIGFnYWluc3RcbiAgICogQHBhcmFtIGRlbHRhIC0gT3B0aW9uYWwgdG9sZXJhbmNlIHZhbHVlIGZvciBjb21wYXJpc29uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgcXVhdGVybmlvbnMgYXJlIGFwcHJveGltYXRlbHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAdGhyb3dzIEVycm9yIC0gTWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3NcbiAgICovXG4gIGlzRXF1YWwoX3ZlYzogSVF1YXRlcm5pb24sIF9kZWx0YT86IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBxdWF0ZXJuaW9uIGlzIGV4YWN0bHkgZXF1YWwgdG8gYW5vdGhlciBxdWF0ZXJuaW9uLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHF1YXRlcm5pb24gdG8gY29tcGFyZSBhZ2FpbnN0XG4gICAqIEByZXR1cm5zIFRydWUgaWYgcXVhdGVybmlvbnMgYXJlIGV4YWN0bHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAdGhyb3dzIEVycm9yIC0gTWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3NcbiAgICovXG4gIGlzU3RyaWN0RXF1YWwoX3ZlYzogSVF1YXRlcm5pb24pOiBib29sZWFuIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHF1YXRlcm5pb24gdG8gRXVsZXIgYW5nbGVzIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIG91dCAtIFRoZSBtdXRhYmxlIHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0aW5nIEV1bGVyIGFuZ2xlc1xuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBFdWxlciBhbmdsZXNcbiAgICogQHRocm93cyBFcnJvciAtIE1ldGhvZCBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzXG4gICAqL1xuICB0b0V1bGVyQW5nbGVzVG8oX291dDogSU11dGFibGVWZWN0b3IzKTogSU11dGFibGVWZWN0b3IzIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHF1YXRlcm5pb24gdG8gRXVsZXIgYW5nbGVzLlxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgRXVsZXIgYW5nbGVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc1xuICAgKi9cbiAgdG9FdWxlckFuZ2xlcygpOiBJVmVjdG9yMyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSAzRCB2ZWN0b3IgYnkgdGhpcyBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHJldHVybnMgQSBuZXcgdHJhbnNmb3JtZWQgdmVjdG9yXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc1xuICAgKi9cbiAgdHJhbnNmb3JtVmVjdG9yMyhfdmVjOiBJVmVjdG9yMyk6IElWZWN0b3IzIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIDNEIHZlY3RvciBieSB0aGlzIHF1YXRlcm5pb24gcm90YXRpb24gYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHBhcmFtIG91dCAtIFRoZSBtdXRhYmxlIHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIHRyYW5zZm9ybWVkIHJlc3VsdFxuICAgKiBAdGhyb3dzIEVycm9yIC0gTWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3NcbiAgICovXG4gIHRyYW5zZm9ybVZlY3RvcjNUbyhfdmVjOiBJVmVjdG9yMywgX291dDogSU11dGFibGVWZWN0b3IzKTogSVZlY3RvcjMge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgM0QgdmVjdG9yIGJ5IHRoZSBpbnZlcnNlIG9mIHRoaXMgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciB0cmFuc2Zvcm1lZCBieSB0aGUgaW52ZXJzZSByb3RhdGlvblxuICAgKiBAdGhyb3dzIEVycm9yIC0gTWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3NcbiAgICovXG4gIHRyYW5zZm9ybVZlY3RvcjNJbnZlcnNlKF92ZWM6IElWZWN0b3IzKTogSVZlY3RvcjMge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBiZXR3ZWVuIHRoaXMgcXVhdGVybmlvbiBhbmQgYW5vdGhlciBxdWF0ZXJuaW9uLlxuICAgKiBUaGUgZG90IHByb2R1Y3Qgb2YgdHdvIHF1YXRlcm5pb25zIGdpdmVzIGEgc2NhbGFyIHZhbHVlIHRoYXQgcmVwcmVzZW50c1xuICAgKiB0aGUgY29zaW5lIG9mIGhhbGYgdGhlIGFuZ2xlIGJldHdlZW4gdGhlbSB3aGVuIGJvdGggcXVhdGVybmlvbnMgYXJlIHVuaXQgcXVhdGVybmlvbnMuXG4gICAqIEBwYXJhbSBxdWF0IC0gVGhlIHF1YXRlcm5pb24gdG8gY29tcHV0ZSB0aGUgZG90IHByb2R1Y3Qgd2l0aFxuICAgKiBAcmV0dXJucyBUaGUgZG90IHByb2R1Y3QgcmVzdWx0XG4gICAqL1xuICBkb3QocXVhdDogSVF1YXRlcm5pb24pIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXSAqIHF1YXQuX3ZbMF0gKyB0aGlzLl92WzFdICogcXVhdC5fdlsxXSArIHRoaXMuX3ZbMl0gKiBxdWF0Ll92WzJdICsgdGhpcy5fdlszXSAqIHF1YXQuX3ZbM107XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGRlZXAgY29weSBvZiB0aGlzIHF1YXRlcm5pb24uXG4gICAqIEByZXR1cm5zIEEgbmV3IHF1YXRlcm5pb24gaW5zdGFuY2Ugd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICogQHRocm93cyBFcnJvciAtIE1ldGhvZCBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzXG4gICAqL1xuICBjbG9uZSgpOiBJUXVhdGVybmlvbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIHR5cGVkIGFycmF5IHN0b3JhZ2UgZm9yIHF1YXRlcm5pb24gY29tcG9uZW50cyBbeCwgeSwgeiwgd10uXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF92OiBUeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQWNPLElBQWUscUJBQWYsTUFBeUQ7QUFBQSxFQUF6RDtBQXVNTDtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBQWlCLElBQUksYUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWxNbEMsSUFBSSxZQUFZO0FBQ2QsV0FBTyxLQUFLLFlBQVk7QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLElBQVk7QUFDZCxXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBWTtBQUNkLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLElBQVk7QUFDZCxXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxHQUFHLEdBQVc7QUFDWixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsU0FBUztBQUNQLFdBQU8sS0FBSyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFBQSxFQUNsRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGdCQUF3QjtBQUN0QixXQUFPLEtBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEtBQUs7QUFBQSxFQUM3RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQW1CO0FBQ2pCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSx3QkFBZ0M7QUFDOUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxpQkFBMkI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxVQUFtQjtBQUNqQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxRQUFRLE1BQW1CLFFBQTBCO0FBQ25ELFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxjQUFjLE1BQTRCO0FBQ3hDLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxnQkFBZ0IsTUFBd0M7QUFDdEQsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxnQkFBMEI7QUFDeEIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGlCQUFpQixNQUEwQjtBQUN6QyxVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxtQkFBbUIsTUFBZ0IsTUFBaUM7QUFDbEUsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLHdCQUF3QixNQUEwQjtBQUNoRCxVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxJQUFJLE1BQW1CO0FBQ3JCLFdBQU8sS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQzdHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsUUFBcUI7QUFDbkIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFPRjsiLAogICJuYW1lcyI6IFtdCn0K
