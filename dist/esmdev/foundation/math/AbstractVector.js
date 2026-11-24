// src/foundation/math/AbstractVector.ts
var AbstractVector = class {
  constructor() {
    /** Internal typed array storage for vector components */
    this._v = new Float32Array();
  }
  /**
   * Gets the x-component (first component) of the vector.
   * @returns The x-component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Gets the GLSL string representation of the vector as float values.
   * @returns GLSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsFloat() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the GLSL string representation of the vector as integer values.
   * @returns GLSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsInt() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the GLSL string representation of the vector as unsigned integer values.
   * @returns GLSL-formatted string for unsigned integer values with 'u' suffix
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsUint() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the vector as float values.
   * @returns WGSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsFloat() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the vector as integer values.
   * @returns WGSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsInt() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the vector as unsigned integer values.
   * @returns WGSL-formatted string for unsigned integer values with 'u' suffix
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsUint() {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this vector is approximately equal to another vector within a specified tolerance.
   * @param vec - The vector to compare against
   * @param delta - Optional tolerance value for comparison
   * @returns True if vectors are approximately equal, false otherwise
   * @throws Error - Must be implemented by subclasses
   */
  isEqual(_vec, _delta) {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this vector is strictly equal to another vector (exact equality).
   * @param vec - The vector to compare against
   * @returns True if vectors are exactly equal, false otherwise
   * @throws Error - Must be implemented by subclasses
   */
  isStrictEqual(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculates the length (magnitude) of the vector.
   * @returns The length of the vector
   * @throws Error - Must be implemented by subclasses
   */
  length() {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculates the squared length of the vector.
   * This is more efficient than length() when only relative comparisons are needed.
   * @returns The squared length of the vector
   * @throws Error - Must be implemented by subclasses
   */
  lengthSquared() {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculates the distance from this vector to another vector.
   * @param vec - The target vector
   * @returns The distance between the vectors
   * @throws Error - Must be implemented by subclasses
   */
  lengthTo(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Calculates the dot product between this vector and another vector.
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   * @throws Error - Must be implemented by subclasses
   */
  dot(_vec) {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the component value at the specified index.
   * @param i - The index of the component to retrieve
   * @returns The component value at the given index
   */
  at(i) {
    return this._v[i];
  }
  /**
   * Converts the vector to its string representation.
   * @returns String representation of the vector
   * @throws Error - Must be implemented by subclasses
   */
  toString() {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the vector to an approximate string representation.
   * Useful for debugging when exact precision is not required.
   * @returns Approximate string representation of the vector
   * @throws Error - Must be implemented by subclasses
   */
  toStringApproximately() {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the vector to a flat array of numbers.
   * @returns Array containing all vector components
   * @throws Error - Must be implemented by subclasses
   */
  flattenAsArray() {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this vector is a dummy (empty) vector.
   * A dummy vector has no components and is typically used as a placeholder.
   * @returns True if the vector is dummy, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }
  /**
   * Gets the component value at the specified index.
   * Alias for the at() method for convenience.
   * @param i - The index of the component to retrieve
   * @returns The component value at the given index
   */
  v(i) {
    return this._v[i];
  }
  /**
   * Checks if the internal storage shares the same ArrayBuffer as the provided one.
   * Useful for determining if vectors share underlying memory.
   * @param arrayBuffer - The ArrayBuffer to compare against
   * @returns True if the same ArrayBuffer is used, false otherwise
   */
  isTheSourceSame(arrayBuffer) {
    return this._v.buffer === arrayBuffer;
  }
  /**
   * Gets the class name of this vector instance.
   * @returns The constructor name of the class
   */
  get className() {
    return this.constructor.name;
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   * @returns Bytes per component
   * @throws Error - Must be implemented by subclasses
   */
  get bytesPerComponent() {
    throw new Error("Method not implemented.");
  }
};
export {
  AbstractVector
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9BYnN0cmFjdFZlY3Rvci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yIH0gZnJvbSAnLi9JVmVjdG9yJztcblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciB2ZWN0b3IgaW1wbGVtZW50YXRpb25zLlxuICogUHJvdmlkZXMgY29tbW9uIGZ1bmN0aW9uYWxpdHkgYW5kIGRlZmluZXMgdGhlIGludGVyZmFjZSB0aGF0IGFsbCB2ZWN0b3IgY2xhc3NlcyBtdXN0IGltcGxlbWVudC5cbiAqIFRoaXMgY2xhc3MgaGFuZGxlcyBiYXNpYyB2ZWN0b3Igb3BlcmF0aW9ucyBhbmQgc2VydmVzIGFzIGEgZm91bmRhdGlvbiBmb3Igc3BlY2lmaWMgdmVjdG9yIHR5cGVzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQWJzdHJhY3RWZWN0b3IgaW1wbGVtZW50cyBJVmVjdG9yIHtcbiAgLyoqIEludGVybmFsIHR5cGVkIGFycmF5IHN0b3JhZ2UgZm9yIHZlY3RvciBjb21wb25lbnRzICovXG4gIF92OiBUeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB4LWNvbXBvbmVudCAoZmlyc3QgY29tcG9uZW50KSBvZiB0aGUgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgeC1jb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvciBhcyBmbG9hdCB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIEdMU0wtZm9ybWF0dGVkIHN0cmluZyBmb3IgZmxvYXQgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCBnbHNsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBHTFNMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yIGFzIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBHTFNMLWZvcm1hdHRlZCBzdHJpbmcgZm9yIGludGVnZXIgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCBnbHNsU3RyQXNJbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvciBhcyB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgR0xTTC1mb3JtYXR0ZWQgc3RyaW5nIGZvciB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcyB3aXRoICd1JyBzdWZmaXhcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgZ2V0IGdsc2xTdHJBc1VpbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgV0dTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvciBhcyBmbG9hdCB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIFdHU0wtZm9ybWF0dGVkIHN0cmluZyBmb3IgZmxvYXQgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBXR1NMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yIGFzIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBXR1NMLWZvcm1hdHRlZCBzdHJpbmcgZm9yIGludGVnZXIgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNJbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgV0dTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvciBhcyB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgV0dTTC1mb3JtYXR0ZWQgc3RyaW5nIGZvciB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcyB3aXRoICd1JyBzdWZmaXhcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc1VpbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgdmVjdG9yIGlzIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gYW5vdGhlciB2ZWN0b3Igd2l0aGluIGEgc3BlY2lmaWVkIHRvbGVyYW5jZS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY29tcGFyZSBhZ2FpbnN0XG4gICAqIEBwYXJhbSBkZWx0YSAtIE9wdGlvbmFsIHRvbGVyYW5jZSB2YWx1ZSBmb3IgY29tcGFyaXNvblxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHZlY3RvcnMgYXJlIGFwcHJveGltYXRlbHkgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAdGhyb3dzIEVycm9yIC0gTXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc2VzXG4gICAqL1xuICBpc0VxdWFsKF92ZWM6IElWZWN0b3IsIF9kZWx0YT86IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyB2ZWN0b3IgaXMgc3RyaWN0bHkgZXF1YWwgdG8gYW5vdGhlciB2ZWN0b3IgKGV4YWN0IGVxdWFsaXR5KS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY29tcGFyZSBhZ2FpbnN0XG4gICAqIEByZXR1cm5zIFRydWUgaWYgdmVjdG9ycyBhcmUgZXhhY3RseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGlzU3RyaWN0RXF1YWwoX3ZlYzogSVZlY3Rvcik6IGJvb2xlYW4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggKG1hZ25pdHVkZSkgb2YgdGhlIHZlY3Rvci5cbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yLlxuICAgKiBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gbGVuZ3RoKCkgd2hlbiBvbmx5IHJlbGF0aXZlIGNvbXBhcmlzb25zIGFyZSBuZWVkZWQuXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGxlbmd0aFNxdWFyZWQoKTogbnVtYmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGlzdGFuY2UgZnJvbSB0aGlzIHZlY3RvciB0byBhbm90aGVyIHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB0YXJnZXQgdmVjdG9yXG4gICAqIEByZXR1cm5zIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSB2ZWN0b3JzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGxlbmd0aFRvKF92ZWM6IElWZWN0b3IpOiBudW1iZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyIHZlY3Rvci5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGRvdCBwcm9kdWN0IHdpdGhcbiAgICogQHJldHVybnMgVGhlIGRvdCBwcm9kdWN0IHJlc3VsdFxuICAgKiBAdGhyb3dzIEVycm9yIC0gTXVzdCBiZSBpbXBsZW1lbnRlZCBieSBzdWJjbGFzc2VzXG4gICAqL1xuICBkb3QoX3ZlYzogSVZlY3Rvcik6IG51bWJlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGUgY29tcG9uZW50IHRvIHJldHJpZXZlXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdmFsdWUgYXQgdGhlIGdpdmVuIGluZGV4XG4gICAqL1xuICBhdChpOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92W2ldO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gaXRzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhbiBhcHByb3hpbWF0ZSBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqIFVzZWZ1bCBmb3IgZGVidWdnaW5nIHdoZW4gZXhhY3QgcHJlY2lzaW9uIGlzIG5vdCByZXF1aXJlZC5cbiAgICogQHJldHVybnMgQXBwcm94aW1hdGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgdG9TdHJpbmdBcHByb3hpbWF0ZWx5KCk6IHN0cmluZyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBmbGF0IGFycmF5IG9mIG51bWJlcnMuXG4gICAqIEByZXR1cm5zIEFycmF5IGNvbnRhaW5pbmcgYWxsIHZlY3RvciBjb21wb25lbnRzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGZsYXR0ZW5Bc0FycmF5KCk6IG51bWJlcltdIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgdmVjdG9yIGlzIGEgZHVtbXkgKGVtcHR5KSB2ZWN0b3IuXG4gICAqIEEgZHVtbXkgdmVjdG9yIGhhcyBubyBjb21wb25lbnRzIGFuZCBpcyB0eXBpY2FsbHkgdXNlZCBhcyBhIHBsYWNlaG9sZGVyLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2ZWN0b3IgaXMgZHVtbXksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNEdW1teSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqIEFsaWFzIGZvciB0aGUgYXQoKSBtZXRob2QgZm9yIGNvbnZlbmllbmNlLlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGUgY29tcG9uZW50IHRvIHJldHJpZXZlXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdmFsdWUgYXQgdGhlIGdpdmVuIGluZGV4XG4gICAqL1xuICB2KGk6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBpbnRlcm5hbCBzdG9yYWdlIHNoYXJlcyB0aGUgc2FtZSBBcnJheUJ1ZmZlciBhcyB0aGUgcHJvdmlkZWQgb25lLlxuICAgKiBVc2VmdWwgZm9yIGRldGVybWluaW5nIGlmIHZlY3RvcnMgc2hhcmUgdW5kZXJseWluZyBtZW1vcnkuXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBBcnJheUJ1ZmZlciB0byBjb21wYXJlIGFnYWluc3RcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgc2FtZSBBcnJheUJ1ZmZlciBpcyB1c2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzVGhlU291cmNlU2FtZShhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdi5idWZmZXIgPT09IGFycmF5QnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgb2YgdGhpcyB2ZWN0b3IgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSBjb25zdHJ1Y3RvciBuYW1lIG9mIHRoZSBjbGFzc1xuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBjb21wb25lbnQgaW4gdGhlIHVuZGVybHlpbmcgdHlwZWQgYXJyYXkuXG4gICAqIEByZXR1cm5zIEJ5dGVzIHBlciBjb21wb25lbnRcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgZ2V0IGJ5dGVzUGVyQ29tcG9uZW50KCk6IG51bWJlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNZXRob2Qgbm90IGltcGxlbWVudGVkLicpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBUU8sSUFBZSxpQkFBZixNQUFpRDtBQUFBLEVBQWpEO0FBRUw7QUFBQSxjQUFpQixJQUFJLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNbEMsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxpQkFBeUI7QUFDM0IsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGVBQXVCO0FBQ3pCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxnQkFBd0I7QUFDMUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGlCQUF5QjtBQUMzQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksZUFBdUI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGdCQUF3QjtBQUMxQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxRQUFRLE1BQWUsUUFBMEI7QUFDL0MsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGNBQWMsTUFBd0I7QUFDcEMsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxTQUFpQjtBQUNmLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxnQkFBd0I7QUFDdEIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFNBQVMsTUFBdUI7QUFDOUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLElBQUksTUFBdUI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxHQUFHLEdBQW1CO0FBQ3BCLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQW1CO0FBQ2pCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSx3QkFBZ0M7QUFDOUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxpQkFBMkI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxVQUFtQjtBQUNqQixRQUFJLEtBQUssR0FBRyxXQUFXLEdBQUc7QUFDeEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsRUFBRSxHQUFtQjtBQUNuQixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGdCQUFnQixhQUFtQztBQUNqRCxXQUFPLEtBQUssR0FBRyxXQUFXO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxZQUFvQjtBQUN0QixXQUFPLEtBQUssWUFBWTtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxvQkFBNEI7QUFDOUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
