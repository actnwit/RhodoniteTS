import Rn from '../../../../dist/esm';

function generateEntity() {
  return Rn.EntityHelper.createGroupEntity();
}

test('create Parents and children.', () => {
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  // generate entities
  const sceneEntity = generateEntity();
  const parentEntity = generateEntity();
  const childEntity = generateEntity();
  //  const child2Entity = generateEntity();

  // set transform info
  sceneEntity.getTransform().translate = Rn.Vector3.fromCopyArray([1, 0, 0]);
  parentEntity.getTransform().translate = Rn.Vector3.fromCopyArray([1, 0, 0]);
  childEntity.getTransform().translate = Rn.Vector3.fromCopyArray([1, 0, 0]);
  //  child2Entity.getTransform().translate = Rn.Vector3.fromCopyArray([0, 1, 0]);

  // setup scene graph
  parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());
  //  parentEntity.getSceneGraph().addChild(child2Entity.getSceneGraph());
  sceneEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());

  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);
  // console.log(childEntity.getSceneGraph().worldMatrix);

  expect(
    childEntity
      .getSceneGraph()
      .worldMatrix.isEqual(
        new Rn.Matrix44(1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
        0.00001
      )
  ).toBe(true);
});

test('flatten hierarchy', () => {
  // generate entities
  const sceneEntity = generateEntity();
  const parentEntity = generateEntity();
  const childEntity = generateEntity();
  const child2Entity = generateEntity();

  // setup scene graph
  parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());
  parentEntity.getSceneGraph().addChild(child2Entity.getSceneGraph());
  sceneEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());

  const result = Rn.SceneGraphComponent.flattenHierarchy(
    sceneEntity.getSceneGraph(),
    false
  );

  expect(result.length).toBe(4);
});