import Rn from '../../../../dist/esm/';

function generateEntity() {
  return Rn.EntityHelper.createTransformEntity();
}

test('Use translate simply', () => {
  Rn.MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = Rn.Vector3.fromCopyArray([1, 0, 0]);
  expect(
    transformComponent.translate.isEqual(Rn.Vector3.fromCopyArray([1, 0, 0]))
  ).toBe(true);
  firstEntity.scale = Rn.Vector3.fromCopyArray([2, 1, 1]);
  expect(
    transformComponent.translate.isEqual(Rn.Vector3.fromCopyArray([1, 0, 0]))
  ).toBe(true);

  expect(
    transformComponent.scale.isEqual(Rn.Vector3.fromCopyArray([2, 1, 1]))
  ).toBe(true);
});
