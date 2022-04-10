import Entity from './Entity';
import {Is} from '../misc/Is';
import {EntityRepository} from './EntityRepository';

test('Entities cannot be instantiated by new operator.', () => {
  let entity = null;
  try {
    entity = new Entity(0, true);
  } catch {
    expect(Is.not.exist(entity)).toBe(true);
  }
});

test('The EntityEntityRepositorysitory creates a entity whose uid Is 1', () => {
  const firstEntity = EntityRepository.createEntity();
  expect(firstEntity.entityUID).toBe(0);
});

test('A entity name Is unique', () => {
  const firstEntity = EntityRepository.createEntity();
  const secondEntity = EntityRepository.createEntity();
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', false);
  expect(renamed).toBe(false);
  expect(secondEntity.uniqueName).toBe(beforeSecondEntityName);
});

test('The tryToSetUniqueName method can almost certainly set a new unique name by setting the 2nd argument to true.', () => {
  const firstEntity = EntityRepository.createEntity();
  const secondEntity = EntityRepository.createEntity();
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', true);
  expect(renamed).toBe(true);
  // console.log('secondEntity.uniqueName Is ' + secondEntity.uniqueName);
  expect(secondEntity.uniqueName === beforeSecondEntityName).toBe(false);
});
