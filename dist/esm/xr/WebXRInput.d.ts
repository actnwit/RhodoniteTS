import { MotionController } from 'webxr-input-profiles/packages/motion-controllers/src/motionController.js';
import { IEntity } from '../foundation/core/Entity';
import { IMutableVector3 } from '../foundation/math/IVector';
import { IMutableQuaternion } from '../foundation/math/IQuaternion';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { MutableScalar } from '../foundation/math/MutableScalar';
import { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
type WebXRSystemViewerData = {
    viewerTranslate: IMutableVector3;
    viewerScale: MutableVector3;
    viewerOrientation: IMutableQuaternion;
    viewerAzimuthAngle: MutableScalar;
};
export declare function createMotionController(xrInputSource: XRInputSource, basePath: string, profilePriorities: string[]): Promise<ISceneGraphEntity | undefined>;
export declare function updateGamePad(timestamp: number, xrFrame: XRFrame, viewerData: WebXRSystemViewerData): void;
export declare function updateMotionControllerModel(entity: IEntity, motionController: MotionController): void;
export declare function getMotionController(xrInputSource: XRInputSource): MotionController | undefined;
export {};
