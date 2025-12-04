import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ isUboEnabled: false, cgApiDebugConsoleOutput: true }),
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/FlightHelmet/glTF/FlightHelmet.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  ),
  environment: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  specular: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

// expressions
const expressions = [];

expressions.push(assets.mainExpression);

// post effects
const expressionPostEffect = new Rn.Expression();
expressions.push(expressionPostEffect);

// gamma correction (and super sampling)
const mainRenderPass = assets.mainExpression.renderPasses[0];
const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer(engine, {
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial(engine);
const gammaCorrectionRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  engine,
  gammaCorrectionMaterial,
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);
expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// cameraController
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
controller.dolly = 0.83;

// lighting
await setIBL();

let count = 0;

engine.startRenderLoop(() => {
  if (count > 100) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  } else if (count === 100) {
    p.id = 'started';
    p.innerText = 'Started.';
  }

  engine.process(expressions);

  count++;
});

async function setIBL() {
  const meshRendererComponents = engine.componentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
