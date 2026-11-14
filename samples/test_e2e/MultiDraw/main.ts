import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

window.Rn = Rn;

const engine = await Rn.Engine.init({
  approach: getProcessApproach(Rn),
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Warn }),
});

// Camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(50);
cameraComponent.aspect = 1;
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 8]);

// Light
const lightEntity = Rn.createLightEntity(engine);
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([1, 1, 1]);
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 4, Math.PI / 6, 0]);

const materialA = Rn.MaterialHelper.createClassicUberMaterial(engine);
materialA.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([0.2, 0.55, 1.0, 1.0]));
const materialB = Rn.MaterialHelper.createClassicUberMaterial(engine);
materialB.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([1.0, 0.45, 0.2, 1.0]));

const QUAD_COUNT = 8;
const VERTEX_COUNT_PER_QUAD = 4;
const INDEX_COUNT_PER_QUAD = 6;
const totalVertices = QUAD_COUNT * VERTEX_COUNT_PER_QUAD;
const positionByteLength = totalVertices * 3 * 4;
const index16ByteLength = QUAD_COUNT * INDEX_COUNT_PER_QUAD * 2;
const index32ByteLength = QUAD_COUNT * INDEX_COUNT_PER_QUAD * 4;
const totalByteLength = positionByteLength + index16ByteLength + index32ByteLength + 64;

// All primitives share this CPU Buffer, like the primitives of one glTF file share its buffer.
const arrayBuffer = new ArrayBuffer(totalByteLength);
const sharedBuffer = new Rn.Buffer({
  byteLength: totalByteLength,
  buffer: arrayBuffer,
  name: 'MultiDrawSharedBuffer',
  byteAlign: 4,
  bufferUsage: Rn.BufferUse.CPUGeneric,
  indexOfTheBufferUsage: 0,
});

const createQuadPrimitive = (quadIndex: number, material: Rn.Material, useUint32: boolean) => {
  const column = quadIndex % 4;
  const row = Math.floor(quadIndex / 4);
  const centerX = (column - 1.5) * 1.4;
  const centerY = (row - 0.5) * 1.4;

  const positions = new Float32Array([
    centerX - 0.5,
    centerY - 0.5,
    0,
    centerX + 0.5,
    centerY - 0.5,
    0,
    centerX - 0.5,
    centerY + 0.5,
    0,
    centerX + 0.5,
    centerY + 0.5,
    0,
  ]);
  const positionView = sharedBuffer
    .takeBufferView({ byteLengthToNeed: positions.byteLength, byteStride: 0 })
    .unwrapForce();
  const positionAccessor = positionView
    .takeAccessor({
      compositionType: Rn.CompositionType.Vec3,
      componentType: Rn.ComponentType.Float,
      count: VERTEX_COUNT_PER_QUAD,
    })
    .unwrapForce();
  positionAccessor.copyFromTypedArray(positions);

  const indexArray = useUint32 ? new Uint32Array([0, 1, 2, 2, 1, 3]) : new Uint16Array([0, 1, 2, 2, 1, 3]);
  const indexView = sharedBuffer
    .takeBufferView({ byteLengthToNeed: indexArray.byteLength, byteStride: 0 })
    .unwrapForce();
  const indexAccessor = indexView
    .takeAccessor({
      compositionType: Rn.CompositionType.Scalar,
      componentType: useUint32 ? Rn.ComponentType.UnsignedInt : Rn.ComponentType.UnsignedShort,
      count: INDEX_COUNT_PER_QUAD,
    })
    .unwrapForce();
  indexAccessor.copyFromTypedArray(indexArray);

  const attributes = new Map();
  attributes.set(Rn.VertexAttribute.Position.XYZ, positionAccessor);

  const primitive = new Rn.Primitive(engine);
  primitive.setData(attributes, Rn.PrimitiveMode.Triangles, material, indexAccessor);
  return primitive;
};

const meshA = new Rn.Mesh(engine);
const meshB = new Rn.Mesh(engine);
for (let i = 0; i < QUAD_COUNT; i++) {
  // The last quad uses a different material to verify that batches split on materials.
  const material = i === QUAD_COUNT - 1 ? materialB : materialA;
  // Mix 16-bit and 32-bit source index buffers; the merged index buffer is always uint32.
  const primitive = createQuadPrimitive(i, material, i % 2 === 1);
  if (i < QUAD_COUNT / 2) {
    meshA.addPrimitive(primitive);
  } else {
    meshB.addPrimitive(primitive);
  }
}

const entityA = Rn.createMeshEntity(engine);
entityA.getMesh().setMesh(meshA);
const entityB = Rn.createMeshEntity(engine);
entityB.getMesh().setMesh(meshB);

// A second entity sharing meshA exercises instanced multi-draw and the instance remap.
const entityA2 = Rn.createMeshEntity(engine);
entityA2.getMesh().setMesh(meshA);
entityA2.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, -3.0, 0]);

const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([entityA, entityB, entityA2]);

const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

let count = 0;
const draw = () => {
  engine.process([expression]);
  count++;
  if (count > 0) {
    window._rendered = true;
  }
  requestAnimationFrame(draw);
};
draw();
