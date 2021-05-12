import {MotionController} from 'webxr-input-profiles/packages/motion-controllers/src/motionController';
import {fetchProfile} from 'webxr-input-profiles/packages/motion-controllers/src/profiles';
import {Constants} from 'webxr-input-profiles/packages/motion-controllers/src/constants';
import { XRFrame, XRInputSource } from 'webxr';
import Gltf2Importer from '../foundation/importer/Gltf2Importer';
import ModelConverter from '../foundation/importer/ModelConverter';
import { Is } from '../foundation/misc/Is';
import Entity from '../foundation/core/Entity';
import { Component } from 'webxr-input-profiles/packages/motion-controllers/src/component';
import Quaternion from '../foundation/math/Quaternion';
import Vector3 from '../foundation/math/Vector3';
const oculusProfile = require('webxr-input-profiles/packages/registry/profiles/oculus/oculus-touch.json');

const motionControllers:Map<XRInputSource, MotionController> = new Map();

type ComponentValues = {
    state: Constants.ComponentState;
    button?: number;
    xAxis?: number;
    yAxis?: number
  };

type ComponentChangeCallback = ({
  componentValues, handedness}:
  {componentValues: ComponentValues, handedness: Constants.Handedness}
  )=>unknown;

const GeneralType = Object.freeze({
  TRIGGER: 'trigger',
  SQUEEZE: 'squeeze',
  TOUCHPAD: 'touchpad',
  THUMBSTICK: 'thumbstick',
  BUTTON_1: 'button_1',
  BUTTON_2: 'button_2',
  BUTTON_3: 'button_3',
  BUTTON_SPECIAL: 'button_special'
});

type ComponentFunctionMap = {
  'trigger': ComponentChangeCallback;
  'squeeze': ComponentChangeCallback;
  'touchpad': ComponentChangeCallback;
  'thumbstick': ComponentChangeCallback;
  'button_1': ComponentChangeCallback;
  'button_2': ComponentChangeCallback;
  'button_3': ComponentChangeCallback;
  'buttonSpecial': ComponentChangeCallback;
}

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

export async function createMotionController(xrInputSource: XRInputSource, basePath: string, profilePriorities: string[]) {
  const { profile, assetPath } = await fetchProfile(xrInputSource, basePath, undefined, true, profilePriorities);
  const motionController = new MotionController(xrInputSource, profile, assetPath!);
  motionControllers.set(xrInputSource, motionController);
  const asset = await addMotionControllerToScene(motionController);
  const modelConverter = ModelConverter.getInstance();
  if (Is.exist(asset)) {
    const rootGroup = modelConverter.convertToRhodoniteObject(asset);
    return rootGroup;
  } else {
    return undefined;
  }
}


async function addMotionControllerToScene(motionController: MotionController) {
  const importer = Gltf2Importer.getInstance();
  const asset = await importer.import(motionController.assetUrl);
  addTouchPointDots(motionController, asset);
  // MyEngine.scene.add(asset);

  return asset;
}

export function updateGamePad(timestamp: number, xrFrame: XRFrame) {
  // Other frame-loop stuff ...

  Array.from(motionControllers.values()).forEach((motionController: MotionController) => {
    motionController.updateFromGamepad();
    Object.keys(motionController.components).forEach((componentId: string) =>{
      const component = motionController.components[componentId];
      processInput(component, (motionController.xrInputSource as XRInputSource).handedness);
    })
  });

  // Other frame-loop stuff ...


}

function processInput(component: Component, handed: string) {
  const componentName = wellKnownMapping.get(component.rootNodeName);
  if (Is.not.exist(componentName)) {
    return;
  }
  switch(componentName) {
    case GeneralType.TRIGGER:
      processTriggerInput(component, handed); break;
    case GeneralType.THUMBSTICK:
      processThumbstickInput(component, handed); break;
    case GeneralType.SQUEEZE:
      processSqueezeInput(component, handed); break;
    case GeneralType.BUTTON_1:
    case GeneralType.BUTTON_2:
    case GeneralType.BUTTON_3:
    case GeneralType.BUTTON_SPECIAL:
      processButtonInput(component, handed); break;
    case GeneralType.TOUCHPAD:
      processTouchpadInput(component, handed); break;
    default:
  }
}


function processTriggerInput(triggerComponent: Component, handed: string) {
  const componentName = wellKnownMapping.get(triggerComponent.rootNodeName);
  if (triggerComponent.values.state === Constants.ComponentState.PRESSED) {
    console.log(componentName, triggerComponent.values.button, handed);
    // Fire ray gun
  } else if (triggerComponent.values.state === Constants.ComponentState.TOUCHED) {
    const chargeLevel = triggerComponent.values.button;
    console.log(componentName, triggerComponent.values.button, handed);
    // Show ray gun charging up
  }
}

function processSqueezeInput(squeezeComponent: Component, handed: string) {
  const componentName = wellKnownMapping.get(squeezeComponent.rootNodeName);
  if (squeezeComponent.values.state === Constants.ComponentState.PRESSED) {
    console.log(componentName, squeezeComponent.values.button, handed);
    // Fire ray gun
  } else if (squeezeComponent.values.state === Constants.ComponentState.TOUCHED) {
    const chargeLevel = squeezeComponent.values.button;
    console.log(componentName, squeezeComponent.values.button, handed);
    // Show ray gun charging up
  }
}
function processThumbstickInput(thumbstickComponent: Component, handed: string) {
  const componentName = wellKnownMapping.get(thumbstickComponent.rootNodeName);
  if (thumbstickComponent.values.state === Constants.ComponentState.PRESSED) {
    console.log(componentName, thumbstickComponent.values.button, thumbstickComponent.values.state, handed);
    // Align the world orientation to the user's current orientation
  } else if (thumbstickComponent.values.state === Constants.ComponentState.TOUCHED) {
    const scootDistanceX = thumbstickComponent.values.yAxis;//* scootIncrement;
    const scootDistanceY = thumbstickComponent.values.xAxis;//* scootIncrement;
    // Scoot the user forward
    console.log(componentName, `scootDistanceX: ${scootDistanceX}, scootDistanceY: ${scootDistanceY}`, thumbstickComponent.values.state, handed);
  }
}

function processButtonInput(buttonComponent: Component, handed: string) {
  const componentName = wellKnownMapping.get(buttonComponent.rootNodeName);
  if (buttonComponent.values.state === Constants.ComponentState.PRESSED) {
    console.log(componentName, buttonComponent.values.button, buttonComponent.values.state, handed);
  } else if (buttonComponent.values.state === Constants.ComponentState.TOUCHED) {
    console.log(componentName, buttonComponent.values.button, buttonComponent.values.state, handed);
  }
}

function processTouchpadInput(thumbstick: Component, handed: string) {
  if (thumbstick.values.state === Constants.ComponentState.PRESSED) {
    // Align the world orientation to the user's current orientation
  } else if (thumbstick.values.state === Constants.ComponentState.TOUCHED
              && thumbstick.values.yAxis !== 0) {
    const scootDistance = thumbstick.values.yAxis;//* scootIncrement;
    // Scoot the user forward
  }
}

function addTouchPointDots(motionController: MotionController, asset: any) {
  Object.values(motionController.components).forEach((component) => {
    if (component.touchPointNodeName) {
      const touchPointRoot = asset.getChildByName(component.touchPointNodeName, true);

      // const sphereGeometry = new THREE.SphereGeometry(0.001);
      // const material = new THREE.MeshBasicMaterial({ color: 0x0000FF });
      // const touchPointDot = new THREE.Mesh(sphereGeometry, material);
      // touchPointRoot.add(touchPointDot);
    }
  });
}

export function updateMotionControllerModel(entity: Entity, motionController: MotionController) {
  // this codes are from https://immersive-web.github.io/webxr-input-profiles/packages/motion-controllers/#animating-components

  // Update the 3D model to reflect the button, thumbstick, and touchpad state
  const map = entity.getTagValue('rnEntitiesByNames');
  Object.values(motionController.components).forEach((component: Component) => {
    for (const visualResponseName in component.visualResponses) {
      const visualResponse = component.visualResponses[visualResponseName];

      // Find the topmost node in the visualization
      const entity = map.get(visualResponse.valueNodeName);
      if (Is.not.exist(entity)) {
        console.warn(`The entity of the controller doesn't exist`)
        continue;
      }
      // Calculate the new properties based on the weight supplied
      if (visualResponse.valueNodeProperty === 'visibility') {
        entity.getSceneGraph().isVisible = !!visualResponse.value;
      } else if (visualResponse.valueNodeProperty === 'transform') {
        const minNode = map.get(visualResponse.minNodeName!);
        const maxNode = map.get(visualResponse.maxNodeName!);
        if (Is.not.exist(minNode) || Is.not.exist(maxNode)) {
          console.warn(`The min/max Node of the component of the controller doesn't exist`)
          continue;
        }

        const minNodeTransform = minNode.getTransform();
        const maxNodeTransform = maxNode.getTransform();

        entity.getTransform().quaternion = Quaternion.qlerp(
          minNodeTransform.quaternionInner,
          maxNodeTransform.quaternionInner,
          visualResponse.value as number,
        );

        entity.getTransform().translate = Vector3.lerp(
          maxNodeTransform.translateInner,
          minNodeTransform.translateInner,
          visualResponse.value as number
        );
      }
    }
  });
}

export function getMotionController(xrInputSource: XRInputSource) {
  return motionControllers.get(xrInputSource)
}
