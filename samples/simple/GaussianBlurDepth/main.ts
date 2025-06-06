import Rn from '../../../dist/esmdev/index.js';

const gaussianKernelSize = 15;
const gaussianVariance = 8.0;

const resolutionDepthCamera = 512;

// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

// prepare entities
const entitySphere = createEntitySphere();
const entityBoard = createEntityBoard();
const entitiesRenderTarget = [entitySphere, entityBoard];

// prepare cameras
const cameraComponentDepth = createEntityDepthCamera().getCamera();

// prepare render passes
const renderPassDepth = createRenderPassDepthEncode(cameraComponentDepth, entitiesRenderTarget);
createAndSetFramebuffer(renderPassDepth, resolutionDepthCamera, 1);

const renderPassDepthBlurH = createRenderPassGaussianBlurForDepth(renderPassDepth, true);
createAndSetFramebuffer(renderPassDepthBlurH, resolutionDepthCamera, 1);

const renderPassDepthBlurHV = createRenderPassGaussianBlurForDepth(renderPassDepthBlurH, false);

const renderPassesDepth = [renderPassDepth, renderPassDepthBlurH, renderPassDepthBlurHV];

// prepare expressions
const expressionDepthBlur = createExpression(renderPassesDepth);
const expressions = [expressionDepthBlur];

// draw
draw(expressions);

// ---functions-----------------------------------------------------------------------------------------

function createEntityDepthCamera() {
  const entityCamera = Rn.createCameraEntity();
  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.setFovyAndChangeFocalLength(120);
  cameraComponent.zFar = 50.0;

  return entityCamera;
}

function createRenderPassDepthEncode(cameraComponent: Rn.CameraComponent, entitiesTarget: Rn.ISceneGraphEntity[]) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities(entitiesTarget);

  const material = Rn.MaterialHelper.createDepthEncodeMaterial();
  renderPass.setMaterial(material);
  return renderPass;
}

function createEntitySphere() {
  const primitive = new Rn.Sphere();
  primitive.generate({
    radius: 10,
    widthSegments: 20,
    heightSegments: 20,
  });

  const entity = Rn.createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  const transform = entity.getTransform();
  transform.localScale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
  transform.localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, 5.0]);
  transform.localEulerAngles = Rn.Vector3.fromCopyArray([0.0, 0.0, 0.0]);

  return entity;
}

function createEntityBoard() {
  const primitive = new Rn.Plane();
  primitive.generate({
    width: 20,
    height: 20,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  });

  const entity = Rn.createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  const transform = entity.getTransform();
  transform.localScale = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  transform.localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.5]);
  transform.localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

  return entity;
}

function createAndSetFramebuffer(renderPass: Rn.RenderPass, resolution: number, textureNum: number) {
  const framebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: resolution,
    height: resolution,
    textureNum: textureNum,
    textureFormats: [Rn.TextureFormat.RGBA8],
    createDepthBuffer: true,
  });
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function createRenderPassGaussianBlurForDepth(renderPassBlurTarget: Rn.RenderPass, isHorizontal: boolean) {
  const material = Rn.MaterialHelper.createGaussianBlurForEncodedDepthMaterial();

  const gaussianDistributionRatio = Rn.MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
    kernelSize: gaussianKernelSize,
    variance: gaussianVariance,
  });
  material.setParameter('gaussianKernelSize', gaussianKernelSize);
  material.setParameter('gaussianRatio', gaussianDistributionRatio);

  if (isHorizontal === false) {
    material.setParameter('isHorizontal', false);
  }

  const framebufferTarget = renderPassBlurTarget.getFramebuffer();
  material.setParameter('framebufferSize', Rn.Vector2.fromCopy2(framebufferTarget.width, framebufferTarget.height));
  const TextureTarget = framebufferTarget.colorAttachments[0] as Rn.RenderTargetTexture;
  const renderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(material, TextureTarget);

  return renderPass;
}

function createExpression(renderPasses: Rn.RenderPass[]) {
  const expression = new Rn.Expression();
  expression.addRenderPasses(renderPasses);
  return expression;
}

function draw(expressions: Rn.Expression[]) {
  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions));
}
