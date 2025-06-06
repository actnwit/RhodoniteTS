import Rn from '../../../dist/esmdev/index.js';

let p: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(
    '../../../assets/gltf/glTF-Sample-Assets/Models/MetalRoughSpheresNoTextures/glTF-Binary/MetalRoughSpheresNoTextures.glb',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  ),
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
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
});

// expressions
const expressions = [];

expressions.push(assets.mainExpression);

// post effects
const expressionPostEffect = new Rn.Expression();
expressions.push(expressionPostEffect);

// gamma correction
const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
for (const renderPass of assets.mainExpression.renderPasses) {
  renderPass.setFramebuffer(gammaTargetFramebuffer);
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
}
assets.mainExpression.renderPasses[0].toClearColorBuffer = true;
assets.mainExpression.renderPasses[0].toClearDepthBuffer = true;

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  gammaCorrectionMaterial,
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);
expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// cameraController
const mainRenderPass = assets.mainExpression.renderPasses[0];
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.79;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

// lighting
await setIBL();

let count = 0;

Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  Rn.System.process(expressions);

  count++;
});

async function setIBL() {
  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
