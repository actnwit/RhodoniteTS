import Rn from '../../';


function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent]);
  return entity;
}

// test('Use translate simply', async () => {
//   await Rn.ModuleManager.getInstance().loadModule('webgl');

//   Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
//   const firstEntity = generateEntity();

//   const indices = new Uint32Array([
//     0, 1, 3, 3, 1, 2
//   ]);

//   const positions = new Float32Array([
//     -1.5, -0.5, 0.0,
//     -0.5, -0.5, 0.0,
//     -0.5, 0.5, 0.0,
//     -1.5, 0.5, 0.0
//   ]);

//   const colors = new Float32Array([
//     0.0, 1.0, 1.0,
//     1.0, 1.0, 0.0,
//     1.0, 0.0, 0.0,
//     0.0, 0.0, 1.0
//   ]);

//   const primitive = Rn.Primitive.createPrimitive({
//     indices: indices,
//     attributeCompositionTypes: [Rn.CompositionType.Vec3, Rn.CompositionType.Vec3],
//     attributeSemantics: [Rn.VertexAttribute.Position, Rn.VertexAttribute.Color0],
//     attributes: [positions, colors],
//     material: void 0,
//     primitiveMode: Rn.PrimitiveMode.Triangles
//   });

//   const meshComponent = firstEntity.getComponent(Rn.MeshComponent) as MeshComponent;
//   const mesh = new Rn.Mesh();
//   mesh.addPrimitive(primitive);
//   meshComponent.setMesh(mesh);

//  // expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
// });

test('dummy', async () => {
  expect(true).toBe(true);
});
