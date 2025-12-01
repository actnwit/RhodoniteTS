import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const setupRenderPassEntityUidOutput = (
  engine: Rn.Engine,
  rootGroup: Rn.ISceneGraphEntity,
  cameraComponent: Rn.CameraComponent,
  canvas: HTMLCanvasElement
) => {
  const renderPass = new Rn.RenderPass(engine);
  const entityUidOutputMaterial = Rn.MaterialHelper.createEntityUIDOutputMaterial(engine);

  renderPass.setMaterial(entityUidOutputMaterial);
  renderPass.cameraComponent = cameraComponent;

  const framebuffer = Rn.RenderableHelper.createFrameBuffer(engine, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA8],
    createDepthBuffer: true,
  });
  renderPass.setFramebuffer(framebuffer);
  renderPass.clearColor = Rn.Vector4.fromCopyArray([0, 0, 0, 1]);
  renderPass.toClearColorBuffer = true;
  renderPass.toClearDepthBuffer = true;

  // rootGroup.getTransform().scale = Rn.Vector3.fromCopyArray([100, 100, 100]);

  renderPass.addEntities([rootGroup]);

  return renderPass;
};

const setupRenderPassRendering = (engine: Rn.Engine, rootGroup, cameraComponent) => {
  const renderPass = new Rn.RenderPass(engine);
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([rootGroup]);
  renderPass.toClearColorBuffer = true;
  renderPass.toClearDepthBuffer = true;
  renderPass.clearColor = Rn.Vector4.fromCopy4(0.8, 0.8, 0.8, 1.0);

  return renderPass;
};

let p = null;

const load = async () => {
  Rn.Config.cgApiDebugConsoleOutput = true;
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  window.canvas = canvas;
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas,
  });
  const expression = new Rn.Expression();

  // Camera
  const cameraEntity = Rn.createCameraControllerEntity(engine, true);
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent) as Rn.CameraComponent;
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(30);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

  // Lights
  const lightEntity2 = Rn.createLightEntity(engine);
  lightEntity2.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, 10.0]);
  (lightEntity2.getComponent(Rn.LightComponent) as Rn.LightComponent).color = Rn.Vector3.fromCopyArray([1, 1, 1]);

  // Please download a model from https://www.3dscanstore.com/blog/Free-3D-Head-Model or others
  const response = await Rn.Gltf2Importer.importFromUrl('');
  const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(engine, response);

  const renderPassEntityUidOutput = setupRenderPassEntityUidOutput(engine, rootGroup, cameraComponent, canvas);
  window.renderPassEntityUidOutput = renderPassEntityUidOutput;
  const renderPassRendering = setupRenderPassRendering(engine, rootGroup, cameraComponent);
  // expression.addRenderPasses([renderPassEntityUidOutput]);
  // expression.addRenderPasses([renderPassRendering]);
  expression.addRenderPasses([renderPassEntityUidOutput, renderPassRendering]);
  // expression.addRenderPasses([renderPassRendering]);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getComponent(
    Rn.CameraControllerComponent
  ) as Rn.CameraControllerComponent;
  (cameraControllerComponent.controller as Rn.OrbitCameraController).setTarget(rootGroup);

  Rn.CameraComponent.current = 0;
  let startTime = Date.now();
  let count = 0;
  const draw = () => {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
        startTime = date.getTime();
      }
      //console.log(time);
      //      rootGroup.getTransform().scale = rotationVec3;
      //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
    }

    engine.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
};

load();
