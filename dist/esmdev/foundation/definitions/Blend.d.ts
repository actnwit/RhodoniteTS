import { EnumIO } from '../misc/EnumIO';
export interface BlendEnum extends EnumIO {
    webgpu: string;
}
declare function from(index: number): BlendEnum;
export declare const Blend: Readonly<{
    EquationFuncAdd: BlendEnum;
    Zero: BlendEnum;
    One: BlendEnum;
    SrcAlpha: BlendEnum;
    OneMinusSrcAlpha: BlendEnum;
    Max: BlendEnum;
    from: typeof from;
}>;
export {};
