import Rn from '../../../../dist/esm';

describe('SceneGraphComponent', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  function generateEntity() {
    return Rn.createGroupEntity(engine);
  }

  test('create Parents and children.', () => {
    // generate entities
    const sceneEntity = generateEntity();
    const parentEntity = generateEntity();
    const childEntity = generateEntity();
    //  const child2Entity = generateEntity();

    // set transform info
    sceneEntity.position = Rn.Vector3.fromCopyArray([1, 0, 0]);
    parentEntity.position = Rn.Vector3.fromCopyArray([1, 0, 0]);
    childEntity.position = Rn.Vector3.fromCopyArray([1, 0, 0]);
    //  child2Entity.getTransform().localPosition = Vector3.fromCopyArray([0, 1, 0]);

    // setup scene graph
    parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());
    //  parentEntity.getSceneGraph().addChild(child2Entity.getSceneGraph());
    sceneEntity.addChild(parentEntity.getSceneGraph());

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

    console.log(childEntity.getSceneGraph().matrix);
    expect(
      childEntity
        .getSceneGraph()
        .matrix.isEqual(Rn.Matrix44.fromCopy16RowMajor(1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), 0.00001)
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
    parentEntity.addChild(child2Entity.getSceneGraph());
    sceneEntity.addChild(parentEntity.getSceneGraph());

    const result = Rn.flattenHierarchy(sceneEntity.getSceneGraph(), false);

    expect(result.length).toBe(4);
  });

  test('getQuaternionRecursivelyTo writes the world rotation into the given quaternion', () => {
    const sceneEntity = generateEntity();
    const parentEntity = generateEntity();
    const childEntity = generateEntity();

    parentEntity.getTransform().localRotation = Rn.Quaternion.axisAngle(Rn.Vector3.fromCopy3(0, 1, 0), Math.PI / 4);
    childEntity.getTransform().localRotation = Rn.Quaternion.axisAngle(Rn.Vector3.fromCopy3(1, 0, 0), Math.PI / 6);
    parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());
    sceneEntity.addChild(parentEntity.getSceneGraph());

    const childSceneGraph = childEntity.getSceneGraph();
    const out = Rn.MutableQuaternion.identity();
    const returned = childSceneGraph.getQuaternionRecursivelyTo(out);

    expect(returned).toBe(out);
    expect(out.isEqual(childSceneGraph.getQuaternionRecursively(), 0.00001)).toBe(true);

    // The same output instance can be reused without allocating a new quaternion.
    const out2 = Rn.MutableQuaternion.identity();
    expect(childSceneGraph.getQuaternionRecursivelyTo(out2)).toBe(out2);
    expect(out2.isStrictEqual(out)).toBe(true);
  });

  // test('create Parents and children.', () => {
  //   const entityRepository = EntityRepository.getInstance();
  //   const entity = entityRepository.createEntity([]);
  //   const transformEntity = entityRepository.addComponentToEntity(
  //     TransformComponent,
  //     entity.entityUID
  //   );
  //   // const
  // });
});
