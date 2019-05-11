
let p = null;

const load = async function(time){
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);//, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
  cameraComponent.type = Rn.CameraType.Orthographic;
  cameraComponent.parameters = new Rn.Vector4(0.1, 10000, 1, 1);
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 2.0);

  //const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/BoxTextured/glTF/BoxTextured.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/Lantern/glTF/Lantern.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/WaterBottle/glTF/WaterBottle.gltf');
 //const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
 //const response = await importer.import('../../../assets/gltf/2.0/VC/glTF/VC.gltf');
 // const response = await importer.import('../../../assets/gltf/2.0/Buggy/glTF/Buggy.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/Triangle/glTF/Triangle.gltf');
//   const response = await importer.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
  // const response = await importer.import('../../../assets/gltf/2.0/BoxAnimated/glTF/BoxAnimated.gltf');
// const response = await importer.import('../../../assets/gltf/2.0/BrainStem/glTF/BrainStem.gltf');
//const response = await importer.import('../../../assets/gltf/2.0/AnimatedMorphCube/glTF/AnimatedMorphCube.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/gltf-asset-generator/Animation_Node/Animation_Node_05.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/polly/project_polly.glb');
// const response = await importer.import('../../../assets/gltf/2.0/zoman_sf/scene.gltf');
//  const response = await importer.import('../../../assets/gltf/2.0/env_test/EnvironmentTest.gltf');

  // const modelConverter = Rn.ModelConverter.getInstance();
//  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
//  rootGroup.getTransform().rotate = new Rn.Vector3(0, 1.0, 0.0);



  // Plane
  const planeEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  const planeMaterial = Rn.MaterialHelper.createFurnaceTestMaterial();
  planeMaterial.setParameter(Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(512, 512));
  planeMaterial.setParameter('mode', 1);

  // const planePrimitive = new Rn.Plane();
  // planePrimitive.generate({width:2, height:2, uSpan:1, vSpan:1, material: planeMaterial});
  const planePrimitive = new Rn.Sphere();
  planePrimitive.generate({radius:1, widthSegments:100, heightSegments:100, material: planeMaterial});
  const planeComponent = planeEntity.getComponent(Rn.MeshComponent);
  planeComponent.addPrimitive(planePrimitive);
  // planeEntity.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);

  // CameraComponent
  // const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
  // cameraControllerComponent.setTarget(planeEntity);
  // cameraControllerComponent.zFarAdjustingFactorBasedOnAABB = 1000;


  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  let count = 0;
  let rot = 0;
  const draw = function(time) {

    if (p == null && count > 0) {
      // if (response != null) {

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 512, 512);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //  }

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
      rotEnv(rot++*0.004);
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

function rotEnv(rot) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.rotationOfCubeMap = rot;
  }
  // window.sphere2MeshRendererComponent.rotationOfCubeMap = rot;
  window.sphereEntity.getTransform().rotate = new Rn.Vector3(0, -rot, 0);
}

function setDiffuseCubeMapContribution(value) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.diffuseCubeMapContribution = value;
  }
}

function setSpecularCubeMapContribution(value) {
  for (let meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.specularCubeMapContribution = value;
  }
}