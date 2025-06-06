import Rn from '../../../dist/esmdev/index.js';

// ---parameters---------------------------------------------------------------------------------------------

const lightPosition = Rn.MutableVector3.fromCopyArray([0.0, 3.0, 5.0]);
const zFarDepthCamera = 10.0;

const resolutionDepthCamera = 512;

const diffuseColorFactorSmallBoard = Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1]);
const diffuseColorFactorLargeBoard = Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1]);

const shadowColorFactorLargeBoard = Rn.Vector4.fromCopyArray([0.05, 0.35, 0.25, 1]);

// ---main algorithm-----------------------------------------------------------------------------------------

// load modules
await Promise.all([
  Rn.ModuleManager.getInstance().loadModule('webgl'),
  Rn.ModuleManager.getInstance().loadModule('pbr'),
]);

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: rnCanvasElement,
});

// prepare entities
const entitySmallBoard = createEntityBoard();
setTransformParameterToEntity(
  entitySmallBoard,
  Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]),
  Rn.Vector3.fromCopyArray([0.0, 0.0, -1.0]),
  Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0])
);

const entityLargeBoard = createEntityBoard();
setTransformParameterToEntity(
  entityLargeBoard,
  Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]),
  Rn.Vector3.fromCopyArray([0.0, 0.0, -1.5]),
  Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0])
);

const entitiesRenderTarget = [entitySmallBoard, entityLargeBoard];

// prepare cameras
const directionLight = Rn.MutableVector3.multiply(lightPosition, -1).normalize();
const cameraComponentDepth = createEntityDepthCamera(directionLight).getCamera();
const cameraComponentMain = createEntityMainCamera().getCamera();
const cameraControllerComponent = (cameraComponentMain.entity as Rn.ICameraControllerEntity).getCameraController();
const controller = cameraControllerComponent.controller;
controller.setTarget(entityLargeBoard);
controller.unregisterEventListeners();
controller.registerEventListeners(document.getElementById('world'));

// prepare render passes
const renderPassDepth = createRenderPassDepth(cameraComponentDepth, entitiesRenderTarget);
const framebufferDepth = Rn.RenderableHelper.createFrameBuffer({
  width: resolutionDepthCamera,
  height: resolutionDepthCamera,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
renderPassDepth.setFramebuffer(framebufferDepth);

const renderPassMain = createRenderPassMain(cameraComponentMain, renderPassDepth, entitySmallBoard, entityLargeBoard);

// prepare expressions
const expression = new Rn.Expression();
expression.addRenderPasses([renderPassDepth, renderPassMain]);

// draw
draw([expression], cameraComponentDepth.entity, directionLight);

// ---functions-----------------------------------------------------------------------------------------

function createEntityDepthCamera(directionLight: Rn.MutableVector3) {
  const entityCamera = Rn.createCameraEntity();
  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = lightPosition;

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.zNear = zFarDepthCamera / 100;
  cameraComponent.zFar = zFarDepthCamera;
  cameraComponent.type = Rn.CameraType.Orthographic;
  cameraComponent.direction = directionLight;

  return entityCamera;
}

function createEntityMainCamera() {
  const entityCamera = Rn.createCameraControllerEntity();
  return entityCamera;
}

function createRenderPassDepth(cameraComponentDepth: Rn.CameraComponent, entitiesRenderTarget: Rn.ISceneGraphEntity[]) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponentDepth;
  renderPass.addEntities(entitiesRenderTarget);

  const material = Rn.MaterialHelper.createDepthEncodeMaterial();
  renderPass.setMaterial(material);
  return renderPass;
}

function createRenderPassMain(
  cameraComponent: Rn.CameraComponent,
  renderPassDepth: Rn.RenderPass,
  entitySmallBoard: Rn.IMeshEntity,
  entityLargeBoard: Rn.IMeshEntity
) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([entitySmallBoard, entityLargeBoard]);

  const materialSmallBoard = Rn.MaterialHelper.createShadowMapDecodeClassicSingleMaterial({}, renderPassDepth);
  materialSmallBoard.setParameter('diffuseColorFactor', diffuseColorFactorSmallBoard);

  const meshComponentSmallBoard = entitySmallBoard.getMesh();
  const meshSmallBoard = meshComponentSmallBoard.mesh;
  const primitiveSmallBoard = meshSmallBoard.primitives[0];
  renderPass.setMaterialForPrimitive(materialSmallBoard, primitiveSmallBoard);

  const materialLargeBoard = Rn.MaterialHelper.createShadowMapDecodeClassicSingleMaterial({}, renderPassDepth);
  materialLargeBoard.setParameter('diffuseColorFactor', diffuseColorFactorLargeBoard);
  materialLargeBoard.setParameter('shadowColorFactor', shadowColorFactorLargeBoard);

  const meshComponentLargeBoard = entityLargeBoard.getMesh();
  const meshLargeBoard = meshComponentLargeBoard.mesh;
  const primitiveLargeBoard = meshLargeBoard.primitives[0];
  renderPass.setMaterialForPrimitive(materialLargeBoard, primitiveLargeBoard);

  return renderPass;
}

function createEntityBoard() {
  const primitive = new Rn.Plane();
  primitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
  });

  const entity = Rn.createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  return entity;
}

function setTransformParameterToEntity(
  entity: Rn.ISceneGraphEntity,
  scale: Rn.Vector3,
  translate: Rn.Vector3,
  rotate: Rn.Vector3
) {
  const transform = entity.getTransform();
  transform.localScale = scale;
  transform.localPosition = translate;
  transform.localEulerAngles = rotate;
}

function draw(expressions: Rn.Expression[], entityDepthCamera: Rn.ICameraEntity, directionLight: Rn.MutableVector3) {
  const inputElem = document.getElementById('light_pos') as HTMLInputElement;
  const inputValue = parseFloat(inputElem.value) / 200;
  lightPosition.x = inputValue;
  entityDepthCamera.getTransform().localPosition = lightPosition;
  Rn.MutableVector3.multiplyTo(lightPosition, -1, directionLight).normalize();
  entityDepthCamera.getCamera().direction = directionLight;

  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, entityDepthCamera, directionLight));
}
