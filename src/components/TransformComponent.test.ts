import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';

test('The EntityRepository creates a entity whose uid is 1', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([TransformComponent.componentTID]);
  expect(firstEntity.entityUID).toBe(1);
});
