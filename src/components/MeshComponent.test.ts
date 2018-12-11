import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import ComponentRepository from '../core/ComponentRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';
import Vector3 from '../math/Vector3';
import SceneGraphComponent from './SceneGraphComponent';
import MeshComponent from './MeshComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID, MeshComponent.componentTID]);
  return entity;
}

test('The EntityRepository creates a entity whose uid is 1', () => {
  const firstEntity = generateEntity();
  expect(firstEntity.entityUID).toBe(1);
});

test('Use translate simply', () => {
  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = new Vector3(1, 0, 0);
  expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
});
