import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

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

  // Plane
  const texture = new Rn.VideoTexture();
  texture.generateTextureFromUri('../../../assets/videos/video.mp4');
  const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial();
  modelMaterial.setTextureParameter(
    Rn.ShaderSemantics.DiffuseColorTexture,
    texture
  );

  const planeEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
    Rn.MeshRendererComponent,
  ]);
  const planePrimitive = new Rn.Plane();
  planePrimitive.generate({
    width: 2,
    height: 2,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    flipTextureCoordinateY: true,
    material: modelMaterial,
  });
  const planeMeshComponent = planeEntity.getMesh();
  const planeMesh = new Rn.Mesh();
  planeMesh.addPrimitive(planePrimitive);
  planeMeshComponent.setMesh(planeMesh);
  planeEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);

  // Camera
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller = cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(planeEntity);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([planeEntity]);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function () {
    if (p == null && count > 0) {
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
    texture.updateTexture();
    system.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
};
