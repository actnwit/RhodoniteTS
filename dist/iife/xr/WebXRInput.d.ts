import { MotionController } from 'webxr-input-profiles/packages/motion-controllers/src/motionController.js';
import type { IEntity } from '../foundation/core/Entity';
import type { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
import type { IMutableQuaternion } from '../foundation/math/IQuaternion';
import type { IMutableVector3 } from '../foundation/math/IVector';
import type { MutableScalar } from '../foundation/math/MutableScalar';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import type { Engine } from '../foundation/system/Engine';
/**
 * Data structure for tracking WebXR viewer (user) position and orientation
 */
type WebXRSystemViewerData = {
    /** Current position offset of the viewer */
    viewerTranslate: IMutableVector3;
    /** Current scale factor of the viewer */
    viewerScale: MutableVector3;
    /** Current orientation of the viewer */
    viewerOrientation: IMutableQuaternion;
    /** Current azimuth rotation angle of the viewer */
    viewerAzimuthAngle: MutableScalar;
};
/**
 * Creates and initializes a motion controller for a WebXR input source
 * @param xrInputSource - The WebXR input source to create a controller for
 * @param basePath - Base path for loading controller assets
 * @param profilePriorities - Array of profile names in order of preference
 * @returns Promise that resolves to the root entity of the controller model
 */
export declare function createMotionController(engine: Engine, xrInputSource: XRInputSource, basePath: string, _profilePriorities: string[]): Promise<ISceneGraphEntity>;
/**
 * Updates all motion controllers' states based on current gamepad input
 * @param timestamp - Current frame timestamp in microseconds
 * @param xrFrame - Current WebXR frame
 * @param viewerData - Current viewer position and orientation data
 */
export declare function updateGamePad(timestamp: number, _xrFrame: XRFrame, viewerData: WebXRSystemViewerData): void;
/**
 * Updates the visual state of a motion controller model based on component values
 * Animates button presses, trigger pulls, thumbstick movements, etc.
 * @param entity - The root entity containing the controller model
 * @param motionController - The motion controller with current component states
 */
export declare function updateMotionControllerModel(entity: IEntity, motionController: MotionController): void;
/**
 * Retrieves the motion controller associated with a specific XR input source
 * @param xrInputSource - The XR input source to get the motion controller for
 * @returns The motion controller if found, undefined otherwise
 */
export declare function getMotionController(xrInputSource: XRInputSource): MotionController | undefined;
export {};
