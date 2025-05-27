import Rn from '../../../dist/esmdev/index.js';

// ---parameters---------------------------------------------------------------------------------------------

const uriGltf =
  '../../../assets/gltf/glTF-Sample-Assets/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb';
const basePathIBL = '../../../assets/ibl/shanghai_bund';

// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

// when "ProcessApproach.DataTexture" is specified,
// we need to specify the following setting in order to avoid the error
//  "Too many temporary registers required to compile shader".
Rn.Config.isUboEnabled = false;

const assets = await Rn.defaultAssetLoader.load({
  environment: Rn.CubeTexture.loadFromUrl({
    baseUrl: basePathIBL + '/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: basePathIBL + '/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl({
    baseUrl: basePathIBL + '/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

// prepare cameras
const entityMainCamera = createEntityMainCamera();

// prepare renderPasses
const renderPassMain = await createRenderPassMain(uriGltf, entityMainCamera);
createAndSetFrameBufferAndMSAAFramebuffer(renderPassMain, rnCanvasElement.width);

const materialGamma = Rn.MaterialHelper.createGammaCorrectionMaterial();
const renderPassGamma = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  materialGamma,
  renderPassMain.getResolveFramebuffer().colorAttachments[0] as Rn.RenderTargetTexture
);

const expression = new Rn.Expression();
expression.addRenderPasses([renderPassMain, renderPassGamma]);

// set ibl textures
await setIBLTexture();

// draw
draw([expression], 0);

// ---functions-----------------------------------------------------------------------------------------

function createEntityMainCamera() {
  const entityCamera = Rn.createCameraControllerEntity();
  const cameraComponent = entityCamera.getCamera();
  cameraComponent.setFovyAndChangeFocalLength(30);

  return entityCamera;
}

function createEntityPostEffectCamera() {
  const entityCamera = Rn.createCameraEntity();
  const cameraComponent = entityCamera.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;

  return entityCamera;
}

async function createRenderPassMain(
  uriGltf: string,
  entityCamera: Rn.ICameraEntity
) {
  const entityEnvironmentCube = await createEntityEnvironmentCube();
  const entityRootGroup = await createEntityGltf2(uriGltf);

  const renderPass = new Rn.RenderPass();
  renderPass.cameraComponent = entityCamera.getCamera();
  renderPass.addEntities([entityEnvironmentCube, entityRootGroup]);

  const cameraController = entityMainCamera.getCameraController();
  const controller = cameraController.controller;
  controller.setTarget(entityRootGroup);

  return renderPass;
}

async function createEntityEnvironmentCube() {
  const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial({
    makeOutputSrgb: false,
  });
  materialSphere.setParameter('envHdriFormat', Rn.HdriFormat.HDR_LINEAR.index);
  const sampler = new Rn.Sampler({
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  materialSphere.setTextureParameter('colorEnvTexture', assets.environment, sampler);

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

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = (
    await Rn.Gltf2Importer.importFromUri(uriGltf, {
      defaultMaterialHelperArgumentArray: [{ makeOutputSrgb: false }],
    })
  );
  const entityRootGroup = await Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);
  return entityRootGroup;
}

function createAndSetFrameBufferAndMSAAFramebuffer(
  renderPass: Rn.RenderPass,
  resolutionFramebuffer: number
) {
  const framebuffer = Rn.RenderableHelper.createFrameBufferMSAA({
    width: resolutionFramebuffer,
    height: resolutionFramebuffer,
    colorBufferNum: 1,
    colorFormats: [Rn.TextureFormat.RGBA8],
    sampleCountMSAA: 4,
    depthBufferFormat: Rn.TextureFormat.Depth32F,
  });
  renderPass.setFramebuffer(framebuffer);

  const framebufferMSAA = Rn.RenderableHelper.createFrameBuffer({
    width: resolutionFramebuffer,
    height: resolutionFramebuffer,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA8],
    createDepthBuffer: false,
  });
  renderPass.setResolveFramebuffer(framebufferMSAA);
}

async function setIBLTexture() {
  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];

  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}

function draw(expressions: Rn.Expression[], loopCount: number, pElem?: HTMLElement) {
  // for e2e-test
  if (pElem === undefined && loopCount > 0) {
    pElem = document.createElement('p');
    pElem.setAttribute('id', 'rendered');
    pElem.innerText = 'Rendered.';
    document.body.appendChild(pElem);
  }

  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, loopCount + 1, pElem));
}
