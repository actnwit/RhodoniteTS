import { EnumIO } from '../misc/EnumIO';
export type ShadowMapEnum = EnumIO;
declare function from(index: number): ShadowMapEnum | undefined;
declare function fromString(str: string): ShadowMapEnum;
export declare const ShadowMap: Readonly<{
    Standard: EnumIO;
    Variance: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
