import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

// Note: The length of one side of texture must be less than Math.pow(2, 12)
// This is the limit of iOS13.3 (iPhone 6S)
Rn.Config.dataTextureWidth = Math.pow(2, 8);
Rn.Config.dataTextureHeight = Math.pow(2, 9);

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  memoryUsageOrder: {
    cpuGeneric: 1.3,
    gpuInstanceData: 0.6,
    gpuVertexData: 0.0,
  },
});

// params

const displayResolution = 800;
const vrmModelRotation = Rn.Vector3.fromCopyArray([0, (3 / 4) * Math.PI, 0.0]);

// camera
const cameraEntity = Rn.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

// expresions
const expressions = [];

// vrm
const vrmExpression = (
  await Rn.GltfImporter.importFromUri('../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [
      {
        isSkinning: false,
        isMorphing: false,
        makeOutputSrgb: false,
      },
    ],
    autoResizeTexture: true,
    cameraComponent: cameraComponent,
  })
).unwrapForce();
expressions.push(vrmExpression);

const vrmMainRenderPass = vrmExpression.renderPasses[0];
const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
vrmRootEntity.getTransform().localEulerAngles = vrmModelRotation;

// post effects
const expressionPostEffect = new Rn.Expression();
expressions.push(expressionPostEffect);

// gamma correction
const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: displayResolution,
  height: displayResolution,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
for (const renderPass of vrmExpression.renderPasses) {
  renderPass.setFramebuffer(gammaTargetFramebuffer);
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
}
vrmExpression.renderPasses[0].toClearColorBuffer = true;
vrmExpression.renderPasses[0].toClearDepthBuffer = true;

const postEffectCameraEntity = createPostEffectCameraEntity();
const postEffectCameraComponent = postEffectCameraEntity.getCamera();

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass = createPostEffectRenderPass(
  gammaCorrectionMaterial,
  postEffectCameraComponent
);

setTextureParameterForMeshComponents(
  gammaCorrectionRenderPass.meshComponents,
  'baseColorTexture',
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);

// fxaa
const fxaaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: displayResolution,
  height: displayResolution,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
gammaCorrectionRenderPass.setFramebuffer(fxaaTargetFramebuffer);

const fxaaRenderPass = createRenderPassSharingEntitiesAndCamera(gammaCorrectionRenderPass);
const fxaaMaterial = Rn.MaterialHelper.createFXAA3QualityMaterial();
fxaaMaterial.setParameter(
  'screenInfo',
  Rn.Vector2.fromCopyArray2([displayResolution, displayResolution])
);
const sampler = new Rn.Sampler({
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.Linear,
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
  anisotropy: false,
});
fxaaMaterial.setTextureParameter(
  'baseColorTexture',
  fxaaTargetFramebuffer.getColorAttachedRenderTargetTexture(0),
  sampler
);
fxaaRenderPass.setMaterial(fxaaMaterial);

expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass, fxaaRenderPass]);

//set default camera
Rn.CameraComponent.current = 0;

// cameraController
const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
const vrmMainCameraEntity = vrmMainCameraComponent.entity as Rn.ICameraControllerEntity;
const vrmMainCameraControllerComponent = vrmMainCameraEntity.getCameraController();
const controller = vrmMainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.8;
controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);

// Lights
const lightEntity = Rn.createLightEntity();
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0.0, 0.0, Math.PI / 8]);

let count = 0;
let startTime = Date.now();
Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    // const date = new Date();
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
  }

  Rn.System.process(expressions);

  count++;
});

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};

function createPostEffectRenderPass(material: Rn.Material, cameraComponent: Rn.CameraComponent) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);

  const boardEntity = Rn.createMeshEntity();
  boardEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0.0, 0.0]);
  boardEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -0.5]);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function createPostEffectCameraEntity() {
  const cameraEntity = Rn.createCameraEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;
  return cameraEntity;
}

function createRenderPassSharingEntitiesAndCamera(originalRenderPass) {
  const renderPass = new Rn.RenderPass();
  renderPass.addEntities(originalRenderPass.entities);
  renderPass.cameraComponent = originalRenderPass.cameraComponent;

  return renderPass;
}

function setTextureParameterForMeshComponents(
  meshComponents: Rn.MeshComponent[],
  shaderSemantic: string,
  value: Rn.RenderTargetTexture
) {
  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    if (!mesh) continue;

    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setTextureParameter(shaderSemantic, value, sampler);
    }
  }
}
