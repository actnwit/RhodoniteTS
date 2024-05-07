import { EnumIO } from '../misc/EnumIO';
export type LightTypeEnum = EnumIO;
declare function from(index: number): LightTypeEnum;
declare function fromString(str: string): LightTypeEnum;
export declare const LightType: Readonly<{
    Point: EnumIO;
    Directional: EnumIO;
    Spot: EnumIO;
    Ambient: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
