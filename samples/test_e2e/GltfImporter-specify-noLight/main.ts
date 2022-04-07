import ComponentRepository from '../../../dist/esm/foundation/core/ComponentRepository';
import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';
declare const window: any;
declare const Rn: typeof _Rn;
let p = null;

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(120.0);
  cameraComponent.aspect = 1.0;

  // gltf
  const expression = await Rn.GltfImporter.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf',
    {
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
      cameraComponent: cameraComponent,
    }
  );

  const meshComponents = ComponentRepository.getComponentsWithType(
    Rn.MeshComponent
  );
  setParameterForMeshComponents(
    meshComponents,
    Rn.ShaderSemantics.BaseColorFactor,
    Rn.Vector4.fromCopyArray([0.5, 0.5, 0.5, 1.0])
  );

  // cameraController
  const mainRenderPass = expression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    mainCameraControllerComponent.controller as OrbitCameraController;
  controller.dolly = 0.7;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

  let count = 0;
  let startTime = Date.now();

  const draw = function () {
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
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }

    Rn.System.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

function setParameterForMeshComponents(meshComponents, shaderSemantic, value) {
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    if (!mesh) continue;

    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setParameter(shaderSemantic, value);
    }
  }
}
