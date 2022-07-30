import { EnumIO } from '../misc/EnumIO';
export declare type CameraTypeEnum = EnumIO;
declare function from(index: number): CameraTypeEnum;
declare function fromString(str: string): CameraTypeEnum;
export declare const CameraType: Readonly<{
    Perspective: EnumIO;
    Orthographic: EnumIO;
    Frustum: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
