// src/foundation/math/VectorN.ts
var VectorN = class _VectorN {
  /**
   * Creates a new VectorN instance.
   * @param typedArray - The typed array containing the vector components
   */
  constructor(typedArray) {
    this._v = typedArray;
  }
  /**
   * Creates a deep copy of this vector.
   * @returns A new VectorN instance with the same components as this vector
   */
  clone() {
    return new _VectorN(this._v.slice());
  }
  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy VectorN instance
   */
  static dummy() {
    return new _VectorN(new Float32Array([]));
  }
  /**
   * Checks if this vector is a dummy vector (has no components).
   *
   * @returns True if the vector has no components, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }
  copyComponents(vec) {
    this._v.set(vec._v);
  }
  setAt(i, value) {
    this._v[i] = value;
  }
  getAt(i) {
    return this._v[i];
  }
};
export {
  VectorN
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3JOLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5cbi8qKlxuICogVmVjdG9yTiByZXByZXNlbnRzIGFuIE4tZGltZW5zaW9uYWwgdmVjdG9yIHdpdGggYXJiaXRyYXJ5IGxlbmd0aC5cbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYmFzaWMgdmVjdG9yIG9wZXJhdGlvbnMgdXNpbmcgVHlwZWRBcnJheSBmb3IgZWZmaWNpZW50IG1lbW9yeSB1c2FnZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFZlY3Rvck4ge1xuICBwdWJsaWMgX3Y6IFR5cGVkQXJyYXk7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yTiBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHR5cGVkQXJyYXkgLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHR5cGVkQXJyYXk6IFR5cGVkQXJyYXkpIHtcbiAgICB0aGlzLl92ID0gdHlwZWRBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3JOIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgY29tcG9uZW50cyBhcyB0aGlzIHZlY3RvclxuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3JOKHRoaXMuX3Yuc2xpY2UoKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IHZlY3RvciB3aXRoIG5vIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IFZlY3Rvck4gaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpIHtcbiAgICByZXR1cm4gbmV3IFZlY3Rvck4obmV3IEZsb2F0MzJBcnJheShbXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHZlY3RvciBpcyBhIGR1bW15IHZlY3RvciAoaGFzIG5vIGNvbXBvbmVudHMpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2ZWN0b3IgaGFzIG5vIGNvbXBvbmVudHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNEdW1teSgpIHtcbiAgICBpZiAodGhpcy5fdi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb3B5Q29tcG9uZW50cyh2ZWM6IFZlY3Rvck4pIHtcbiAgICB0aGlzLl92LnNldCh2ZWMuX3YpO1xuICB9XG5cbiAgc2V0QXQoaTogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fdltpXSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0QXQoaTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFNTyxJQUFNLFVBQU4sTUFBTSxTQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9uQixZQUFZLFlBQXdCO0FBQ2xDLFNBQUssS0FBSztBQUFBLEVBQ1o7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsUUFBUTtBQUNOLFdBQU8sSUFBSSxTQUFRLEtBQUssR0FBRyxNQUFNLENBQUM7QUFBQSxFQUNwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sUUFBUTtBQUNiLFdBQU8sSUFBSSxTQUFRLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQ3pDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsVUFBVTtBQUNSLFFBQUksS0FBSyxHQUFHLFdBQVcsR0FBRztBQUN4QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxlQUFlLEtBQWM7QUFDM0IsU0FBSyxHQUFHLElBQUksSUFBSSxFQUFFO0FBQUEsRUFDcEI7QUFBQSxFQUVBLE1BQU0sR0FBVyxPQUFlO0FBQzlCLFNBQUssR0FBRyxDQUFDLElBQUk7QUFBQSxFQUNmO0FBQUEsRUFFQSxNQUFNLEdBQVc7QUFDZixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
