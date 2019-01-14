import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from './TransformComponent';
import ImmutableVector3 from '../math/ImmutableVector3';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import RowMajarMatrix44 from '../math/RowMajarMatrix44';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID]);
  return entity;
}

test('create Parents and children.', () => {
  // generate entities
  const sceneEntity = generateEntity();
  const parentEntity = generateEntity();
  const childEntity = generateEntity();
//  const child2Entity = generateEntity();

  // set transform info
  sceneEntity.getTransform().translate = new ImmutableVector3(1, 0, 0);
  parentEntity.getTransform().translate = new ImmutableVector3(1, 0, 0);
  childEntity.getTransform().translate = new ImmutableVector3(1, 0, 0);
//  child2Entity.getTransform().translate = new Vector3(0, 1, 0);

  // setup scene graph
  parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());
//  parentEntity.getSceneGraph().addChild(child2Entity.getSceneGraph());
  sceneEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());

  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);
  console.log(childEntity.getSceneGraph().worldMatrix);

  expect(childEntity.getSceneGraph().worldMatrix.isEqual(
    new RowMajarMatrix44(
      1, 0, 0, 3,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1), 0.00001)).toBe(true);
});
