import { EnumIO } from '../misc/EnumIO';
export declare type CameraControllerTypeEnum = EnumIO;
declare function from(index: number): CameraControllerTypeEnum;
declare function fromString(str: string): CameraControllerTypeEnum;
export declare const CameraControllerType: Readonly<{
    Orbit: EnumIO;
    WalkThrough: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
