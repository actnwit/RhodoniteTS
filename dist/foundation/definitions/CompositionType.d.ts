import { EnumIO } from "../misc/EnumIO";
import { ComponentTypeEnum } from "./ComponentType";
import { Count } from "../../commontypes/CommonTypes";
export interface CompositionTypeEnum extends EnumIO {
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
}
declare function from(index: number): CompositionTypeEnum;
declare function fromString(str: string): CompositionTypeEnum;
declare function fromGlslString(str_: string): CompositionTypeEnum;
declare function isArray(compositionType: CompositionTypeEnum): boolean;
export declare const CompositionType: Readonly<{
    Unknown: CompositionTypeEnum;
    Scalar: CompositionTypeEnum;
    Vec2: CompositionTypeEnum;
    Vec3: CompositionTypeEnum;
    Vec4: CompositionTypeEnum;
    Mat2: CompositionTypeEnum;
    Mat3: CompositionTypeEnum;
    Mat4: CompositionTypeEnum;
    Texture2D: CompositionTypeEnum;
    TextureCube: CompositionTypeEnum;
    ScalarArray: CompositionTypeEnum;
    Vec2Array: CompositionTypeEnum;
    Vec3Array: CompositionTypeEnum;
    Vec4Array: CompositionTypeEnum;
    Mat4Array: CompositionTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
    fromGlslString: typeof fromGlslString;
    isArray: typeof isArray;
}>;
export {};
