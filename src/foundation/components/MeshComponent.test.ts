import EntityRepository from '../core/EntityRepository';
import TransformComponent from './TransformComponent';
import SceneGraphComponent from './SceneGraphComponent';
import MeshComponent from './MeshComponent';
import Primitive from '../geometry/Primitive';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import MemoryManager from '../core/MemoryManager';
import Mesh from '../geometry/Mesh';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent, SceneGraphComponent, MeshComponent]);
  return entity;
}

test('Use translate simply', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
  const firstEntity = generateEntity();

  const indices = new Uint32Array([
    0, 1, 3, 3, 1, 2
  ]);

  const positions = new Float32Array([
    -1.5, -0.5, 0.0,
    -0.5, -0.5, 0.0,
    -0.5, 0.5, 0.0,
    -1.5, 0.5, 0.0
  ]);

  const colors = new Float32Array([
    0.0, 1.0, 1.0,
    1.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 0.0, 1.0
  ]);

  const primitive = Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [CompositionType.Vec3, CompositionType.Vec3],
    attributeSemantics: [VertexAttribute.Position, VertexAttribute.Color0],
    attributes: [positions, colors],
    material: void 0,
    primitiveMode: PrimitiveMode.Triangles
  });

  const meshComponent = firstEntity.getComponent(MeshComponent) as MeshComponent;
  const mesh = new Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);

 // expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
});
