import RnObject from './RnObject';

beforeEach(() => {
  RnObject._reset();
});

test('ObjectUID count up correctly', () => {
  expect(RnObject.currentMaxObjectCount).toBe(0);

  const obj0 = new RnObject();
  const obj1 = new RnObject();

  expect(RnObject.currentMaxObjectCount).toBe(2);

  expect(obj0.objectUID).toBe(0);
  expect(obj1.objectUID).toBe(1);
});

test('A instance of RnObject is named as "entity_of_uid_***" automatically.', () => {
  const obj0 = new RnObject();

  expect(obj0.uniqueName).toBe('entity_of_uid_0');
});

test('Try to set unique name', () => {
  const obj0 = new RnObject();
  obj0.tryToSetUniqueName('Foo', true);

  expect(obj0.uniqueName).toBe('Foo');

  const obj1 = new RnObject();
  obj1.tryToSetUniqueName('Boo', false);
  expect(obj1.uniqueName).toBe('Boo');

  const obj2 = new RnObject();
  obj2.tryToSetUniqueName('Foo', false);
  expect(obj2.uniqueName).toBe('entity_of_uid_2');

  obj2.tryToSetUniqueName('Foo', true);
  expect(obj2.uniqueName).toBe('Foo_(entity_of_uid_2)');
});
