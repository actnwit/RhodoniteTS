import Rn from '../../../dist/esm';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

test('Entities cannot be instantiated by new operator.', () => {
  let entity: Rn.Entity | undefined;
  try {
    entity = new Rn.Entity(engine, 0, true);
  } catch {
    expect(Rn.Is.exist(entity)).toBe(false);
  }
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
