import { type EnumIO } from '../misc/EnumIO';
export type SdfShapeTypeEnum = EnumIO;
declare function from(index: number): SdfShapeTypeEnum;
declare function fromString(str: string): SdfShapeTypeEnum;
export declare const SdfShapeType: Readonly<{
    Custom: EnumIO;
    Sphere: EnumIO;
    Box: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
