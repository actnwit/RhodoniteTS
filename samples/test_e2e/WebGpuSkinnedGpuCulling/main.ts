import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// GPU frustum culling of deformed meshes (Config.isComputeSkinningEnabled) in WebGPU mode. Their vertices are skinned
// and morphed by a compute shader, which also computes the bounding box of each deformed instance for the culling:
// - an instanced skinned mesh (BrainStem shallow copies) in a row that leaves the view, culled per instance;
// - an instanced morph target mesh (AnimatedMorphCube), one copy inside and one outside of the view.
// `?computeSkinning=0` renders the same scene with the vertex shader deformation and the CPU culling, which must give
// the same image.
const params = new URLSearchParams(window.location.search);
const isComputeSkinningEnabled = params.get('computeSkinning') !== '0';

await Promise.all([
  Rn.ModuleManager.getInstance().loadModule('webgpu'),
  Rn.ModuleManager.getInstance().loadModule('pbr'),
]);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.WebGPU,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info, isComputeSkinningEnabled }),
});
window.engine = engine;

const entities: Rn.ISceneGraphEntity[] = [];

// The skinned model and its shallow copies (an instanced skinned mesh: the instances have their own skeletons).
const brainStem = (
  await Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/BrainStem/glTF-Binary/BrainStem.glb'
  )
).renderPasses[0].sceneTopLevelGraphComponents[0].entity;
entities.push(brainStem);
for (let i = 1; i < 8; i++) {
  const copy = engine.entityRepository.shallowCopyEntity(brainStem) as Rn.ISceneGraphEntity;
  copy.getTransform().localPosition = Rn.Vector3.fromCopy3(i * 1.2, 0, -i * 0.6);
  entities.push(copy);
}

// The morph target model and a copy outside of the view.
const morphCube = (
  await Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb'
  )
).renderPasses[0].sceneTopLevelGraphComponents[0].entity;
morphCube.getTransform().localPosition = Rn.Vector3.fromCopy3(-1.5, 0.8, 0.5);
morphCube.getTransform().localScale = Rn.Vector3.fromCopy3(0.5, 0.5, 0.5);
entities.push(morphCube);
const morphCubeCopy = engine.entityRepository.shallowCopyEntity(morphCube) as Rn.ISceneGraphEntity;
morphCubeCopy.getTransform().localPosition = Rn.Vector3.fromCopy3(-30, 0.8, 0.5);
entities.push(morphCubeCopy);

const lightEntity = Rn.createLightEntity(engine);
lightEntity.getLight().type = Rn.LightType.Directional;
lightEntity.getLight().intensity = 3;
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 4, Math.PI / 6, 0);

const cameraEntity = Rn.createCameraEntity(engine, true);
const camera = cameraEntity.getCamera();
camera.zNear = 0.1;
camera.zFar = 100;
camera.setFovyAndChangeFocalLength(40);
camera.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopy3(1.0, 1.2, 5.0);
cameraEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(-0.08, 0.15, 0);

const renderPass = new Rn.RenderPass(engine);
renderPass.clearColor = Rn.Vector4.fromCopy4(0.15, 0.15, 0.18, 1.0);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities(entities);
renderPass.cameraComponent = camera;

const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

// A fixed pose, so that the image is deterministic.
let time = 0.8;
Rn.AnimationComponent.setGlobalTime(engine, time);

let count = 0;
const draw = () => {
  if (window.isAnimating) {
    time += 0.016;
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      time = Rn.AnimationComponent.getStartInputValue(engine);
    }
    Rn.AnimationComponent.setGlobalTime(engine, time);
  }
  engine.process([expression]);
  if (count === 2) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.textContent = 'Rendered.';
    document.body.appendChild(p);
  }
  count++;
  requestAnimationFrame(draw);
};

draw();
