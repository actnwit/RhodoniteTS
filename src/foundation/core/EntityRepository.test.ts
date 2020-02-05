import RnObj, { RnType } from "../../../dist/rhodonite";

const Rn: RnType = RnObj as any;

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent]);
  return entity;
}

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  const firstEntity = generateEntity();
  const entityRepository = Rn.EntityRepository.getInstance();
  const sceneGraphComponent = entityRepository.getComponentOfEntity(firstEntity.entityUID, Rn.SceneGraphComponent);

  expect(sceneGraphComponent instanceof Rn.SceneGraphComponent).toBe(true);
});
