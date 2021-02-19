import Rn from '../..';

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent]);
  return entity;
}

test('Use translate simply', () => {
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  const firstEntity = generateEntity();
  const transformComponent = firstEntity.getTransform();
  transformComponent.translate = new Rn.Vector3(1, 0, 0);
  expect(transformComponent.translate.isEqual(new Rn.Vector3(1, 0, 0))).toBe(
    true
  );
});
