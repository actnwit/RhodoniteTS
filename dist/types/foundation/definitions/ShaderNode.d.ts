import { EnumIO } from "../misc/EnumIO";
export interface ShaderNodeEnum extends EnumIO {
}
declare function from(index: number): ShaderNodeEnum;
declare function fromString(str: string): ShaderNodeEnum;
export declare const ShaderNode: Readonly<{
    ClassicShading: ShaderNodeEnum;
    PBRShading: ShaderNodeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
