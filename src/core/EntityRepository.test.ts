import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/TransformComponent';
import ImmutableVector3 from '../math/ImmutableVector3';
import ImmutableMatrix44 from '../math/ImmutableMatrix44';
import SceneGraphComponent from '../components/SceneGraphComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
  return entity;
}

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  const firstEntity = generateEntity();
  const entityRepository = EntityRepository.getInstance();
  const sceneGraphComponent = entityRepository.getComponentOfEntity(firstEntity.entityUID, SceneGraphComponent.componentTID);
  
  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});
