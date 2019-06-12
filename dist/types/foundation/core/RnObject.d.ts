export default class RnObject {
    private readonly __objectUid;
    static currentMaxObjectCount: number;
    static readonly InvalidObjectUID = -1;
    private __uniqueName;
    private static __uniqueNames;
    private __tags;
    private __conbinedTagString;
    constructor();
    readonly objectUid: ObjectUID;
    /**
     * Try to set a unique name of the entity.
     * @param name
     * @param toAddNameIfConflict If true, force to add name string to the current unique name string. If false, give up to change name.
     */
    tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
    validateTagString(val: string): boolean;
    tryToSetTag(tagName: string, tagValue: string): boolean;
    getTagValue(tagName: string): string;
    getTag(tagName: string): any;
    hasTag(tagName: string): boolean;
    removeTag(tagName: string): void;
    matchTag(tagName: string, tagValue: string): boolean;
    matchTagConbliedAsFree(stringArray: string[]): boolean;
    matchTagConblied(tags: RnTags): boolean;
    /**
     * Get the unique name of the entity.
     */
    readonly uniqueName: string;
}
