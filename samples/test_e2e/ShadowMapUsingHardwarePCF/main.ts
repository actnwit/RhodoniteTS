import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// Spot Light
const spotLight = Rn.createLightWithCameraEntity(engine);
spotLight.getLight().type = Rn.LightType.Spot;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
// spotLight.getLight().range = 0.01;
// spotLight.getCamera().zFar = 10000.5;
// spotLight.getCamera().setFovyAndChangeFocalLength(40);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 1.0, 0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity(engine);
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0.5, 3, 0.5]);
mainCameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);

// Depth RenderPass
const renderPassDepth = createRenderPassSpecifyingCameraComponent(spotLight);
createFramebuffer(renderPassDepth, 1024, 1024);

// Main RenderPass
const renderPassMain = createRenderPassSpecifyingCameraComponent(mainCameraEntity as any);

// Expression
const expression = new Rn.Expression();
// expression.addRenderPasses([renderPassDepth]);
expression.addRenderPasses([renderPassDepth, renderPassMain]);

// Scene Objects
const entitySmallBoard = createBoardEntityWithMaterial();
const entityLargeBoard = createBoardEntityWithMaterial();

// set Transforms
const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.5, -0.0]);
const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -0.0]);

entitySmallBoard.getTransform().localScale = Rn.Vector3.fromCopy3(0.2, 0.2, 0.2);
entitySmallBoard.getTransform().localPosition = translateSmallBoard;
// entitySmallBoard.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);
entityLargeBoard.getTransform().localPosition = translateBigBoard;
// entityLargeBoard.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);

// set entities to render passes
renderPassDepth.addEntities([entitySmallBoard, entityLargeBoard]);
renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

// set depth shader to depth render pass
renderPassDepth.setMaterial(Rn.MaterialHelper.createFlatMaterial(engine));

// set parameters
const meshComponentSmallBoard = entitySmallBoard.getMesh();
const meshComponentLargeBoard = entityLargeBoard.getMesh();
setParameterForMeshComponent(
  meshComponentSmallBoard,
  'diffuseColorFactor',
  Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
);
setParameterForMeshComponent(
  meshComponentLargeBoard,
  'diffuseColorFactor',
  Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
);
setTextureParameterForMeshComponent(
  meshComponentSmallBoard,
  'depthTexture',
  renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()
);
setTextureParameterForMeshComponent(
  meshComponentLargeBoard,
  'depthTexture',
  renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()
);

window.download = () => {
  renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()!.downloadTexturePixelData();
};

let count = 0;

engine.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  engine.process([expression]);

  setParameterForMeshComponent(meshComponentSmallBoard, 'depthBiasPV', spotLight.getCamera().biasViewProjectionMatrix);
  setParameterForMeshComponent(meshComponentLargeBoard, 'depthBiasPV', spotLight.getCamera().biasViewProjectionMatrix);
  count++;
});

function createBoardEntityWithMaterial() {
  const entity = Rn.createMeshEntity(engine);

  const primitive = new Rn.Plane(engine);
  primitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material: Rn.MaterialHelper.createClassicUberMaterial(engine, {
      isShadow: true,
    }),
  });

  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh(engine);
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
  return entity;
}

function createFramebuffer(renderPass, height, width) {
  const framebuffer = Rn.RenderableHelper.createDepthBuffer(height, width, {});
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function createRenderPassSpecifyingCameraComponent(lightWithCameraEntity: Rn.ILightEntity & Rn.ICameraEntityMethods) {
  const renderPass = new Rn.RenderPass(engine);
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
  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Nearest,
    minFilter: Rn.TextureParameter.Nearest,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    shadowCompareMode: true,
  });
  const mesh = meshComponent.mesh;
  const primitiveNumber = mesh.getPrimitiveNumber();

  for (let j = 0; j < primitiveNumber; j++) {
    const primitive = mesh.getPrimitiveAt(j);
    primitive.material.setTextureParameter(shaderSemantic, value, sampler);
  }
}
