export default class RnObject {
  private readonly __objectUid: ObjectUID = -1;
  static currentMaxObjectCount = -1;
  static readonly InvalidObjectUID = -1;
  private __uniqueName: string;
  private static __uniqueNames: string[] = [];
  private __tags: RnTag = {}; // Tag string allows alphabet, digit and underscore (_) only
  private __conbinedTagString: string = ''; // Tag string allows alphabet, digit and underscore (_) only

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

  validateTagString(val: string) {
    var reg = new RegExp(/[!"#$%&'()\*\+\-\s\.,\/:;<=>?@\[\\\]^`{|}~]/g);
    if(reg.test(val)) {
      return true;
    }
    return false;
  }

  tryToSetTag(tagName: string, tagValue: string) {
    if (this.validateTagString(tagName)) {
      if (this.validateTagString(tagValue)) {
        if (this.hasTag(tagName)) {
          this.removeTag(tagName);
        }

        this.__tags[tagName] = tagValue;
        this.__conbinedTagString += `${tagName}:${tagValue}` + ' ';
        return true;
      }
    }
    return false;
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

  removeTag(tagName: string) {
    const strToDelete = `${tagName}:${this.__tags[tagName]}` + ' ';
    this.__conbinedTagString.replace(this.__conbinedTagString, "");
    delete this.__tags[tagName];
  }

  matchTag(tagName: string, tagValue: string) {
    if (this.__tags[tagName] === tagValue) {
      return true;
    } else {
      return false;
    }
  }

  matchTagConbliedAsFree(stringArray: string[]) {
    let regExpStr = '^';

    for (let i=0; i<stringArray.length; i++) {
      regExpStr += `(?=.*${stringArray[i]})`;
    }
    var reg = new RegExp(regExpStr);
    if (reg.test(this.__conbinedTagString)) {
      return true;
    } else {
      return false;
    }
  }

  matchTagConblied(tags: Array<RnTag>) {
    let regExpStr = '^';

    for (let i=0; i<tags.length; i++) {
      regExpStr += `(?=.*${tags[i].tagName}:${tags[i].tagValue})`;
    }
    var reg = new RegExp(regExpStr);
    if (reg.test(this.__conbinedTagString)) {
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
