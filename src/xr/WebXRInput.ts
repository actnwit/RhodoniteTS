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
  });

  // Other frame-loop stuff ...
}

function processTriggerInput(trigger: any) {
  if (trigger.state === Constants.ComponentState.PRESSED) {
    // Fire ray gun
  } else if (trigger.state === Constants.ComponentState.TOUCHED) {
    const chargeLevel = trigger.buttonValue;
    // Show ray gun charging up
  }
}

function processThumbstickInput(thumbstick: any) {
  // if (thumbstick.values.state === Constants.ComponentState.PRESSED) {
  //   // Align the world orientation to the user's current orientation
  // } else if (thumbstick.values.state === Constants.ComponentState.TOUCHED
  //             && thumbstick.values.yAxis !== 0) {
  //   const scootDistance = thumbstick.values.yAxis * scootIncrement;
  //   // Scoot the user forward
  // }
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
