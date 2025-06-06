import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

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
cameraComponent.setFovyAndChangeFocalLength(60.0);
cameraComponent.aspect = 1.0;

const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(
    '../../../assets/gltf/glTF-Sample-Assets/Models/SheenCloth/glTF/SheenCloth.gltf',
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
    baseUrl: './../../../assets/ibl/shanghai_bund/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/shanghai_bund/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/shanghai_bund/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
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
const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  gammaCorrectionMaterial,
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);
expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// cameraController
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
controller.dolly = 0.78;

// lighting
await setIBL();

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  } else if (count === 1) {
    p.id = 'started';
    p.innerText = 'Started.';
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
