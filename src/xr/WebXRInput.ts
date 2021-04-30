import {MotionController} from 'webxr-input-profiles/packages/motion-controllers/src/motionController';
import {fetchProfile} from 'webxr-input-profiles/packages/motion-controllers/src/profiles';
import {Constants} from 'webxr-input-profiles/packages/motion-controllers/src/constants';
import { XRFrame, XRInputSource } from 'webxr';
import Gltf2Importer from '../foundation/importer/Gltf2Importer';
import ModelConverter from '../foundation/importer/ModelConverter';
import { Is } from '../foundation/misc/Is';
const oculusProfile = require('webxr-input-profiles/packages/registry/profiles/oculus/oculus-touch.json');

const motionControllers:Map<XRInputSource, MotionController> = new Map();

export async function createMotionController(xrInputSource: XRInputSource, basePath: string) {
  const { profile, assetPath } = await fetchProfile(xrInputSource, basePath);
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

function updateMotionControllerModel(motionController: MotionController) {

  // // Update the 3D model to reflect the button, thumbstick, and touchpad state
  // const motionControllerRoot = MyEngine.scene.getChildByName(motionController.rootNodeName);
  // Object.values(motionController.components).forEach((component: Component) => {
  //   component.visualResponses.forEach((visualResponse) => {
  //     // Find the topmost node in the visualization
  //     const valueNode = motionControllerRoot.getChildByName(visualResponse.valueNodeName);

  //     // Calculate the new properties based on the weight supplied
  //     if (visualResponse.valueNodeProperty === 'visibility') {
  //       valueNode.visible = visualResponse.value;
  //     } else if (visualResponse.valueNodeProperty === 'transform') {
  //       const minNode = motionControllerRoot.getObjectByName(visualResponse.minNodeName);
  //       const maxNode = motionControllerRoot.getObjectByName(visualResponse.maxNodeName);

  //       THREE.Quaternion.slerp(
  //         minNode.quaternion,
  //         maxNode.quaternion,
  //         valueNode.quaternion,
  //         visualResponse.value
  //       );

  //       valueNode.position.lerpVectors(
  //         minNode.position,
  //         maxNode.position,
  //         visualResponse.value
  //       );
  //     }
  //   });
  // });
}
