import type { Component } from 'webxr-input-profiles/packages/motion-controllers/src/component.js';
import { Constants } from 'webxr-input-profiles/packages/motion-controllers/src/constants.js';
import { MotionController } from 'webxr-input-profiles/packages/motion-controllers/src/motionController.js';
import { fetchProfile } from 'webxr-input-profiles/packages/motion-controllers/src/profiles.js';
import type { IEntity } from '../foundation/core/Entity';
import type { ISceneGraphEntity } from '../foundation/helpers/EntityHelper';
import { Gltf2Importer } from '../foundation/importer/Gltf2Importer';
import { ModelConverter } from '../foundation/importer/ModelConverter';
import type { IMutableQuaternion } from '../foundation/math/IQuaternion';
import type { IMutableVector3 } from '../foundation/math/IVector';
import { MutableMatrix33 } from '../foundation/math/MutableMatrix33';
import type { MutableScalar } from '../foundation/math/MutableScalar';
import { MutableVector3 } from '../foundation/math/MutableVector3';
import { Quaternion } from '../foundation/math/Quaternion';
import { Vector3 } from '../foundation/math/Vector3';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import { valueWithDefault } from '../foundation/misc/MiscUtil';
// const oculusProfile = require('webxr-input-profiles/packages/registry/profiles/oculus/oculus-touch.json');

/**
 * Map storing motion controllers associated with their XR input sources
 */
const motionControllers: Map<XRInputSource, MotionController> = new Map();

/**
 * Represents the current state and values of a WebXR input component
 */
type ComponentValues = {
  /** The current state of the component (pressed, touched, default) */
  state: Constants.ComponentState;
  /** Button pressure value (0-1) for button components */
  button?: number;
  /** X-axis value (-1 to 1) for thumbstick/touchpad components */
  xAxis?: number;
  /** Y-axis value (-1 to 1) for thumbstick/touchpad components */
  yAxis?: number;
};

/**
 * Callback function type for handling component state changes
 */
type ComponentChangeCallback = ({
  componentValues,
  handedness,
}: {
  /** Current values of the component */
  componentValues: ComponentValues;
  /** Left or right hand controller */
  handedness: Constants.Handedness;
}) => unknown;

/**
 * General component types for WebXR input devices
 */
const GeneralType = Object.freeze({
  TRIGGER: 'trigger',
  SQUEEZE: 'squeeze',
  TOUCHPAD: 'touchpad',
  THUMBSTICK: 'thumbstick',
  BUTTON_1: 'button_1',
  BUTTON_2: 'button_2',
  BUTTON_3: 'button_3',
  BUTTON_SPECIAL: 'button_special',
});

/**
 * Map of component types to their callback functions
 */
type _ComponentFunctionMap = {
  /** Trigger component callback */
  trigger: ComponentChangeCallback;
  /** Squeeze/grip component callback */
  squeeze: ComponentChangeCallback;
  /** Touchpad component callback */
  touchpad: ComponentChangeCallback;
  /** Thumbstick component callback */
  thumbstick: ComponentChangeCallback;
  /** Primary button callback */
  button_1: ComponentChangeCallback;
  /** Secondary button callback */
  button_2: ComponentChangeCallback;
  /** Tertiary button callback */
  button_3: ComponentChangeCallback;
  /** Special/menu button callback */
  buttonSpecial: ComponentChangeCallback;
};

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
 * Mapping of well-known input component names to general types
 */
const wellKnownMapping = new Map();
wellKnownMapping.set('a_button', GeneralType.BUTTON_1);
wellKnownMapping.set('b_button', GeneralType.BUTTON_2);
wellKnownMapping.set('x_button', GeneralType.BUTTON_1);
wellKnownMapping.set('y_button', GeneralType.BUTTON_2);
wellKnownMapping.set('thumbrest', GeneralType.BUTTON_3);
wellKnownMapping.set('menu', GeneralType.BUTTON_SPECIAL);
wellKnownMapping.set('xr_standard_trigger', GeneralType.TRIGGER);
wellKnownMapping.set('xr_standard_squeeze', GeneralType.SQUEEZE);
wellKnownMapping.set('xr_standard_thumbstick', GeneralType.THUMBSTICK);
wellKnownMapping.set('xr_standard_touchpad', GeneralType.TOUCHPAD);
wellKnownMapping.set('trigger', GeneralType.TRIGGER);
wellKnownMapping.set('squeeze', GeneralType.SQUEEZE);
wellKnownMapping.set('thumbstick', GeneralType.THUMBSTICK);
wellKnownMapping.set('touchpad', GeneralType.TOUCHPAD);

/**
 * Creates and initializes a motion controller for a WebXR input source
 * @param xrInputSource - The WebXR input source to create a controller for
 * @param basePath - Base path for loading controller assets
 * @param profilePriorities - Array of profile names in order of preference
 * @returns Promise that resolves to the root entity of the controller model
 */
export async function createMotionController(
  xrInputSource: XRInputSource,
  basePath: string,
  _profilePriorities: string[]
) {
  const { profile, assetPath } = await fetchProfile(xrInputSource, basePath);
  const motionController = new MotionController(xrInputSource, profile, assetPath!);
  motionControllers.set(xrInputSource, motionController);
  const result = await addMotionControllerToScene(motionController);
  const rootGroup = await ModelConverter.convertToRhodoniteObject(result);
  return rootGroup;
}

/**
 * Loads and adds a motion controller's 3D model to the scene
 * @param motionController - The motion controller to add to the scene
 * @returns Promise that resolves to the loaded asset
 */
async function addMotionControllerToScene(motionController: MotionController) {
  const asset = await Gltf2Importer.importFromUrl(motionController.assetUrl);
  addTouchPointDots(motionController, asset);
  // MyEngine.scene.add(asset);

  return asset;
}

/**
 * Updates all motion controllers' states based on current gamepad input
 * @param timestamp - Current frame timestamp in microseconds
 * @param xrFrame - Current WebXR frame
 * @param viewerData - Current viewer position and orientation data
 */
export function updateGamePad(timestamp: number, _xrFrame: XRFrame, viewerData: WebXRSystemViewerData) {
  // Other frame-loop stuff ...

  Array.from(motionControllers.values()).forEach((motionController: MotionController) => {
    motionController.updateFromGamepad();
    Object.keys(motionController.components).forEach((componentId: string) => {
      const component = motionController.components[componentId];
      processInput(component, (motionController.xrInputSource as XRInputSource).handedness, viewerData, timestamp);
    });
  });

  // Other frame-loop stuff ...
}

/** Last processed timestamp for calculating delta time */
let lastTimestamp = 0;

/**
 * Processes input from a specific component and updates viewer data accordingly
 * @param component - The input component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data to update based on input
 * @param timestamp - Current timestamp in microseconds
 */
function processInput(component: Component, handed: string, viewerData: WebXRSystemViewerData, timestamp: number) {
  const componentName = wellKnownMapping.get(component.rootNodeName);
  if (Is.not.exist(componentName)) {
    return;
  }

  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
    return;
  }

  const deltaSec = (timestamp - lastTimestamp) * 0.000001;
  switch (componentName) {
    case GeneralType.TRIGGER:
      processTriggerInput(component, handed, viewerData, deltaSec);
      break;
    case GeneralType.THUMBSTICK:
      processThumbstickInput(component, handed, viewerData, deltaSec);
      break;
    case GeneralType.SQUEEZE:
      processSqueezeInput(component, handed, viewerData, deltaSec);
      break;
    case GeneralType.BUTTON_1:
    case GeneralType.BUTTON_2:
    case GeneralType.BUTTON_3:
    case GeneralType.BUTTON_SPECIAL:
      processButtonInput(component, handed, viewerData, deltaSec);
      break;
    case GeneralType.TOUCHPAD:
      processTouchpadInput(component, handed, viewerData, deltaSec);
      break;
    default:
  }
}

/** Shared scale vector for trigger input processing */
const scaleVec3 = MutableVector3.one();

/**
 * Processes trigger input and updates viewer scale based on trigger pressure
 * @param triggerComponent - The trigger component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data to update
 * @param deltaSec - Time delta in seconds since last frame
 */
function processTriggerInput(
  triggerComponent: Component,
  handed: string,
  viewerData: WebXRSystemViewerData,
  deltaSec: number
) {
  let value = 0;
  const scale = 0.1;

  const componentName = wellKnownMapping.get(triggerComponent.rootNodeName);
  if (triggerComponent.values.state === Constants.ComponentState.PRESSED) {
    Logger.info(`${componentName}, ${triggerComponent.values.button}, ${handed}`);
    value =
      valueWithDefault({
        value: triggerComponent.values.button,
        defaultValue: 0,
      }) * deltaSec;
    // Fire ray gun
  } else if (triggerComponent.values.state === Constants.ComponentState.TOUCHED) {
    Logger.info(`${componentName}, ${triggerComponent.values.button}, ${handed}`);
    value =
      valueWithDefault({
        value: triggerComponent.values.button,
        defaultValue: 0,
      }) * deltaSec;
    // Show ray gun charging up
  }
  if (handed === 'right') {
    value *= -1;
  }
  scaleVec3.x -= value * scale;
  scaleVec3.y -= value * scale;
  scaleVec3.z -= value * scale;
  scaleVec3.x = Math.max(scaleVec3.x, 0.05);
  scaleVec3.y = Math.max(scaleVec3.y, 0.05);
  scaleVec3.z = Math.max(scaleVec3.z, 0.05);
  scaleVec3.x = Math.min(scaleVec3.x, 3.0);
  scaleVec3.y = Math.min(scaleVec3.y, 3.0);
  scaleVec3.z = Math.min(scaleVec3.z, 3.0);
  viewerData.viewerScale.copyComponents(scaleVec3);
}

/**
 * Processes squeeze/grip input and logs the input state
 * @param squeezeComponent - The squeeze component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data (currently unused)
 * @param deltaSec - Time delta in seconds since last frame (currently unused)
 */
function processSqueezeInput(
  squeezeComponent: Component,
  handed: string,
  _viewerData: WebXRSystemViewerData,
  _deltaSec: number
) {
  const componentName = wellKnownMapping.get(squeezeComponent.rootNodeName);
  if (squeezeComponent.values.state === Constants.ComponentState.PRESSED) {
    Logger.info(`${componentName}, ${squeezeComponent.values.button}, ${handed}`);
    // Fire ray gun
  } else if (squeezeComponent.values.state === Constants.ComponentState.TOUCHED) {
    Logger.info(`${componentName}, ${squeezeComponent.values.button}, ${handed}`);
    // Show ray gun charging up
  }
}

/**
 * Processes thumbstick input for navigation and rotation
 * Right thumbstick controls Y movement and azimuth rotation
 * Left thumbstick controls X/Z movement
 * @param thumbstickComponent - The thumbstick component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data to update based on thumbstick input
 * @param deltaSec - Time delta in seconds since last frame
 */
function processThumbstickInput(
  thumbstickComponent: Component,
  handed: string,
  viewerData: WebXRSystemViewerData,
  deltaSec: number
) {
  const componentName = wellKnownMapping.get(thumbstickComponent.rootNodeName);
  let xAxis = 0;
  let yAxis = 0;
  const deltaScaleHorizontal = 0.25;
  const deltaScaleVertical = 0.1;
  const deltaScaleAzimuthAngle = 0.15;
  if (thumbstickComponent.values.state === Constants.ComponentState.PRESSED) {
    Logger.info(
      `${componentName}, ${thumbstickComponent.values.button}, ${thumbstickComponent.values.state}, ${handed}`
    );
    xAxis =
      valueWithDefault({
        value: thumbstickComponent.values.xAxis,
        defaultValue: 0,
      }) * deltaSec;
    yAxis =
      valueWithDefault({
        value: thumbstickComponent.values.yAxis,
        defaultValue: 0,
      }) * deltaSec;
    // Align the world orientation to the user's current orientation
  } else if (thumbstickComponent.values.state === Constants.ComponentState.TOUCHED) {
    xAxis =
      valueWithDefault({
        value: thumbstickComponent.values.xAxis,
        defaultValue: 0,
      }) * deltaSec;
    yAxis =
      valueWithDefault({
        value: thumbstickComponent.values.yAxis,
        defaultValue: 0,
      }) * deltaSec;
  }
  xAxis = Math.min(xAxis, 1);
  yAxis = Math.min(yAxis, 1);

  const deltaVector = MutableVector3.zero();
  if (handed === 'right') {
    viewerData.viewerAzimuthAngle.x -= xAxis * deltaScaleAzimuthAngle;
    deltaVector.y -= yAxis * deltaScaleVertical * viewerData.viewerScale.x;
  } else {
    deltaVector.x += xAxis * deltaScaleHorizontal * viewerData.viewerScale.x;
    deltaVector.z += yAxis * deltaScaleHorizontal * viewerData.viewerScale.x;
  }
  const orientationMat = MutableMatrix33.fromCopyQuaternion(viewerData.viewerOrientation);
  const rotateMat = orientationMat.multiply(MutableMatrix33.rotateY(viewerData.viewerAzimuthAngle.x));
  rotateMat.multiplyVectorTo(deltaVector, deltaVector as MutableVector3);
  viewerData.viewerTranslate.add(deltaVector);
}

/**
 * Processes button input and logs the button state
 * @param buttonComponent - The button component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data (currently unused)
 * @param deltaSec - Time delta in seconds since last frame (currently unused)
 */
function processButtonInput(
  buttonComponent: Component,
  handed: string,
  _viewerData: WebXRSystemViewerData,
  _deltaSec: number
) {
  const componentName = wellKnownMapping.get(buttonComponent.rootNodeName);
  if (buttonComponent.values.state === Constants.ComponentState.PRESSED) {
    Logger.info(`${componentName}, ${buttonComponent.values.button}, ${buttonComponent.values.state}, ${handed}`);
  } else if (buttonComponent.values.state === Constants.ComponentState.TOUCHED) {
    Logger.info(`${componentName}, ${buttonComponent.values.button}, ${buttonComponent.values.state}, ${handed}`);
  }
}

/**
 * Processes touchpad input for navigation (currently minimal implementation)
 * @param thumbstick - The touchpad component to process
 * @param handed - The handedness of the controller (left/right)
 * @param viewerData - Viewer data (currently unused)
 * @param deltaSec - Time delta in seconds since last frame (currently unused)
 */
function processTouchpadInput(
  thumbstick: Component,
  _handed: string,
  _viewerData: WebXRSystemViewerData,
  _deltaSec: number
) {
  if (thumbstick.values.state === Constants.ComponentState.PRESSED) {
    // Align the world orientation to the user's current orientation
  } else if (thumbstick.values.state === Constants.ComponentState.TOUCHED && thumbstick.values.yAxis !== 0) {
    const _scootDistance = thumbstick.values.yAxis; //* scootIncrement;
    // Scoot the user forward
  }
}

/**
 * Adds visual touch point indicators to motion controller components
 * @param motionController - The motion controller to add touch points to
 * @param asset - The 3D asset of the controller
 */
function addTouchPointDots(motionController: MotionController, asset: any) {
  Object.values(motionController.components).forEach(component => {
    if (component.touchPointNodeName) {
      const _touchPointRoot = asset.getChildByName(component.touchPointNodeName, true);

      // const sphereGeometry = new THREE.SphereGeometry(0.001);
      // const material = new THREE.MeshBasicMaterial({ color: 0x0000FF });
      // const touchPointDot = new THREE.Mesh(sphereGeometry, material);
      // touchPointRoot.add(touchPointDot);
    }
  });
}

/**
 * Updates the visual state of a motion controller model based on component values
 * Animates button presses, trigger pulls, thumbstick movements, etc.
 * @param entity - The root entity containing the controller model
 * @param motionController - The motion controller with current component states
 */
export function updateMotionControllerModel(entity: IEntity, motionController: MotionController) {
  // this codes are from https://immersive-web.github.io/webxr-input-profiles/packages/motion-controllers/#animating-components

  // Update the 3D model to reflect the button, thumbstick, and touchpad state
  const map = entity.getTagValue('rnEntitiesByNames');
  Object.values(motionController.components).forEach((component: Component) => {
    for (const visualResponseName in component.visualResponses) {
      const visualResponse = component.visualResponses[visualResponseName];

      // Find the topmost node in the visualization
      const entity = map.get(visualResponse.valueNodeName);
      if (Is.not.exist(entity)) {
        Logger.warn("The entity of the controller doesn't exist");
        continue;
      }
      // Calculate the new properties based on the weight supplied
      if (visualResponse.valueNodeProperty === 'visibility') {
        entity.getSceneGraph().isVisible = !!visualResponse.value;
      } else if (visualResponse.valueNodeProperty === 'transform') {
        const minNode = map.get(visualResponse.minNodeName!) as ISceneGraphEntity;
        const maxNode = map.get(visualResponse.maxNodeName!) as ISceneGraphEntity;
        if (Is.not.exist(minNode) || Is.not.exist(maxNode)) {
          Logger.warn("The min/max Node of the component of the controller doesn't exist");
          continue;
        }

        const minNodeTransform = minNode.getTransform();
        const maxNodeTransform = maxNode.getTransform();

        entity.getTransform().quaternion = Quaternion.qlerp(
          minNodeTransform.localRotationInner,
          maxNodeTransform.localRotationInner,
          visualResponse.value as number
        );

        entity.getTransform().localPosition = Vector3.lerp(
          minNodeTransform.localPositionInner,
          maxNodeTransform.localPositionInner,
          visualResponse.value as number
        );
      }
    }
  });
}

/**
 * Retrieves the motion controller associated with a specific XR input source
 * @param xrInputSource - The XR input source to get the motion controller for
 * @returns The motion controller if found, undefined otherwise
 */
export function getMotionController(xrInputSource: XRInputSource) {
  return motionControllers.get(xrInputSource);
}
