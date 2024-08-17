import Rn from '../../../dist/esmdev/index.js';
import { loadHDR } from '../../../vendor/hdrpngts.js';

declare const window: any;
declare const HDRImage: any;

const cubeMapSize = 512;

// Init Rhodonite
Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.WebGPU,
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
  mipLevelCount: 1,
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
panoramaToCubeMaterial.setParameter(Rn.ShaderSemantics.CubeMapFaceId, 0);

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
// Render Loop
let count = 0;

const renderIBL = () => {
  panoramaToCubeRenderPass.setFramebuffer(panoramaToCubeFramebuffer);

  for (let i = 0; i < 6; i++) {
    panoramaToCubeMaterial.setParameter(Rn.ShaderSemantics.CubeMapFaceId, i);
    panoramaToCubeFramebuffer.setColorAttachmentCubeAt(0, i, 0, panoramaToCubeRenderTargetCube);
    Rn.System.process([panoramaToCubeExpression]);
  }

  panoramaToCubeRenderTargetCube.generateMipmaps();
};

// camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
// cameraComponent.zNear = 0.1;
cameraComponent.zFar = 10000.0;
// cameraComponent.setFovyAndChangeFocalLength(20.0);
// cameraComponent.aspect = 1.0;

// renderIBL();

const createEntityEnvironmentCube = () => {
  panoramaToCubeRenderTargetCube.hdriFormat = Rn.HdriFormat.HDR_LINEAR;

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
    panoramaToCubeRenderTargetCube,
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
  entitySphere.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 0]);

  const expression = new Rn.Expression();
  const renderPass = new Rn.RenderPass();
  renderPass.addEntities([entitySphere]);
  renderPass.cameraComponent = cameraComponent;
  expression.addRenderPasses([renderPass]);

  return expression;
};

const expression = createEntityEnvironmentCube();

Rn.System.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  renderIBL();
  Rn.System.process([expression]);

  count++;
});
