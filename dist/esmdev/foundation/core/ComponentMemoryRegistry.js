// src/foundation/core/ComponentMemoryRegistry.ts
function createAccessorKey(componentClass, memberName, indexOfBufferView) {
  return `${componentClass.componentTID}:${memberName}:${indexOfBufferView}`;
}
var ComponentMemoryRegistry = class {
  constructor() {
    /**
     * Stores accessors using composite keys.
     * Key format: "ComponentTID:MemberName:IndexOfBufferView"
     */
    this.Gi = /* @__PURE__ */ new Map();
    /**
     * Tracks which accessor keys exist for each component class and member name.
     * This enables efficient iteration over all buffer view indices for a given member.
     */
    this.Bi = /* @__PURE__ */ new Map();
    /**
     * Stores the number of components per buffer view for each component class.
     */
    this.Di = /* @__PURE__ */ new Map();
    /**
     * Stores byte offsets using composite keys.
     * Key format: "ComponentTID:MemberName:IndexOfBufferView"
     */
    this.Hi = /* @__PURE__ */ new Map();
    /**
     * Tracks which byte offset keys exist for each component class and member name.
     */
    this.Ci = /* @__PURE__ */ new Map();
    /**
     * Chunks of variable-length array members, per component SID.
     * Key format: "ComponentTID:MemberName:ComponentSID"
     */
    this.Ii = /* @__PURE__ */ new Map();
    /**
     * Chunks of variable-length array members which are no longer used, per member.
     * Key format: "ComponentTID:MemberName"
     */
    this.Ei = /* @__PURE__ */ new Map();
    /**
     * The state version, incremented when component memory layout changes.
     */
    this.Fi = 0;
  }
  // ==================== Accessor Methods ====================
  /**
   * Gets an accessor for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @returns The accessor or undefined if not found
   */
  getAccessor(componentClass, memberName, indexOfBufferView) {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    return this.Gi.get(key);
  }
  /**
   * Sets an accessor for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @param accessor - The accessor to store
   */
  setAccessor(componentClass, memberName, indexOfBufferView, accessor) {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    this.Gi.set(key, accessor);
    if (!this.Bi.has(componentClass)) {
      this.Bi.set(componentClass, /* @__PURE__ */ new Map());
    }
    const memberMap = this.Bi.get(componentClass);
    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, /* @__PURE__ */ new Set());
    }
    memberMap.get(memberName).add(indexOfBufferView);
    this.Fi++;
  }
  /**
   * Gets all accessors for a specific component member across all buffer view indices.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @returns A Map of buffer view indices to accessors
   */
  getAccessorsForMember(componentClass, memberName) {
    const result = /* @__PURE__ */ new Map();
    const memberMap = this.Bi.get(componentClass);
    if (memberMap == null) {
      return result;
    }
    const indices = memberMap.get(memberName);
    if (indices == null) {
      return result;
    }
    for (const index of indices) {
      const accessor = this.getAccessor(componentClass, memberName, index);
      if (accessor != null) {
        result.set(index, accessor);
      }
    }
    return result;
  }
  /**
   * Checks if accessors exist for a specific component class.
   *
   * @param componentClass - The component class to check
   * @returns True if accessors exist for the component class
   */
  hasAccessorsForComponent(componentClass) {
    return this.Bi.has(componentClass);
  }
  /**
   * Ensures accessor tracking maps are initialized for a component class.
   *
   * @param componentClass - The component class
   */
  ensureAccessorMapsForComponent(componentClass) {
    if (!this.Bi.has(componentClass)) {
      this.Bi.set(componentClass, /* @__PURE__ */ new Map());
    }
  }
  // ==================== Component Count Methods ====================
  /**
   * Gets the number of components per buffer view for a component class.
   *
   * @param componentClass - The component class
   * @returns The count or undefined if not set
   */
  getComponentCountPerBufferView(componentClass) {
    return this.Di.get(componentClass);
  }
  /**
   * Sets the number of components per buffer view for a component class.
   *
   * @param componentClass - The component class
   * @param count - The number of components per buffer view
   */
  setComponentCountPerBufferView(componentClass, count) {
    this.Di.set(componentClass, count);
  }
  /**
   * Gets all component count per buffer view entries.
   *
   * @returns A copy of the component count map
   */
  getAllComponentCountPerBufferView() {
    return new Map(this.Di);
  }
  // ==================== Byte Offset Methods ====================
  /**
   * Gets the byte offset for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @returns The byte offset or undefined if not found
   */
  getByteOffset(componentClass, memberName, indexOfBufferView) {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    return this.Hi.get(key);
  }
  /**
   * Sets the byte offset for a specific component member and buffer view index.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @param indexOfBufferView - The buffer view index
   * @param byteOffset - The byte offset to store
   */
  setByteOffset(componentClass, memberName, indexOfBufferView, byteOffset) {
    const key = createAccessorKey(componentClass, memberName, indexOfBufferView);
    this.Hi.set(key, byteOffset);
    if (!this.Ci.has(componentClass)) {
      this.Ci.set(componentClass, /* @__PURE__ */ new Map());
    }
    const memberMap = this.Ci.get(componentClass);
    if (!memberMap.has(memberName)) {
      memberMap.set(memberName, /* @__PURE__ */ new Set());
    }
    memberMap.get(memberName).add(indexOfBufferView);
  }
  /**
   * Gets all byte offsets for a specific component member.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the member field
   * @returns A Map of buffer view indices to byte offsets
   */
  getByteOffsetsForMember(componentClass, memberName) {
    const result = /* @__PURE__ */ new Map();
    const memberMap = this.Ci.get(componentClass);
    if (memberMap == null) {
      return void 0;
    }
    const indices = memberMap.get(memberName);
    if (indices == null) {
      return void 0;
    }
    for (const index of indices) {
      const offset = this.getByteOffset(componentClass, memberName, index);
      if (offset != null) {
        result.set(index, offset);
      }
    }
    return result;
  }
  /**
   * Checks if byte offset data exists for a specific component class.
   *
   * @param componentClass - The component class to check
   * @returns True if byte offset data exists
   */
  hasByteOffsetsForComponent(componentClass) {
    return this.Ci.has(componentClass);
  }
  // ==================== Variable-Length Chunk Methods ====================
  /**
   * Gets the chunk of a variable-length array member of a component.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the variable-length array member
   * @param componentSID - The component SID
   * @returns The chunk or undefined if not allocated yet
   */
  getVariableLengthChunk(componentClass, memberName, componentSID) {
    return this.Ii.get(`${componentClass.componentTID}:${memberName}:${componentSID}`);
  }
  /**
   * Sets the chunk of a variable-length array member of a component.
   * Note that this does not change the state version, since shaders read the locations of chunks at runtime.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the variable-length array member
   * @param componentSID - The component SID
   * @param chunk - The chunk to set
   */
  setVariableLengthChunk(componentClass, memberName, componentSID, chunk) {
    this.Ii.set(`${componentClass.componentTID}:${memberName}:${componentSID}`, chunk);
  }
  /**
   * Puts a chunk which is no longer used into the free list so that it can be reused.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the variable-length array member
   * @param chunk - The chunk to release
   */
  releaseVariableLengthChunk(componentClass, memberName, chunk) {
    const key = `${componentClass.componentTID}:${memberName}`;
    let freeChunks = this.Ei.get(key);
    if (freeChunks == null) {
      freeChunks = [];
      this.Ei.set(key, freeChunks);
    }
    freeChunks.push(chunk);
  }
  /**
   * Takes the smallest free chunk which has enough capacity.
   *
   * @param componentClass - The component class
   * @param memberName - The name of the variable-length array member
   * @param byteLength - The required byte length
   * @returns The chunk, or undefined if there is no suitable free chunk
   */
  takeFreeVariableLengthChunk(componentClass, memberName, byteLength) {
    const freeChunks = this.Ei.get(`${componentClass.componentTID}:${memberName}`);
    if (freeChunks == null) {
      return void 0;
    }
    let bestIndex = -1;
    for (let i = 0; i < freeChunks.length; i++) {
      const capacity = freeChunks[i].byteCapacity;
      if (capacity >= byteLength && (bestIndex === -1 || capacity < freeChunks[bestIndex].byteCapacity)) {
        bestIndex = i;
      }
    }
    if (bestIndex === -1) {
      return void 0;
    }
    return freeChunks.splice(bestIndex, 1)[0];
  }
  // ==================== State Version ====================
  /**
   * Gets the current state version.
   * This is incremented whenever the memory layout changes.
   *
   * @returns The current state version
   */
  getStateVersion() {
    return this.Fi;
  }
  /**
   * Increments and returns the new state version.
   *
   * @returns The new state version
   */
  incrementStateVersion() {
    return ++this.Fi;
  }
  /**
   * Clears all stored data and resets the registry to its initial state.
   * Should be called when the engine is being destroyed.
   */
  destroy() {
    this.Gi.clear();
    this.Bi.clear();
    this.Di.clear();
    this.Hi.clear();
    this.Ci.clear();
    this.Ii.clear();
    this.Ei.clear();
    this.Fi = 0;
  }
};
export {
  ComponentMemoryRegistry
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9Db21wb25lbnRNZW1vcnlSZWdpc3RyeS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBCeXRlLCBDb21wb25lbnRTSUQsIENvdW50LCBJbmRleE9mMTZCeXRlcyB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzb3IgfSBmcm9tICcuLi9tZW1vcnkvQWNjZXNzb3InO1xuaW1wb3J0IHR5cGUgeyBCdWZmZXJWaWV3IH0gZnJvbSAnLi4vbWVtb3J5L0J1ZmZlclZpZXcnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5cbnR5cGUgTWVtYmVyTmFtZSA9IHN0cmluZztcbnR5cGUgSW5kZXhPZlRoZUJ1ZmZlclZpZXcgPSBudW1iZXI7XG5cbi8qKlxuICogQSBjb21wb3NpdGUga2V5IGZvciBhY2Nlc3NpbmcgY29tcG9uZW50IG1lbW9yeSBkYXRhLlxuICogRm9ybWF0OiBcIkNvbXBvbmVudENsYXNzTmFtZTpNZW1iZXJOYW1lOkluZGV4T2ZCdWZmZXJWaWV3XCJcbiAqL1xudHlwZSBBY2Nlc3NvcktleSA9IHN0cmluZztcbnR5cGUgQnl0ZU9mZnNldEtleSA9IHN0cmluZztcblxuLyoqXG4gKiBDcmVhdGVzIGEgY29tcG9zaXRlIGtleSBmb3IgYWNjZXNzb3IgbG9va3VwLlxuICovXG5mdW5jdGlvbiBjcmVhdGVBY2Nlc3NvcktleShcbiAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gIG1lbWJlck5hbWU6IE1lbWJlck5hbWUsXG4gIGluZGV4T2ZCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlld1xuKTogQWNjZXNzb3JLZXkge1xuICByZXR1cm4gYCR7Y29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEfToke21lbWJlck5hbWV9OiR7aW5kZXhPZkJ1ZmZlclZpZXd9YDtcbn1cblxuLyoqXG4gKiBBIGNodW5rIG9mIG1lbW9yeSBhbGxvY2F0ZWQgZm9yIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlciBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgVmFyaWFibGVMZW5ndGhDaHVuayA9IHtcbiAgLyoqIFRoZSBidWZmZXIgdmlldyB3aGljaCBvd25zIHRoZSBtZW1vcnkgb2YgdGhlIGNodW5rICovXG4gIGJ1ZmZlclZpZXc6IEJ1ZmZlclZpZXc7XG4gIC8qKiBUaGUgY2FwYWNpdHkgb2YgdGhlIGNodW5rIGluIGJ5dGVzICovXG4gIGJ5dGVDYXBhY2l0eTogQnl0ZTtcbiAgLyoqIFRoZSBsb2NhdGlvbiBvZiB0aGUgY2h1bmsgaW4gdGhlIEdQVSBkYXRhIChpbmRleCBvZiAxNiBieXRlcykgKi9cbiAgbG9jYXRpb246IEluZGV4T2YxNkJ5dGVzO1xufTtcblxuLyoqXG4gKiBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSBtYW5hZ2VzIG1lbW9yeS1yZWxhdGVkIGRhdGEgZm9yIGNvbXBvbmVudHMgcGVyIEVuZ2luZSBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGNvbnNvbGlkYXRlcyB3aGF0IHdlcmUgcHJldmlvdXNseSBzdGF0aWMgTWFwcyBpbiB0aGUgQ29tcG9uZW50IGNsYXNzLFxuICogcmVkdWNpbmcgbmVzdGluZyBkZXB0aCBhbmQgbWFraW5nIHRoZSBjb2RlIG1vcmUgbWFpbnRhaW5hYmxlLlxuICpcbiAqIEByZW1hcmtzXG4gKiBQcmV2aW91c2x5LCBDb21wb25lbnQgaGFkIGRlZXBseSBuZXN0ZWQgc3RhdGljIE1hcHMgbGlrZTpcbiAqIGBNYXA8RW5naW5lT2JqZWN0VUlELCBNYXA8dHlwZW9mIENvbXBvbmVudCwgTWFwPE1lbWJlck5hbWUsIE1hcDxJbmRleE9mVGhlQnVmZmVyVmlldywgQWNjZXNzb3I+Pj4+YFxuICpcbiAqIFRoaXMgY2xhc3MgZmxhdHRlbnMgdGhlIHN0cnVjdHVyZSBieTpcbiAqIDEuIEJlaW5nIG93bmVkIGJ5IEVuZ2luZSAocmVtb3ZpbmcgdGhlIEVuZ2luZU9iamVjdFVJRCBsYXllcilcbiAqIDIuIFVzaW5nIGNvbXBvc2l0ZSBzdHJpbmcga2V5cyAocmVkdWNpbmcgTWFwIG5lc3RpbmcgZnJvbSAzIGxldmVscyB0byAxKVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50TWVtb3J5UmVnaXN0cnkge1xuICAvKipcbiAgICogU3RvcmVzIGFjY2Vzc29ycyB1c2luZyBjb21wb3NpdGUga2V5cy5cbiAgICogS2V5IGZvcm1hdDogXCJDb21wb25lbnRUSUQ6TWVtYmVyTmFtZTpJbmRleE9mQnVmZmVyVmlld1wiXG4gICAqL1xuICBwcml2YXRlIF9fYWNjZXNzb3JzOiBNYXA8QWNjZXNzb3JLZXksIEFjY2Vzc29yPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogVHJhY2tzIHdoaWNoIGFjY2Vzc29yIGtleXMgZXhpc3QgZm9yIGVhY2ggY29tcG9uZW50IGNsYXNzIGFuZCBtZW1iZXIgbmFtZS5cbiAgICogVGhpcyBlbmFibGVzIGVmZmljaWVudCBpdGVyYXRpb24gb3ZlciBhbGwgYnVmZmVyIHZpZXcgaW5kaWNlcyBmb3IgYSBnaXZlbiBtZW1iZXIuXG4gICAqL1xuICBwcml2YXRlIF9fYWNjZXNzb3JLZXlzQnlNZW1iZXI6IE1hcDx0eXBlb2YgQ29tcG9uZW50LCBNYXA8TWVtYmVyTmFtZSwgU2V0PEluZGV4T2ZUaGVCdWZmZXJWaWV3Pj4+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIG51bWJlciBvZiBjb21wb25lbnRzIHBlciBidWZmZXIgdmlldyBmb3IgZWFjaCBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBwcml2YXRlIF9fY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3OiBNYXA8dHlwZW9mIENvbXBvbmVudCwgQ291bnQ+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgYnl0ZSBvZmZzZXRzIHVzaW5nIGNvbXBvc2l0ZSBrZXlzLlxuICAgKiBLZXkgZm9ybWF0OiBcIkNvbXBvbmVudFRJRDpNZW1iZXJOYW1lOkluZGV4T2ZCdWZmZXJWaWV3XCJcbiAgICovXG4gIHByaXZhdGUgX19ieXRlT2Zmc2V0T2ZBY2Nlc3NvckluQnVmZmVyOiBNYXA8Qnl0ZU9mZnNldEtleSwgQnl0ZT4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIFRyYWNrcyB3aGljaCBieXRlIG9mZnNldCBrZXlzIGV4aXN0IGZvciBlYWNoIGNvbXBvbmVudCBjbGFzcyBhbmQgbWVtYmVyIG5hbWUuXG4gICAqL1xuICBwcml2YXRlIF9fYnl0ZU9mZnNldEtleXNCeU1lbWJlcjogTWFwPHR5cGVvZiBDb21wb25lbnQsIE1hcDxNZW1iZXJOYW1lLCBTZXQ8SW5kZXhPZlRoZUJ1ZmZlclZpZXc+Pj4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIENodW5rcyBvZiB2YXJpYWJsZS1sZW5ndGggYXJyYXkgbWVtYmVycywgcGVyIGNvbXBvbmVudCBTSUQuXG4gICAqIEtleSBmb3JtYXQ6IFwiQ29tcG9uZW50VElEOk1lbWJlck5hbWU6Q29tcG9uZW50U0lEXCJcbiAgICovXG4gIHByaXZhdGUgX192YXJpYWJsZUxlbmd0aENodW5rczogTWFwPHN0cmluZywgVmFyaWFibGVMZW5ndGhDaHVuaz4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIENodW5rcyBvZiB2YXJpYWJsZS1sZW5ndGggYXJyYXkgbWVtYmVycyB3aGljaCBhcmUgbm8gbG9uZ2VyIHVzZWQsIHBlciBtZW1iZXIuXG4gICAqIEtleSBmb3JtYXQ6IFwiQ29tcG9uZW50VElEOk1lbWJlck5hbWVcIlxuICAgKi9cbiAgcHJpdmF0ZSBfX2ZyZWVWYXJpYWJsZUxlbmd0aENodW5rczogTWFwPHN0cmluZywgVmFyaWFibGVMZW5ndGhDaHVua1tdPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogVGhlIHN0YXRlIHZlcnNpb24sIGluY3JlbWVudGVkIHdoZW4gY29tcG9uZW50IG1lbW9yeSBsYXlvdXQgY2hhbmdlcy5cbiAgICovXG4gIHByaXZhdGUgX19zdGF0ZVZlcnNpb24gPSAwO1xuXG4gIC8vID09PT09PT09PT09PT09PT09PT09IEFjY2Vzc29yIE1ldGhvZHMgPT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogR2V0cyBhbiBhY2Nlc3NvciBmb3IgYSBzcGVjaWZpYyBjb21wb25lbnQgbWVtYmVyIGFuZCBidWZmZXIgdmlldyBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzc1xuICAgKiBAcGFyYW0gbWVtYmVyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtZW1iZXIgZmllbGRcbiAgICogQHBhcmFtIGluZGV4T2ZCdWZmZXJWaWV3IC0gVGhlIGJ1ZmZlciB2aWV3IGluZGV4XG4gICAqIEByZXR1cm5zIFRoZSBhY2Nlc3NvciBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBnZXRBY2Nlc3NvcihcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lLFxuICAgIGluZGV4T2ZCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlld1xuICApOiBBY2Nlc3NvciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qga2V5ID0gY3JlYXRlQWNjZXNzb3JLZXkoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGluZGV4T2ZCdWZmZXJWaWV3KTtcbiAgICByZXR1cm4gdGhpcy5fX2FjY2Vzc29ycy5nZXQoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFuIGFjY2Vzc29yIGZvciBhIHNwZWNpZmljIGNvbXBvbmVudCBtZW1iZXIgYW5kIGJ1ZmZlciB2aWV3IGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzXG4gICAqIEBwYXJhbSBtZW1iZXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1lbWJlciBmaWVsZFxuICAgKiBAcGFyYW0gaW5kZXhPZkJ1ZmZlclZpZXcgLSBUaGUgYnVmZmVyIHZpZXcgaW5kZXhcbiAgICogQHBhcmFtIGFjY2Vzc29yIC0gVGhlIGFjY2Vzc29yIHRvIHN0b3JlXG4gICAqL1xuICBzZXRBY2Nlc3NvcihcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lLFxuICAgIGluZGV4T2ZCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlldyxcbiAgICBhY2Nlc3NvcjogQWNjZXNzb3JcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gY3JlYXRlQWNjZXNzb3JLZXkoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGluZGV4T2ZCdWZmZXJWaWV3KTtcbiAgICB0aGlzLl9fYWNjZXNzb3JzLnNldChrZXksIGFjY2Vzc29yKTtcblxuICAgIC8vIFRyYWNrIHRoZSBrZXkgZm9yIGl0ZXJhdGlvblxuICAgIGlmICghdGhpcy5fX2FjY2Vzc29yS2V5c0J5TWVtYmVyLmhhcyhjb21wb25lbnRDbGFzcykpIHtcbiAgICAgIHRoaXMuX19hY2Nlc3NvcktleXNCeU1lbWJlci5zZXQoY29tcG9uZW50Q2xhc3MsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IG1lbWJlck1hcCA9IHRoaXMuX19hY2Nlc3NvcktleXNCeU1lbWJlci5nZXQoY29tcG9uZW50Q2xhc3MpITtcbiAgICBpZiAoIW1lbWJlck1hcC5oYXMobWVtYmVyTmFtZSkpIHtcbiAgICAgIG1lbWJlck1hcC5zZXQobWVtYmVyTmFtZSwgbmV3IFNldCgpKTtcbiAgICB9XG4gICAgbWVtYmVyTWFwLmdldChtZW1iZXJOYW1lKSEuYWRkKGluZGV4T2ZCdWZmZXJWaWV3KTtcblxuICAgIHRoaXMuX19zdGF0ZVZlcnNpb24rKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFsbCBhY2Nlc3NvcnMgZm9yIGEgc3BlY2lmaWMgY29tcG9uZW50IG1lbWJlciBhY3Jvc3MgYWxsIGJ1ZmZlciB2aWV3IGluZGljZXMuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEByZXR1cm5zIEEgTWFwIG9mIGJ1ZmZlciB2aWV3IGluZGljZXMgdG8gYWNjZXNzb3JzXG4gICAqL1xuICBnZXRBY2Nlc3NvcnNGb3JNZW1iZXIoY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsIG1lbWJlck5hbWU6IE1lbWJlck5hbWUpOiBNYXA8SW5kZXhPZlRoZUJ1ZmZlclZpZXcsIEFjY2Vzc29yPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxJbmRleE9mVGhlQnVmZmVyVmlldywgQWNjZXNzb3I+KCk7XG4gICAgY29uc3QgbWVtYmVyTWFwID0gdGhpcy5fX2FjY2Vzc29yS2V5c0J5TWVtYmVyLmdldChjb21wb25lbnRDbGFzcyk7XG4gICAgaWYgKG1lbWJlck1hcCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBjb25zdCBpbmRpY2VzID0gbWVtYmVyTWFwLmdldChtZW1iZXJOYW1lKTtcbiAgICBpZiAoaW5kaWNlcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGluZGV4IG9mIGluZGljZXMpIHtcbiAgICAgIGNvbnN0IGFjY2Vzc29yID0gdGhpcy5nZXRBY2Nlc3Nvcihjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgaW5kZXgpO1xuICAgICAgaWYgKGFjY2Vzc29yICE9IG51bGwpIHtcbiAgICAgICAgcmVzdWx0LnNldChpbmRleCwgYWNjZXNzb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhY2Nlc3NvcnMgZXhpc3QgZm9yIGEgc3BlY2lmaWMgY29tcG9uZW50IGNsYXNzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYWNjZXNzb3JzIGV4aXN0IGZvciB0aGUgY29tcG9uZW50IGNsYXNzXG4gICAqL1xuICBoYXNBY2Nlc3NvcnNGb3JDb21wb25lbnQoY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2FjY2Vzc29yS2V5c0J5TWVtYmVyLmhhcyhjb21wb25lbnRDbGFzcyk7XG4gIH1cblxuICAvKipcbiAgICogRW5zdXJlcyBhY2Nlc3NvciB0cmFja2luZyBtYXBzIGFyZSBpbml0aWFsaXplZCBmb3IgYSBjb21wb25lbnQgY2xhc3MuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICovXG4gIGVuc3VyZUFjY2Vzc29yTWFwc0ZvckNvbXBvbmVudChjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fX2FjY2Vzc29yS2V5c0J5TWVtYmVyLmhhcyhjb21wb25lbnRDbGFzcykpIHtcbiAgICAgIHRoaXMuX19hY2Nlc3NvcktleXNCeU1lbWJlci5zZXQoY29tcG9uZW50Q2xhc3MsIG5ldyBNYXAoKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT0gQ29tcG9uZW50IENvdW50IE1ldGhvZHMgPT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGJ1ZmZlciB2aWV3IGZvciBhIGNvbXBvbmVudCBjbGFzcy5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzc1xuICAgKiBAcmV0dXJucyBUaGUgY291bnQgb3IgdW5kZWZpbmVkIGlmIG5vdCBzZXRcbiAgICovXG4gIGdldENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyhjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCk6IENvdW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldy5nZXQoY29tcG9uZW50Q2xhc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG51bWJlciBvZiBjb21wb25lbnRzIHBlciBidWZmZXIgdmlldyBmb3IgYSBjb21wb25lbnQgY2xhc3MuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIGNvdW50IC0gVGhlIG51bWJlciBvZiBjb21wb25lbnRzIHBlciBidWZmZXIgdmlld1xuICAgKi9cbiAgc2V0Q29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LCBjb3VudDogQ291bnQpOiB2b2lkIHtcbiAgICB0aGlzLl9fY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LnNldChjb21wb25lbnRDbGFzcywgY291bnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIGNvbXBvbmVudCBjb3VudCBwZXIgYnVmZmVyIHZpZXcgZW50cmllcy5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBjb21wb25lbnQgY291bnQgbWFwXG4gICAqL1xuICBnZXRBbGxDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcoKTogTWFwPHR5cGVvZiBDb21wb25lbnQsIENvdW50PiB7XG4gICAgcmV0dXJuIG5ldyBNYXAodGhpcy5fX2NvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyk7XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PSBCeXRlIE9mZnNldCBNZXRob2RzID09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJ5dGUgb2Zmc2V0IGZvciBhIHNwZWNpZmljIGNvbXBvbmVudCBtZW1iZXIgYW5kIGJ1ZmZlciB2aWV3IGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzXG4gICAqIEBwYXJhbSBtZW1iZXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1lbWJlciBmaWVsZFxuICAgKiBAcGFyYW0gaW5kZXhPZkJ1ZmZlclZpZXcgLSBUaGUgYnVmZmVyIHZpZXcgaW5kZXhcbiAgICogQHJldHVybnMgVGhlIGJ5dGUgb2Zmc2V0IG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmRcbiAgICovXG4gIGdldEJ5dGVPZmZzZXQoXG4gICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgbWVtYmVyTmFtZTogTWVtYmVyTmFtZSxcbiAgICBpbmRleE9mQnVmZmVyVmlldzogSW5kZXhPZlRoZUJ1ZmZlclZpZXdcbiAgKTogQnl0ZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qga2V5ID0gY3JlYXRlQWNjZXNzb3JLZXkoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGluZGV4T2ZCdWZmZXJWaWV3KTtcbiAgICByZXR1cm4gdGhpcy5fX2J5dGVPZmZzZXRPZkFjY2Vzc29ySW5CdWZmZXIuZ2V0KGtleSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYnl0ZSBvZmZzZXQgZm9yIGEgc3BlY2lmaWMgY29tcG9uZW50IG1lbWJlciBhbmQgYnVmZmVyIHZpZXcgaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEBwYXJhbSBpbmRleE9mQnVmZmVyVmlldyAtIFRoZSBidWZmZXIgdmlldyBpbmRleFxuICAgKiBAcGFyYW0gYnl0ZU9mZnNldCAtIFRoZSBieXRlIG9mZnNldCB0byBzdG9yZVxuICAgKi9cbiAgc2V0Qnl0ZU9mZnNldChcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lLFxuICAgIGluZGV4T2ZCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlldyxcbiAgICBieXRlT2Zmc2V0OiBCeXRlXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGtleSA9IGNyZWF0ZUFjY2Vzc29yS2V5KGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBpbmRleE9mQnVmZmVyVmlldyk7XG4gICAgdGhpcy5fX2J5dGVPZmZzZXRPZkFjY2Vzc29ySW5CdWZmZXIuc2V0KGtleSwgYnl0ZU9mZnNldCk7XG5cbiAgICAvLyBUcmFjayB0aGUga2V5IGZvciBpdGVyYXRpb25cbiAgICBpZiAoIXRoaXMuX19ieXRlT2Zmc2V0S2V5c0J5TWVtYmVyLmhhcyhjb21wb25lbnRDbGFzcykpIHtcbiAgICAgIHRoaXMuX19ieXRlT2Zmc2V0S2V5c0J5TWVtYmVyLnNldChjb21wb25lbnRDbGFzcywgbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgY29uc3QgbWVtYmVyTWFwID0gdGhpcy5fX2J5dGVPZmZzZXRLZXlzQnlNZW1iZXIuZ2V0KGNvbXBvbmVudENsYXNzKSE7XG4gICAgaWYgKCFtZW1iZXJNYXAuaGFzKG1lbWJlck5hbWUpKSB7XG4gICAgICBtZW1iZXJNYXAuc2V0KG1lbWJlck5hbWUsIG5ldyBTZXQoKSk7XG4gICAgfVxuICAgIG1lbWJlck1hcC5nZXQobWVtYmVyTmFtZSkhLmFkZChpbmRleE9mQnVmZmVyVmlldyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgYnl0ZSBvZmZzZXRzIGZvciBhIHNwZWNpZmljIGNvbXBvbmVudCBtZW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEByZXR1cm5zIEEgTWFwIG9mIGJ1ZmZlciB2aWV3IGluZGljZXMgdG8gYnl0ZSBvZmZzZXRzXG4gICAqL1xuICBnZXRCeXRlT2Zmc2V0c0Zvck1lbWJlcihcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lXG4gICk6IE1hcDxJbmRleE9mVGhlQnVmZmVyVmlldywgQnl0ZT4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBNYXA8SW5kZXhPZlRoZUJ1ZmZlclZpZXcsIEJ5dGU+KCk7XG4gICAgY29uc3QgbWVtYmVyTWFwID0gdGhpcy5fX2J5dGVPZmZzZXRLZXlzQnlNZW1iZXIuZ2V0KGNvbXBvbmVudENsYXNzKTtcbiAgICBpZiAobWVtYmVyTWFwID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGluZGljZXMgPSBtZW1iZXJNYXAuZ2V0KG1lbWJlck5hbWUpO1xuICAgIGlmIChpbmRpY2VzID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaW5kZXggb2YgaW5kaWNlcykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5nZXRCeXRlT2Zmc2V0KGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBpbmRleCk7XG4gICAgICBpZiAob2Zmc2V0ICE9IG51bGwpIHtcbiAgICAgICAgcmVzdWx0LnNldChpbmRleCwgb2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYnl0ZSBvZmZzZXQgZGF0YSBleGlzdHMgZm9yIGEgc3BlY2lmaWMgY29tcG9uZW50IGNsYXNzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYnl0ZSBvZmZzZXQgZGF0YSBleGlzdHNcbiAgICovXG4gIGhhc0J5dGVPZmZzZXRzRm9yQ29tcG9uZW50KGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19ieXRlT2Zmc2V0S2V5c0J5TWVtYmVyLmhhcyhjb21wb25lbnRDbGFzcyk7XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PSBWYXJpYWJsZS1MZW5ndGggQ2h1bmsgTWV0aG9kcyA9PT09PT09PT09PT09PT09PT09PVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjaHVuayBvZiBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXIgb2YgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcGFyYW0gY29tcG9uZW50U0lEIC0gVGhlIGNvbXBvbmVudCBTSURcbiAgICogQHJldHVybnMgVGhlIGNodW5rIG9yIHVuZGVmaW5lZCBpZiBub3QgYWxsb2NhdGVkIHlldFxuICAgKi9cbiAgZ2V0VmFyaWFibGVMZW5ndGhDaHVuayhcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lLFxuICAgIGNvbXBvbmVudFNJRDogQ29tcG9uZW50U0lEXG4gICk6IFZhcmlhYmxlTGVuZ3RoQ2h1bmsgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fdmFyaWFibGVMZW5ndGhDaHVua3MuZ2V0KGAke2NvbXBvbmVudENsYXNzLmNvbXBvbmVudFRJRH06JHttZW1iZXJOYW1lfToke2NvbXBvbmVudFNJRH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjaHVuayBvZiBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXIgb2YgYSBjb21wb25lbnQuXG4gICAqIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGNoYW5nZSB0aGUgc3RhdGUgdmVyc2lvbiwgc2luY2Ugc2hhZGVycyByZWFkIHRoZSBsb2NhdGlvbnMgb2YgY2h1bmtzIGF0IHJ1bnRpbWUuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcGFyYW0gY29tcG9uZW50U0lEIC0gVGhlIGNvbXBvbmVudCBTSURcbiAgICogQHBhcmFtIGNodW5rIC0gVGhlIGNodW5rIHRvIHNldFxuICAgKi9cbiAgc2V0VmFyaWFibGVMZW5ndGhDaHVuayhcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCxcbiAgICBtZW1iZXJOYW1lOiBNZW1iZXJOYW1lLFxuICAgIGNvbXBvbmVudFNJRDogQ29tcG9uZW50U0lELFxuICAgIGNodW5rOiBWYXJpYWJsZUxlbmd0aENodW5rXG4gICk6IHZvaWQge1xuICAgIHRoaXMuX192YXJpYWJsZUxlbmd0aENodW5rcy5zZXQoYCR7Y29tcG9uZW50Q2xhc3MuY29tcG9uZW50VElEfToke21lbWJlck5hbWV9OiR7Y29tcG9uZW50U0lEfWAsIGNodW5rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdXRzIGEgY2h1bmsgd2hpY2ggaXMgbm8gbG9uZ2VyIHVzZWQgaW50byB0aGUgZnJlZSBsaXN0IHNvIHRoYXQgaXQgY2FuIGJlIHJldXNlZC5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzc1xuICAgKiBAcGFyYW0gbWVtYmVyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZS1sZW5ndGggYXJyYXkgbWVtYmVyXG4gICAqIEBwYXJhbSBjaHVuayAtIFRoZSBjaHVuayB0byByZWxlYXNlXG4gICAqL1xuICByZWxlYXNlVmFyaWFibGVMZW5ndGhDaHVuayhjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCwgbWVtYmVyTmFtZTogTWVtYmVyTmFtZSwgY2h1bms6IFZhcmlhYmxlTGVuZ3RoQ2h1bmspIHtcbiAgICBjb25zdCBrZXkgPSBgJHtjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUR9OiR7bWVtYmVyTmFtZX1gO1xuICAgIGxldCBmcmVlQ2h1bmtzID0gdGhpcy5fX2ZyZWVWYXJpYWJsZUxlbmd0aENodW5rcy5nZXQoa2V5KTtcbiAgICBpZiAoZnJlZUNodW5rcyA9PSBudWxsKSB7XG4gICAgICBmcmVlQ2h1bmtzID0gW107XG4gICAgICB0aGlzLl9fZnJlZVZhcmlhYmxlTGVuZ3RoQ2h1bmtzLnNldChrZXksIGZyZWVDaHVua3MpO1xuICAgIH1cbiAgICBmcmVlQ2h1bmtzLnB1c2goY2h1bmspO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBzbWFsbGVzdCBmcmVlIGNodW5rIHdoaWNoIGhhcyBlbm91Z2ggY2FwYWNpdHkuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3NcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcGFyYW0gYnl0ZUxlbmd0aCAtIFRoZSByZXF1aXJlZCBieXRlIGxlbmd0aFxuICAgKiBAcmV0dXJucyBUaGUgY2h1bmssIG9yIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyBzdWl0YWJsZSBmcmVlIGNodW5rXG4gICAqL1xuICB0YWtlRnJlZVZhcmlhYmxlTGVuZ3RoQ2h1bmsoXG4gICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgbWVtYmVyTmFtZTogTWVtYmVyTmFtZSxcbiAgICBieXRlTGVuZ3RoOiBCeXRlXG4gICk6IFZhcmlhYmxlTGVuZ3RoQ2h1bmsgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGZyZWVDaHVua3MgPSB0aGlzLl9fZnJlZVZhcmlhYmxlTGVuZ3RoQ2h1bmtzLmdldChgJHtjb21wb25lbnRDbGFzcy5jb21wb25lbnRUSUR9OiR7bWVtYmVyTmFtZX1gKTtcbiAgICBpZiAoZnJlZUNodW5rcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgYmVzdEluZGV4ID0gLTE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmVlQ2h1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjYXBhY2l0eSA9IGZyZWVDaHVua3NbaV0uYnl0ZUNhcGFjaXR5O1xuICAgICAgaWYgKGNhcGFjaXR5ID49IGJ5dGVMZW5ndGggJiYgKGJlc3RJbmRleCA9PT0gLTEgfHwgY2FwYWNpdHkgPCBmcmVlQ2h1bmtzW2Jlc3RJbmRleF0uYnl0ZUNhcGFjaXR5KSkge1xuICAgICAgICBiZXN0SW5kZXggPSBpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmVzdEluZGV4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGZyZWVDaHVua3Muc3BsaWNlKGJlc3RJbmRleCwgMSlbMF07XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PSBTdGF0ZSBWZXJzaW9uID09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgc3RhdGUgdmVyc2lvbi5cbiAgICogVGhpcyBpcyBpbmNyZW1lbnRlZCB3aGVuZXZlciB0aGUgbWVtb3J5IGxheW91dCBjaGFuZ2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0ZSB2ZXJzaW9uXG4gICAqL1xuICBnZXRTdGF0ZVZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3N0YXRlVmVyc2lvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmNyZW1lbnRzIGFuZCByZXR1cm5zIHRoZSBuZXcgc3RhdGUgdmVyc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBzdGF0ZSB2ZXJzaW9uXG4gICAqL1xuICBpbmNyZW1lbnRTdGF0ZVZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKyt0aGlzLl9fc3RhdGVWZXJzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgc3RvcmVkIGRhdGEgYW5kIHJlc2V0cyB0aGUgcmVnaXN0cnkgdG8gaXRzIGluaXRpYWwgc3RhdGUuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgd2hlbiB0aGUgZW5naW5lIGlzIGJlaW5nIGRlc3Ryb3llZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fX2FjY2Vzc29ycy5jbGVhcigpO1xuICAgIHRoaXMuX19hY2Nlc3NvcktleXNCeU1lbWJlci5jbGVhcigpO1xuICAgIHRoaXMuX19jb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcuY2xlYXIoKTtcbiAgICB0aGlzLl9fYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlci5jbGVhcigpO1xuICAgIHRoaXMuX19ieXRlT2Zmc2V0S2V5c0J5TWVtYmVyLmNsZWFyKCk7XG4gICAgdGhpcy5fX3ZhcmlhYmxlTGVuZ3RoQ2h1bmtzLmNsZWFyKCk7XG4gICAgdGhpcy5fX2ZyZWVWYXJpYWJsZUxlbmd0aENodW5rcy5jbGVhcigpO1xuICAgIHRoaXMuX19zdGF0ZVZlcnNpb24gPSAwO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBa0JBLFNBQVMsa0JBQ1AsZ0JBQ0EsWUFDQSxtQkFDYTtBQUNiLFNBQU8sR0FBRyxlQUFlLFlBQVksSUFBSSxVQUFVLElBQUksaUJBQWlCO0FBQzFFO0FBNEJPLElBQU0sMEJBQU4sTUFBOEI7QUFBQSxFQUE5QjtBQUtMO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBUUEsS0FBMEMsb0JBQUksSUFBSTtBQU0xRDtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVFDLEtBQTRGLG9CQUFJLElBQUk7QUFLNUc7QUFBQTtBQUFBO0FBQUEsU0FBUUMsS0FBOEQsb0JBQUksSUFBSTtBQU05RTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVFDLEtBQTJELG9CQUFJLElBQUk7QUFLM0U7QUFBQTtBQUFBO0FBQUEsU0FBUUMsS0FBOEYsb0JBQUksSUFBSTtBQU05RztBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQVFDLEtBQTJELG9CQUFJLElBQUk7QUFNM0U7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFRQyxLQUFpRSxvQkFBSSxJQUFJO0FBS2pGO0FBQUE7QUFBQTtBQUFBLFNBQVFDLEtBQWlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVl6QixZQUNFLGdCQUNBLFlBQ0EsbUJBQ3NCO0FBQ3RCLFVBQU0sTUFBTSxrQkFBa0IsZ0JBQWdCLFlBQVksaUJBQWlCO0FBQzNFLFdBQU8sS0FBS1AsR0FBWSxJQUFJLEdBQUc7QUFBQSxFQUNqQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLFlBQ0UsZ0JBQ0EsWUFDQSxtQkFDQSxVQUNNO0FBQ04sVUFBTSxNQUFNLGtCQUFrQixnQkFBZ0IsWUFBWSxpQkFBaUI7QUFDM0UsU0FBS0EsR0FBWSxJQUFJLEtBQUssUUFBUTtBQUdsQyxRQUFJLENBQUMsS0FBS0MsR0FBdUIsSUFBSSxjQUFjLEdBQUc7QUFDcEQsV0FBS0EsR0FBdUIsSUFBSSxnQkFBZ0Isb0JBQUksSUFBSSxDQUFDO0FBQUEsSUFDM0Q7QUFDQSxVQUFNLFlBQVksS0FBS0EsR0FBdUIsSUFBSSxjQUFjO0FBQ2hFLFFBQUksQ0FBQyxVQUFVLElBQUksVUFBVSxHQUFHO0FBQzlCLGdCQUFVLElBQUksWUFBWSxvQkFBSSxJQUFJLENBQUM7QUFBQSxJQUNyQztBQUNBLGNBQVUsSUFBSSxVQUFVLEVBQUcsSUFBSSxpQkFBaUI7QUFFaEQsU0FBS007QUFBQSxFQUNQO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLHNCQUFzQixnQkFBa0MsWUFBNkQ7QUFDbkgsVUFBTSxTQUFTLG9CQUFJLElBQW9DO0FBQ3ZELFVBQU0sWUFBWSxLQUFLTixHQUF1QixJQUFJLGNBQWM7QUFDaEUsUUFBSSxhQUFhLE1BQU07QUFDckIsYUFBTztBQUFBLElBQ1Q7QUFDQSxVQUFNLFVBQVUsVUFBVSxJQUFJLFVBQVU7QUFDeEMsUUFBSSxXQUFXLE1BQU07QUFDbkIsYUFBTztBQUFBLElBQ1Q7QUFDQSxlQUFXLFNBQVMsU0FBUztBQUMzQixZQUFNLFdBQVcsS0FBSyxZQUFZLGdCQUFnQixZQUFZLEtBQUs7QUFDbkUsVUFBSSxZQUFZLE1BQU07QUFDcEIsZUFBTyxJQUFJLE9BQU8sUUFBUTtBQUFBLE1BQzVCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSx5QkFBeUIsZ0JBQTJDO0FBQ2xFLFdBQU8sS0FBS0EsR0FBdUIsSUFBSSxjQUFjO0FBQUEsRUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSwrQkFBK0IsZ0JBQXdDO0FBQ3JFLFFBQUksQ0FBQyxLQUFLQSxHQUF1QixJQUFJLGNBQWMsR0FBRztBQUNwRCxXQUFLQSxHQUF1QixJQUFJLGdCQUFnQixvQkFBSSxJQUFJLENBQUM7QUFBQSxJQUMzRDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsK0JBQStCLGdCQUFxRDtBQUNsRixXQUFPLEtBQUtDLEdBQThCLElBQUksY0FBYztBQUFBLEVBQzlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSwrQkFBK0IsZ0JBQWtDLE9BQW9CO0FBQ25GLFNBQUtBLEdBQThCLElBQUksZ0JBQWdCLEtBQUs7QUFBQSxFQUM5RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLG9DQUFrRTtBQUNoRSxXQUFPLElBQUksSUFBSSxLQUFLQSxFQUE2QjtBQUFBLEVBQ25EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZQSxjQUNFLGdCQUNBLFlBQ0EsbUJBQ2tCO0FBQ2xCLFVBQU0sTUFBTSxrQkFBa0IsZ0JBQWdCLFlBQVksaUJBQWlCO0FBQzNFLFdBQU8sS0FBS0MsR0FBK0IsSUFBSSxHQUFHO0FBQUEsRUFDcEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxjQUNFLGdCQUNBLFlBQ0EsbUJBQ0EsWUFDTTtBQUNOLFVBQU0sTUFBTSxrQkFBa0IsZ0JBQWdCLFlBQVksaUJBQWlCO0FBQzNFLFNBQUtBLEdBQStCLElBQUksS0FBSyxVQUFVO0FBR3ZELFFBQUksQ0FBQyxLQUFLQyxHQUF5QixJQUFJLGNBQWMsR0FBRztBQUN0RCxXQUFLQSxHQUF5QixJQUFJLGdCQUFnQixvQkFBSSxJQUFJLENBQUM7QUFBQSxJQUM3RDtBQUNBLFVBQU0sWUFBWSxLQUFLQSxHQUF5QixJQUFJLGNBQWM7QUFDbEUsUUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLEdBQUc7QUFDOUIsZ0JBQVUsSUFBSSxZQUFZLG9CQUFJLElBQUksQ0FBQztBQUFBLElBQ3JDO0FBQ0EsY0FBVSxJQUFJLFVBQVUsRUFBRyxJQUFJLGlCQUFpQjtBQUFBLEVBQ2xEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLHdCQUNFLGdCQUNBLFlBQzZDO0FBQzdDLFVBQU0sU0FBUyxvQkFBSSxJQUFnQztBQUNuRCxVQUFNLFlBQVksS0FBS0EsR0FBeUIsSUFBSSxjQUFjO0FBQ2xFLFFBQUksYUFBYSxNQUFNO0FBQ3JCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxVQUFVLFVBQVUsSUFBSSxVQUFVO0FBQ3hDLFFBQUksV0FBVyxNQUFNO0FBQ25CLGFBQU87QUFBQSxJQUNUO0FBQ0EsZUFBVyxTQUFTLFNBQVM7QUFDM0IsWUFBTSxTQUFTLEtBQUssY0FBYyxnQkFBZ0IsWUFBWSxLQUFLO0FBQ25FLFVBQUksVUFBVSxNQUFNO0FBQ2xCLGVBQU8sSUFBSSxPQUFPLE1BQU07QUFBQSxNQUMxQjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsMkJBQTJCLGdCQUEyQztBQUNwRSxXQUFPLEtBQUtBLEdBQXlCLElBQUksY0FBYztBQUFBLEVBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZQSx1QkFDRSxnQkFDQSxZQUNBLGNBQ2lDO0FBQ2pDLFdBQU8sS0FBS0MsR0FBdUIsSUFBSSxHQUFHLGVBQWUsWUFBWSxJQUFJLFVBQVUsSUFBSSxZQUFZLEVBQUU7QUFBQSxFQUN2RztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsdUJBQ0UsZ0JBQ0EsWUFDQSxjQUNBLE9BQ007QUFDTixTQUFLQSxHQUF1QixJQUFJLEdBQUcsZUFBZSxZQUFZLElBQUksVUFBVSxJQUFJLFlBQVksSUFBSSxLQUFLO0FBQUEsRUFDdkc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsMkJBQTJCLGdCQUFrQyxZQUF3QixPQUE0QjtBQUMvRyxVQUFNLE1BQU0sR0FBRyxlQUFlLFlBQVksSUFBSSxVQUFVO0FBQ3hELFFBQUksYUFBYSxLQUFLQyxHQUEyQixJQUFJLEdBQUc7QUFDeEQsUUFBSSxjQUFjLE1BQU07QUFDdEIsbUJBQWEsQ0FBQztBQUNkLFdBQUtBLEdBQTJCLElBQUksS0FBSyxVQUFVO0FBQUEsSUFDckQ7QUFDQSxlQUFXLEtBQUssS0FBSztBQUFBLEVBQ3ZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsNEJBQ0UsZ0JBQ0EsWUFDQSxZQUNpQztBQUNqQyxVQUFNLGFBQWEsS0FBS0EsR0FBMkIsSUFBSSxHQUFHLGVBQWUsWUFBWSxJQUFJLFVBQVUsRUFBRTtBQUNyRyxRQUFJLGNBQWMsTUFBTTtBQUN0QixhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksWUFBWTtBQUNoQixhQUFTLElBQUksR0FBRyxJQUFJLFdBQVcsUUFBUSxLQUFLO0FBQzFDLFlBQU0sV0FBVyxXQUFXLENBQUMsRUFBRTtBQUMvQixVQUFJLFlBQVksZUFBZSxjQUFjLE1BQU0sV0FBVyxXQUFXLFNBQVMsRUFBRSxlQUFlO0FBQ2pHLG9CQUFZO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFDQSxRQUFJLGNBQWMsSUFBSTtBQUNwQixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU8sV0FBVyxPQUFPLFdBQVcsQ0FBQyxFQUFFLENBQUM7QUFBQSxFQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxrQkFBMEI7QUFDeEIsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx3QkFBZ0M7QUFDOUIsV0FBTyxFQUFFLEtBQUtBO0FBQUEsRUFDaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsVUFBZ0I7QUFDZCxTQUFLUCxHQUFZLE1BQU07QUFDdkIsU0FBS0MsR0FBdUIsTUFBTTtBQUNsQyxTQUFLQyxHQUE4QixNQUFNO0FBQ3pDLFNBQUtDLEdBQStCLE1BQU07QUFDMUMsU0FBS0MsR0FBeUIsTUFBTTtBQUNwQyxTQUFLQyxHQUF1QixNQUFNO0FBQ2xDLFNBQUtDLEdBQTJCLE1BQU07QUFDdEMsU0FBS0MsS0FBaUI7QUFBQSxFQUN4QjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2FjY2Vzc29ycyIsICJfX2FjY2Vzc29yS2V5c0J5TWVtYmVyIiwgIl9fY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3IiwgIl9fYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlciIsICJfX2J5dGVPZmZzZXRLZXlzQnlNZW1iZXIiLCAiX192YXJpYWJsZUxlbmd0aENodW5rcyIsICJfX2ZyZWVWYXJpYWJsZUxlbmd0aENodW5rcyIsICJfX3N0YXRlVmVyc2lvbiJdCn0K
