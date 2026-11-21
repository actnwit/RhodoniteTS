import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// GPU frustum culling (Config.isGpuCullingEnabled) in WebGPU mode. The scene mixes the cases the culling handles:
// - a large grid of instances sharing one mesh, most of which are outside of the view (culled per instance);
// - some of those instances hidden with SceneGraphComponent.isVisible (culled on the GPU as well);
// - unique (non-instanced) meshes, partly outside of the view;
// - an instanced mesh with an alpha-blended material (its instance order must be preserved).
// `?gpuCulling=0` renders the same scene with the CPU culling, which must give the same image.
const params = new URLSearchParams(window.location.search);
const isGpuCullingEnabled = params.get('gpuCulling') !== '0';

await Promise.all([
  Rn.ModuleManager.getInstance().loadModule('webgpu'),
  Rn.ModuleManager.getInstance().loadModule('pbr'),
]);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.WebGPU,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info, isGpuCullingEnabled }),
});
window.engine = engine;

const entities: Rn.ISceneGraphEntity[] = [];

// Instanced cubes on a 40 x 40 grid on the XZ plane. The camera looks at a corner of the grid, so most of the
// instances are outside of the frustum.
const gridSide = 40;
const spacing = 1.5;
const cubeMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
cubeMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.9, 0.5, 0.2, 1));
const cubeTemplate = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.fromCopy3(0.5, 0.5, 0.5),
  material: cubeMaterial,
});
for (let i = 0; i < gridSide * gridSide; i++) {
  const entity =
    i === 0 ? cubeTemplate : (engine.entityRepository.shallowCopyEntity(cubeTemplate) as Rn.ISceneGraphEntity);
  const x = i % gridSide;
  const z = Math.floor(i / gridSide);
  entity.getTransform().localPosition = Rn.Vector3.fromCopy3(x * spacing, 0.5, z * spacing);
  entity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0, (x * 7 + z * 13) * 0.05, 0);
  if (i % 7 === 3) {
    entity.getSceneGraph().isVisible = false;
  }
  entities.push(entity);
}

// Unique spheres along the left border of the view: some are inside, some outside of the frustum.
for (let i = 0; i < 12; i++) {
  const material = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.2, 0.4 + i * 0.05, 0.9, 1));
  const sphere = Rn.MeshHelper.createSphere(engine, {
    radius: 0.6,
    widthSegments: 24,
    heightSegments: 16,
    material,
  });
  sphere.getTransform().localPosition = Rn.Vector3.fromCopy3(-2.5, 1.2, i * 3.0 - 6.0);
  entities.push(sphere);
}

// Instanced alpha-blended planes standing in a row through the view.
const blendMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
blendMaterial.alphaMode = Rn.AlphaMode.Blend;
blendMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.3, 0.9, 0.4, 0.5));
const planeTemplate = Rn.MeshHelper.createPlane(engine, {
  width: 2,
  height: 2,
  uSpan: 1,
  vSpan: 1,
  isUVRepeat: false,
  direction: 'xy',
  material: blendMaterial,
});
for (let i = 0; i < 16; i++) {
  const entity =
    i === 0 ? planeTemplate : (engine.entityRepository.shallowCopyEntity(planeTemplate) as Rn.ISceneGraphEntity);
  entity.getTransform().localPosition = Rn.Vector3.fromCopy3(3 + i * 1.2, 1.5, 4 + i * 1.6);
  entities.push(entity);
}

const lightEntity = Rn.createLightEntity(engine);
lightEntity.getLight().type = Rn.LightType.Directional;
lightEntity.getLight().intensity = 3;
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 3, Math.PI / 5, 0);

const cameraEntity = Rn.createCameraEntity(engine, true);
const camera = cameraEntity.getCamera();
camera.zNear = 0.1;
camera.zFar = 200;
camera.setFovyAndChangeFocalLength(50);
camera.aspect = 1;

const setCameraAngle = (angle: number) => {
  const target = Rn.Vector3.fromCopy3(6, 0.5, 6);
  const radius = 14;
  cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopy3(
    target.x + Math.sin(angle) * radius,
    7,
    target.z + Math.cos(angle) * radius
  );
  const position = cameraEntity.getTransform().localPosition;
  const dir = Rn.Vector3.normalize(Rn.Vector3.subtract(target, position));
  const yaw = Math.atan2(-dir.x, -dir.z);
  const pitch = Math.asin(dir.y);
  cameraEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(pitch, yaw, 0);
};
const initialAngle = -Math.PI / 5;
setCameraAngle(initialAngle);
window.setCameraAngle = setCameraAngle;

const renderPass = new Rn.RenderPass(engine);
renderPass.clearColor = Rn.Vector4.fromCopy4(0.15, 0.15, 0.18, 1.0);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities(entities);
renderPass.cameraComponent = camera;

const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

let count = 0;
let angle = initialAngle;
const draw = () => {
  if (window.isAnimating) {
    angle += 0.01;
    setCameraAngle(angle);
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
