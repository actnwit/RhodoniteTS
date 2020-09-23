import { EnumIO } from "../misc/EnumIO";
export interface LightTypeEnum extends EnumIO {
}
declare function from(index: number): LightTypeEnum;
declare function fromString(str: string): LightTypeEnum;
export declare const LightType: Readonly<{
    Point: LightTypeEnum;
    Directional: LightTypeEnum;
    Spot: LightTypeEnum;
    Ambient: LightTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
