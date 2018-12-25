export default class RnObject {
  private readonly __objectUid: ObjectUID = 0;
  static currentMaxObjectCount = 0;

  constructor(needToManage = false) {
    if (needToManage) {
      this.__objectUid = ++RnObject.currentMaxObjectCount;
    }
  }

  get objectUid(): ObjectUID {
    return this.__objectUid;
  }
}
