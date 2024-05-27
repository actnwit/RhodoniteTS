import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Spot Light
const spotLight = Rn.EntityHelper.createLightWithCameraEntity();
spotLight.getLight().type = Rn.LightType.Spot;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 1.0, 0);

// Main Camera
const mainCameraEntity = Rn.EntityHelper.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0.5, 3, 0.5]);
mainCameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);

// Depth RenderPass
const renderPassDepth = createRenderPassSpecifyingCameraComponent(spotLight);
createFramebuffer(renderPassDepth, 1024, 1024);

// Main RenderPass
const renderPassMain = createRenderPassSpecifyingCameraComponent(mainCameraEntity);

// Expression
const expression = new Rn.Expression();
// expression.addRenderPasses([renderPassDepth]);
// expression.addRenderPasses([renderPassMain]);
expression.addRenderPasses([renderPassDepth, renderPassMain]);

// Scene Objects
const entitySmallBoard = createBallEntityWithMaterial();
const entityLargeBoard = createBoardEntityWithMaterial();

// set Transforms
const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.5, -0.0]);
const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -0.0]);

entitySmallBoard.getTransform().localScale = Rn.Vector3.fromCopy3(0.2, 0.2, 0.2);
entitySmallBoard.getTransform().localPosition = translateSmallBoard;
// entitySmallBoard.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);
entityLargeBoard.getTransform().localPosition = translateBigBoard;
entityLargeBoard.getTransform().localScale = Rn.Vector3.fromCopy3(1.5, 1.5, 1.5);
// entityLargeBoard.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);

// set entities to render passes
renderPassDepth.addEntities([entitySmallBoard, entityLargeBoard]);
renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

// set depth shader to depth render pass
renderPassDepth.setMaterial(Rn.MaterialHelper.createDepthMomentEncodeMaterial());

// set material parameters
const meshComponentSmallBoard = entitySmallBoard.getMesh();
const meshComponentLargeBoard = entityLargeBoard.getMesh();
setParameterForMeshComponent(
  meshComponentSmallBoard,
  Rn.ShaderSemantics.BaseColorFactor,
  Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
);
setParameterForMeshComponent(
  meshComponentLargeBoard,
  Rn.ShaderSemantics.BaseColorFactor,
  Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
);
setTextureParameterForMeshComponent(
  meshComponentSmallBoard,
  Rn.ShaderSemantics.DepthTexture,
  renderPassDepth.getFramebuffer().getColorAttachedRenderTargetTexture(0)
);
setTextureParameterForMeshComponent(
  meshComponentLargeBoard,
  Rn.ShaderSemantics.DepthTexture,
  renderPassDepth.getFramebuffer().getColorAttachedRenderTargetTexture(0)
);

window.download = function () {
  renderPassDepth
    .getFramebuffer()
    .getDepthAttachedRenderTargetTexture()!
    .downloadTexturePixelData();
};

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  Rn.System.process([expression]);

  setParameterForMeshComponent(
    meshComponentSmallBoard,
    Rn.ShaderSemantics.DepthBiasPV,
    spotLight.getCamera().biasViewProjectionMatrix
  );
  setParameterForMeshComponent(
    meshComponentLargeBoard,
    Rn.ShaderSemantics.DepthBiasPV,
    spotLight.getCamera().biasViewProjectionMatrix
  );
  count++;
});

function createBallEntityWithMaterial() {
  const ballEntity = Rn.MeshHelper.createSphere({
    radius: 1.0,
    widthSegments: 40,
    heightSegments: 40,
    material: Rn.MaterialHelper.createPbrUberMaterial({
      isShadow: true,
    }),
  });

  return ballEntity;
}

function createBoardEntityWithMaterial() {
  const entity = Rn.MeshHelper.createPlane({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material: Rn.MaterialHelper.createPbrUberMaterial({
      isShadow: true,
    }),
  });
  return entity;
}

function createFramebuffer(renderPass, height, width) {
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(height, width, 1, {
    level: 0,
    internalFormat: Rn.TextureParameter.RG32F,
    format: Rn.PixelFormat.RG,
    type: Rn.ComponentType.Float,
    createDepthBuffer: true,
    isMSAA: false,
    sampleCountMSAA: 1,
  });
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function createRenderPassSpecifyingCameraComponent(lightWithCameraEntity: Rn.ICameraEntityMethods) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = lightWithCameraEntity.getCamera();
  return renderPass;
}

function setParameterForMeshComponent(meshComponent, shaderSemantic, value) {
  const mesh = meshComponent.mesh;
  const primitiveNumber = mesh.getPrimitiveNumber();

  for (let j = 0; j < primitiveNumber; j++) {
    const primitive = mesh.getPrimitiveAt(j);
    primitive.material.setParameter(shaderSemantic, value);
  }
}
function setTextureParameterForMeshComponent(
  meshComponent: Rn.MeshComponent,
  shaderSemantic: Rn.ShaderSemanticsEnum,
  value: Rn.RenderTargetTexture
) {
  const mesh = meshComponent.mesh;
  const primitiveNumber = mesh.getPrimitiveNumber();

  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  for (let j = 0; j < primitiveNumber; j++) {
    const primitive = mesh.getPrimitiveAt(j);
    primitive.material.setTextureParameter(shaderSemantic, value, sampler);
  }
}
