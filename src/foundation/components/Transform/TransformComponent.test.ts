import Rn from '../../../../dist/esm';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

function generateEntity() {
  return Rn.createTransformEntity(engine);
}

test('Use translate simply', () => {
  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.localPosition = Rn.Vector3.fromCopyArray([1, 0, 0]);
  expect(transformComponent.localPosition.isEqual(Rn.Vector3.fromCopyArray([1, 0, 0]))).toBe(true);
  firstEntity.localScale = Rn.Vector3.fromCopyArray([2, 1, 1]);
  expect(transformComponent.localPosition.isEqual(Rn.Vector3.fromCopyArray([1, 0, 0]))).toBe(true);

  expect(transformComponent.localScale.isEqual(Rn.Vector3.fromCopyArray([2, 1, 1]))).toBe(true);
});
