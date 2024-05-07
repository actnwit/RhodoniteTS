import { EnumIO } from '../misc/EnumIO';
export type ShaderVariableTypeEnum = EnumIO;
declare function from(index: number): ShaderVariableTypeEnum;
declare function fromString(str: string): ShaderVariableTypeEnum;
export declare const ShaderVariableType: Readonly<{
    Varying: EnumIO;
    ReadOnlyData: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
