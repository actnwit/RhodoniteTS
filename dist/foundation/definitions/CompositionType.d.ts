import { EnumIO } from "../misc/EnumIO";
export interface CompositionTypeEnum extends EnumIO {
    getNumberOfComponents(): Count;
}
declare function from(index: number): CompositionTypeEnum;
declare function fromString(str: string): CompositionTypeEnum;
export declare const CompositionType: Readonly<{
    Unknown: CompositionTypeEnum;
    Scalar: CompositionTypeEnum;
    Vec2: CompositionTypeEnum;
    Vec3: CompositionTypeEnum;
    Vec4: CompositionTypeEnum;
    Mat2: CompositionTypeEnum;
    Mat3: CompositionTypeEnum;
    Mat4: CompositionTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
