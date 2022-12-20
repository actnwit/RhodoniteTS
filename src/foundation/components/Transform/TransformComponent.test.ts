import { MemoryManager } from '../../core/MemoryManager';
import { EntityHelper } from '../../helpers/EntityHelper';
import { Vector3 } from '../../math/Vector3';

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
  transformComponent.localPosition = Vector3.fromCopyArray([1, 0, 0]);
  expect(transformComponent.localPosition.isEqual(Vector3.fromCopyArray([1, 0, 0]))).toBe(true);
  firstEntity.localScale = Vector3.fromCopyArray([2, 1, 1]);
  expect(transformComponent.localPosition.isEqual(Vector3.fromCopyArray([1, 0, 0]))).toBe(true);

  expect(transformComponent.localScale.isEqual(Vector3.fromCopyArray([2, 1, 1]))).toBe(true);
});
