import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/TransformComponent';
import Vector3 from '../math/Vector3';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from '../components/SceneGraphComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
  return entity;
}

test('The EntityRepository creates a entity whose uid is 1', () => {
  const firstEntity = generateEntity();
  const entityRepository = EntityRepository.getInstance();
  const sceneGraphComponent = entityRepository.getComponentOfEntity(firstEntity.entityUID, SceneGraphComponent.componentTID);
  
  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});
