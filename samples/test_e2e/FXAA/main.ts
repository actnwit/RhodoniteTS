import Frame from '../../../dist/esm/foundation/renderer/Frame';
import _Rn from '../../../dist/esm/index';
import {
  OrbitCameraController,
  CameraComponent,
  MeshComponent,
  AbstractTexture,
  Expression,
  FrameBuffer,
  RenderPass,
} from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;

const frame = new Rn.Frame();
const expressionWithFXAA = new Rn.Expression();
const expressionWithOutFXAA = new Rn.Expression();
let activeExpression: Expression;
let framebuffer: FrameBuffer;
let renderPassMain: RenderPass;

(async () => {
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  const gl = await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas,
    webglOption: {antialias: false},
  });

  // setup the Main RenderPass
  renderPassMain = await setupRenderPassMain();
  framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
    canvas!.clientWidth,
    canvas!.clientHeight,
    1,
    {}
  );
  renderPassMain.setFramebuffer(framebuffer);

  // setup the FXAA RenderPass
  const renderPassFxaa = await setupRenderPassFxaa(
    // framebuffer.getColorAttachedRenderTargetTexture(0),
    frame.getColorAttachmentFromInputOf(expressionWithFXAA),
    canvas!.clientWidth,
    canvas!.clientHeight
  );

  // register renderPasses to expressions
  expressionWithFXAA.addRenderPasses([renderPassMain, renderPassFxaa]);
  expressionWithOutFXAA.addRenderPasses([renderPassMain]);

  frame.addExpression(expressionWithFXAA, [renderPassMain]);
  frame.resolve();

  activeExpression = expressionWithFXAA;

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  let count = 0;
  const draw = function () {
    if (count > 0) {
      window._rendered = true;
    }
    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }

    Rn.System.process(frame);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

async function setupRenderPassMain() {
  const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial();
  const planeEntity = Rn.EntityHelper.createMeshEntity();
  const planePrimitive = new Rn.Plane();
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
  const planeMesh = new Rn.Mesh();
  planeMesh.addPrimitive(planePrimitive);
  planeMeshComponent.setMesh(planeMesh);
  planeEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    Math.PI / 3,
  ]);
  const sphereEntity = Rn.EntityHelper.createMeshEntity();
  const spherePrimitive = new Rn.Sphere();
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  spherePrimitive.generate({
    radius: -100,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  const environmentCubeTexture = new Rn.CubeTexture();
  {
    const response = await fetch('../../../assets/images/cubemap_test.basis');
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    environmentCubeTexture.loadTextureImagesFromBasis(uint8Array);
    environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  }
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture
  );
  sphereMaterial.setParameter(
    Rn.EnvConstantMaterialContent.EnvHdriFormat,
    Rn.HdriFormat.LDR_SRGB.index
  );
  const sphereMeshComponent = sphereEntity.getMesh();
  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);
  sphereMeshComponent.setMesh(sphereMesh);
  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0, 0.5,
  ]);
  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(planeEntity);
  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([planeEntity, sphereEntity]);
  return renderPass;
}

function setupRenderPassFxaa(
  renderable: Promise<AbstractTexture>,
  width: number,
  height: number
) {
  const renderPassFxaa = new Rn.RenderPass();
  const entityFxaa = Rn.EntityHelper.createMeshEntity();
  const primitiveFxaa = new Rn.Plane();
  primitiveFxaa.generate({
    width: 2,
    height: 2,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    flipTextureCoordinateY: false,
  });
  primitiveFxaa.material = Rn.MaterialHelper.createFXAA3QualityMaterial();
  primitiveFxaa.material.setTextureParameterAsPromise(
    Rn.ShaderSemantics.BaseColorTexture,
    renderable
  );
  primitiveFxaa.material.setParameter(
    Rn.ShaderSemantics.ScreenInfo,
    Rn.Vector2.fromCopyArray2([width, height])
  );
  const meshComponentFxaa = entityFxaa.getMesh() as MeshComponent;
  const meshFxaa = new Rn.Mesh();
  meshFxaa.addPrimitive(primitiveFxaa);
  meshComponentFxaa.setMesh(meshFxaa);
  entityFxaa.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    0,
  ]);
  renderPassFxaa.addEntities([entityFxaa]);
  const cameraEntityFxaa = Rn.EntityHelper.createCameraEntity();
  const cameraComponentFxaa = cameraEntityFxaa.getCamera() as CameraComponent;
  cameraEntityFxaa.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0.0, 1.0,
  ]);
  cameraComponentFxaa.type = Rn.CameraType.Orthographic;
  renderPassFxaa.cameraComponent = cameraComponentFxaa;

  return renderPassFxaa;
}

window.toggleFXAA = function () {
  const toggleButton = document.getElementById(
    'toggleFXAAButton'
  ) as HTMLElement;
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
