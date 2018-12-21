import Entity from './Entity';
import EntityRepository from './EntityRepository';
import is from '../misc/IsUtil';


test('Entities cannot be instantiated by new operator.', () => {
  let entity = null;
  try {
    entity = new Entity(1, true, Symbol(), EntityRepository.getInstance());
  } catch {
    expect(is.not.exist(entity)).toBe(true);
  }
});

test('The EntityRepository creates a entity whose uid is 1', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([]);
  expect(firstEntity.entityUID).toBe(1);
});
