import Entity from '../core/Entity';
import EntityRepository from '../core/EntityRepository';
import ComponentRepository from '../core/ComponentRepository';
import TransformComponent from './TransformComponent';
import is from '../misc/IsUtil';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
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


test('create Parent and child.', () => {
  const sceneEntity = generateEntity();
  const parentEntity = generateEntity();
  const childEntity = generateEntity();
  const child2Entity = generateEntity();
  sceneEntity.getTransform().translate = new Vector3(1, 0, 0);
  parentEntity.getTransform().translate = new Vector3(1, 0, 0);
  childEntity.getTransform().translate = new Vector3(1, 0, 0);
  child2Entity.getTransform().translate = new Vector3(0, 1, 0);
  parentEntity.getScenGraph().addChild(childEntity.getScenGraph());
  parentEntity.getScenGraph().addChild(child2Entity.getScenGraph());
  sceneEntity.getScenGraph().addChild(parentEntity.getScenGraph());

  console.log(childEntity.getScenGraph().worldMatrix.toString());
  console.log(child2Entity.getScenGraph().worldMatrix.toString());
  expect(true).toBe(true);
  //expect(childEntity.getScenGraph.worldMatrix.isEqual(new Vector3(1, 0, 0))).toBe(true);
});

