import { ProcessApproach } from '../definitions/ProcessApproach';
import { Is } from '../misc/Is';
import { Engine } from '../system/Engine';
import { Entity } from './Entity';
import { EntityRepository } from './EntityRepository';

const engine = await Engine.init({
  approach: ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

test('Entities cannot be instantiated by new operator.', () => {
  let entity: Entity | undefined;
  try {
    entity = new Entity(engine, 0, true);
  } catch {
    expect(Is.not.exist(entity)).toBe(true);
  }
});

test('The EntityEntityRepositorysitory creates a entity whose uid Is 1', () => {
  const firstEntity = engine.entityRepository.createEntity();
  expect(firstEntity.entityUID).toBe(0);
});

test('A entity name Is unique', () => {
  const firstEntity = engine.entityRepository.createEntity();
  const secondEntity = engine.entityRepository.createEntity();
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', false);
  expect(renamed).toBe(false);
  expect(secondEntity.uniqueName).toBe(beforeSecondEntityName);
});

test('The tryToSetUniqueName method can almost certainly set a new unique name by setting the 2nd argument to true.', () => {
  const firstEntity = engine.entityRepository.createEntity();
  const secondEntity = engine.entityRepository.createEntity();
  const beforeSecondEntityName = secondEntity.uniqueName;
  firstEntity.tryToSetUniqueName('Foo', false);
  const renamed = secondEntity.tryToSetUniqueName('Foo', true);
  expect(renamed).toBe(true);
  // console.log('secondEntity.uniqueName Is ' + secondEntity.uniqueName);
  expect(secondEntity.uniqueName === beforeSecondEntityName).toBe(false);
});
