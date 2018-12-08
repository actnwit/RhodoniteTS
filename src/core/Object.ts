export default class RnObject {
  private readonly __objectUid: ObjectUID;
  static currentMaxObjectCount = 0;

  constructor() {
    this.__objectUid = ++RnObject.currentMaxObjectCount;
  }

  get objectUid() {
    return this.__objectUid;
  }
}
