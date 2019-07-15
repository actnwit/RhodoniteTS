import { RnTags, ObjectUID } from "../../types/CommonTypes";
/**
 * The root class of the objects in Rhodonite
 */
export default class RnObject {
    private readonly __objectUid;
    private static __objects;
    static readonly InvalidObjectUID = -1;
    static currentMaxObjectCount: number;
    private __uniqueName;
    private static __uniqueNames;
    private __tags;
    private __conbinedTagString;
    private static __objectsByNameMap;
    constructor();
    /**
     * Gets the objectUID of the object.
     */
    readonly objectUID: ObjectUID;
    /**
     * Gets the object by corresponding to the objectUID.
     * @param objectUid The objectUID of the object.
     */
    static getRnObject(objectUid: ObjectUID): RnObject;
    /**
     * Gets the object by the unique name.
     * @param uniqueName The unique name of the object.
     */
    static getRnObjectByName(uniqueName: string): RnObject | undefined;
    /**
     * Try to set a unique name of the entity.
     * @param name
     * @param toAddNameIfConflict If true, force to add name string to the current unique name string. If false, give up to change name.
     */
    tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
    /**
     * Validate the string of tags.
     * @param val The string to be validated
     */
    validateTagString(val: string): boolean;
    /**
     * Tries to set tag (name and value).
     * @param tagName The tag name.
     * @param tagValue Tha value of the tag.
     */
    tryToSetTag(tagName: string, tagValue: string): boolean;
    /**
     * Gets the value of the tag.
     * @param tagName The tag name.
     */
    getTagValue(tagName: string): string;
    /**
     * Gets the tag object.
     * @param tagName The tag name.
     */
    getTag(tagName: string): any;
    /**
     * Gets the boolean value whether this object has the tag or not.
     * @param tagName The tag name.
     */
    hasTag(tagName: string): boolean;
    /**
     * Remove the tag.
     * @param tagName The tag name.
     */
    removeTag(tagName: string): void;
    /**
     * Confirms the matching of the tag name and tag value.
     * @param tagName The tag name.
     * @param tagValue The tag value.
     */
    matchTag(tagName: string, tagValue: string): boolean;
    /**
     * Comfirm that this object's tags includes given an array of string.
     * @param stringArray an array of string.
     */
    matchTagsAsFreeStrings(stringArray: string[]): boolean;
    /**
     * Comfirm that this object's tags includes given set of tags.
     * @param tags The set of tags.
     */
    matchTags(tags: RnTags): boolean;
    /**
     * Get the unique name of the entity.
     */
    readonly uniqueName: string;
}
