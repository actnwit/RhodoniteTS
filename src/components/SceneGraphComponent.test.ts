import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from './TransformComponent';
import Vector3 from '../math/Vector3';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
  return entity;
}

test('The EntityRepository creates a entity whose uid is 1', () => {
  const firstEntity = generateEntity();
  expect(firstEntity.entityUID).toBe(1);
});


test('create Parents and children.', () => {
  // generate entities
  const sceneEntity = generateEntity();
  const parentEntity = generateEntity();
  const childEntity = generateEntity();
  const child2Entity = generateEntity();

  // set transform info
  sceneEntity.getTransform().translate = new Vector3(1, 0, 0);
  parentEntity.getTransform().translate = new Vector3(1, 0, 0);
  childEntity.getTransform().translate = new Vector3(1, 0, 0);
  child2Entity.getTransform().translate = new Vector3(0, 1, 0);

  // setup scene graph
  parentEntity.getScenGraph().addChild(childEntity.getScenGraph());
  parentEntity.getScenGraph().addChild(child2Entity.getScenGraph());
  sceneEntity.getScenGraph().addChild(parentEntity.getScenGraph());

  console.log(childEntity.getScenGraph().worldMatrix.toString());
  console.log(child2Entity.getScenGraph().worldMatrix.toString());
  //expect(true).toBe(true);

  console.log(childEntity.getScenGraph().worldMatrix.toStringApproximately());

  expect(childEntity.getScenGraph().worldMatrix.isEqual(
    new Matrix44(
      1, 0, 0, 3,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1))).toBe(true);
});

