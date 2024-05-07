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

const entityEnvironmentCube = createEntityEnvironmentCube(basePathIBL);
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
  const entityCamera = Rn.EntityHelper.createCameraEntity();

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
  const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
  return entityCamera;
}

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = (await Rn.Gltf2Importer.importFromUri(uriGltf)).unwrapForce();
  const entityRootGroup = Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);

  const transformComponent = entityRootGroup.getTransform();
  transformComponent.localScale = rootGroupScale;
  return entityRootGroup;
}

function createEntityEnvironmentCube(basePathIBL: string) {
  const cubeTextureEnvironment = new Rn.CubeTexture();
  cubeTextureEnvironment.baseUriToLoad = basePathIBL + '/environment/environment';
  cubeTextureEnvironment.isNamePosNeg = true;
  cubeTextureEnvironment.hdriFormat = Rn.HdriFormat.HDR_LINEAR;
  cubeTextureEnvironment.mipmapLevelNumber = 1;
  cubeTextureEnvironment.loadTextureImagesAsync();

  const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial();
  materialSphere.setParameter(
    Rn.EnvConstantMaterialContent.EnvHdriFormat,
    Rn.HdriFormat.HDR_LINEAR.index
  );
  materialSphere.setTextureParameter(Rn.ShaderSemantics.ColorEnvTexture, cubeTextureEnvironment);

  const primitiveSphere = new Rn.Sphere();
  primitiveSphere.generate({
    radius: 2500,
    widthSegments: 40,
    heightSegments: 40,
    material: materialSphere,
  });
  const meshSphere = new Rn.Mesh();
  meshSphere.addPrimitive(primitiveSphere);

  const entitySphere = Rn.EntityHelper.createMeshEntity();
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
  material.setParameter(
    Rn.ShaderSemantics.DiffuseColorFactor,
    Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.0])
  );
  material.setParameter(
    Rn.ShadowMapDecodeClassicMaterialContent.ShadowColorFactor,
    Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.5])
  );
  material.alphaMode = Rn.AlphaMode.Translucent;

  const primitive = new Rn.Plane();
  primitive.generate({
    width: 20,
    height: 20,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const entity = Rn.EntityHelper.createMeshEntity();
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
  textureNum: number,
  property: {
    level?: number | undefined;
    internalFormat?: Rn.TextureParameterEnum | undefined;
    format?: Rn.PixelFormatEnum | undefined;
    type?: Rn.ComponentTypeEnum | undefined;
    magFilter?: Rn.TextureParameterEnum | undefined;
    minFilter?: Rn.TextureParameterEnum | undefined;
    wrapS?: Rn.TextureParameterEnum | undefined;
    wrapT?: Rn.TextureParameterEnum | undefined;
    createDepthBuffer?: boolean | undefined;
    isMSAA?: boolean | undefined;
  } = {}
) {
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
    resolution,
    resolution,
    textureNum,
    property
  );
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
  cubeTextureSpecular.baseUriToLoad = basePathIBL + '/specular/specular';
  cubeTextureSpecular.isNamePosNeg = true;
  cubeTextureSpecular.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  cubeTextureSpecular.mipmapLevelNumber = 10;

  const cubeTextureDiffuse = new Rn.CubeTexture();
  cubeTextureDiffuse.baseUriToLoad = basePathIBL + '/diffuse/diffuse';
  cubeTextureDiffuse.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  cubeTextureDiffuse.mipmapLevelNumber = 1;
  cubeTextureDiffuse.isNamePosNeg = true;

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
