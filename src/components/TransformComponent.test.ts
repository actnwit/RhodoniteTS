import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import ComponentRepository from '../core/ComponentRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';
import Vector3 from '../math/Vector3';

test('The EntityRepository creates a entity whose uid is 1', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([TransformComponent.componentTID]);
  expect(firstEntity.entityUID).toBe(1);
});

test('translate', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([TransformComponent.componentTID]);
  const transformComponent = firstEntity.getTransfrom();
  transformComponent.translate = new Vector3(1, 0, 0);
  expect(transformComponent.translate.isEqual(new Vector3(1, 0, 0))).toBe(true);
});
