export default class RnObject {
  private readonly __objectUid: ObjectUID = -1;
  static currentMaxObjectCount = -1;
  static readonly InvalidObjectUID = -1;

  constructor(needToManage = false) {
    if (needToManage) {
      this.__objectUid = ++RnObject.currentMaxObjectCount;
    }
  }

  get objectUid(): ObjectUID {
    return this.__objectUid;
  }
}
