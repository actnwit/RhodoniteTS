import type { RnTags, ObjectUID } from '../../types/CommonTypes';
import { deepCopyUsingJsonStringify } from '../misc/MiscUtil';
import { Config } from './Config';

/**
 * A Tag interface representing a key-value pair for object metadata
 */
export type Tag = {
  /** The tag name/key */
  tag: string;
  /** The tag value */
  value: any;
};

/**
 * The Interface of the RnObject defining core object functionality.
 */
export interface IRnObject {
  /** Unique identifier for the object */
  objectUID: ObjectUID;
  /** Unique name string for the object */
  uniqueName: string;

  /**
   * Attempts to set a unique name for the object
   * @param name - The desired unique name
   * @param toAddNameIfConflict - Whether to modify the name if it conflicts with existing names
   * @returns True if the name was successfully set, false otherwise
   */
  tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;

  /**
   * Validates a tag string to ensure it contains only allowed characters
   * @param val - The string to validate
   * @returns True if the string is valid, false otherwise
   */
  validateTagString(val: string): boolean;

  /**
   * Attempts to set a tag on the object
   * @param tag - The tag object containing name and value
   * @returns True if the tag was successfully set, false otherwise
   */
  tryToSetTag(tag: Tag): boolean;

  /**
   * Retrieves the value of a specific tag
   * @param tagName - The name of the tag to retrieve
   * @returns The tag value or undefined if not found
   */
  getTagValue(tagName: string): any;

  /**
   * Checks if an object matches a specific tag name and value
   * @param tagName - The tag name to match
   * @param tagValue - The tag value to match
   * @returns True if the tag matches, false otherwise
   */
  matchTag(tagName: string, tagValue: string): boolean;

  /**
   * Checks if the object's combined tag string contains all provided strings
   * @param stringArray - Array of strings to search for in tags
   * @returns True if all strings are found, false otherwise
   */
  matchTagsAsFreeStrings(stringArray: string[]): boolean;

  /**
   * Checks if the object has all the specified tags with matching values
   * @param tags - The tags object to match against
   * @returns True if all tags match, false otherwise
   */
  matchTags(tags: RnTags): boolean;

  /**
   * Copies properties from another RnObject instance
   * @param rnObject - The source object to copy from
   * @internal
   */
  _copyFrom(rnObject: RnObject): void;
}

/**
 * The root class of all objects in Rhodonite, providing core functionality
 * for object identification, naming, and tagging.
 */
export class RnObject implements IRnObject {
  /// static members
  /** Invalid object UID constant */
  static readonly InvalidObjectUID = -1;
  /** Current maximum object count for UID generation */
  static currentMaxObjectCount = 0;
  /** Array storing all unique names */
  private static __uniqueNames: string[] = [];
  /** Map for quick object lookup by name */
  private static __objectsByNameMap: Map<string, WeakRef<RnObject>> = new Map();
  /** Array storing weak references to all objects */
  private static __objects: WeakRef<RnObject>[] = [];

  /// members
  /** Unique identifier for this object instance */
  private readonly __objectUid: ObjectUID = RnObject.currentMaxObjectCount++;
  /** Unique name for this object instance */
  private __uniqueName: string;
  /** Collection of tags associated with this object */
  _tags: RnTags = {}; // Tag string allows alphabet, digit and underscore (_) only
  /** Combined string representation of all tags for efficient searching */
  private __combinedTagString = ''; // Tag string allows alphabet, digit and underscore (_) only

  /**
   * Creates a new RnObject instance with auto-generated unique name and UID
   */
  constructor() {
    this.__uniqueName = `${this.constructor.name}__uid_${this.__objectUid}`;
    this.__updateInfo(this.__uniqueName);
  }

  /**
   * Updates the internal object tracking information
   * @param uniqueName - The unique name to register for this object
   * @private
   */
  private __updateInfo(uniqueName: string) {
    RnObject.__uniqueNames[this.__objectUid] = uniqueName;
    RnObject.__objects[this.__objectUid] = new WeakRef(this);
    RnObject.__objectsByNameMap.set(this.__uniqueName, new WeakRef(this));
  }

  /**
   * Unregisters this object from all tracking collections.
   * Should be called when the object is being destroyed.
   */
  public unregister() {
    delete RnObject.__objects[this.__objectUid];
    delete RnObject.__uniqueNames[this.__objectUid];
    RnObject.__objectsByNameMap.delete(this.__uniqueName);
  }

  /**
   * Searches for the first object that has a specific tag with the given value
   * @param tag - The tag name to search for
   * @param value - The tag value to match
   * @returns WeakRef to the first matching object, or undefined if not found
   */
  static searchByTag(tag: string, value: string) {
    for (const obj of RnObject.__objects) {
      if (obj.deref()?.getTagValue(tag) === value) {
        return obj;
      }
    }
    return undefined;
  }

  /**
   * Gets the unique object identifier
   * @returns The object's UID
   */
  get objectUID(): ObjectUID {
    return this.__objectUid;
  }

  /**
   * Retrieves an RnObject instance by its unique identifier
   * @param objectUid - The unique identifier of the object to retrieve
   * @returns The RnObject instance or undefined if not found or garbage collected
   */
  static getRnObject(objectUid: ObjectUID) {
    return RnObject.__objects[objectUid]?.deref();
  }

  /**
   * Retrieves an RnObject instance by its unique name
   * @param uniqueName - The unique name of the object to retrieve
   * @returns The RnObject instance or undefined if not found or garbage collected
   */
  static getRnObjectByName(uniqueName: string) {
    return RnObject.__objectsByNameMap.get(uniqueName)?.deref();
  }

  /**
   * Attempts to set a unique name for this object
   * @param name - The desired unique name
   * @param toAddNameIfConflict - If true, appends UID to make name unique when conflicts occur; if false, fails on conflict
   * @returns True if the name was successfully set, false if there was a conflict and toAddNameIfConflict was false
   */
  tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean {
    if (RnObject.__uniqueNames.indexOf(name) !== -1) {
      // Conflict
      if (toAddNameIfConflict) {
        const newName = name + '_(' + this.__objectUid + ')';
        if (RnObject.__uniqueNames.indexOf(newName) === -1) {
          RnObject.__objectsByNameMap.delete(this.__uniqueName);
          this.__uniqueName = newName;
          RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;
          RnObject.__objectsByNameMap.set(this.__uniqueName, new WeakRef(this));
          return true;
        }
      }
      return false;
    } else {
      this.__uniqueName = name;
      RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;
      RnObject.__objectsByNameMap.set(this.__uniqueName, new WeakRef(this));
      return true;
    }
  }

  /**
   * Validates that a tag string contains only allowed characters (alphanumeric and underscore)
   * @param val - The string to validate
   * @returns True if the string contains only valid characters, false if it contains invalid characters
   */
  validateTagString(val: string): boolean {
    const reg = new RegExp(/[!"#$%&'()\*\+\-\s\.,\/:;<=>?@\[\\\]^`{|}~]/g);
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
  tryToSetTag(tag: Tag): boolean {
    if (this.validateTagString(tag.tag)) {
      if (this.hasTag(tag.tag)) {
        this.removeTag(tag.tag);
      }

      this._tags[tag.tag] = tag.value;
      this.__combinedTagString += `${tag.tag}:${tag.value}` + ' ';
      return true;
    }
    return false;
  }

  /**
   * Retrieves the value associated with a specific tag name
   * @param tagName - The name of the tag whose value to retrieve
   * @returns The tag value, or undefined if the tag doesn't exist
   */
  getTagValue(tagName: string): any {
    return this._tags[tagName];
  }

  /**
   * Retrieves a complete tag object (name and value) for the specified tag name
   * @param tagName - The name of the tag to retrieve
   * @returns A Tag object containing the name and value
   */
  getTag(tagName: string): Tag {
    const tag: Tag = {
      tag: tagName,
      value: this._tags[tagName],
    };
    return tag;
  }

  /**
   * Checks whether this object has a tag with the specified name
   * @param tagName - The name of the tag to check for
   * @returns True if the tag exists (value is not null/undefined), false otherwise
   */
  hasTag(tagName: string) {
    if (this._tags[tagName] != null) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Removes a tag from this object
   * @param tagName - The name of the tag to remove
   */
  removeTag(tagName: string) {
    const strToDelete = `${tagName}:${this._tags[tagName]}` + ' ';
    this.__combinedTagString = this.__combinedTagString.replace(strToDelete, '');
    delete this._tags[tagName];
  }

  /**
   * Checks if this object has a tag with the specified name and value
   * @param tagName - The tag name to match
   * @param tagValue - The tag value to match
   * @returns True if the object has a matching tag, false otherwise
   */
  matchTag(tagName: string, tagValue: string): boolean {
    if (this._tags[tagName] === tagValue) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if the object's combined tag string contains all the provided search strings.
   * This allows for flexible searching within tag names and values.
   * @param stringArray - Array of strings that must all be present in the combined tag string
   * @returns True if all strings are found in the combined tag string, false otherwise
   */
  matchTagsAsFreeStrings(stringArray: string[]): boolean {
    let regExpStr = '^';

    for (let i = 0; i < stringArray.length; i++) {
      regExpStr += `(?=.*${stringArray[i]})`;
    }
    const reg = new RegExp(regExpStr);
    if (reg.test(this.__combinedTagString)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if this object has all the specified tags with exactly matching values
   * @param tags - Object containing tag names as keys and expected values
   * @returns True if all specified tags exist with matching values, false otherwise
   */
  matchTags(tags: RnTags): boolean {
    let regExpStr = '^';

    for (const tagName in tags) {
      regExpStr += `(?=.*${[tagName]}:${tags[tagName]})`;
    }
    const reg = new RegExp(regExpStr);
    if (reg.test(this.__combinedTagString)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the unique name of this object
   * @returns The unique name string
   */
  get uniqueName() {
    return this.__uniqueName;
  }

  /**
   * Resets all static object tracking data. Used primarily for testing.
   * @internal
   */
  static _reset() {
    this.currentMaxObjectCount = 0;
    this.__uniqueNames = [];
    this.__objectsByNameMap = new Map();
    this.__objects = [];
  }

  /**
   * Copies tag data from another RnObject instance to this object
   * @param rnObject - The source RnObject to copy tags from
   * @internal
   */
  _copyFrom(rnObject: RnObject) {
    this._tags = deepCopyUsingJsonStringify(rnObject._tags);
    this.__combinedTagString = rnObject.__combinedTagString;
  }
}
