
let p = null;

const load = async function (time) {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();
  const importer = Rn.VRMImporter.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
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
  const lightComponent2 = lightEntity2.getComponent(Rn.LightComponent);
  lightComponent2.type = Rn.LightType.Directional;
  lightComponent2.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity2.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);
  //lightEntity2.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
  //lightEntity2.getComponent(Rn.LightComponent).type = Rn.LightType.Directional;

  const rootGroups = await importer.import('../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [{ isLighting: true }],
  });
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);

  for (let rootGroup of rootGroups) {
    rootGroup.getTransform().rotate = new Rn.Vector3(0, Math.PI, 0.0);
  }

  //  rootGroup.getTransform().scale = new Rn.Vector3(0.01, 0.01, 0.01);


  // CameraComponent
  const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
  cameraControllerComponent.controller.setTarget(rootGroups[0]);


  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function (time) {

    if (p == null && count > 0) {
      if (rootGroups[0] != null) {

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

    system.process();
    count++;

    requestAnimationFrame(draw);
  }

  draw();
}

document.body.onload = load;

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}

