import { EnumIO } from "../misc/EnumIO";
export interface CameraTypeEnum extends EnumIO {
}
declare function from(index: number): CameraTypeEnum;
declare function fromString(str: string): CameraTypeEnum;
export declare const CameraType: Readonly<{
    Perspective: CameraTypeEnum;
    Orthographic: CameraTypeEnum;
    Frustom: CameraTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
