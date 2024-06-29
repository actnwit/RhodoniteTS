import { EnumIO } from '../misc/EnumIO';
export type ToneMappingTypeEnum = EnumIO;
declare function from(index: number): ToneMappingTypeEnum;
export declare const ToneMappingType: Readonly<{
    None: EnumIO;
    KhronosPbrNeutral: EnumIO;
    Reinhard: EnumIO;
    GT_ToneMap: EnumIO;
    ACES_Narkowicz: EnumIO;
    ACES_Hill: EnumIO;
    ACES_Hill_Exposure_Boost: EnumIO;
    from: typeof from;
}>;
export {};
