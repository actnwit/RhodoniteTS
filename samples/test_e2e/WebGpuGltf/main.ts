import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

window.Rn = Rn;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.Engine.init({
  approach: Rn.ProcessApproach.WebGPU,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

const assets = await Rn.defaultAssetLoader.load({
  environment: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

let count = 0;

const response = await Rn.Gltf2Importer.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/FlightHelmet/glTF/FlightHelmet.gltf'
);
//---------------------------
const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(response);
//rootGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

// CameraComponent
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
// cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);
const cameraControllerComponent = cameraEntity.getCameraController();
cameraControllerComponent.controller.setTarget(rootGroup);
(cameraControllerComponent.controller as Rn.OrbitCameraController).autoUpdate = false;

// Light
const light = Rn.createLightEntity();
light.getLight().type = Rn.LightType.Directional;

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
// renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([rootGroup]);
renderPass.cameraComponent = cameraComponent;

// expression
const expressions = [];
const envExpression = await createEnvCubeExpression();
expressions.push(envExpression);
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);
expressions.push(expression);

// lighting
await setIBL();

let startTime = Date.now();
let startTimeForPerformanceNow = 0;
const draw = () => {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.isAnimating = true;
    const date = new Date();
    const _rotation = 0.001 * (date.getTime() - startTime);
    //rotationVec3._v[0] = 0.1;
    //rotationVec3._v[1] = rotation;
    //rotationVec3._v[2] = 0.1;
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
  } else {
    Rn.AnimationComponent.isAnimating = false;
  }

  //      console.log(date.getTime());
  Rn.Engine.process(expressions);

  const t0 = Rn.Engine.timeAtProcessBegin;
  const t1 = Rn.Engine.timeAtProcessEnd;
  const msec = t1 - t0;
  const sec = msec / 1000;
  const virtualFps = 1.0 / sec;
  const duration = t1 - startTimeForPerformanceNow;
  if (duration > 1000) {
    console.log(`draw time: ${msec} msec, virtual fps: ${virtualFps} fps`);
    startTimeForPerformanceNow = t1;
  }

  count++;
  requestAnimationFrame(draw);
};

draw();

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export('Rhodonite');
};

async function createEnvCubeExpression() {
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const sampler = new Rn.Sampler({
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', assets.environment, sampler);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);

  const spherePrimitive = new Rn.Sphere();
  spherePrimitive.generate({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.createMeshEntity();
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 20, -20]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

async function setIBL() {
  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
