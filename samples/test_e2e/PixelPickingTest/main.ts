import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const setupRenderPassEntityUidOutput = function (
  rootGroup: Rn.ISceneGraphEntity,
  cameraComponent: Rn.CameraComponent,
  canvas: HTMLCanvasElement
) {
  const renderPass = new Rn.RenderPass();
  const entityUidOutputMaterial = Rn.MaterialHelper.createEntityUIDOutputMaterial();

  renderPass.setMaterial(entityUidOutputMaterial);
  renderPass.cameraComponent = cameraComponent;

  const framebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA8],
    createDepthBuffer: true,
  });
  renderPass.setFramebuffer(framebuffer);
  renderPass.clearColor = Rn.Vector4.fromCopyArray([0, 0, 0, 1]);
  renderPass.toClearColorBuffer = true;
  renderPass.toClearDepthBuffer = true;

  // rootGroup.getTransform().scale = Rn.Vector3.fromCopyArray([100, 100, 100]);

  renderPass.addEntities([rootGroup]);

  return renderPass;
};

const setupRenderPassRendering = function (
  rootGroup: Rn.ISceneGraphEntity,
  cameraComponent: Rn.CameraComponent
) {
  const renderPass = new Rn.RenderPass();
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([rootGroup]);

  return renderPass;
};

const pick = async function (e: any) {
  const x = e.offsetX;
  const y = window.canvas.clientHeight - e.offsetY;
  const framebuffer = window.renderPassEntityUidOutput.getFramebuffer();
  const renderTargetTexture = framebuffer.getColorAttachedRenderTargetTexture(0);
  const pickedPixel = await renderTargetTexture.getPixelValueAt(x, y);
  console.log(pickedPixel.toString());

  const bitDec = Rn.Vector4.fromCopyArray([1, 255, 65025, 0]);
  const pickedEntityUID = bitDec.dot(pickedPixel);
  console.log(pickedEntityUID);

  return pickedEntityUID;
};

let p: any;

const canvas = document.getElementById('world') as HTMLCanvasElement;
window.canvas = canvas;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas,
});
const expression = new Rn.Expression();

// Camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera() as Rn.CameraComponent;
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(90);
cameraComponent.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// Lights
// const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
// lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 100000.0, 1.0]);
// lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
const lightEntity2 = Rn.createLightEntity();
lightEntity2.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, 10.0]);
(lightEntity2.getLight() as Rn.LightComponent).intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
//lightEntity2.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI/2, 0, 0]);
//lightEntity2.getLight().type = Rn.LightType.Directional;

//  const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/Box/glTF/Box.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/BoxTextured/glTF/BoxTextured.gltf');
//  const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/Lantern/glTF/Lantern.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/WaterBottle/glTF/WaterBottle.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/VC/glTF/VC.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/GearboxAssy/glTF/GearboxAssy.gltf');
// const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/Buggy/glTF/Buggy.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
//  const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
//  const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/Duck/glTF/Duck.gltf');
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/Avocado/glTF/Avocado.gltf');
const response = (
  await Rn.Gltf2Importer.importFromUri(
    '../../../assets/gltf/glTF-Sample-Assets/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb'
  )
).unwrapForce();
//const response = await importer.importFromUri('../../../assets/gltf/glTF-Sample-Models/1.0/BrainStem/glTF/BrainStem.gltf');
const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response);
//rootGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
//  rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);
//  rootGroup.getTransform().scale = Rn.Vector3.fromCopyArray([0.01, 0.01, 0.01]);

const renderPassEntityUidOutput = setupRenderPassEntityUidOutput(
  rootGroup,
  cameraComponent,
  canvas
);
window.renderPassEntityUidOutput = renderPassEntityUidOutput;
const renderPassRendering = setupRenderPassRendering(rootGroup, cameraComponent);
// expression.addRenderPasses([renderPassEntityUidOutput]);
// expression.addRenderPasses([renderPassRendering]);
expression.addRenderPasses([renderPassEntityUidOutput, renderPassRendering]);
// expression.addRenderPasses([renderPassRendering]);

// CameraComponent
const cameraControllerComponent =
  cameraEntity.getCameraController() as Rn.CameraControllerComponent;
(cameraControllerComponent.controller as Rn.OrbitCameraController).setTarget(rootGroup);

Rn.CameraComponent.current = 0;
let startTime = Date.now();
const rotationVec3 = Rn.MutableVector3.one();
let count = 0;

Rn.System.startRenderLoop(async () => {
  if (p == null && count > 0) {
    window._pickedEntityUID = await pick({ offsetX: 300, offsetY: 300 });

    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
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
});

canvas.addEventListener('mousedown', pick);

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
