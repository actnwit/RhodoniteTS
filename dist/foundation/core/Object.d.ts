export default class RnObject {
    private readonly __objectUid;
    static currentMaxObjectCount: number;
    static readonly InvalidObjectUID = -1;
    constructor(needToManage?: boolean);
    readonly objectUid: ObjectUID;
}
