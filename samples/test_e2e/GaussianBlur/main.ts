import Rn from '../../../dist/esmdev/index.js';

// ---parameters---------------------------------------------------------------------------------------------

const gaussianKernelSize = 15;
const gaussianVariance = 8.0;

// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

// prepare renderPasses
const cameraComponentMain = createEntityMainCamera().getCamera();
const renderPassMain = createRenderPassMain(cameraComponentMain);
const resolution = rnCanvasElement.width;
createAndSetFramebuffer(renderPassMain, resolution, 1);

const renderPassGaussianBlurH = createRenderPassGaussianBlur(renderPassMain, true);
createAndSetFramebuffer(renderPassGaussianBlurH, resolution, 1);

const renderPassGaussianBlurHV = createRenderPassGaussianBlur(renderPassGaussianBlurH, false);

// prepare expressions
const expressionMain = createExpression([renderPassMain]);
const expressionPostEffect = createExpression([renderPassGaussianBlurH, renderPassGaussianBlurHV]);

const expressions = [expressionMain, expressionPostEffect];

// draw
draw(expressions, true);

// ---functions-----------------------------------------------------------------------------------------
function createEntityMainCamera() {
  const entityCamera = Rn.createCameraEntity();

  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.setFovyAndChangeFocalLength(120);

  return entityCamera;
}

function createRenderPassMain(cameraComponent: Rn.CameraComponent) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;

  const entitySmallBoard = createEntityColoredBoard(Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1]));
  const transformSmallBoard = entitySmallBoard.getTransform();
  transformSmallBoard.localScale = Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]);
  transformSmallBoard.localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.0]);
  transformSmallBoard.localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

  const entityLargeBoard = createEntityColoredBoard(Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1]));
  const transformLargeBoard = entityLargeBoard.getTransform();
  transformLargeBoard.localPosition = Rn.Vector3.fromCopyArray([15, 30, -1.5]);
  transformLargeBoard.localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

  renderPass.addEntities([entitySmallBoard, entityLargeBoard]);
  return renderPass;
}

function createEntityColoredBoard(boardColor: Rn.Vector4) {
  const primitive = new Rn.Plane();
  primitive.generate({
    width: 20,
    height: 20,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  });
  primitive.material.setParameter('diffuseColorFactor', boardColor);

  const entity = Rn.createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
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

function createRenderPassGaussianBlur(renderPassBlurTarget: Rn.RenderPass, isHorizontal: boolean) {
  const material = Rn.MaterialHelper.createGaussianBlurMaterial({
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
