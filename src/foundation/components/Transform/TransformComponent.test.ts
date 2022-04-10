import {MemoryManager} from '../../core/MemoryManager';
import {EntityHelper} from '../../helpers/EntityHelper';
import {Vector3} from '../../math/Vector3';

function generateEntity() {
  return EntityHelper.createTransformEntity();
}

test('Use translate simply', () => {
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = Vector3.fromCopyArray([1, 0, 0]);
  expect(
    transformComponent.translate.isEqual(Vector3.fromCopyArray([1, 0, 0]))
  ).toBe(true);
  firstEntity.scale = Vector3.fromCopyArray([2, 1, 1]);
  expect(
    transformComponent.translate.isEqual(Vector3.fromCopyArray([1, 0, 0]))
  ).toBe(true);

  expect(
    transformComponent.scale.isEqual(Vector3.fromCopyArray([2, 1, 1]))
  ).toBe(true);
});
