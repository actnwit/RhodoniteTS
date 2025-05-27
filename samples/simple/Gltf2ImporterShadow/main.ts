import Rn from '../../../dist/esmdev/index.js';

// ---parameters---------------------------------------------------------------------------------------------

const uriGltf = '../../../assets/gltf/glTF-Sample-Models/2.0/AntiqueCamera/glTF/AntiqueCamera.gltf';
const basePathIBL = '../../../assets/ibl/shanghai_bund';

const lightPosition = Rn.Vector3.fromCopyArray([-15.0, 50.0, 30.0]);

const zFarDepth = 3000;

const groundPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, 0.0]);
const groundSize = Rn.Vector3.fromCopyArray([128, 128, 128]);
const rootGroupScale = Rn.Vector3.fromCopyArray([4, 4, 4]);
const resolutionDepthCamera = 1024;

// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: rnCanvasElement,
});

// prepare cameras
const entityCameraDepth = createEntityDepthCamera();
const entityCameraMain = createEntityMainCamera();

// prepare render passes
const entityRootGroup = await createEntityGltf2(uriGltf);
const renderPassesDepth = createRenderPassDepth(entityCameraDepth.getCamera(), entityRootGroup);

const entityEnvironmentCube = await createEntityEnvironmentCube(basePathIBL);
const entityBoardCastedShadow = createEntityBoard(renderPassesDepth);

const renderPassMain = new Rn.RenderPass();
renderPassMain.cameraComponent = entityCameraMain.getCamera();
renderPassMain.addEntities([entityEnvironmentCube, entityBoardCastedShadow, entityRootGroup]);

// set target of camera controller
const cameraControllerComponent = entityCameraMain.getCameraController();
const controller = cameraControllerComponent.controller;
controller.setTarget(entityRootGroup);

// prepare expressions
const expression = createExpression([renderPassesDepth, renderPassMain]);

// set ibl textures
await setIBLTexture(basePathIBL);

// draw
draw([expression]);

// ---functions-----------------------------------------------------------------------------------------

function createEntityDepthCamera() {
  const entityCamera = Rn.createCameraEntity();

  const transformCamera = entityCamera.getTransform();
  transformCamera.localPosition = lightPosition;

  const cameraComponent = entityCamera.getCamera();
  cameraComponent.zNear = zFarDepth / 10000;
  cameraComponent.zFar = zFarDepth;

  const lightDirection = Rn.MutableVector3.multiply(lightPosition, -1.0).normalize();
  cameraComponent.direction = lightDirection;

  return entityCamera;
}

function createEntityMainCamera() {
  const entityCamera = Rn.createCameraControllerEntity();
  return entityCamera;
}

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = (await Rn.Gltf2Importer.importFromUri(uriGltf)).unwrapForce();
  const entityRootGroup = await Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);

  const transformComponent = entityRootGroup.getTransform();
  transformComponent.localScale = rootGroupScale;
  return entityRootGroup;
}

async function createEntityEnvironmentCube(basePathIBL: string) {
  const cubeTextureEnvironment = new Rn.CubeTexture();
  await cubeTextureEnvironment.loadTextureImages({
    baseUrl: basePathIBL + '/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  });

  const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial();
  materialSphere.setParameter('envHdriFormat', Rn.HdriFormat.HDR_LINEAR.index);
  const samplerSphere = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.LinearMipmapLinear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  materialSphere.setTextureParameter('colorEnvTexture', cubeTextureEnvironment, samplerSphere);

  const primitiveSphere = new Rn.Sphere();
  primitiveSphere.generate({
    radius: 2500,
    widthSegments: 40,
    heightSegments: 40,
    material: materialSphere,
  });
  const meshSphere = new Rn.Mesh();
  meshSphere.addPrimitive(primitiveSphere);

  const entitySphere = Rn.createMeshEntity();
  const meshComponentSphere = entitySphere.getMesh();
  meshComponentSphere.setMesh(meshSphere);

  entitySphere.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  entitySphere.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 300, 0]);

  return entitySphere;
}

function createEntityBoard(renderPassDepth: Rn.RenderPass) {
  const material = Rn.MaterialHelper.createShadowMapDecodeClassicSingleMaterial(
    {},
    renderPassDepth
  );
  material.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.0]));
  material.setParameter('shadowColorFactor', Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.5]));
  material.alphaMode = Rn.AlphaMode.Blend;

  const primitive = new Rn.Plane();
  primitive.generate({
    width: 20,
    height: 20,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const entity = Rn.createMeshEntity();
  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

  const transform = entity.getTransform();
  transform.localScale = groundSize;
  transform.localPosition = groundPosition;

  return entity;
}

function createRenderPassDepth(
  cameraComponentDepth: Rn.CameraComponent,
  entityRenderTarget: Rn.ISceneGraphEntity
) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponentDepth;
  renderPass.addEntities([entityRenderTarget]);

  const material = Rn.MaterialHelper.createDepthEncodeMaterial();
  renderPass.setMaterial(material);

  createAndSetFramebuffer(renderPass, resolutionDepthCamera, 1);

  return renderPass;
}

function createAndSetFramebuffer(
  renderPass: Rn.RenderPass,
  resolution: number,
  textureNum: number
) {
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

function createExpression(renderPasses: Rn.RenderPass[]) {
  const expression = new Rn.Expression();
  expression.addRenderPasses(renderPasses);
  return expression;
}

async function setIBLTexture(basePathIBL: string) {
  const cubeTextureSpecular = new Rn.CubeTexture();
  await cubeTextureSpecular.loadTextureImages({
    baseUrl: basePathIBL + '/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  });

  const cubeTextureDiffuse = new Rn.CubeTexture();
  await cubeTextureDiffuse.loadTextureImages({
    baseUrl: basePathIBL + '/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  });

  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];

  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(cubeTextureDiffuse, cubeTextureSpecular);
  }
}

function draw(expressions: Rn.Expression[]) {
  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions));
}
