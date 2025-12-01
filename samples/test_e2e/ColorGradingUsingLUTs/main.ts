import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// prepare memory
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// prepare renderPasses
const cameraComponentMain = createEntityMainCamera().getCamera();
const renderPassMain = createRenderPassMain(cameraComponentMain);
const resolution = rnCanvasElement.width;
createAndSetFramebuffer(renderPassMain, resolution, 1);

const cameraComponentPostEffect = createEntityPostEffectCamera().getCamera();
const renderPassColorGrading = createRenderPassColorGrading(
  './REST_33.C0075.png',
  renderPassMain,
  cameraComponentPostEffect
);

// prepare expressions
const expressionMain = createExpression([renderPassMain]);
const expressionPostEffect = createExpression([renderPassColorGrading]);

const expressions = [expressionMain, expressionPostEffect];

// draw
draw(expressions, true);

// ---functions-----------------------------------------------------------------------------------------

function createEntityMainCamera() {
  const entityCamera = Rn.createCameraEntity(engine, true);
  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.setFovyAndChangeFocalLength(120);

  return entityCamera;
}

function createRenderPassMain(cameraComponent: Rn.CameraComponent) {
  const renderPass = new Rn.RenderPass(engine);
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

function createEntityColoredBoard(diffuseColor: Rn.Vector4) {
  const primitive = new Rn.Plane(engine);
  primitive.generate({
    width: 20,
    height: 20,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  });
  primitive.material.setParameter('diffuseColorFactor', diffuseColor);

  const entity = Rn.createMeshEntity(engine);
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh(engine);
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
  return entity;
}

function createAndSetFramebuffer(renderPass: Rn.RenderPass, resolution: number, textureNum: number) {
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

function createEntityPostEffectCamera() {
  const entityCamera = Rn.createCameraEntity(engine, false);

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;

  return entityCamera;
}

function createRenderPassColorGrading(uri: string, renderPassMain: Rn.RenderPass, cameraComponent: Rn.CameraComponent) {
  const material = Rn.MaterialHelper.createColorGradingUsingLUTsMaterial(engine, { uri }, renderPassMain);

  const boardPrimitive = new Rn.Plane(engine);
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const boardMesh = new Rn.Mesh(engine);
  boardMesh.addPrimitive(boardPrimitive);

  const boardEntity = Rn.createMeshEntity(engine);
  boardEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0.0, 0.0]);
  boardEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -0.5]);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  const renderPass = new Rn.RenderPass(engine);
  renderPass.toClearColorBuffer = false;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function createExpression(renderPasses: Rn.RenderPass[]) {
  const expression = new Rn.Expression();
  expression.addRenderPasses(renderPasses);
  return expression;
}

function draw(expressions: Rn.Expression[], isFirstLoop: boolean) {
  // for e2e-test
  if (!isFirstLoop) {
    window._rendered = true;
  }

  engine.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, false));
}
