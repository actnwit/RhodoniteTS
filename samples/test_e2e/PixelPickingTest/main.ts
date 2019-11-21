import { RnType } from '../../../dist/types/foundation/main'
import CameraComponent from '../../../dist/types/foundation/components/CameraComponent';
import CameraControllerComponent from '../../../dist/types/foundation/components/CameraControllerComponent';
import Entity from '../../../dist/types/foundation/core/Entity';
import LightComponent from '../../../dist/types/foundation/components/LightComponent';
import Vector4 from '../../../dist/types/foundation/math/Vector4';
import { RnWebGL } from '../../../dist/types/webgl/main';
import OrbitCameraController from '../../../dist/types/foundation/cameras/OrbitCameraController';

declare const window: any;
declare const Rn: RnType;
declare const RnWebGL: RnWebGL


const setupRenderPassEntityUidOutput = function (rootGroup: Entity, cameraComponent: CameraComponent, canvas: HTMLCanvasElement) {
  const renderPass = new Rn.RenderPass();
  const entityUidOutputMaterial = Rn.MaterialHelper.createEntityUIDOutputMaterial();
  RnWebGL.WebGLStrategyUniform.setupMaterial(entityUidOutputMaterial);

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

const pick = function (e: any) {
  const x = e.offsetX;
  const y = window.canvas.clientHeight - e.offsetY;
  const framebuffer = window.renderPassEntityUidOutput.getFramebuffer();
  const renderTargetTexture = framebuffer.colorAttachments[0];
  const pickedPixel = renderTargetTexture.getPixelValueAt(x, y);
  console.log(pickedPixel.toString());

  const bitDec = new Rn.Vector4(1, 255, 65025, 0);
  const pickedEntityUID = bitDec.dotProduct(pickedPixel);
  console.log(pickedEntityUID);

  return pickedEntityUID;
}

let p = null;

const load = async function () {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf1Importer.getInstance();
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
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);


  // Lights
  // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  // lightEntity.getTransform().translate = new Rn.Vector3(1.0, 100000.0, 1.0);
  // lightEntity.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);
  const lightEntity2 = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  lightEntity2.getTransform().translate = new Rn.Vector3(0.0, 0.0, 10.0);
  (lightEntity2.getComponent(Rn.LightComponent) as LightComponent).intensity = new Rn.Vector3(1, 1, 1);
  //lightEntity2.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
  //lightEntity2.getComponent(Rn.LightComponent).type = Rn.LightType.Directional;


  //  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/BoxTextured/glTF/BoxTextured.gltf');
  //  const response = await importer.import('../../../assets/gltf/2.0/Lantern/glTF/Lantern.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/WaterBottle/glTF/WaterBottle.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
  //const response = await importer.import('../../../assets/gltf/1.0/VC/glTF/VC.gltf');
  //const response = await importer.import('../../../assets/gltf/1.0/GearboxAssy/glTF/GearboxAssy.gltf');
  // const response = await importer.import('../../../assets/gltf/1.0/Buggy/glTF/Buggy.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
  //  const response = await importer.import('../../../assets/gltf/1.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
  //const response = await importer.import('../../../assets/gltf/1.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
  //  const response = await importer.import('../../../assets/gltf/1.0/Duck/glTF/Duck.gltf');
  //const response = await importer.import('../../../assets/gltf/1.0/Avocado/glTF/Avocado.gltf');
  const response = await importer.import('../../../assets/gltf/1.0/BoxAnimated/glTF/BoxAnimated.gltf');
  //const response = await importer.import('../../../assets/gltf/1.0/BrainStem/glTF/BrainStem.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
  //  rootGroup.getTransform().rotate = new Rn.Vector3(0, 1.0, 0.0);
  //  rootGroup.getTransform().scale = new Rn.Vector3(0.01, 0.01, 0.01);


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

      window._pickedEntityUID = pick({ offsetX: 300, offsetY: 300 });

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

  canvas.addEventListener('mousedown', pick);

  draw(0);
}

load();
