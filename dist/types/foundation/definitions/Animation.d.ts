import { EnumIO } from "../misc/EnumIO";
export interface AnimationEnum extends EnumIO {
}
declare function from(index: number): AnimationEnum;
declare function fromString(str: string): AnimationEnum;
export declare const Animation: Readonly<{
    Linear: AnimationEnum;
    Step: AnimationEnum;
    CubicSpline: AnimationEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
