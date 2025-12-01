import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
window.Rn = Rn;
// ---parameters---------------------------------------------------------------------------------------------

const uriGltf =
  // '../../../assets/gltf/glTF-Sample-Models/2.0/BoomBoxWithAxes/glTF/BoomBoxWithAxes.gltf';
  '../../../assets/gltf/glTF-Sample-Assets/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb';
const basePathIBL = '../../../assets/ibl/shanghai_bund';

const luminanceCriterion = 1.0;
const gaussianBlurLevelHighLuminance = 4;
const gaussianKernelSize = 10;
const gaussianVariance = 10;

//  ratio of the final drawing ([original image, glare level 0, glare level 1, glare level 2])
//  glare level N means the glare effect in size [2^(N-1) * original image size]
// const synthesizeCoefficient = [1.0, 1.0 / 5.0, 1.0 / 6.0, 1.0 / 10.0];
const synthesizeCoefficient = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0] as [number, number, number, number, number, number];
// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

const assets = await Rn.defaultAssetLoader.load({
  environment: Rn.CubeTexture.loadFromUrl({
    baseUrl: `${basePathIBL}/environment/environment`,
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.HDR_LINEAR,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: `${basePathIBL}/specular/specular`,
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl({
    baseUrl: `${basePathIBL}/diffuse/diffuse`,
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

// import gltf2
const rootGroup = await createEntityGltf2(uriGltf);

// prepare environment cube
const entityEnvironmentCube = await createEntityEnvironmentCube();

// prepare cameras
const cameraComponentMain = createEntityMainCamera(rootGroup).getCamera();

// prepare renderPasses
const renderPassMain = await createRenderPassMain(cameraComponentMain, [rootGroup, entityEnvironmentCube]);
createAndSetFramebuffer(renderPassMain, rnCanvasElement.width, rnCanvasElement.height, 1, {
  internalFormat: Rn.TextureFormat.RGBA16F,
});
renderPassMain.clearColor = Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 1.0]);

const bloomHelper = new Rn.Bloom(engine);
const { bloomExpression, bloomedRenderTarget } = bloomHelper.createBloomExpression({
  textureToBloom: renderPassMain.getFramebuffer().colorAttachments[0] as unknown as Rn.AbstractTexture,
  parameters: {
    luminanceCriterion,
    gaussianBlurLevelHighLuminance,
    gaussianKernelSize,
    gaussianVariance,
    synthesizeCoefficient,
  },
});

const materialGamma = Rn.MaterialHelper.createGammaCorrectionMaterial(engine);
const renderPassGamma = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  engine,
  materialGamma,
  bloomedRenderTarget
);

// prepare expressions
const mainExpression = createExpression([renderPassMain]);
const gammaExpression = createExpression([renderPassGamma]);

const expressions = [mainExpression, bloomExpression, gammaExpression];

// set ibl textures
await setIBLTexture();

// draw
draw(expressions, 0);

// ---functions-----------------------------------------------------------------------------------------

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = await Rn.Gltf2Importer.importFromUrl(uriGltf, {
    defaultMaterialHelperArgumentArray: [{ makeOutputSrgb: false }],
  });

  const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(engine, gltf2JSON);
  return rootGroup;
}

async function createEntityEnvironmentCube() {
  const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial(engine, {
    makeOutputSrgb: false,
  });
  materialSphere.setParameter('envHdriFormat', Rn.HdriFormat.HDR_LINEAR.index);
  const samplerSphere = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  materialSphere.setTextureParameter('colorEnvTexture', assets.environment, samplerSphere);

  const primitiveSphere = new Rn.Sphere(engine);
  primitiveSphere.generate({
    radius: 2500,
    widthSegments: 40,
    heightSegments: 40,
    material: materialSphere,
  });
  const meshSphere = new Rn.Mesh(engine);
  meshSphere.addPrimitive(primitiveSphere);

  const entitySphere = Rn.createMeshEntity(engine);
  const meshComponentSphere = entitySphere.getMesh();
  meshComponentSphere.setMesh(meshSphere);

  entitySphere.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  entitySphere.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 300, 0]);

  return entitySphere;
}

function createEntityMainCamera(entityCameraTarget: Rn.ISceneGraphEntity) {
  const entityCamera = Rn.createCameraControllerEntity(engine, true);
  const cameraControllerComponent = entityCamera.getCameraController();
  const controller = cameraControllerComponent.controller;
  controller.setTarget(entityCameraTarget);

  return entityCamera as Rn.ICameraEntity;
}

async function createRenderPassMain(cameraComponent: Rn.CameraComponent, entityRenderTargets: Rn.ISceneGraphEntity[]) {
  const renderPass = new Rn.RenderPass(engine);
  renderPass.tryToSetUniqueName('renderPassMain', true);
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities(entityRenderTargets);
  return renderPass;
}

function createAndSetFramebuffer(
  renderPass: Rn.RenderPass,
  resolutionWidth: number,
  resolutionHeight: number,
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
  }
) {
  const framebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: resolutionWidth,
    height: resolutionHeight,
    textureNum,
    textureFormats: [property.internalFormat],
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

async function setIBLTexture() {
  const meshRendererComponents = engine.componentRepository.getComponentsWithType(
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

  engine.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions, loopCount + 1, pElem));
}
