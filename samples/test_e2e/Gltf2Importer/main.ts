import Rn from '../../../dist/esmdev/index.js';
let p: any;

declare const window: any;

//-------------------------------
const gl = await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// Lights
const lightEntity = Rn.EntityHelper.createLightEntity();
lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 1.0, 100000.0]);
lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
lightEntity.getLight().type = Rn.LightType.Directional;
//lightEntity2.getLight().type = Rn.LightType.Directional;

const response = await Rn.Gltf2Importer.importFromUri(
  '../../../assets/gltf/glTF-Sample-Models/2.0/BoxAnimated/glTF/BoxAnimated.gltf'
);
//---------------------------
const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response.unwrapForce());
//rootGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
cameraControllerComponent.controller.setTarget(rootGroup);

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.toClearColorBuffer = true;
renderPass.addEntities([rootGroup]);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.current = 0;
let startTime = Date.now();
const rotationVec3 = Rn.MutableVector3.one();
let count = 0;
const draw = function () {
  if (p == null && count > 0) {
    if (response != null) {
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, 600, 600);
      gl.clearColor(0.8, 0.8, 0.8, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
    window._rendered = true;
  }

  if (window.isAnimating) {
    const date = new Date();
    const rotation = 0.001 * (date.getTime() - startTime);
    //rotationVec3._v[0] = 0.1;
    //rotationVec3._v[1] = rotation;
    //rotationVec3._v[2] = 0.1;
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
    //console.log(time);
    //      rootGroup.getTransform().scale = rotationVec3;
    //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
  }

  Rn.System.process([expression]);
  count++;

  requestAnimationFrame(draw);
};

draw();
//-----------------

//---------------------
window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
