import Rn from '../../../dist/esmdev/index.js';

// ---parameters---------------------------------------------------------------------------------------------

const uriGltf = '../../../assets/gltf/glTF-Sample-Models/2.0/AntiqueCamera/glTF/AntiqueCamera.gltf';
const basePathIBL = '../../../assets/ibl/shanghai_bund';

// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

// when "ProcessApproach.DataTexture" is specified,
// we need to specify the following setting in order to avoid the error
//  "Too many temporary registers required to compile shader".
Rn.Config.isUboEnabled = false;

// prepare cameras
const entityMainCamera = createEntityMainCamera();
const entityPostEffectCamera = createEntityPostEffectCamera();

// prepare renderPasses
const renderPassMain = await createRenderPassMain(uriGltf, basePathIBL, entityMainCamera);
createAndSetFrameBufferAndMSAAFramebuffer(renderPassMain, rnCanvasElement.width);

const materialGamma = Rn.MaterialHelper.createGammaCorrectionMaterial();
const sampler = new Rn.Sampler({
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
  minFilter: Rn.TextureParameter.Linear,
  magFilter: Rn.TextureParameter.Linear,
});
materialGamma.setTextureParameter(
  Rn.ShaderSemantics.BaseColorTexture,
  renderPassMain.getResolveFramebuffer().colorAttachments[0] as Rn.RenderTargetTexture,
  sampler
);
const renderPassGamma = createRenderPassPostEffect(
  materialGamma,
  entityPostEffectCamera.getCamera()
);

const expression = new Rn.Expression();
expression.addRenderPasses([renderPassMain, renderPassGamma]);

// set ibl textures
await setIBLTexture(basePathIBL);

// draw
draw([expression], 0);

// ---functions-----------------------------------------------------------------------------------------

function createEntityMainCamera() {
  const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = entityCamera.getCamera();
  cameraComponent.setFovyAndChangeFocalLength(30);

  return entityCamera;
}

function createEntityPostEffectCamera() {
  const entityCamera = Rn.EntityHelper.createCameraEntity();
  const cameraComponent = entityCamera.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;

  return entityCamera;
}

async function createRenderPassMain(
  uriGltf: string,
  basePathIBL: string,
  entityCamera: Rn.ICameraEntity
) {
  const entityEnvironmentCube = createEntityEnvironmentCube(basePathIBL);
  const entityRootGroup = await createEntityGltf2(uriGltf);

  const renderPass = new Rn.RenderPass();
  renderPass.cameraComponent = entityCamera.getCamera();
  renderPass.addEntities([entityEnvironmentCube, entityRootGroup]);

  const cameraController = entityMainCamera.getCameraController();
  const controller = cameraController.controller;
  controller.setTarget(entityRootGroup);

  return renderPass;
}

function createEntityEnvironmentCube(basePathIBL: string) {
  const cubeTextureEnvironment = new Rn.CubeTexture();
  cubeTextureEnvironment.baseUriToLoad = basePathIBL + '/environment/environment';
  cubeTextureEnvironment.isNamePosNeg = true;
  cubeTextureEnvironment.hdriFormat = Rn.HdriFormat.HDR_LINEAR;
  cubeTextureEnvironment.mipmapLevelNumber = 1;
  cubeTextureEnvironment.loadTextureImagesAsync();

  const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial({
    makeOutputSrgb: false,
  });
  materialSphere.setParameter(Rn.ShaderSemantics.EnvHdriFormat, Rn.HdriFormat.HDR_LINEAR.index);
  const sampler = new Rn.Sampler({
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  materialSphere.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    cubeTextureEnvironment,
    sampler
  );

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

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = (
    await Rn.Gltf2Importer.importFromUri(uriGltf, {
      defaultMaterialHelperArgumentArray: [{ makeOutputSrgb: false }],
    })
  ).unwrapForce();
  const entityRootGroup = Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);
  return entityRootGroup;
}

function createRenderPassPostEffect(material: Rn.Material, cameraComponent: Rn.CameraComponent) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);

  const boardEntity = Rn.EntityHelper.createMeshEntity();
  boardEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0.0, 0.0]);
  boardEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -0.5]);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function createAndSetFrameBufferAndMSAAFramebuffer(
  renderPass: Rn.RenderPass,
  resolutionFramebuffer: number
) {
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
    resolutionFramebuffer,
    resolutionFramebuffer,
    0,
    { isMSAA: true }
  );
  renderPass.setFramebuffer(framebuffer);

  const framebufferMSAA = Rn.RenderableHelper.createTexturesForRenderTarget(
    resolutionFramebuffer,
    resolutionFramebuffer,
    1,
    { createDepthBuffer: false }
  );
  renderPass.setResolveFramebuffer(framebufferMSAA);
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

function draw(expressions: Rn.Expression[], loopCount: number, pElem?: HTMLElement) {
  // for e2e-test
  if (pElem === undefined && loopCount > 100) {
    pElem = document.createElement('p');
    pElem.setAttribute('id', 'rendered');
    pElem.innerText = 'Rendered.';
    document.body.appendChild(pElem);
  }

  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, loopCount + 1, pElem));
}
