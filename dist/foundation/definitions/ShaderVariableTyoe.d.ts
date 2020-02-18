import { EnumIO } from "../misc/EnumIO";
export interface ShaderVariableTypeEnum extends EnumIO {
}
declare function from(index: number): ShaderVariableTypeEnum;
declare function fromString(str: string): ShaderVariableTypeEnum;
export declare const ShaderType: Readonly<{
    Varying: ShaderVariableTypeEnum;
    ReadOnlyData: ShaderVariableTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
