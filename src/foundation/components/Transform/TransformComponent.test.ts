import Rn from '../../../../dist/esm/';

function generateEntity() {
  return Rn.EntityHelper.createTransformEntity();
}

test('Use translate simply', () => {
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = Rn.Vector3.fromCopyArray([1, 0, 0]);
  console.log(transformComponent.translateInner);
  console.log(transformComponent.translate);
  console.log(Rn.Vector3.fromCopyArray([1, 0, 0]));
  expect(
    transformComponent.translate.isEqual(Rn.Vector3.fromCopyArray([1, 0, 0]))
  ).toBe(true);
});