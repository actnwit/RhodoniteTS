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
const cameraComponentMain = createEntityMainCamera().getCamera();

// prepare render passes
const renderPassesDepth = createRenderPassesDepth(
  cameraComponentDepth,
  entitiesRenderTarget,
  false
);
const renderPassesSquareDepth = createRenderPassesDepth(
  cameraComponentDepth,
  entitiesRenderTarget,
  true
);

const renderPassDepthBlurHV = renderPassesDepth[2];
const renderPassSquareDepthBlurHV = renderPassesSquareDepth[2];
const renderPassMain = createRenderPassMain(
  cameraComponentMain,
  entitySphere,
  entityBoard,
  cameraComponentDepth,
  renderPassDepthBlurHV,
  renderPassSquareDepthBlurHV
);

// prepare expressions
const expressionDepthBlur = createExpression(renderPassesDepth);
const expressionSquareDepthBlur = createExpression(renderPassesSquareDepth);
const expressionMain = createExpression([renderPassMain]);

const expressions = [expressionDepthBlur, expressionSquareDepthBlur, expressionMain];

// draw
draw(expressions, true);

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

function createEntityMainCamera() {
  const entityCamera = Rn.createCameraControllerEntity();
  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = Rn.Vector3.fromCopyArray([-0.1, -0.1, 10.0]);

  return entityCamera;
}

function createRenderPassesDepth(
  cameraComponentDepth: Rn.CameraComponent,
  entitiesRenderTarget: Rn.IMeshEntity[],
  isSquareDepth: boolean
) {
  const renderPassDepth = createRenderPassDepthEncode(
    cameraComponentDepth,
    entitiesRenderTarget,
    isSquareDepth
  );
  createAndSetFramebuffer(renderPassDepth, resolutionDepthCamera, 1);

  const renderPassDepthBlurH = createRenderPassGaussianBlurForDepth(renderPassDepth, true);
  createAndSetFramebuffer(renderPassDepthBlurH, resolutionDepthCamera, 1);

  const renderPassDepthBlurHV = createRenderPassGaussianBlurForDepth(renderPassDepthBlurH, false);
  createAndSetFramebuffer(renderPassDepthBlurHV, resolutionDepthCamera, 1);

  return [renderPassDepth, renderPassDepthBlurH, renderPassDepthBlurHV];
}

function createRenderPassDepthEncode(
  cameraComponent: Rn.CameraComponent,
  entitiesTarget: Rn.IMeshEntity[],
  isSquareDepth: boolean
) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities(entitiesTarget);

  const material = Rn.MaterialHelper.createDepthEncodeMaterial({
    depthPow: isSquareDepth ? 2.0 : 1.0,
  });
  renderPass.setMaterial(material);
  return renderPass;
}

function createRenderPassMain(
  cameraComponent: Rn.CameraComponent,
  entitySphere: Rn.IMeshEntity,
  entityBoard: Rn.IMeshEntity,
  cameraComponentDepth: Rn.CameraComponent,
  renderPassDepthBlurHV: Rn.RenderPass,
  renderPassSquareDepthBlurHV: Rn.RenderPass
) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([entitySphere, entityBoard]);

  // set variance shadow material for sphere primitive in this render pass
  const materialSphere = Rn.MaterialHelper.createVarianceShadowMapDecodeClassicSingleMaterial(
    { depthCameraComponent: cameraComponentDepth },
    [renderPassDepthBlurHV, renderPassSquareDepthBlurHV]
  );
  materialSphere.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1]));
  materialSphere.setParameter('shadowColor', Rn.Vector4.fromCopyArray([0.25, 0.05, 0.2, 1]));
  materialSphere.setParameter('minimumVariance', Rn.Scalar.fromCopyNumber(0.01));
  const primitiveSphere = entitySphere.getMesh().mesh.primitives[0];
  renderPass.setMaterialForPrimitive(materialSphere, primitiveSphere);

  // set variance shadow material for board primitive in this render pass
  const materialBoard = Rn.MaterialHelper.createVarianceShadowMapDecodeClassicSingleMaterial(
    { depthCameraComponent: cameraComponentDepth },
    [renderPassDepthBlurHV, renderPassSquareDepthBlurHV]
  );
  materialBoard.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1]));
  materialBoard.setParameter('shadowColor', Rn.Vector4.fromCopyArray([0.05, 0.35, 0.25, 1]));
  materialBoard.setParameter('minimumVariance', Rn.Scalar.fromCopyNumber(0.01));
  const primitiveBoard = entityBoard.getMesh().mesh.primitives[0];
  renderPass.setMaterialForPrimitive(materialBoard, primitiveBoard);

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

function createAndSetFramebuffer(
  renderPass: Rn.RenderPass,
  resolution: number,
  textureNum: number
) {
  const framebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: resolution,
    height: resolution,
    textureNum,
    textureFormats: [Rn.TextureFormat.RGBA8],
    createDepthBuffer: true,
  });
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function createRenderPassGaussianBlurForDepth(
  renderPassBlurTarget: Rn.RenderPass,
  isHorizontal: boolean
) {
  const material = Rn.MaterialHelper.createGaussianBlurForEncodedDepthMaterial({
    additionalName: '',
    maxInstancesNumber: 10,
  });

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
  material.setParameter(
    'framebufferSize',
    Rn.Vector2.fromCopy2(framebufferTarget.width, framebufferTarget.height)
  );
  const TextureTarget = framebufferTarget.colorAttachments[0] as Rn.RenderTargetTexture;
  const renderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
    material,
    TextureTarget
  );

  return renderPass;
}

function createExpression(renderPasses: Rn.RenderPass[]) {
  const expression = new Rn.Expression();
  expression.addRenderPasses(renderPasses);
  return expression;
}

function draw(expressions: Rn.Expression[], isFirstLoop: boolean, pElem?: HTMLElement) {
  // for e2e-test
  if (pElem === undefined && !isFirstLoop) {
    pElem = document.createElement('p');
    pElem.setAttribute('id', 'rendered');
    pElem.innerText = 'Rendered.';
    document.body.appendChild(pElem);
  }

  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, false, pElem));
}
