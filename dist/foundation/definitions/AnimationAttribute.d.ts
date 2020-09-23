import { EnumIO } from "../misc/EnumIO";
export interface AnimationAttributeEnum extends EnumIO {
}
declare function from(index: number): AnimationAttributeEnum;
declare function fromString(str: string): AnimationAttributeEnum;
export declare const AnimationAttribute: Readonly<{
    Quaternion: AnimationAttributeEnum;
    Translate: AnimationAttributeEnum;
    Scale: AnimationAttributeEnum;
    Weights: AnimationAttributeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
