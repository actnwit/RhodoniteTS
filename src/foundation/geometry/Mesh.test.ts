import Primitive from '../geometry/Primitive';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import MemoryManager from '../core/MemoryManager';
import Mesh from '../geometry/Mesh';

function generatePrimitive() {
  const indices = new Uint32Array([
    0, 1, 3, 3, 1, 2
  ]);

  const positions = new Float32Array([
    -1.5, -0.5, 0.0,
    -0.5, -0.5, 0.0,
    -0.5, 0.5, 0.0,
    -1.5, 0.5, 0.0
  ]);

  const primitive = Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [CompositionType.Vec3],
    attributeSemantics: [VertexAttribute.Position],
    attributes: [positions],
    material: void 0,
    primitiveMode: PrimitiveMode.Triangles
  });

  return primitive;
}


test('mesh.instanceIndex is correct', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
  const primitive = generatePrimitive();

  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const mesh2 = new Mesh();
  mesh2.setMesh(mesh);

  mesh2.instanceIndex

  expect(mesh2.instanceIndex).toBe(1);
});

test('mesh.isInstanceMesh() is correct', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
  const primitive = generatePrimitive();

  const mesh = new Mesh();
  mesh.addPrimitive(primitive);

  const mesh2 = new Mesh();
  mesh2.setMesh(mesh);

  mesh2.instanceIndex

  expect(mesh.isInstanceMesh()).toBe(false);
  expect(mesh2.isInstanceMesh()).toBe(true);
});
