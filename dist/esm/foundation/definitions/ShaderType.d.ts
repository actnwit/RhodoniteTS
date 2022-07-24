import { EnumIO } from '../misc/EnumIO';
export declare type ShaderTypeEnum = EnumIO;
declare function from(index: number): ShaderTypeEnum;
declare function fromString(str: string): ShaderTypeEnum;
export declare const ShaderType: Readonly<{
    VertexShader: EnumIO;
    PixelShader: EnumIO;
    VertexAndPixelShader: EnumIO;
    ComputeShader: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
