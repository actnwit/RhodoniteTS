import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import ComponentRepository from '../core/ComponentRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';
import Vector3 from '../math/Vector3';
import MemoryManager from '../core/MemoryManager';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent]);
  return entity;
}

test('Use translate simply', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);

  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = new Vector3(1, 0, 0);
  expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
});
