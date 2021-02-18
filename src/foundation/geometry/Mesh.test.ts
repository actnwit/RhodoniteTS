import Rn from '../..';

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

  const primitive = Rn.Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [Rn.CompositionType.Vec3],
    attributeSemantics: [Rn.VertexAttribute.Position],
    attributes: [positions],
    material: void 0,
    primitiveMode: Rn.PrimitiveMode.Triangles
  });

  return primitive;
}


// test('mesh.instanceIndex is correct', async () => {
//   Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
//   await Rn.ModuleManager.getInstance().loadModule('webgl');

//   const primitive = generatePrimitive();

//   const mesh = new Rn.Mesh();
//   mesh.addPrimitive(primitive);

//   const mesh2 = new Rn.Mesh();
//   mesh2.setOriginalMesh(mesh);

//   mesh2.instanceIndex

//   expect(mesh2.instanceIndex).toBe(1);
// });

// test('mesh.isInstanceMesh() is correct', async () => {
//   Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
//   await Rn.ModuleManager.getInstance().loadModule('webgl');

//   const primitive = generatePrimitive();

//   const mesh = new Rn.Mesh();
//   mesh.addPrimitive(primitive);

//   const mesh2 = new Rn.Mesh();
//   mesh2.setOriginalMesh(mesh);

//   mesh2.instanceIndex

//   expect(mesh.isInstanceMesh()).toBe(false);
//   expect(mesh2.isInstanceMesh()).toBe(true);
// });

test('dummy', async () => {
  expect(true).toBe(true);
});
