import { EnumIO } from "../misc/EnumIO";
export interface ShaderVariableUpdateIntervalEnum extends EnumIO {
}
declare function from(index: number): ShaderVariableUpdateIntervalEnum;
declare function fromString(str: string): ShaderVariableUpdateIntervalEnum;
export declare const ShaderVariableUpdateInterval: Readonly<{
    FirstTimeOnly: ShaderVariableUpdateIntervalEnum;
    EveryTime: ShaderVariableUpdateIntervalEnum;
    RenderPass: ShaderVariableUpdateIntervalEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
