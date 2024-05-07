import { EnumIO } from '../misc/EnumIO';
export type ShaderNodeEnum = EnumIO;
declare function from(index: number): ShaderNodeEnum;
declare function fromString(str: string): ShaderNodeEnum;
export declare const ShaderNode: Readonly<{
    ClassicShading: EnumIO;
    PBRShading: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
