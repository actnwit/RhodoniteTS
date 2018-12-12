import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import ComponentRepository from '../core/ComponentRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';
import Vector3 from '../math/Vector3';
import SceneGraphComponent from './SceneGraphComponent';
import MeshComponent from './MeshComponent';
import Primitive from '../geometry/Primitive';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID, MeshComponent.componentTID]);
  return entity;
}

test('Use translate simply', () => {
  const firstEntity = generateEntity();

  const indices = new Float32Array([
    0, 1, 3, 3, 1, 2
  ]);

  const position = new Float32Array([
    -1.5, -0.5, 0.0,
    -0.5, -0.5, 0.0,
    -0.5, 0.5, 0.0,
    -1.5, 0.5, 0.0
  ]);

  Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [CompositionType.Mat3],
    attributes: [],
    material: 0,
    primitiveMode: PrimitiveMode.Triangles
  });

 // expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
});
