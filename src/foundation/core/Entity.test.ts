import Entity from './Entity';
import EntityRepository from './EntityRepository';
import {Is} from '../misc/Is';

test('Entities cannot be instantiated by new operator.', () => {
  let entity = null;
  try {
    entity = new Entity(0, true);
  } catch {
    expect(Is.not.exist(entity)).toBe(true);
  }
});

test('The EntityRepository creates a entity whose uid Is 1', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([]);
  expect(firstEntity.entityUID).toBe(0);
});

test('A entity name Is unique', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([]);
  const secondEntity = repo.createEntity([]);
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', false);
  expect(renamed).toBe(false);
  expect(secondEntity.uniqueName).toBe(beforeSecondEntityName);
});

test('The tryToSetUniqueName method can almost certainly set a new unique name by setting the 2nd argument to true.', () => {
  const repo = EntityRepository.getInstance();
  const firstEntity = repo.createEntity([]);
  const secondEntity = repo.createEntity([]);
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', true);
  expect(renamed).toBe(true);
  console.log('secondEntity.uniqueName Is ' + secondEntity.uniqueName);
  expect(secondEntity.uniqueName === beforeSecondEntityName).toBe(false);
});
