import Rn from '../../../dist/esmdev/index.js';

declare const Stats: any;
declare const window: any;

window.Rn = Rn;

function createColoredCubePrimitive() {
  const indices = new Uint16Array([
    3, 1, 0, 2, 1, 3, 4, 5, 7, 7, 5, 6, 8, 9, 11, 11, 9, 10, 15, 13, 12, 14, 13, 15, 19, 17, 16, 18, 17, 19, 20, 21, 23,
    23, 21, 22,
  ]);

  const positions = new Float32Array([
    -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
    -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1,
    -1, 1, 1, -1, 1, -1,
  ]);

  const colors = new Float32Array([
    0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
    1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0,
  ]);

  return Rn.Primitive.createPrimitive(engine, {
    indices,
    attributeSemantics: [Rn.VertexAttribute.Position.XYZ, Rn.VertexAttribute.Color0.XYZ],
    attributes: [positions, colors],
    primitiveMode: Rn.PrimitiveMode.Triangles,
  });
}

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: false }),
});

const countParam = new URLSearchParams(window.location.search).get('count');
const parsedCount = countParam != null ? Number.parseInt(countParam, 10) : Number.NaN;
const cubeCount = Number.isFinite(parsedCount) ? Math.min(200_000, Math.max(1, parsedCount)) : 10_000;

const primitive = createColoredCubePrimitive();

// Default orthographic camera maps world X/Y to the viewport; keep the grid on XY so any
// instance count stays inside the frustum. Fit using the smaller ortho half-extent (aspect).
Rn.Engine.createCamera(engine);
const cameraSid = Rn.CameraComponent.getCurrent(engine);
const camera = engine.componentRepository.getComponent(Rn.CameraComponent, cameraSid) as Rn.CameraComponent;
const orthoHalfMin = Math.min(camera.xMag, camera.yMag);
const frustumInset = 0.92;
const halfSpan = orthoHalfMin * frustumInset;

const gridSide = Math.ceil(Math.sqrt(cubeCount));
const cell = (2 * halfSpan) / gridSide;
const halfCell = cell / 2;
const unitCubeCornerDist = Math.sqrt(3);
const cubeScale = ((cell * 0.5) / unitCubeCornerDist) * 0.98;

const sharedMesh = new Rn.Mesh(engine);
sharedMesh.addPrimitive(primitive);

const templateEntity = Rn.createMeshEntity(engine);
templateEntity.getMesh().setMesh(sharedMesh);

const entities: Rn.ISceneGraphEntity[] = [];
const baseXArr = new Float32Array(cubeCount);
const baseYArr = new Float32Array(cubeCount);
const baseZArr = new Float32Array(cubeCount);
const wavePhaseOffset = new Float32Array(cubeCount);

for (let i = 0; i < cubeCount; i++) {
  const entity =
    i === 0 ? templateEntity : (engine.entityRepository.shallowCopyEntity(templateEntity) as Rn.ISceneGraphEntity);
  entities.push(entity);

  const gx = i % gridSide;
  const gy = Math.floor(i / gridSide);
  const baseX = -halfSpan + halfCell + gx * cell;
  const baseY = -halfSpan + halfCell + gy * cell;
  baseXArr[i] = baseX;
  baseYArr[i] = baseY;
  wavePhaseOffset[i] = gx * 0.08 + gy * 0.06;

  entity.getTransform().localScale = Rn.Vector3.fromCopyArray([cubeScale, cubeScale, cubeScale]);
  entity.getTransform().setLocalPositionAsArray3([baseX, baseY, 0]);
}

const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities(entities);

const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.domElement);

let count = 0;
const positionScratch: [number, number, number] = [0, 0, 0];

const draw = () => {
  if (count > 0) {
    window._rendered = true;
  }

  const phase = count * 0.02;
  if (window.isAnimating) {
    for (let i = 0; i < cubeCount; i++) {
      positionScratch[0] = baseXArr[i] + Math.sin(phase + wavePhaseOffset[i]) * 0.12;
      positionScratch[1] = baseYArr[i];
      positionScratch[2] = baseZArr[i];
      entities[i].getTransform().setLocalPositionAsArray3(positionScratch);
    }
  }

  stats.begin();
  engine.process([expression]);
  stats.end();
  count++;
  requestAnimationFrame(draw);
};

draw();

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(engine, 'Rhodonite');
};
