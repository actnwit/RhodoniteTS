import _Rn from '../../../dist/esm/index';
import {
  CameraComponent,
  CameraControllerComponent,
  Entity,
  LightComponent,
  OrbitCameraController,
} from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;

const setupRenderPassEntityUidOutput = function (rootGroup: Entity, cameraComponent: CameraComponent, canvas: HTMLCanvasElement) {
  const renderPass = new Rn.RenderPass();
  const entityUidOutputMaterial = Rn.MaterialHelper.createEntityUIDOutputMaterial();

  renderPass.setMaterial(entityUidOutputMaterial);
  renderPass.cameraComponent = cameraComponent;

  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(canvas.clientWidth, canvas.clientHeight, 1, {});
  renderPass.setFramebuffer(framebuffer);
  renderPass.clearColor = new Rn.Vector4(0, 0, 0, 1);
  renderPass.toClearColorBuffer = true;
  renderPass.toClearDepthBuffer = true;

  // rootGroup.getTransform().scale = new Rn.Vector3(100, 100, 100);

  renderPass.addEntities([rootGroup]);

  return renderPass;
}

const setupRenderPassRendering = function (rootGroup, cameraComponent) {
  const renderPass = new Rn.RenderPass();
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([rootGroup]);

  return renderPass;
}

let p = null;

const load = async function () {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  window.canvas = canvas;
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, canvas);
  const expression = new Rn.Expression();

  const entityRepository = Rn.EntityRepository.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent) as CameraComponent;
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(30);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);


  // Lights
  const lightEntity2 = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  lightEntity2.getTransform().translate = new Rn.Vector3(0.0, 0.0, 10.0);
  (lightEntity2.getComponent(Rn.LightComponent) as LightComponent).intensity = new Rn.Vector3(1, 1, 1);

  // Please download a model from https://www.3dscanstore.com/blog/Free-3D-Head-Model or others
  const response = await importer.import('');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);


  const renderPassEntityUidOutput = setupRenderPassEntityUidOutput(rootGroup, cameraComponent, canvas);
  window.renderPassEntityUidOutput = renderPassEntityUidOutput;
  const renderPassRendering = setupRenderPassRendering(rootGroup, cameraComponent);
  // expression.addRenderPasses([renderPassEntityUidOutput]);
  // expression.addRenderPasses([renderPassRendering]);
  expression.addRenderPasses([renderPassEntityUidOutput, renderPassRendering]);
  // expression.addRenderPasses([renderPassRendering]);


  // CameraComponent
  const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent) as CameraControllerComponent;
  (cameraControllerComponent.controller as OrbitCameraController).setTarget(rootGroup);


  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function (time) {

    if (p == null && count > 0) {
      if (response != null) {

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 600, 600);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }


      p = document.createElement('p');
      p.setAttribute("id", "rendered");
      p.innerText = 'Rendered.';
      document.body.appendChild(p);

    }

    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      //rotationVec3.v[0] = 0.1;
      //rotationVec3.v[1] = rotation;
      //rotationVec3.v[2] = 0.1;
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
      //console.log(time);
      //      rootGroup.getTransform().scale = rotationVec3;
      //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
    }

    system.process([expression]);
    count++;

    requestAnimationFrame(draw);
  }

  draw(0);
}

load();

