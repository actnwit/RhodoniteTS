import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: HTMLParagraphElement | undefined;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');

  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.FastestWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  const entityRepository = Rn.EntityRepository.getInstance();
  const importer = Rn.VRMImporter.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);

  // Lights
  // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  // lightEntity.getTransform().translate = new Rn.Vector3(1.0, 100000.0, 1.0);
  // lightEntity.getLight().intensity = new Rn.Vector3(1, 1, 1);
  const lightEntity2 = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.LightComponent,
  ]);
  const lightComponent2 = lightEntity2.getLight();
  lightComponent2.type = Rn.LightType.Directional;
  lightComponent2.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity2.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);
  //lightEntity2.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
  //lightEntity2.getLight().type = Rn.LightType.Directional;

  const rootGroups = await importer.import('../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [{isLighting: true}],
    tangentCalculationMode: 0,
  });
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);

  for (const rootGroup of rootGroups) {
    rootGroup.getTransform().rotate = new Rn.Vector3(0, Math.PI, 0.0);
  }

  //  rootGroup.getTransform().scale = new Rn.Vector3(0.01, 0.01, 0.01);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller = cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(rootGroups[0]);
  controller.dolly = 0.75;

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities(rootGroups);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.main = 0;
  let count = 0;
  let startTime = Date.now();
  const draw = function () {
    if (p == null && count > 0) {
      if (rootGroups[0] != null) {
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 600, 600);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      //rotationVec3._v[0] = 0.1;
      //rotationVec3._v[1] = rotation;
      //rotationVec3._v[2] = 0.1;
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
  };

  draw();
})();

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
