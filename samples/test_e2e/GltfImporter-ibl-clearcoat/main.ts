import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  rnWebGLDebug: true,
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
    '../../../assets/gltf/glTF-Sample-Models/2.0/ClearCoatTest/glTF-Binary/ClearCoatTest.glb',
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

const postEffectCameraEntity = createPostEffectCameraEntity();
const postEffectCameraComponent = postEffectCameraEntity.getCamera();

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
const gammaCorrectionRenderPass = createPostEffectRenderPass(
  gammaCorrectionMaterial,
  postEffectCameraComponent
);

setTextureParameterForMeshComponents(
  gammaCorrectionRenderPass.meshComponents,
  Rn.ShaderSemantics.BaseColorTexture,
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);

expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// cameraController
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
controller.dolly = 0.78;

// lighting
setIBL('./../../../assets/ibl/shanghai_bund');

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 70) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  } else if (count === 1) {
    p.id = 'started';
    p.innerText = 'Started.';
  }

  Rn.System.process(expressions);

  count++;
});

function setIBL(baseUri) {
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
  for (let i = 0; i < meshRendererComponents.length; i++) {
    const meshRendererComponent = meshRendererComponents[i];
    meshRendererComponent.specularCubeMap = specularCubeTexture;
    meshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
  }
}

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

  const boardEntity = Rn.EntityHelper.createMeshEntity();
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
  const cameraEntity = Rn.EntityHelper.createCameraEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;
  return cameraEntity;
}

function setTextureParameterForMeshComponents(meshComponents, shaderSemantic, value) {
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    if (!mesh) continue;

    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setTextureParameter(shaderSemantic, value);
    }
  }
}
