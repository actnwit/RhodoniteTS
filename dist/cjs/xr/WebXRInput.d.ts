/// <reference types="webxr" />
import { MotionController } from 'webxr-input-profiles/packages/motion-controllers/src/motionController';
import { IEntity } from '../foundation/core/Entity';
import { IMutableVector3 } from '../foundation/math/IVector';
import { IMutableQuaternion } from '../foundation/math/IQuaternion';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { MutableScalar } from '../foundation/math/MutableScalar';
declare type WebXRSystemViewerData = {
    viewerTranslate: IMutableVector3;
    viewerScale: MutableVector3;
    viewerOrientation: IMutableQuaternion;
    viewerAzimuthAngle: MutableScalar;
};
export declare function createMotionController(xrInputSource: XRInputSource, basePath: string, profilePriorities: string[]): Promise<import("..").ISceneGraphEntity | undefined>;
export declare function updateGamePad(timestamp: number, xrFrame: XRFrame, viewerData: WebXRSystemViewerData): void;
export declare function updateMotionControllerModel(entity: IEntity, motionController: MotionController): void;
export declare function getMotionController(xrInputSource: XRInputSource): MotionController | undefined;
export {};
