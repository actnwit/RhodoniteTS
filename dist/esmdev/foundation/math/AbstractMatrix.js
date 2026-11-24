// src/foundation/math/AbstractMatrix.ts
var AbstractMatrix = class {
  constructor() {
    /** Internal typed array storage for matrix elements (Float32Array or Float64Array) */
    this._v = new Float32Array();
  }
  /**
   * Gets the matrix element at the specified row and column.
   *
   * @param row_i - The zero-based row index
   * @param column_i - The zero-based column index
   * @returns The matrix element value at the specified position
   * @throws Error when not implemented in derived classes
   */
  at(_row_i, _column_i) {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the matrix to a string representation.
   *
   * @returns A string representation of the matrix
   * @throws Error when not implemented in derived classes
   */
  toString() {
    throw new Error("Method not implemented.");
  }
  /**
   * Converts the matrix to an approximate string representation.
   *
   * This method is useful for displaying matrices with rounded values
   * for better readability in debugging or logging scenarios.
   *
   * @returns An approximate string representation of the matrix
   * @throws Error when not implemented in derived classes
   */
  toStringApproximately() {
    throw new Error("Method not implemented.");
  }
  /**
   * Flattens the matrix into a one-dimensional array.
   *
   * @returns A flat array containing all matrix elements in row-major order
   * @throws Error when not implemented in derived classes
   */
  flattenAsArray() {
    throw new Error("Method not implemented.");
  }
  /**
   * Checks if this matrix is a dummy (uninitialized) matrix.
   *
   * A matrix is considered dummy if its internal storage has zero length,
   * indicating it hasn't been properly initialized with matrix data.
   *
   * @returns True if the matrix is dummy/uninitialized, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }
  /**
   * Gets the matrix element at the specified flat index.
   *
   * This provides direct access to the underlying Float32Array storage
   * using a single index rather than row/column coordinates.
   *
   * @param i - The zero-based flat index into the matrix storage
   * @returns The matrix element value at the specified index
   */
  v(i) {
    return this._v[i];
  }
  /**
   * Calculates the determinant of the matrix.
   *
   * @returns The determinant value of the matrix
   * @throws Error when not implemented in derived classes
   */
  determinant() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the class name of this matrix instance.
   *
   * @returns The name of the constructor function (class name)
   */
  get className() {
    return this.constructor.name;
  }
  /**
   * Gets the GLSL string representation of the matrix as float values.
   * @returns GLSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsFloat() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the GLSL string representation of the matrix as integer values.
   * @returns GLSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsInt() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the GLSL string representation of the matrix as unsigned integer values.
   * @returns GLSL-formatted string for unsigned integer values with 'u' suffix
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsUint() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the matrix as float values.
   * @returns WGSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsFloat() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the matrix as integer values.
   * @returns WGSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsInt() {
    throw new Error("Method not implemented.");
  }
  /**
   * Gets the WGSL string representation of the matrix as unsigned integer values.
   * @returns WGSL-formatted string for unsigned integer values with 'u' suffix
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsUint() {
    throw new Error("Method not implemented.");
  }
  /**
   * Indicates whether this matrix is an identity matrix class.
   *
   * This property should be overridden in derived classes that represent
   * identity matrices to return true.
   *
   * @returns False for the base AbstractMatrix class
   */
  get isIdentityMatrixClass() {
    return false;
  }
  /**
   * Checks if the matrix's internal storage shares the same ArrayBuffer as the provided one.
   *
   * This method is useful for determining if two matrices share the same underlying
   * memory, which can be important for performance optimizations and avoiding
   * unnecessary data copying.
   *
   * @param arrayBuffer - The ArrayBuffer to compare against
   * @returns True if the internal storage uses the same ArrayBuffer, false otherwise
   */
  isTheSourceSame(arrayBuffer) {
    return this._v.buffer === arrayBuffer;
  }
};
export {
  AbstractMatrix
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9BYnN0cmFjdE1hdHJpeC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBUeXBlZEFycmF5IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJTWF0cml4IH0gZnJvbSAnLi9JTWF0cml4JztcblxuLyoqXG4gKiBBYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBtYXRyaXggaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYSBjb21tb24gaW50ZXJmYWNlIGFuZCBiYXNpYyBmdW5jdGlvbmFsaXR5IGZvciBhbGwgbWF0cml4IHR5cGVzXG4gKiBpbiB0aGUgc3lzdGVtLiBJdCBpbXBsZW1lbnRzIHRoZSBJTWF0cml4IGludGVyZmFjZSBhbmQgc2VydmVzIGFzIHRoZSBmb3VuZGF0aW9uXG4gKiBmb3IgY29uY3JldGUgbWF0cml4IGNsYXNzZXMgbGlrZSBNYXRyaXg0NCwgTWF0cml4MzMsIGV0Yy5cbiAqXG4gKiBAYWJzdHJhY3RcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFic3RyYWN0TWF0cml4IGltcGxlbWVudHMgSU1hdHJpeCB7XG4gIC8qKiBJbnRlcm5hbCB0eXBlZCBhcnJheSBzdG9yYWdlIGZvciBtYXRyaXggZWxlbWVudHMgKEZsb2F0MzJBcnJheSBvciBGbG9hdDY0QXJyYXkpICovXG4gIF92OiBUeXBlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgpO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIHJvdyBhbmQgY29sdW1uLlxuICAgKlxuICAgKiBAcGFyYW0gcm93X2kgLSBUaGUgemVyby1iYXNlZCByb3cgaW5kZXhcbiAgICogQHBhcmFtIGNvbHVtbl9pIC0gVGhlIHplcm8tYmFzZWQgY29sdW1uIGluZGV4XG4gICAqIEByZXR1cm5zIFRoZSBtYXRyaXggZWxlbWVudCB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uXG4gICAqIEB0aHJvd3MgRXJyb3Igd2hlbiBub3QgaW1wbGVtZW50ZWQgaW4gZGVyaXZlZCBjbGFzc2VzXG4gICAqL1xuICBhdChfcm93X2k6IG51bWJlciwgX2NvbHVtbl9pOiBudW1iZXIpOiBudW1iZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gICAqIEB0aHJvd3MgRXJyb3Igd2hlbiBub3QgaW1wbGVtZW50ZWQgaW4gZGVyaXZlZCBjbGFzc2VzXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgbWF0cml4IHRvIGFuIGFwcHJveGltYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgaXMgdXNlZnVsIGZvciBkaXNwbGF5aW5nIG1hdHJpY2VzIHdpdGggcm91bmRlZCB2YWx1ZXNcbiAgICogZm9yIGJldHRlciByZWFkYWJpbGl0eSBpbiBkZWJ1Z2dpbmcgb3IgbG9nZ2luZyBzY2VuYXJpb3MuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFwcHJveGltYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gICAqIEB0aHJvd3MgRXJyb3Igd2hlbiBub3QgaW1wbGVtZW50ZWQgaW4gZGVyaXZlZCBjbGFzc2VzXG4gICAqL1xuICB0b1N0cmluZ0FwcHJveGltYXRlbHkoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgdGhlIG1hdHJpeCBpbnRvIGEgb25lLWRpbWVuc2lvbmFsIGFycmF5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZsYXQgYXJyYXkgY29udGFpbmluZyBhbGwgbWF0cml4IGVsZW1lbnRzIGluIHJvdy1tYWpvciBvcmRlclxuICAgKiBAdGhyb3dzIEVycm9yIHdoZW4gbm90IGltcGxlbWVudGVkIGluIGRlcml2ZWQgY2xhc3Nlc1xuICAgKi9cbiAgZmxhdHRlbkFzQXJyYXkoKTogbnVtYmVyW10ge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBtYXRyaXggaXMgYSBkdW1teSAodW5pbml0aWFsaXplZCkgbWF0cml4LlxuICAgKlxuICAgKiBBIG1hdHJpeCBpcyBjb25zaWRlcmVkIGR1bW15IGlmIGl0cyBpbnRlcm5hbCBzdG9yYWdlIGhhcyB6ZXJvIGxlbmd0aCxcbiAgICogaW5kaWNhdGluZyBpdCBoYXNuJ3QgYmVlbiBwcm9wZXJseSBpbml0aWFsaXplZCB3aXRoIG1hdHJpeCBkYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtYXRyaXggaXMgZHVtbXkvdW5pbml0aWFsaXplZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0R1bW15KCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl92Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtYXRyaXggZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkIGZsYXQgaW5kZXguXG4gICAqXG4gICAqIFRoaXMgcHJvdmlkZXMgZGlyZWN0IGFjY2VzcyB0byB0aGUgdW5kZXJseWluZyBGbG9hdDMyQXJyYXkgc3RvcmFnZVxuICAgKiB1c2luZyBhIHNpbmdsZSBpbmRleCByYXRoZXIgdGhhbiByb3cvY29sdW1uIGNvb3JkaW5hdGVzLlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSB6ZXJvLWJhc2VkIGZsYXQgaW5kZXggaW50byB0aGUgbWF0cml4IHN0b3JhZ2VcbiAgICogQHJldHVybnMgVGhlIG1hdHJpeCBlbGVtZW50IHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcbiAgICovXG4gIHYoaTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdltpXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiB0aGUgbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGV0ZXJtaW5hbnQgdmFsdWUgb2YgdGhlIG1hdHJpeFxuICAgKiBAdGhyb3dzIEVycm9yIHdoZW4gbm90IGltcGxlbWVudGVkIGluIGRlcml2ZWQgY2xhc3Nlc1xuICAgKi9cbiAgZGV0ZXJtaW5hbnQoKTogbnVtYmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZSBvZiB0aGlzIG1hdHJpeCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5hbWUgb2YgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIChjbGFzcyBuYW1lKVxuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeCBhcyBmbG9hdCB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIEdMU0wtZm9ybWF0dGVkIHN0cmluZyBmb3IgZmxvYXQgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCBnbHNsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBHTFNMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4IGFzIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBHTFNMLWZvcm1hdHRlZCBzdHJpbmcgZm9yIGludGVnZXIgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCBnbHNsU3RyQXNJbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeCBhcyB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgR0xTTC1mb3JtYXR0ZWQgc3RyaW5nIGZvciB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcyB3aXRoICd1JyBzdWZmaXhcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgZ2V0IGdsc2xTdHJBc1VpbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgV0dTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeCBhcyBmbG9hdCB2YWx1ZXMuXG4gICAqIEByZXR1cm5zIFdHU0wtZm9ybWF0dGVkIHN0cmluZyBmb3IgZmxvYXQgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNGbG9hdCgpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBXR1NMIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4IGFzIGludGVnZXIgdmFsdWVzLlxuICAgKiBAcmV0dXJucyBXR1NMLWZvcm1hdHRlZCBzdHJpbmcgZm9yIGludGVnZXIgdmFsdWVzXG4gICAqIEB0aHJvd3MgRXJyb3IgLSBNdXN0IGJlIGltcGxlbWVudGVkIGJ5IHN1YmNsYXNzZXNcbiAgICovXG4gIGdldCB3Z3NsU3RyQXNJbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgV0dTTCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeCBhcyB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICogQHJldHVybnMgV0dTTC1mb3JtYXR0ZWQgc3RyaW5nIGZvciB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcyB3aXRoICd1JyBzdWZmaXhcbiAgICogQHRocm93cyBFcnJvciAtIE11c3QgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlc1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc1VpbnQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBtYXRyaXggaXMgYW4gaWRlbnRpdHkgbWF0cml4IGNsYXNzLlxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IHNob3VsZCBiZSBvdmVycmlkZGVuIGluIGRlcml2ZWQgY2xhc3NlcyB0aGF0IHJlcHJlc2VudFxuICAgKiBpZGVudGl0eSBtYXRyaWNlcyB0byByZXR1cm4gdHJ1ZS5cbiAgICpcbiAgICogQHJldHVybnMgRmFsc2UgZm9yIHRoZSBiYXNlIEFic3RyYWN0TWF0cml4IGNsYXNzXG4gICAqL1xuICBnZXQgaXNJZGVudGl0eU1hdHJpeENsYXNzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIG1hdHJpeCdzIGludGVybmFsIHN0b3JhZ2Ugc2hhcmVzIHRoZSBzYW1lIEFycmF5QnVmZmVyIGFzIHRoZSBwcm92aWRlZCBvbmUuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIHVzZWZ1bCBmb3IgZGV0ZXJtaW5pbmcgaWYgdHdvIG1hdHJpY2VzIHNoYXJlIHRoZSBzYW1lIHVuZGVybHlpbmdcbiAgICogbWVtb3J5LCB3aGljaCBjYW4gYmUgaW1wb3J0YW50IGZvciBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb25zIGFuZCBhdm9pZGluZ1xuICAgKiB1bm5lY2Vzc2FyeSBkYXRhIGNvcHlpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBBcnJheUJ1ZmZlciB0byBjb21wYXJlIGFnYWluc3RcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgaW50ZXJuYWwgc3RvcmFnZSB1c2VzIHRoZSBzYW1lIEFycmF5QnVmZmVyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzVGhlU291cmNlU2FtZShhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdi5idWZmZXIgPT09IGFycmF5QnVmZmVyO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBWU8sSUFBZSxpQkFBZixNQUFpRDtBQUFBLEVBQWpEO0FBRUw7QUFBQSxjQUFpQixJQUFJLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVsQyxHQUFHLFFBQWdCLFdBQTJCO0FBQzVDLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxXQUFtQjtBQUNqQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0Esd0JBQWdDO0FBQzlCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxpQkFBMkI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxVQUFtQjtBQUNqQixRQUFJLEtBQUssR0FBRyxXQUFXLEdBQUc7QUFDeEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsRUFBRSxHQUFtQjtBQUNuQixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGNBQXNCO0FBQ3BCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxZQUFvQjtBQUN0QixXQUFPLEtBQUssWUFBWTtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxpQkFBeUI7QUFDM0IsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGVBQXVCO0FBQ3pCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QjtBQUFBLEVBQzNDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxnQkFBd0I7QUFDMUIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGlCQUF5QjtBQUMzQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksZUFBdUI7QUFDekIsVUFBTSxJQUFJLE1BQU0seUJBQXlCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLGdCQUF3QjtBQUMxQixVQUFNLElBQUksTUFBTSx5QkFBeUI7QUFBQSxFQUMzQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLElBQUksd0JBQWlDO0FBQ25DLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLGdCQUFnQixhQUFtQztBQUNqRCxXQUFPLEtBQUssR0FBRyxXQUFXO0FBQUEsRUFDNUI7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
