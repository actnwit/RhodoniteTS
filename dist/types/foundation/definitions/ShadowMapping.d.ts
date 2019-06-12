import { EnumIO } from "../misc/EnumIO";
export interface ShadowMappingEnum extends EnumIO {
}
declare function from(index: number): ShadowMappingEnum;
declare function fromString(str: string): ShadowMappingEnum;
export declare const ShadowMapping: Readonly<{
    Standard: ShadowMappingEnum;
    Variance: ShadowMappingEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
