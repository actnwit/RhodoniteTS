import Entity from './Entity';
import EntityRepository from './EntityRepository';


test('A Entity is creatable', () => {
  const entity = new Entity(1, true);
  expect(entity instanceof Entity).toBe(true);
});

test('The EntityRepository creates a entity whose uid is 1', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([]);
  expect(firstEntity.entityUID).toBe(1);
});
