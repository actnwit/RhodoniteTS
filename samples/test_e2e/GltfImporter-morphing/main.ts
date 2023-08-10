import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.EntityHelper.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(45.0);
cameraComponent.aspect = 1.0;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([3, 0, 3]);
cameraTransform.localEulerAngles = Rn.Vector3.fromCopyArray([0, Math.PI / 4, 0]);

// gltf
const expression = (
  await Rn.GltfImporter.importFromUri(
    '../../../assets/gltf/glTF-Sample-Models/2.0/AnimatedMorphSphere/glTF-Binary/AnimatedMorphSphere.glb',
    {
      cameraComponent: cameraComponent,
    }
  )
).unwrapForce();

// Lights
const lightEntity = Rn.EntityHelper.createLightEntity();
lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([0.4, 0.9, 0.7]);
lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([4.0, 0.0, 5.0]);

let count = 0;
Rn.AnimationComponent.globalTime = 3.6;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.globalTime += 0.016;
    if (Rn.AnimationComponent.globalTime > Rn.AnimationComponent.endInputValue) {
      Rn.AnimationComponent.globalTime -=
        Rn.AnimationComponent.endInputValue - Rn.AnimationComponent.startInputValue;
    }
  }

  Rn.System.process([expression]);

  count++;
});

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
