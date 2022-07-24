import { EnumIO } from '../misc/EnumIO';
export declare type ShadingModelEnum = EnumIO;
declare function from(index: number): ShadingModelEnum;
export declare const ShadingModel: Readonly<{
    Unknown: EnumIO;
    Constant: EnumIO;
    Lambert: EnumIO;
    BlinnPhong: EnumIO;
    Phong: EnumIO;
    from: typeof from;
}>;
export {};
