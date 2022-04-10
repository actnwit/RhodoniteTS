import {SceneGraphComponent} from '../components/SceneGraph/SceneGraphComponent';
import {EntityHelper} from '../helpers/EntityHelper';
import {EntityRepository} from './EntityRepository';
import {MemoryManager} from './MemoryManager';

function generateEntity() {
  const entity = EntityHelper.createGroupEntity();
  return entity;
}

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = generateEntity();
  const sceneGraphComponent = EntityRepository.getComponentOfEntity(
    firstEntity.entityUID,
    SceneGraphComponent
  );

  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});
