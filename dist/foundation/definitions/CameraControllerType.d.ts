import { EnumIO } from "../misc/EnumIO";
export interface CameraControllerTypeEnum extends EnumIO {
}
declare function from(index: number): CameraControllerTypeEnum;
declare function fromString(str: string): CameraControllerTypeEnum;
export declare const CameraControllerType: Readonly<{
    Orbit: CameraControllerTypeEnum;
    WalkThrough: CameraControllerTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
