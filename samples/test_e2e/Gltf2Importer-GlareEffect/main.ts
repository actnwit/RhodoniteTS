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
const synthesizeCoefficient = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0] as [
  number,
  number,
  number,
  number,
  number,
  number
];
// ---main algorithm-----------------------------------------------------------------------------------------

// prepare memory
Rn.Config.cgApiDebugConsoleOutput = true;
const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: rnCanvasElement,
});

// import gltf2
const rootGroup = await createEntityGltf2(uriGltf);

// prepare environment cube
const entityEnvironmentCube = createEntityEnvironmentCube(basePathIBL);

// prepare cameras
const cameraComponentMain = createEntityMainCamera(rootGroup).getCamera();

// prepare renderPasses
const renderPassMain = await createRenderPassMain(cameraComponentMain, [
  rootGroup,
  entityEnvironmentCube,
]);
createAndSetFramebuffer(renderPassMain, rnCanvasElement.width, rnCanvasElement.height, 1, {
  internalFormat: Rn.TextureFormat.RGBA16F,
});
renderPassMain.clearColor = Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 1.0]);

const { bloomExpression, bloomedRenderTarget } = Rn.ExpressionHelper.createBloomExpression({
  textureToBloom: renderPassMain.getFramebuffer()
    .colorAttachments[0] as unknown as Rn.AbstractTexture,
  parameters: {
    luminanceCriterion,
    gaussianBlurLevelHighLuminance,
    gaussianKernelSize,
    gaussianVariance,
    synthesizeCoefficient,
  },
});

const materialGamma = Rn.MaterialHelper.createGammaCorrectionMaterial();
const renderPassGamma = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  materialGamma,
  bloomedRenderTarget
);

// prepare expressions
const mainExpression = createExpression([renderPassMain]);
const gammaExpression = createExpression([renderPassGamma]);

const expressions = [mainExpression, bloomExpression, gammaExpression];

// set ibl textures
await setIBLTexture(basePathIBL);

// draw
draw(expressions, 0);

// ---functions-----------------------------------------------------------------------------------------

async function createEntityGltf2(uriGltf: string) {
  const gltf2JSON = (
    await Rn.Gltf2Importer.importFromUri(uriGltf, {
      defaultMaterialHelperArgumentArray: [{ makeOutputSrgb: false }],
    })
  ).unwrapForce();

  const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);
  return rootGroup;
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
  materialSphere.setParameter('envHdriFormat', Rn.HdriFormat.HDR_LINEAR.index);
  const samplerSphere = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
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

  const entitySphere = Rn.EntityHelper.createMeshEntity();
  const meshComponentSphere = entitySphere.getMesh();
  meshComponentSphere.setMesh(meshSphere);

  entitySphere.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  entitySphere.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 300, 0]);

  return entitySphere;
}

function createEntityMainCamera(entityCameraTarget: Rn.ISceneGraphEntity) {
  const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
  const cameraControllerComponent = entityCamera.getCameraController();
  const controller = cameraControllerComponent.controller;
  controller.setTarget(entityCameraTarget);

  return entityCamera as Rn.ICameraEntity;
}

async function createRenderPassMain(
  cameraComponent: Rn.CameraComponent,
  entityRenderTargets: Rn.ISceneGraphEntity[]
) {
  const renderPass = new Rn.RenderPass();
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
