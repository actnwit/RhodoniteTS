import Rn from '../../../dist/esmdev/index.js';
import { loadHDR } from '../../../vendor/hdrpngts.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;
declare const HDRImage: any;

const cubeMapSize = 512;

// Init Rhodonite
Rn.Config.cgApiDebugConsoleOutput = true;
const processApproach = getProcessApproach(Rn);
await Rn.System.init({
  approach: processApproach,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Load HDR image
const response = await fetch('../../../assets/hdr/near_the_river_02_1k.hdr');
const arrayBuffer = await response.arrayBuffer();
const data = await loadHDR(new Uint8Array(arrayBuffer));

// Create HDR texture
const hdrTexture = new Rn.Texture();
hdrTexture.allocate({
  width: data.width,
  height: data.height,
  format: Rn.TextureFormat.RGBA32F,
});

const dataFloat = data.dataFloat;

const pixels = new Float32Array(data.width * data.height * 4);
for (let i = 0; i < data.width * data.height; i++) {
  pixels[i * 4] = dataFloat[i * 3];
  pixels[i * 4 + 1] = dataFloat[i * 3 + 1];
  pixels[i * 4 + 2] = dataFloat[i * 3 + 2];
  pixels[i * 4 + 3] = 1.0;
}

hdrTexture.loadImageToMipLevel({
  mipLevel: 0,
  xOffset: 0,
  yOffset: 0,
  width: data.width,
  height: data.height,
  rowSizeByPixel: data.width,
  data: pixels,
  type: Rn.ComponentType.Float,
});

// Create material
const panoramaToCubeMaterial = Rn.MaterialHelper.createPanoramaToCubeMaterial();
panoramaToCubeMaterial.setParameter('cubeMapFaceId', 0);

// Create expression
const panoramaToCubeExpression = new Rn.Expression();

const [panoramaToCubeFramebuffer, panoramaToCubeRenderTargetCube] =
  Rn.RenderableHelper.createFrameBufferCubeMap({
    width: cubeMapSize,
    height: cubeMapSize,
    textureFormat: Rn.TextureFormat.RGBA32F,
    // mipLevelCount: 1,
  });

// Create renderPass and set hdrTexture to panoramaToCubeMaterial
const panoramaToCubeRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  panoramaToCubeMaterial,
  hdrTexture
);

panoramaToCubeRenderPass.toClearColorBuffer = false;
panoramaToCubeRenderPass.toClearDepthBuffer = false;
panoramaToCubeRenderPass.isDepthTest = false;
panoramaToCubeRenderPass.setFramebuffer(panoramaToCubeFramebuffer);
panoramaToCubeExpression.addRenderPasses([panoramaToCubeRenderPass]);

const prefilterIblMaterial = Rn.MaterialHelper.createPrefilterIBLMaterial();
prefilterIblMaterial.setParameter('cubeMapFaceId', 0);

const prefilterIblExpression = new Rn.Expression();

const [diffuseIblFramebuffer, diffuseIblRenderTargetCube] =
  Rn.RenderableHelper.createFrameBufferCubeMap({
    width: cubeMapSize,
    height: cubeMapSize,
    textureFormat: Rn.TextureFormat.RGBA32F,
    mipLevelCount: 1,
  });
const [specularIblFramebuffer, specularIblRenderTargetCube] =
  Rn.RenderableHelper.createFrameBufferCubeMap({
    width: cubeMapSize,
    height: cubeMapSize,
    textureFormat: Rn.TextureFormat.RGBA32F,
  });

const sampler = new Rn.Sampler({
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.LinearMipmapLinear,
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
  wrapR: Rn.TextureParameter.ClampToEdge,
});
sampler.create();
const prefilterIblRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  prefilterIblMaterial,
  panoramaToCubeRenderTargetCube,
  sampler
);

prefilterIblRenderPass.toClearColorBuffer = false;
prefilterIblRenderPass.toClearDepthBuffer = false;
prefilterIblRenderPass.isDepthTest = false;
prefilterIblRenderPass.setFramebuffer(diffuseIblFramebuffer);
prefilterIblExpression.addRenderPasses([prefilterIblRenderPass]);

// Render Loop
let count = 0;

const renderIBL = () => {
  panoramaToCubeRenderPass.setFramebuffer(panoramaToCubeFramebuffer);

  for (let i = 0; i < 6; i++) {
    panoramaToCubeMaterial.setParameter('cubeMapFaceId', i);
    panoramaToCubeFramebuffer.setColorAttachmentCubeAt(0, i, 0, panoramaToCubeRenderTargetCube);
    Rn.System.process([panoramaToCubeExpression]);
  }

  panoramaToCubeRenderTargetCube.generateMipmaps();

  prefilterIblRenderPass.setFramebuffer(diffuseIblFramebuffer);
  prefilterIblMaterial.setParameter('distributionType', 0);

  for (let i = 0; i < 6; i++) {
    prefilterIblMaterial.setParameter('cubeMapFaceId', i);
    diffuseIblFramebuffer.setColorAttachmentCubeAt(0, i, 0, diffuseIblRenderTargetCube);
    Rn.System.process([prefilterIblExpression]);
  }

  prefilterIblRenderPass.setFramebuffer(specularIblFramebuffer);
  prefilterIblMaterial.setParameter('distributionType', 1);

  const mipLevelCount = Math.floor(Math.log2(cubeMapSize)) + 1;
  for (let i = 0; i < mipLevelCount; i++) {
    const roughness = i / (mipLevelCount - 1);
    prefilterIblMaterial.setParameter('roughness', roughness);
    for (let face = 0; face < 6; face++) {
      prefilterIblMaterial.setParameter('cubeMapFaceId', face);
      specularIblFramebuffer.setColorAttachmentCubeAt(0, face, i, specularIblRenderTargetCube);
      prefilterIblRenderPass.setViewport(
        Rn.Vector4.fromCopy4(0, 0, cubeMapSize >> i, cubeMapSize >> i)
      );
      Rn.System.process([prefilterIblExpression]);
    }
  }
};

// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.001;
cameraComponent.zFar = 100.0;
cameraComponent.setFovyAndChangeFocalLength(20.0);
cameraComponent.aspect = 1.0;

const expressions = [];

const mainExpressionResult = await Rn.GltfImporter.importFromUri(
  '../../../assets/gltf/glTF-Sample-Assets/Models/MetalRoughSpheresNoTextures/glTF-Binary/MetalRoughSpheresNoTextures.glb',
  {
    cameraComponent: cameraComponent,
  },
  (obj: Rn.RnPromiseCallbackObj) => {
    // this callback won't be called
    console.log(`loading items: ${obj.resolvedNum} / ${obj.promiseAllNum}`);
  }
);
if (Rn.isOk(mainExpressionResult)) {
  expressions.push(mainExpressionResult.get());

  // cameraController
  const mainRenderPass = mainExpressionResult.get().renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
} else {
  console.error(mainExpressionResult.toString());
}

const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
  Rn.MeshRendererComponent
) as Rn.MeshRendererComponent[];
for (const meshRendererComponent of meshRendererComponents) {
  await meshRendererComponent.setIBLCubeMap(
    diffuseIblRenderTargetCube as any,
    specularIblRenderTargetCube as any
  );
}

const createEntityEnvironmentCube = () => {
  panoramaToCubeRenderTargetCube.hdriFormat = Rn.HdriFormat.HDR_LINEAR;

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
  materialSphere.setTextureParameter(
    'colorEnvTexture',
    panoramaToCubeRenderTargetCube,
    // diffuseIblRenderTargetCube,
    // specularIblRenderTargetCube,
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

  const entitySphere = Rn.createMeshEntity();
  const meshComponentSphere = entitySphere.getMesh();
  meshComponentSphere.setMesh(meshSphere);

  entitySphere.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  entitySphere.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 0]);

  const expression = new Rn.Expression();
  const renderPass = new Rn.RenderPass();
  renderPass.addEntities([entitySphere]);
  renderPass.cameraComponent = cameraComponent;
  expression.addRenderPasses([renderPass]);

  return expression;
};

renderIBL();

// const debugExpression = createEntityEnvironmentCube();

Rn.System.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  Rn.System.process(expressions);
  // Rn.System.process([debugExpression]);

  count++;
});