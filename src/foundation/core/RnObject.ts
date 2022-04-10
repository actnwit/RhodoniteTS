import {RnTags, ObjectUID} from '../../types/CommonTypes';
import { deepCopyUsingJsonStringify } from '../misc/MiscUtil';

export type Tag = {
  tag: string;
  value: any;
};

export interface IRnObject {
  objectUID: ObjectUID;
  uniqueName: string;
  tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
  validateTagString(val: string): boolean;
  tryToSetTag(tag: Tag): boolean;
  getTagValue(tagName: string): any;
  matchTag(tagName: string, tagValue: string): boolean;
  matchTagsAsFreeStrings(stringArray: string[]): boolean;
  matchTags(tags: RnTags): boolean;
  _copyFrom(rnObject: RnObject): void;
}

/**
 * The root class of the objects in Rhodonite
 */
export class RnObject implements IRnObject {
  /// static members
  static readonly InvalidObjectUID = -1;
  static currentMaxObjectCount = 0;
  private static __uniqueNames: string[] = [];
  private static __objectsByNameMap: Map<string, RnObject> = new Map();
  private static __objects: RnObject[] = [];

  /// members
  private readonly __objectUid: ObjectUID = RnObject.currentMaxObjectCount++;
  private __uniqueName: string;
  private __tags: RnTags = {}; // Tag string allows alphabet, digit and underscore (_) only
  private __combinedTagString = ''; // Tag string allows alphabet, digit and underscore (_) only

  constructor() {
    this.__uniqueName = `${this.constructor.name}__uid_${this.__objectUid}`;
    this.__updateInfo(this.__uniqueName);
  }

  private __updateInfo(uniqueName: string) {
    RnObject.__objects[this.__objectUid] = this;
    RnObject.__uniqueNames[this.__objectUid] = uniqueName;
    RnObject.__objectsByNameMap.set(this.__uniqueName, this);
  }

  static searchByTag(tag: string, value: string) {
    for (const obj of RnObject.__objects) {
      if (obj.getTagValue(tag) === value) {
        return obj;
      }
    }
    return void 0;
  }

  /**
   * Gets the objectUID of the object.
   */
  get objectUID(): ObjectUID {
    return this.__objectUid;
  }

  /**
   * Gets the object by corresponding to the objectUID.
   * @param objectUid The objectUID of the object.
   */
  static getRnObject(objectUid: ObjectUID) {
    return RnObject.__objects[objectUid];
  }

  /**
   * Gets the object by the unique name.
   * @param uniqueName The unique name of the object.
   */
  static getRnObjectByName(uniqueName: string) {
    return RnObject.__objectsByNameMap.get(uniqueName);
  }

  /**
   * Try to set a unique name of the entity.
   * @param name
   * @param toAddNameIfConflict If true, force to add name string to the current unique name string. If false, give up to change name.
   */
  tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean {
    if (RnObject.__uniqueNames.indexOf(name) !== -1) {
      // Conflict
      if (toAddNameIfConflict) {
        const newName = name + '_(' + this.__objectUid + ')';
        if (RnObject.__uniqueNames.indexOf(newName) === -1) {
          this.__uniqueName = newName;
          RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;
          RnObject.__objectsByNameMap.set(this.__uniqueName, this);
          return true;
        }
      }
      return false;
    } else {
      this.__uniqueName = name;
      RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;
      RnObject.__objectsByNameMap.set(this.__uniqueName, this);
      return true;
    }
  }

  /**
   * Validate the string of tags.
   * @param val The string to be validated
   */
  validateTagString(val: string): boolean {
    const reg = new RegExp(/[!"#$%&'()\*\+\-\s\.,\/:;<=>?@\[\\\]^`{|}~]/g);
    if (reg.test(val)) {
      return false;
    }
    return true;
  }

  /**
   * Tries to set tag (name and value).
   * @param tagName The tag name.
   * @param tagValue Tha value of the tag.
   */
  tryToSetTag(tag: Tag): boolean {
    if (this.validateTagString(tag.tag)) {
      if (this.hasTag(tag.tag)) {
        this.removeTag(tag.tag);
      }

      this.__tags[tag.tag] = tag.value;
      this.__combinedTagString += `${tag.tag}:${tag.value}` + ' ';
      return true;
    }
    return false;
  }

  /**
   * Gets the value of the tag.
   * @param tagName The tag name.
   */
  getTagValue(tagName: string): any {
    return this.__tags[tagName];
  }

  /**
   * Gets the tag object.
   * @param tagName The tag name.
   */
  getTag(tagName: string): Tag {
    const tag: Tag = {
      tag: tagName,
      value: this.__tags[tagName],
    };
    return tag;
  }

  /**
   * Gets the boolean value whether this object has the tag or not.
   * @param tagName The tag name.
   */
  hasTag(tagName: string) {
    if (this.__tags[tagName] != null) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Remove the tag.
   * @param tagName The tag name.
   */
  removeTag(tagName: string) {
    const strToDelete = `${tagName}:${this.__tags[tagName]}` + ' ';
    this.__combinedTagString.replace(this.__combinedTagString, '');
    delete this.__tags[tagName];
  }

  /**
   * Confirms the matching of the tag name and tag value.
   * @param tagName The tag name.
   * @param tagValue The tag value.
   */
  matchTag(tagName: string, tagValue: string): boolean {
    if (this.__tags[tagName] === tagValue) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Confirm that this object's tags includes given an array of string.
   * @param stringArray an array of string.
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
   * Confirm that this object's tags includes given set of tags.
   * @param tags The set of tags.
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
   * Get the unique name of the entity.
   */
  get uniqueName() {
    return this.__uniqueName;
  }

  /**
   * @private
   */
  static _reset() {
    this.currentMaxObjectCount = 0;
    this.__uniqueNames = [];
    this.__objectsByNameMap = new Map();
    this.__objects = [];
  }

  _copyFrom(rnObject: RnObject) {
    this.__tags = deepCopyUsingJsonStringify(rnObject.__tags);
    this.__combinedTagString = rnObject.__combinedTagString;
  }
}
