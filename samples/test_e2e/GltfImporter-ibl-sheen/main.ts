import Rn, { ShaderSemanticsEnum } from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// expressions
const expressions = [];

// camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(60.0);
cameraComponent.aspect = 1.0;

// gltf
const mainExpression = (
  await Rn.GltfImporter.importFromUri(
    '../../../assets/gltf/glTF-Sample-Models/2.0/SheenCloth/glTF/SheenCloth.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  )
).unwrapForce();
expressions.push(mainExpression);

// post effects
const expressionPostEffect = new Rn.Expression();
expressions.push(expressionPostEffect);

// gamma correction (and super sampling)
const mainRenderPass = mainExpression.renderPasses[0];
const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(600, 600, 1, {});
mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass =
  Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
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
await setIBL('./../../../assets/ibl/shanghai_bund');

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

async function setIBL(baseUri) {
  const specularCubeTexture = new Rn.CubeTexture();
  specularCubeTexture.baseUriToLoad = baseUri + '/specular/specular';
  specularCubeTexture.isNamePosNeg = true;
  specularCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  specularCubeTexture.mipmapLevelNumber = 10;

  const diffuseCubeTexture = new Rn.CubeTexture();
  diffuseCubeTexture.baseUriToLoad = baseUri + '/diffuse/diffuse';
  diffuseCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  diffuseCubeTexture.mipmapLevelNumber = 1;
  diffuseCubeTexture.isNamePosNeg = true;

  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(diffuseCubeTexture, specularCubeTexture);
  }
}

function setTextureParameterForMeshComponents(
  meshComponents: Rn.MeshComponent[],
  shaderSemantic: ShaderSemanticsEnum,
  value: Rn.RenderTargetTexture
) {
  const sampler = new Rn.Sampler({
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
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
