import { EnumIO } from '../misc/EnumIO';
export type AnimationAttributeEnum = EnumIO;
declare function from(index: number): AnimationAttributeEnum;
declare function fromString(str: string): AnimationAttributeEnum;
export declare const AnimationAttribute: Readonly<{
    Quaternion: EnumIO;
    Translate: EnumIO;
    Scale: EnumIO;
    Weights: EnumIO;
    Effekseer: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
