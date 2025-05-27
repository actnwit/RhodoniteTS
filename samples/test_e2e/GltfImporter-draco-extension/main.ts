import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// expressions
const expressions = [];

// camera
const cameraEntity = Rn.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

// gltf
const mainExpression = (
  await Rn.GltfImporter.importFromUrl(
    '../../../assets/gltf/glTF-Sample-Assets/Models/BarramundiFish/glTF-Draco/BarramundiFish.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  )
);
expressions.push(mainExpression);

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
const mainRenderPass = mainExpression.renderPasses[0];
mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;

const rootGroup = mainRenderPass.sceneTopLevelGraphComponents[0].entity;
const rootTransFormComponent = rootGroup.getTransform();
rootTransFormComponent.localEulerAngles = Rn.Vector3.fromCopyArray([0, Math.PI / 2.0, 0.0]);
rootTransFormComponent.localPosition = Rn.Vector3.fromCopyArray([0, -0.13, -1.5]);

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass =
  Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
    gammaCorrectionMaterial,
    gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
  );
expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// lighting
const lightEntity = Rn.createLightEntity();
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([0.5, 0.5, 0.5]);

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 1) {
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
  }

  Rn.System.process(expressions);
  count++;
});

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
