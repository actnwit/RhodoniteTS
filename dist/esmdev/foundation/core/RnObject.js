// src/foundation/core/RnObject.ts
import { deepCopyUsingJsonStringify } from "../misc/MiscUtil.js";
var _RnObject = class _RnObject {
  // Tag string allows alphabet, digit and underscore (_) only
  /**
   * Creates a new RnObject instance with auto-generated unique name and UID
   */
  constructor() {
    /// members
    /** Unique identifier for this object instance */
    this.fj = _RnObject.currentMaxObjectCount++;
    /** Collection of tags associated with this object */
    this._tags = {};
    // Tag string allows alphabet, digit and underscore (_) only
    /** Combined string representation of all tags for efficient searching */
    this.ij = "";
    this.ej = `${this.constructor.name}__uid_${this.fj}`;
    this.kj(this.ej);
  }
  /**
   * Updates the internal object tracking information
   * @param uniqueName - The unique name to register for this object
   * @private
   */
  kj(uniqueName) {
    _RnObject.gj[this.fj] = uniqueName;
    _RnObject.jj[this.fj] = new WeakRef(this);
    _RnObject.hj.set(this.ej, new WeakRef(this));
  }
  /**
   * Unregisters this object from all tracking collections.
   * Should be called when the object is being destroyed.
   */
  unregister() {
    delete _RnObject.jj[this.fj];
    delete _RnObject.gj[this.fj];
    _RnObject.hj.delete(this.ej);
  }
  /**
   * Searches for the first object that has a specific tag with the given value
   * @param tag - The tag name to search for
   * @param value - The tag value to match
   * @returns WeakRef to the first matching object, or undefined if not found
   */
  static searchByTag(tag, value) {
    var _a;
    for (const obj of _RnObject.jj) {
      if (((_a = obj.deref()) == null ? void 0 : _a.getTagValue(tag)) === value) {
        return obj;
      }
    }
    return void 0;
  }
  /**
   * Gets the unique object identifier
   * @returns The object's UID
   */
  get objectUID() {
    return this.fj;
  }
  /**
   * Retrieves an RnObject instance by its unique identifier
   * @param objectUid - The unique identifier of the object to retrieve
   * @returns The RnObject instance or undefined if not found or garbage collected
   */
  static getRnObject(objectUid) {
    var _a;
    return (_a = _RnObject.jj[objectUid]) == null ? void 0 : _a.deref();
  }
  /**
   * Retrieves an RnObject instance by its unique name
   * @param uniqueName - The unique name of the object to retrieve
   * @returns The RnObject instance or undefined if not found or garbage collected
   */
  static getRnObjectByName(uniqueName) {
    var _a;
    return (_a = _RnObject.hj.get(uniqueName)) == null ? void 0 : _a.deref();
  }
  /**
   * Attempts to set a unique name for this object
   * @param name - The desired unique name
   * @param toAddNameIfConflict - If true, appends UID to make name unique when conflicts occur; if false, fails on conflict
   * @returns True if the name was successfully set, false if there was a conflict and toAddNameIfConflict was false
   */
  tryToSetUniqueName(name, toAddNameIfConflict) {
    if (_RnObject.gj.indexOf(name) !== -1) {
      if (toAddNameIfConflict) {
        const newName = `${name}_(${this.fj})`;
        if (_RnObject.gj.indexOf(newName) === -1) {
          _RnObject.hj.delete(this.ej);
          this.ej = newName;
          _RnObject.gj[this.fj] = this.ej;
          _RnObject.hj.set(this.ej, new WeakRef(this));
          return true;
        }
      }
      return false;
    }
    this.ej = name;
    _RnObject.gj[this.fj] = this.ej;
    _RnObject.hj.set(this.ej, new WeakRef(this));
    return true;
  }
  /**
   * Validates that a tag string contains only allowed characters (alphanumeric and underscore)
   * @param val - The string to validate
   * @returns True if the string contains only valid characters, false if it contains invalid characters
   */
  validateTagString(val) {
    const reg = new RegExp(/[!"#$%&'()*+\-\s.,/:;<=>?@[\\\]^`{|}~]/g);
    if (reg.test(val)) {
      return false;
    }
    return true;
  }
  /**
   * Attempts to set a tag on this object. If the tag already exists, it will be replaced.
   * @param tag - The tag object containing the name and value to set
   * @returns True if the tag was successfully set, false if the tag name contains invalid characters
   */
  tryToSetTag(tag) {
    if (this.validateTagString(tag.tag)) {
      if (this.hasTag(tag.tag)) {
        this.removeTag(tag.tag);
      }
      this._tags[tag.tag] = tag.value;
      this.ij += `${tag.tag}:${tag.value} `;
      return true;
    }
    return false;
  }
  /**
   * Retrieves the value associated with a specific tag name
   * @param tagName - The name of the tag whose value to retrieve
   * @returns The tag value, or undefined if the tag doesn't exist
   */
  getTagValue(tagName) {
    return this._tags[tagName];
  }
  /**
   * Retrieves a complete tag object (name and value) for the specified tag name
   * @param tagName - The name of the tag to retrieve
   * @returns A Tag object containing the name and value
   */
  getTag(tagName) {
    const tag = {
      tag: tagName,
      value: this._tags[tagName]
    };
    return tag;
  }
  /**
   * Checks whether this object has a tag with the specified name
   * @param tagName - The name of the tag to check for
   * @returns True if the tag exists (value is not null/undefined), false otherwise
   */
  hasTag(tagName) {
    if (this._tags[tagName] != null) {
      return true;
    }
    return false;
  }
  /**
   * Removes a tag from this object
   * @param tagName - The name of the tag to remove
   */
  removeTag(tagName) {
    const strToDelete = `${tagName}:${this._tags[tagName]} `;
    this.ij = this.ij.replace(strToDelete, "");
    delete this._tags[tagName];
  }
  /**
   * Checks if this object has a tag with the specified name and value
   * @param tagName - The tag name to match
   * @param tagValue - The tag value to match
   * @returns True if the object has a matching tag, false otherwise
   */
  matchTag(tagName, tagValue) {
    if (this._tags[tagName] === tagValue) {
      return true;
    }
    return false;
  }
  /**
   * Checks if the object's combined tag string contains all the provided search strings.
   * This allows for flexible searching within tag names and values.
   * @param stringArray - Array of strings that must all be present in the combined tag string
   * @returns True if all strings are found in the combined tag string, false otherwise
   */
  matchTagsAsFreeStrings(stringArray) {
    let regExpStr = "^";
    for (let i = 0; i < stringArray.length; i++) {
      regExpStr += `(?=.*${stringArray[i]})`;
    }
    const reg = new RegExp(regExpStr);
    if (reg.test(this.ij)) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this object has all the specified tags with exactly matching values
   * @param tags - Object containing tag names as keys and expected values
   * @returns True if all specified tags exist with matching values, false otherwise
   */
  matchTags(tags) {
    let regExpStr = "^";
    for (const tagName in tags) {
      regExpStr += `(?=.*${[tagName]}:${tags[tagName]})`;
    }
    const reg = new RegExp(regExpStr);
    if (reg.test(this.ij)) {
      return true;
    }
    return false;
  }
  /**
   * Gets the unique name of this object
   * @returns The unique name string
   */
  get uniqueName() {
    return this.ej;
  }
  /**
   * Resets all static object tracking data. Used primarily for testing.
   * @internal
   */
  static _reset() {
    this.currentMaxObjectCount = 0;
    this.gj = [];
    this.hj = /* @__PURE__ */ new Map();
    this.jj = [];
  }
  /**
   * Copies tag data from another RnObject instance to this object
   * @param rnObject - The source RnObject to copy tags from
   * @internal
   */
  _copyFrom(rnObject) {
    this._tags = deepCopyUsingJsonStringify(rnObject._tags);
    this.ij = rnObject.ij;
  }
};
/// static members
/** Invalid object UID constant */
_RnObject.InvalidObjectUID = -1;
/** Current maximum object count for UID generation */
_RnObject.currentMaxObjectCount = 0;
/** Array storing all unique names */
_RnObject.gj = [];
/** Map for quick object lookup by name */
_RnObject.hj = /* @__PURE__ */ new Map();
/** Array storing weak references to all objects */
_RnObject.jj = [];
var RnObject = _RnObject;
export {
  RnObject
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9Sbk9iamVjdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBPYmplY3RVSUQsIFJuVGFncyB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IGRlZXBDb3B5VXNpbmdKc29uU3RyaW5naWZ5IH0gZnJvbSAnLi4vbWlzYy9NaXNjVXRpbCc7XG5cbi8qKlxuICogQSBUYWcgaW50ZXJmYWNlIHJlcHJlc2VudGluZyBhIGtleS12YWx1ZSBwYWlyIGZvciBvYmplY3QgbWV0YWRhdGFcbiAqL1xuZXhwb3J0IHR5cGUgVGFnID0ge1xuICAvKiogVGhlIHRhZyBuYW1lL2tleSAqL1xuICB0YWc6IHN0cmluZztcbiAgLyoqIFRoZSB0YWcgdmFsdWUgKi9cbiAgdmFsdWU6IGFueTtcbn07XG5cbi8qKlxuICogVGhlIEludGVyZmFjZSBvZiB0aGUgUm5PYmplY3QgZGVmaW5pbmcgY29yZSBvYmplY3QgZnVuY3Rpb25hbGl0eS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJUm5PYmplY3Qge1xuICAvKiogVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBvYmplY3QgKi9cbiAgb2JqZWN0VUlEOiBPYmplY3RVSUQ7XG4gIC8qKiBVbmlxdWUgbmFtZSBzdHJpbmcgZm9yIHRoZSBvYmplY3QgKi9cbiAgdW5pcXVlTmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBzZXQgYSB1bmlxdWUgbmFtZSBmb3IgdGhlIG9iamVjdFxuICAgKiBAcGFyYW0gbmFtZSAtIFRoZSBkZXNpcmVkIHVuaXF1ZSBuYW1lXG4gICAqIEBwYXJhbSB0b0FkZE5hbWVJZkNvbmZsaWN0IC0gV2hldGhlciB0byBtb2RpZnkgdGhlIG5hbWUgaWYgaXQgY29uZmxpY3RzIHdpdGggZXhpc3RpbmcgbmFtZXNcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbmFtZSB3YXMgc3VjY2Vzc2Z1bGx5IHNldCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICB0cnlUb1NldFVuaXF1ZU5hbWUobmFtZTogc3RyaW5nLCB0b0FkZE5hbWVJZkNvbmZsaWN0OiBib29sZWFuKTogYm9vbGVhbjtcblxuICAvKipcbiAgICogVmFsaWRhdGVzIGEgdGFnIHN0cmluZyB0byBlbnN1cmUgaXQgY29udGFpbnMgb25seSBhbGxvd2VkIGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBzdHJpbmcgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgc3RyaW5nIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHZhbGlkYXRlVGFnU3RyaW5nKHZhbDogc3RyaW5nKTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gc2V0IGEgdGFnIG9uIHRoZSBvYmplY3RcbiAgICogQHBhcmFtIHRhZyAtIFRoZSB0YWcgb2JqZWN0IGNvbnRhaW5pbmcgbmFtZSBhbmQgdmFsdWVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdGFnIHdhcyBzdWNjZXNzZnVsbHkgc2V0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHRyeVRvU2V0VGFnKHRhZzogVGFnKTogYm9vbGVhbjtcblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSB2YWx1ZSBvZiBhIHNwZWNpZmljIHRhZ1xuICAgKiBAcGFyYW0gdGFnTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB0YWcgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMgVGhlIHRhZyB2YWx1ZSBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBnZXRUYWdWYWx1ZSh0YWdOYW1lOiBzdHJpbmcpOiBhbnk7XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBvYmplY3QgbWF0Y2hlcyBhIHNwZWNpZmljIHRhZyBuYW1lIGFuZCB2YWx1ZVxuICAgKiBAcGFyYW0gdGFnTmFtZSAtIFRoZSB0YWcgbmFtZSB0byBtYXRjaFxuICAgKiBAcGFyYW0gdGFnVmFsdWUgLSBUaGUgdGFnIHZhbHVlIHRvIG1hdGNoXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHRhZyBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIG1hdGNoVGFnKHRhZ05hbWU6IHN0cmluZywgdGFnVmFsdWU6IHN0cmluZyk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgb2JqZWN0J3MgY29tYmluZWQgdGFnIHN0cmluZyBjb250YWlucyBhbGwgcHJvdmlkZWQgc3RyaW5nc1xuICAgKiBAcGFyYW0gc3RyaW5nQXJyYXkgLSBBcnJheSBvZiBzdHJpbmdzIHRvIHNlYXJjaCBmb3IgaW4gdGFnc1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFsbCBzdHJpbmdzIGFyZSBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtYXRjaFRhZ3NBc0ZyZWVTdHJpbmdzKHN0cmluZ0FycmF5OiBzdHJpbmdbXSk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgb2JqZWN0IGhhcyBhbGwgdGhlIHNwZWNpZmllZCB0YWdzIHdpdGggbWF0Y2hpbmcgdmFsdWVzXG4gICAqIEBwYXJhbSB0YWdzIC0gVGhlIHRhZ3Mgb2JqZWN0IHRvIG1hdGNoIGFnYWluc3RcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbGwgdGFncyBtYXRjaCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtYXRjaFRhZ3ModGFnczogUm5UYWdzKTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ29waWVzIHByb3BlcnRpZXMgZnJvbSBhbm90aGVyIFJuT2JqZWN0IGluc3RhbmNlXG4gICAqIEBwYXJhbSBybk9iamVjdCAtIFRoZSBzb3VyY2Ugb2JqZWN0IHRvIGNvcHkgZnJvbVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb3B5RnJvbShybk9iamVjdDogUm5PYmplY3QpOiB2b2lkO1xufVxuXG4vKipcbiAqIFRoZSByb290IGNsYXNzIG9mIGFsbCBvYmplY3RzIGluIFJob2Rvbml0ZSwgcHJvdmlkaW5nIGNvcmUgZnVuY3Rpb25hbGl0eVxuICogZm9yIG9iamVjdCBpZGVudGlmaWNhdGlvbiwgbmFtaW5nLCBhbmQgdGFnZ2luZy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJuT2JqZWN0IGltcGxlbWVudHMgSVJuT2JqZWN0IHtcbiAgLy8vIHN0YXRpYyBtZW1iZXJzXG4gIC8qKiBJbnZhbGlkIG9iamVjdCBVSUQgY29uc3RhbnQgKi9cbiAgc3RhdGljIHJlYWRvbmx5IEludmFsaWRPYmplY3RVSUQgPSAtMTtcbiAgLyoqIEN1cnJlbnQgbWF4aW11bSBvYmplY3QgY291bnQgZm9yIFVJRCBnZW5lcmF0aW9uICovXG4gIHN0YXRpYyBjdXJyZW50TWF4T2JqZWN0Q291bnQgPSAwO1xuICAvKiogQXJyYXkgc3RvcmluZyBhbGwgdW5pcXVlIG5hbWVzICovXG4gIHByaXZhdGUgc3RhdGljIF9fdW5pcXVlTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIC8qKiBNYXAgZm9yIHF1aWNrIG9iamVjdCBsb29rdXAgYnkgbmFtZSAqL1xuICBwcml2YXRlIHN0YXRpYyBfX29iamVjdHNCeU5hbWVNYXA6IE1hcDxzdHJpbmcsIFdlYWtSZWY8Um5PYmplY3Q+PiA9IG5ldyBNYXAoKTtcbiAgLyoqIEFycmF5IHN0b3Jpbmcgd2VhayByZWZlcmVuY2VzIHRvIGFsbCBvYmplY3RzICovXG4gIHByaXZhdGUgc3RhdGljIF9fb2JqZWN0czogV2Vha1JlZjxSbk9iamVjdD5bXSA9IFtdO1xuXG4gIC8vLyBtZW1iZXJzXG4gIC8qKiBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyBvYmplY3QgaW5zdGFuY2UgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfX29iamVjdFVpZDogT2JqZWN0VUlEID0gUm5PYmplY3QuY3VycmVudE1heE9iamVjdENvdW50Kys7XG4gIC8qKiBVbmlxdWUgbmFtZSBmb3IgdGhpcyBvYmplY3QgaW5zdGFuY2UgKi9cbiAgcHJpdmF0ZSBfX3VuaXF1ZU5hbWU6IHN0cmluZztcbiAgLyoqIENvbGxlY3Rpb24gb2YgdGFncyBhc3NvY2lhdGVkIHdpdGggdGhpcyBvYmplY3QgKi9cbiAgX3RhZ3M6IFJuVGFncyA9IHt9OyAvLyBUYWcgc3RyaW5nIGFsbG93cyBhbHBoYWJldCwgZGlnaXQgYW5kIHVuZGVyc2NvcmUgKF8pIG9ubHlcbiAgLyoqIENvbWJpbmVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbGwgdGFncyBmb3IgZWZmaWNpZW50IHNlYXJjaGluZyAqL1xuICBwcml2YXRlIF9fY29tYmluZWRUYWdTdHJpbmcgPSAnJzsgLy8gVGFnIHN0cmluZyBhbGxvd3MgYWxwaGFiZXQsIGRpZ2l0IGFuZCB1bmRlcnNjb3JlIChfKSBvbmx5XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgUm5PYmplY3QgaW5zdGFuY2Ugd2l0aCBhdXRvLWdlbmVyYXRlZCB1bmlxdWUgbmFtZSBhbmQgVUlEXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9fdW5pcXVlTmFtZSA9IGAke3RoaXMuY29uc3RydWN0b3IubmFtZX1fX3VpZF8ke3RoaXMuX19vYmplY3RVaWR9YDtcbiAgICB0aGlzLl9fdXBkYXRlSW5mbyh0aGlzLl9fdW5pcXVlTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgaW50ZXJuYWwgb2JqZWN0IHRyYWNraW5nIGluZm9ybWF0aW9uXG4gICAqIEBwYXJhbSB1bmlxdWVOYW1lIC0gVGhlIHVuaXF1ZSBuYW1lIHRvIHJlZ2lzdGVyIGZvciB0aGlzIG9iamVjdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZUluZm8odW5pcXVlTmFtZTogc3RyaW5nKSB7XG4gICAgUm5PYmplY3QuX191bmlxdWVOYW1lc1t0aGlzLl9fb2JqZWN0VWlkXSA9IHVuaXF1ZU5hbWU7XG4gICAgUm5PYmplY3QuX19vYmplY3RzW3RoaXMuX19vYmplY3RVaWRdID0gbmV3IFdlYWtSZWYodGhpcyk7XG4gICAgUm5PYmplY3QuX19vYmplY3RzQnlOYW1lTWFwLnNldCh0aGlzLl9fdW5pcXVlTmFtZSwgbmV3IFdlYWtSZWYodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIHRoaXMgb2JqZWN0IGZyb20gYWxsIHRyYWNraW5nIGNvbGxlY3Rpb25zLlxuICAgKiBTaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIG9iamVjdCBpcyBiZWluZyBkZXN0cm95ZWQuXG4gICAqL1xuICBwdWJsaWMgdW5yZWdpc3RlcigpIHtcbiAgICBkZWxldGUgUm5PYmplY3QuX19vYmplY3RzW3RoaXMuX19vYmplY3RVaWRdO1xuICAgIGRlbGV0ZSBSbk9iamVjdC5fX3VuaXF1ZU5hbWVzW3RoaXMuX19vYmplY3RVaWRdO1xuICAgIFJuT2JqZWN0Ll9fb2JqZWN0c0J5TmFtZU1hcC5kZWxldGUodGhpcy5fX3VuaXF1ZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciB0aGUgZmlyc3Qgb2JqZWN0IHRoYXQgaGFzIGEgc3BlY2lmaWMgdGFnIHdpdGggdGhlIGdpdmVuIHZhbHVlXG4gICAqIEBwYXJhbSB0YWcgLSBUaGUgdGFnIG5hbWUgdG8gc2VhcmNoIGZvclxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdGFnIHZhbHVlIHRvIG1hdGNoXG4gICAqIEByZXR1cm5zIFdlYWtSZWYgdG8gdGhlIGZpcnN0IG1hdGNoaW5nIG9iamVjdCwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgc3RhdGljIHNlYXJjaEJ5VGFnKHRhZzogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCBvYmogb2YgUm5PYmplY3QuX19vYmplY3RzKSB7XG4gICAgICBpZiAob2JqLmRlcmVmKCk/LmdldFRhZ1ZhbHVlKHRhZykgPT09IHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIG9iamVjdCBpZGVudGlmaWVyXG4gICAqIEByZXR1cm5zIFRoZSBvYmplY3QncyBVSURcbiAgICovXG4gIGdldCBvYmplY3RVSUQoKTogT2JqZWN0VUlEIHtcbiAgICByZXR1cm4gdGhpcy5fX29iamVjdFVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gUm5PYmplY3QgaW5zdGFuY2UgYnkgaXRzIHVuaXF1ZSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSBvYmplY3RVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIG9iamVjdCB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgUm5PYmplY3QgaW5zdGFuY2Ugb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZCBvciBnYXJiYWdlIGNvbGxlY3RlZFxuICAgKi9cbiAgc3RhdGljIGdldFJuT2JqZWN0KG9iamVjdFVpZDogT2JqZWN0VUlEKSB7XG4gICAgcmV0dXJuIFJuT2JqZWN0Ll9fb2JqZWN0c1tvYmplY3RVaWRdPy5kZXJlZigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBSbk9iamVjdCBpbnN0YW5jZSBieSBpdHMgdW5pcXVlIG5hbWVcbiAgICogQHBhcmFtIHVuaXF1ZU5hbWUgLSBUaGUgdW5pcXVlIG5hbWUgb2YgdGhlIG9iamVjdCB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgUm5PYmplY3QgaW5zdGFuY2Ugb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZCBvciBnYXJiYWdlIGNvbGxlY3RlZFxuICAgKi9cbiAgc3RhdGljIGdldFJuT2JqZWN0QnlOYW1lKHVuaXF1ZU5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBSbk9iamVjdC5fX29iamVjdHNCeU5hbWVNYXAuZ2V0KHVuaXF1ZU5hbWUpPy5kZXJlZigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIHNldCBhIHVuaXF1ZSBuYW1lIGZvciB0aGlzIG9iamVjdFxuICAgKiBAcGFyYW0gbmFtZSAtIFRoZSBkZXNpcmVkIHVuaXF1ZSBuYW1lXG4gICAqIEBwYXJhbSB0b0FkZE5hbWVJZkNvbmZsaWN0IC0gSWYgdHJ1ZSwgYXBwZW5kcyBVSUQgdG8gbWFrZSBuYW1lIHVuaXF1ZSB3aGVuIGNvbmZsaWN0cyBvY2N1cjsgaWYgZmFsc2UsIGZhaWxzIG9uIGNvbmZsaWN0XG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG5hbWUgd2FzIHN1Y2Nlc3NmdWxseSBzZXQsIGZhbHNlIGlmIHRoZXJlIHdhcyBhIGNvbmZsaWN0IGFuZCB0b0FkZE5hbWVJZkNvbmZsaWN0IHdhcyBmYWxzZVxuICAgKi9cbiAgdHJ5VG9TZXRVbmlxdWVOYW1lKG5hbWU6IHN0cmluZywgdG9BZGROYW1lSWZDb25mbGljdDogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIGlmIChSbk9iamVjdC5fX3VuaXF1ZU5hbWVzLmluZGV4T2YobmFtZSkgIT09IC0xKSB7XG4gICAgICAvLyBDb25mbGljdFxuICAgICAgaWYgKHRvQWRkTmFtZUlmQ29uZmxpY3QpIHtcbiAgICAgICAgY29uc3QgbmV3TmFtZSA9IGAke25hbWV9Xygke3RoaXMuX19vYmplY3RVaWR9KWA7XG4gICAgICAgIGlmIChSbk9iamVjdC5fX3VuaXF1ZU5hbWVzLmluZGV4T2YobmV3TmFtZSkgPT09IC0xKSB7XG4gICAgICAgICAgUm5PYmplY3QuX19vYmplY3RzQnlOYW1lTWFwLmRlbGV0ZSh0aGlzLl9fdW5pcXVlTmFtZSk7XG4gICAgICAgICAgdGhpcy5fX3VuaXF1ZU5hbWUgPSBuZXdOYW1lO1xuICAgICAgICAgIFJuT2JqZWN0Ll9fdW5pcXVlTmFtZXNbdGhpcy5fX29iamVjdFVpZF0gPSB0aGlzLl9fdW5pcXVlTmFtZTtcbiAgICAgICAgICBSbk9iamVjdC5fX29iamVjdHNCeU5hbWVNYXAuc2V0KHRoaXMuX191bmlxdWVOYW1lLCBuZXcgV2Vha1JlZih0aGlzKSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fX3VuaXF1ZU5hbWUgPSBuYW1lO1xuICAgIFJuT2JqZWN0Ll9fdW5pcXVlTmFtZXNbdGhpcy5fX29iamVjdFVpZF0gPSB0aGlzLl9fdW5pcXVlTmFtZTtcbiAgICBSbk9iamVjdC5fX29iamVjdHNCeU5hbWVNYXAuc2V0KHRoaXMuX191bmlxdWVOYW1lLCBuZXcgV2Vha1JlZih0aGlzKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGVzIHRoYXQgYSB0YWcgc3RyaW5nIGNvbnRhaW5zIG9ubHkgYWxsb3dlZCBjaGFyYWN0ZXJzIChhbHBoYW51bWVyaWMgYW5kIHVuZGVyc2NvcmUpXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgc3RyaW5nIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHN0cmluZyBjb250YWlucyBvbmx5IHZhbGlkIGNoYXJhY3RlcnMsIGZhbHNlIGlmIGl0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyc1xuICAgKi9cbiAgdmFsaWRhdGVUYWdTdHJpbmcodmFsOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCByZWcgPSBuZXcgUmVnRXhwKC9bIVwiIyQlJicoKSorXFwtXFxzLiwvOjs8PT4/QFtcXFxcXFxdXmB7fH1+XS9nKTtcbiAgICBpZiAocmVnLnRlc3QodmFsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byBzZXQgYSB0YWcgb24gdGhpcyBvYmplY3QuIElmIHRoZSB0YWcgYWxyZWFkeSBleGlzdHMsIGl0IHdpbGwgYmUgcmVwbGFjZWQuXG4gICAqIEBwYXJhbSB0YWcgLSBUaGUgdGFnIG9iamVjdCBjb250YWluaW5nIHRoZSBuYW1lIGFuZCB2YWx1ZSB0byBzZXRcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdGFnIHdhcyBzdWNjZXNzZnVsbHkgc2V0LCBmYWxzZSBpZiB0aGUgdGFnIG5hbWUgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzXG4gICAqL1xuICB0cnlUb1NldFRhZyh0YWc6IFRhZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLnZhbGlkYXRlVGFnU3RyaW5nKHRhZy50YWcpKSB7XG4gICAgICBpZiAodGhpcy5oYXNUYWcodGFnLnRhZykpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVUYWcodGFnLnRhZyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RhZ3NbdGFnLnRhZ10gPSB0YWcudmFsdWU7XG4gICAgICB0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcgKz0gYCR7dGFnLnRhZ306JHt0YWcudmFsdWV9IGA7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgdGFnIG5hbWVcbiAgICogQHBhcmFtIHRhZ05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdGFnIHdob3NlIHZhbHVlIHRvIHJldHJpZXZlXG4gICAqIEByZXR1cm5zIFRoZSB0YWcgdmFsdWUsIG9yIHVuZGVmaW5lZCBpZiB0aGUgdGFnIGRvZXNuJ3QgZXhpc3RcbiAgICovXG4gIGdldFRhZ1ZhbHVlKHRhZ05hbWU6IHN0cmluZyk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhZ3NbdGFnTmFtZV07XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgY29tcGxldGUgdGFnIG9iamVjdCAobmFtZSBhbmQgdmFsdWUpIGZvciB0aGUgc3BlY2lmaWVkIHRhZyBuYW1lXG4gICAqIEBwYXJhbSB0YWdOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHRhZyB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBBIFRhZyBvYmplY3QgY29udGFpbmluZyB0aGUgbmFtZSBhbmQgdmFsdWVcbiAgICovXG4gIGdldFRhZyh0YWdOYW1lOiBzdHJpbmcpOiBUYWcge1xuICAgIGNvbnN0IHRhZzogVGFnID0ge1xuICAgICAgdGFnOiB0YWdOYW1lLFxuICAgICAgdmFsdWU6IHRoaXMuX3RhZ3NbdGFnTmFtZV0sXG4gICAgfTtcbiAgICByZXR1cm4gdGFnO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoaXMgb2JqZWN0IGhhcyBhIHRhZyB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZVxuICAgKiBAcGFyYW0gdGFnTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB0YWcgdG8gY2hlY2sgZm9yXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHRhZyBleGlzdHMgKHZhbHVlIGlzIG5vdCBudWxsL3VuZGVmaW5lZCksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaGFzVGFnKHRhZ05hbWU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLl90YWdzW3RhZ05hbWVdICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHRhZyBmcm9tIHRoaXMgb2JqZWN0XG4gICAqIEBwYXJhbSB0YWdOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHRhZyB0byByZW1vdmVcbiAgICovXG4gIHJlbW92ZVRhZyh0YWdOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzdHJUb0RlbGV0ZSA9IGAke3RhZ05hbWV9OiR7dGhpcy5fdGFnc1t0YWdOYW1lXX0gYDtcbiAgICB0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcgPSB0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcucmVwbGFjZShzdHJUb0RlbGV0ZSwgJycpO1xuICAgIGRlbGV0ZSB0aGlzLl90YWdzW3RhZ05hbWVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG9iamVjdCBoYXMgYSB0YWcgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUgYW5kIHZhbHVlXG4gICAqIEBwYXJhbSB0YWdOYW1lIC0gVGhlIHRhZyBuYW1lIHRvIG1hdGNoXG4gICAqIEBwYXJhbSB0YWdWYWx1ZSAtIFRoZSB0YWcgdmFsdWUgdG8gbWF0Y2hcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgb2JqZWN0IGhhcyBhIG1hdGNoaW5nIHRhZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtYXRjaFRhZyh0YWdOYW1lOiBzdHJpbmcsIHRhZ1ZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdGFnc1t0YWdOYW1lXSA9PT0gdGFnVmFsdWUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBvYmplY3QncyBjb21iaW5lZCB0YWcgc3RyaW5nIGNvbnRhaW5zIGFsbCB0aGUgcHJvdmlkZWQgc2VhcmNoIHN0cmluZ3MuXG4gICAqIFRoaXMgYWxsb3dzIGZvciBmbGV4aWJsZSBzZWFyY2hpbmcgd2l0aGluIHRhZyBuYW1lcyBhbmQgdmFsdWVzLlxuICAgKiBAcGFyYW0gc3RyaW5nQXJyYXkgLSBBcnJheSBvZiBzdHJpbmdzIHRoYXQgbXVzdCBhbGwgYmUgcHJlc2VudCBpbiB0aGUgY29tYmluZWQgdGFnIHN0cmluZ1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFsbCBzdHJpbmdzIGFyZSBmb3VuZCBpbiB0aGUgY29tYmluZWQgdGFnIHN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtYXRjaFRhZ3NBc0ZyZWVTdHJpbmdzKHN0cmluZ0FycmF5OiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIGxldCByZWdFeHBTdHIgPSAnXic7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZ0FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICByZWdFeHBTdHIgKz0gYCg/PS4qJHtzdHJpbmdBcnJheVtpXX0pYDtcbiAgICB9XG4gICAgY29uc3QgcmVnID0gbmV3IFJlZ0V4cChyZWdFeHBTdHIpO1xuICAgIGlmIChyZWcudGVzdCh0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIG9iamVjdCBoYXMgYWxsIHRoZSBzcGVjaWZpZWQgdGFncyB3aXRoIGV4YWN0bHkgbWF0Y2hpbmcgdmFsdWVzXG4gICAqIEBwYXJhbSB0YWdzIC0gT2JqZWN0IGNvbnRhaW5pbmcgdGFnIG5hbWVzIGFzIGtleXMgYW5kIGV4cGVjdGVkIHZhbHVlc1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIGFsbCBzcGVjaWZpZWQgdGFncyBleGlzdCB3aXRoIG1hdGNoaW5nIHZhbHVlcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtYXRjaFRhZ3ModGFnczogUm5UYWdzKTogYm9vbGVhbiB7XG4gICAgbGV0IHJlZ0V4cFN0ciA9ICdeJztcblxuICAgIGZvciAoY29uc3QgdGFnTmFtZSBpbiB0YWdzKSB7XG4gICAgICByZWdFeHBTdHIgKz0gYCg/PS4qJHtbdGFnTmFtZV19OiR7dGFnc1t0YWdOYW1lXX0pYDtcbiAgICB9XG4gICAgY29uc3QgcmVnID0gbmV3IFJlZ0V4cChyZWdFeHBTdHIpO1xuICAgIGlmIChyZWcudGVzdCh0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVuaXF1ZSBuYW1lIG9mIHRoaXMgb2JqZWN0XG4gICAqIEByZXR1cm5zIFRoZSB1bmlxdWUgbmFtZSBzdHJpbmdcbiAgICovXG4gIGdldCB1bmlxdWVOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9fdW5pcXVlTmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYWxsIHN0YXRpYyBvYmplY3QgdHJhY2tpbmcgZGF0YS4gVXNlZCBwcmltYXJpbHkgZm9yIHRlc3RpbmcuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9yZXNldCgpIHtcbiAgICB0aGlzLmN1cnJlbnRNYXhPYmplY3RDb3VudCA9IDA7XG4gICAgdGhpcy5fX3VuaXF1ZU5hbWVzID0gW107XG4gICAgdGhpcy5fX29iamVjdHNCeU5hbWVNYXAgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5fX29iamVjdHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGFnIGRhdGEgZnJvbSBhbm90aGVyIFJuT2JqZWN0IGluc3RhbmNlIHRvIHRoaXMgb2JqZWN0XG4gICAqIEBwYXJhbSBybk9iamVjdCAtIFRoZSBzb3VyY2UgUm5PYmplY3QgdG8gY29weSB0YWdzIGZyb21cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29weUZyb20ocm5PYmplY3Q6IFJuT2JqZWN0KSB7XG4gICAgdGhpcy5fdGFncyA9IGRlZXBDb3B5VXNpbmdKc29uU3RyaW5naWZ5KHJuT2JqZWN0Ll90YWdzKTtcbiAgICB0aGlzLl9fY29tYmluZWRUYWdTdHJpbmcgPSBybk9iamVjdC5fX2NvbWJpbmVkVGFnU3RyaW5nO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxrQ0FBa0M7QUFvRnBDLElBQU0sWUFBTixNQUFNLFVBQThCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTBCekMsY0FBYztBQVhkO0FBQUE7QUFBQSxTQUFpQkEsS0FBeUIsVUFBUztBQUluRDtBQUFBLGlCQUFnQixDQUFDO0FBRWpCO0FBQUE7QUFBQSxTQUFRQyxLQUFzQjtBQU01QixTQUFLQyxLQUFlLEdBQUcsS0FBSyxZQUFZLElBQUksU0FBUyxLQUFLRixFQUFXO0FBQ3JFLFNBQUtHLEdBQWEsS0FBS0QsRUFBWTtBQUFBLEVBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT1FDLEdBQWEsWUFBb0I7QUFDdkMsY0FBU0MsR0FBYyxLQUFLSixFQUFXLElBQUk7QUFDM0MsY0FBU0ssR0FBVSxLQUFLTCxFQUFXLElBQUksSUFB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QUFDLElBQUksS0FBSyxPQUFPLENBQUM7QUFBQSxJQUNqRDtBQUNBLFVBQU0sTUFBTSxJQUFJLE9BQU8sU0FBUztBQUNoQyxRQUFJLElBQUksS0FBSyxLQUFLQSxFQUFtQixHQUFHO0FBQ3RDLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxhQUFhO0FBQ2YsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsT0FBTyxTQUFTO0FBQ2QsU0FBSyx3QkFBd0I7QUFDN0IsU0FBS0UsS0FBZ0IsQ0FBQztBQUN0QixTQUFLRSxLQUFxQixvQkFBSSxJQUFJO0FBQ2xDLFNBQUtELEtBQVksQ0FBQztBQUFBLEVBQ3BCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsVUFBVSxVQUFvQjtBQUM1QixTQUFLLFFBQVEsMkJBQTJCLFNBQVMsS0FBSztBQUN0RCxTQUFLSixLQUFzQixTQUFTQTtBQUFBLEVBQ3RDO0FBQ0Y7QUFBQTtBQUFBO0FBalJhLFVBR0ssbUJBQW1CO0FBQUE7QUFIeEIsVUFLSix3QkFBd0I7QUFBQTtBQUxwQixVQU9JRyxLQUEwQixDQUFDO0FBQUE7QUFQL0IsVUFTSUUsS0FBcUQsb0JBQUksSUFBSTtBQUFBO0FBVGpFLFVBV0lELEtBQWlDLENBQUM7QUFYNUMsSUFBTSxXQUFOOyIsCiAgIm5hbWVzIjogWyJfX29iamVjdFVpZCIsICJfX2NvbWJpbmVkVGFnU3RyaW5nIiwgIl9fdW5pcXVlTmFtZSIsICJfX3VwZGF0ZUluZm8iLCAiX191bmlxdWVOYW1lcyIsICJfX29iamVjdHMiLCAiX19vYmplY3RzQnlOYW1lTWFwIl0KfQo=
