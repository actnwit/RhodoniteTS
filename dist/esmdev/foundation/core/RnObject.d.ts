import { RnTags, ObjectUID } from '../../types/CommonTypes';
/**
 * A Tag class
 */
export declare type Tag = {
    tag: string;
    value: any;
};
/**
 * The Interface of the RnObject.
 */
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
export declare class RnObject implements IRnObject {
    static readonly InvalidObjectUID = -1;
    static currentMaxObjectCount: number;
    private static __uniqueNames;
    private static __objectsByNameMap;
    private static __objects;
    private readonly __objectUid;
    private __uniqueName;
    _tags: RnTags;
    private __combinedTagString;
    constructor();
    private __updateInfo;
    static searchByTag(tag: string, value: string): RnObject | undefined;
    /**
     * Gets the objectUID of the object.
     */
    get objectUID(): ObjectUID;
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
    tryToSetTag(tag: Tag): boolean;
    /**
     * Gets the value of the tag.
     * @param tagName The tag name.
     */
    getTagValue(tagName: string): any;
    /**
     * Gets the tag object.
     * @param tagName The tag name.
     */
    getTag(tagName: string): Tag;
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
     * Confirm that this object's tags includes given an array of string.
     * @param stringArray an array of string.
     */
    matchTagsAsFreeStrings(stringArray: string[]): boolean;
    /**
     * Confirm that this object's tags includes given set of tags.
     * @param tags The set of tags.
     */
    matchTags(tags: RnTags): boolean;
    /**
     * Get the unique name of the entity.
     */
    get uniqueName(): string;
    /**
     * @internal
     */
    static _reset(): void;
    _copyFrom(rnObject: RnObject): void;
}
