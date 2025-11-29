import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// Spot Light
const spotLight = Rn.createLightWithCameraEntity();
spotLight.getLight().type = Rn.LightType.Spot;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 1.0, 0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0.0, 3, 0.0]);
mainCameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);

// Depth RenderPass
const renderPassDepth = createRenderPassSpecifyingCameraComponent(spotLight);
const shadowDepthFramebuffer = createFramebuffer(renderPassDepth, 1024, 1024);

// Main RenderPass
const renderPassMain = createRenderPassSpecifyingCameraComponent(mainCameraEntity);

// Scene Objects
const entitySmallBoard = createBallEntityWithMaterial();
const entityLargeBoard = createBoardEntityWithMaterial();

// set Transforms
const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.5, -0.0]);
const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -0.0]);

entitySmallBoard.getTransform().localScale = Rn.Vector3.fromCopy3(0.2, 0.2, 0.2);
entitySmallBoard.getTransform().localPosition = translateSmallBoard;
entityLargeBoard.getTransform().localPosition = translateBigBoard;
entityLargeBoard.getTransform().localScale = Rn.Vector3.fromCopy3(1.5, 1.5, 1.5);

// set entities to render passes
renderPassDepth.addEntities([entitySmallBoard, entityLargeBoard]);
renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

// set depth shader to depth render pass
renderPassDepth.setMaterial(Rn.MaterialHelper.createDepthMomentEncodeMaterial());

const gaussianBlur = new Rn.GaussianBlur();
const [pointShadowMapArrayFramebuffer, _pointShadowMapArrayRenderTargetTexture] =
  Rn.RenderableHelper.createFrameBufferTextureArray({
    width: 1024,
    height: 1024,
    arrayLength: 1,
    level: 0,
    internalFormat: Rn.TextureFormat.RGBA16F,
    format: Rn.PixelFormat.RGBA,
    type: Rn.ComponentType.Float,
  });

const { blurExpression, blurredRenderTarget } = gaussianBlur.createGaussianBlurExpression({
  textureToBlur: shadowDepthFramebuffer.getColorAttachedRenderTargetTexture(0)!,
  parameters: {
    blurPassLevel: 4,
    gaussianKernelSize: 10,
    gaussianVariance: 10,
    synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
    isReduceBuffer: true,
    textureFormat: Rn.TextureFormat.RGBA16F,
    outputFrameBuffer: pointShadowMapArrayFramebuffer,
    outputFrameBufferLayerIndex: 0,
  },
});

// Expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPassDepth, ...blurExpression.renderPasses, renderPassMain]);

// set material parameters
const meshComponentSmallBoard = entitySmallBoard.getMesh();
const meshComponentLargeBoard = entityLargeBoard.getMesh();
setParameterForMeshComponent(
  meshComponentSmallBoard,
  Rn.ShaderSemantics.BaseColorFactor.str,
  Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
);
setParameterForMeshComponent(
  meshComponentLargeBoard,
  Rn.ShaderSemantics.BaseColorFactor.str,
  Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
);
setTextureParameterForMeshComponent(meshComponentSmallBoard, 'depthTexture', blurredRenderTarget);
setTextureParameterForMeshComponent(meshComponentLargeBoard, 'depthTexture', blurredRenderTarget);

window.download = () => {
  renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()!.downloadTexturePixelData();
};

let count = 0;

Rn.Engine.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  Rn.Engine.process([expression]);

  const float32Array = new Float32Array(Rn.Config.maxLightNumber * 16);
  const spotLightComponentSid = spotLight.getLight().componentSID;
  float32Array.set(spotLight.getCamera().biasViewProjectionMatrix._v, spotLightComponentSid * 16);
  setParameterForMeshComponent(
    meshComponentSmallBoard,
    Rn.ShaderSemantics.DepthBiasPV.str,
    new Rn.VectorN(float32Array)
  );
  setParameterForMeshComponent(
    meshComponentLargeBoard,
    Rn.ShaderSemantics.DepthBiasPV.str,
    new Rn.VectorN(float32Array)
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
  const framebuffer = Rn.RenderableHelper.createFrameBuffer({
    width,
    height,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA16F],
    createDepthBuffer: true,
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

function setParameterForMeshComponent(meshComponent: Rn.MeshComponent, shaderSemantic: string, value: any) {
  const mesh = meshComponent.mesh;
  const primitiveNumber = mesh.getPrimitiveNumber();

  for (let j = 0; j < primitiveNumber; j++) {
    const primitive = mesh.getPrimitiveAt(j);
    primitive.material.setParameter(shaderSemantic, value);
  }
}
function setTextureParameterForMeshComponent(
  meshComponent: Rn.MeshComponent,
  shaderSemantic: string,
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
