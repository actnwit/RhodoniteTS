import { EnumIO } from '../misc/EnumIO';
export declare type ShaderVariableUpdateIntervalEnum = EnumIO;
declare function from(index: number): ShaderVariableUpdateIntervalEnum;
declare function fromString(str: string): ShaderVariableUpdateIntervalEnum;
export declare const ShaderVariableUpdateInterval: Readonly<{
    FirstTimeOnly: EnumIO;
    EveryTime: EnumIO;
    RenderPass: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
