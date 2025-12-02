import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const frame = new Rn.Frame();
const expressionWithFXAA = new Rn.Expression();
const expressionWithOutFXAA = new Rn.Expression();
let activeExpression: Rn.Expression;
let framebuffer: Rn.FrameBuffer;
let renderPassMain: Rn.RenderPass;

const canvas = document.getElementById('world') as HTMLCanvasElement;
Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas,
  webglOption: { antialias: false },
});

// setup the Main RenderPass
renderPassMain = await setupRenderPassMain();
framebuffer = Rn.RenderableHelper.createFrameBuffer(engine, {
  width: canvas.clientWidth,
  height: canvas.clientHeight,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
// renderPassMain.setFramebuffer(framebuffer);

// setup the FXAA RenderPass
const renderPassFxaa = await setupRenderPassFxaa(
  // framebuffer.getColorAttachedRenderTargetTexture(0),
  frame.getColorAttachmentFromInputOf(expressionWithFXAA)
);

// register renderPasses to expressions
expressionWithFXAA.addRenderPasses([renderPassMain, renderPassFxaa]);
expressionWithOutFXAA.addRenderPasses([renderPassMain]);

frame.addExpression(expressionWithFXAA, {
  outputs: [
    {
      renderPass: {
        index: 0,
      },
      frameBuffer: framebuffer,
    },
  ],
  inputRenderPasses: [renderPassMain],
});

frame.resolve();

activeExpression = expressionWithFXAA;

let startTime = Date.now();
let count = 0;

engine.startRenderLoop(() => {
  if (count > 0) {
    window._rendered = true;
  }
  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.setGlobalTimeForEngine(engine, time);
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  }

  engine.process(frame);
  count++;
});

async function setupRenderPassMain() {
  const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial(engine);
  const planeEntity = Rn.createMeshEntity(engine);
  const planePrimitive = new Rn.Plane(engine);
  planePrimitive.generate({
    width: 2,
    height: 2,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    flipTextureCoordinateY: false,
    material: modelMaterial,
  });
  const planeMeshComponent = planeEntity.getMesh();
  const planeMesh = new Rn.Mesh(engine);
  planeMesh.addPrimitive(planePrimitive);
  planeMeshComponent.setMesh(planeMesh);
  planeEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, Math.PI / 3]);
  const sphereEntity = Rn.createMeshEntity(engine);
  const spherePrimitive = new Rn.Sphere(engine);
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial(engine);
  spherePrimitive.generate({
    radius: -100,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  const environmentCubeTexture = new Rn.CubeTexture(engine);
  {
    const response = await fetch('../../../assets/images/cubemap_test.basis');
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    environmentCubeTexture.loadTextureImagesFromBasis(uint8Array);
    environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  }
  const samplerSphere = new Rn.Sampler(engine, {
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.LinearMipmapLinear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', environmentCubeTexture, samplerSphere);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);
  const sphereMeshComponent = sphereEntity.getMesh();
  const sphereMesh = new Rn.Mesh(engine);
  sphereMesh.addPrimitive(spherePrimitive);
  sphereMeshComponent.setMesh(sphereMesh);
  // Camera
  const cameraEntity = Rn.createCameraControllerEntity(engine, true);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);
  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(planeEntity);
  // renderPass
  const renderPass = new Rn.RenderPass(engine);
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([planeEntity, sphereEntity]);
  return renderPass;
}

function setupRenderPassFxaa(renderable: Promise<Rn.AbstractTexture>) {
  const fxaaMaterial = Rn.MaterialHelper.createFXAA3QualityMaterial(engine);
  const renderPassFxaa = Rn.RenderPassHelper.createScreenDrawRenderPass(engine, fxaaMaterial);
  fxaaMaterial.setTextureParameterAsPromise('baseColorTexture', renderable);

  return renderPassFxaa;
}

window.toggleFXAA = () => {
  const toggleButton = document.getElementById('toggleFXAAButton') as HTMLElement;
  if (activeExpression === expressionWithFXAA) {
    activeExpression = expressionWithOutFXAA;
    renderPassMain.setFramebuffer(undefined as any);
    (toggleButton.firstChild as ChildNode).textContent = 'Now FXAA Off';
  } else {
    activeExpression = expressionWithFXAA;
    renderPassMain.setFramebuffer(framebuffer);
    (toggleButton.firstChild as ChildNode).textContent = 'Now FXAA On';
  }
  frame.clearExpressions();
  frame.addExpression(activeExpression);
};
