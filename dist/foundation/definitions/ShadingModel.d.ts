import { EnumIO } from "../misc/EnumIO";
export interface ShadingModelEnum extends EnumIO {
}
declare function from(index: number): ShadingModelEnum;
export declare const ShadingModel: Readonly<{
    Unknown: ShadingModelEnum;
    Constant: ShadingModelEnum;
    Lambert: ShadingModelEnum;
    BlinnPhong: ShadingModelEnum;
    Phong: ShadingModelEnum;
    from: typeof from;
}>;
export {};
