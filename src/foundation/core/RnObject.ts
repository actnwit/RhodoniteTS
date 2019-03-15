export default class RnObject {
  private readonly __objectUid: ObjectUID = -1;
  static currentMaxObjectCount = -1;
  static readonly InvalidObjectUID = -1;
  private __uniqueName: string;
  private static __uniqueNames: string[] = [];
  private __tags: {[s:string]: string} = {};

  constructor() {
    this.__objectUid = ++RnObject.currentMaxObjectCount;

    this.__uniqueName = 'entity_of_uid_' + this.__objectUid;
    RnObject.__uniqueNames[this.__objectUid] =  this.__uniqueName;
  }

  get objectUid(): ObjectUID {
    return this.__objectUid;
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
        const newName = name + '_(' + this.__uniqueName + ')';
        if (RnObject.__uniqueNames.indexOf(newName) === -1) {
          this.__uniqueName = newName;
          RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;
          return true;
        }
      }
      return false;
    } else {
      this.__uniqueName = name;
      RnObject.__uniqueNames[this.__objectUid] = this.__uniqueName;

      return true;
    }
  }

  setTag(tagName: string, tagValue: string) {
    this.__tags[tagName] = tagValue;
  }

  getTagValue(tagName: string) {
    return this.__tags[tagName];
  }

  getTag(tagName: string) {
    const tag :any = {};
    tag[tagName] = this.__tags[tagName];
    return tag;
  }

  hasTag(tagName: string) {
    if (this.__tags[tagName] != null) {
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
}
