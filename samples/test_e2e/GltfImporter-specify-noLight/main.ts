import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
let p = null;

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(70.0);
cameraComponent.aspect = 1.0;

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf',
  {
    defaultMaterialHelperArgumentArray: [
      {
        isLighting: false,
      },
    ],
    cameraComponent: cameraComponent,
  }
);

const meshComponents = engine.componentRepository.getComponentsWithType(Rn.MeshComponent) as Rn.MeshComponent[];
setParameterForMeshComponents(meshComponents, 'baseColorFactor', Rn.Vector4.fromCopyArray([0.5, 0.5, 0.5, 1.0]));

// cameraController
const mainRenderPass = expression.renderPasses[0];
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.76;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

let count = 0;
let startTime = Date.now();

engine.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.setGlobalTime(engine, time);
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  }

  engine.process([expression]);

  count++;
});

function setParameterForMeshComponents(meshComponents: Rn.MeshComponent[], shaderSemantic: string, value: any) {
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
