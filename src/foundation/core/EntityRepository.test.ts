import Rn from '../../../dist/esm';

function generateEntity() {
  const entity = Rn.EntityHelper.createGroupEntity();
  return entity;
}

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  Rn.MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = generateEntity();
  const entityRepository = Rn.EntityRepository.getInstance();
  const sceneGraphComponent = entityRepository.getComponentOfEntity(
    firstEntity.entityUID,
    Rn.SceneGraphComponent
  );

  expect(sceneGraphComponent instanceof Rn.SceneGraphComponent).toBe(true);
});
