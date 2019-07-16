import { RnType } from '../../../dist/types/foundation/main'
import CameraComponent from '../../../dist/types/foundation/components/CameraComponent';
import CameraControllerComponent from '../../../dist/types/foundation/components/CameraControllerComponent';
import Entity from '../../../dist/types/foundation/core/Entity';

declare const Rn: RnType;
declare const window: any;

const setupRenderPassEntityUidOutput = function(rootGroup: Entity) {
  const renderPass = new Rn.RenderPass();
  const entityUidOutputMaterial = Rn.MaterialHelper.createEntityUIDOutputMaterial();
  Rn.WebGLStrategyUniform.setupMaterial(entityUidOutputMaterial, []);

  renderPass.material = entityUidOutputMaterial;

  renderPass.addEntities([rootGroup]);

  return renderPass;
}

const load = async function(time){
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf1Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  const entityRepository = Rn.EntityRepository.getInstance();

  const expression = new Rn.Expression();


  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent) as CameraComponent;
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.parameters = new Rn.Vector4(0.1, 1000, 90, 1);
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);




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

  const renderPassEntityUidOutput = setupRenderPassEntityUidOutput(rootGroup);
  expression.addRenderPasses([renderPassEntityUidOutput]);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent) as CameraControllerComponent;
  cameraControllerComponent.setTarget(rootGroup);

  let p: HTMLParagraphElement = null;

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function(time: number) {

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

    system.process(expression);
    count++;

    requestAnimationFrame(draw);
  }

  draw(0);
}

document.body.onload = load;

