import { EnumIO } from "../misc/EnumIO";
export interface AnimationInterpolationEnum extends EnumIO {
}
declare function from(index: number): AnimationInterpolationEnum;
declare function fromString(str: string): AnimationInterpolationEnum;
export declare const AnimationInterpolation: Readonly<{
    Linear: AnimationInterpolationEnum;
    Step: AnimationInterpolationEnum;
    CubicSpline: AnimationInterpolationEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
