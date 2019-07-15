import { EnumIO } from "../misc/EnumIO";
export interface ShaderTypeEnum extends EnumIO {
}
declare function from(index: number): ShaderTypeEnum;
declare function fromString(str: string): ShaderTypeEnum;
export declare const ShaderType: Readonly<{
    VertexShader: ShaderTypeEnum;
    PixelShader: ShaderTypeEnum;
    VertexAndPixelShader: ShaderTypeEnum;
    ComputeShader: ShaderTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
