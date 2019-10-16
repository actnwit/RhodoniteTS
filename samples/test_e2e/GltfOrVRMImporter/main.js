
let p = null;

const load = async function (time) {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');

  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const GltfOrVRMImporter = Rn.GltfOrVRMImporter.getInstance();
  const expression = await GltfOrVRMImporter.import('../../../assets/vrm/test.vrm', {
    gltfOptions: {
      defaultMaterialHelperArgumentArray: [{
        isSkinning: false,
        isMorphing: false,
      }],
      autoResizeTexture: true
    },
  });

  const renderPasses = expression.renderPasses;

  const rootEntity = renderPasses[0].sceneTopLevelGraphComponents[0].entity;
  rootEntity.getTransform().rotate = new Rn.Vector3(0, 3 / 4 * Math.PI, 0.0);

  const mainCameraControllerComponent = renderPasses[0].cameraComponent.entity.getComponent(Rn.CameraControllerComponent);
  mainCameraControllerComponent.controller.dolly = 0.65;






  // Lights
  const entityRepository = Rn.EntityRepository.getInstance();
  const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  const lightComponent = lightEntity.getComponent(Rn.LightComponent);
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);

  let count = 0;
  Rn.CameraComponent.main = 0;


  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    system.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
}

document.body.onload = load;

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}

