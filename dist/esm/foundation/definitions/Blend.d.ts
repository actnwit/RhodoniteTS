import { EnumIO } from '../misc/EnumIO';
export declare type BlendEnum = EnumIO;
declare function from(index: number): BlendEnum;
export declare const Blend: Readonly<{
    EquationFuncAdd: EnumIO;
    One: EnumIO;
    SrcAlpha: EnumIO;
    OneMinusSrcAlpha: EnumIO;
    from: typeof from;
}>;
export {};
