import Rn from '../../../../dist/esm';

describe('SceneGraphComponent', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  function generateEntity() {
    return Rn.createGroupEntity(engine);
  }

  beforeAll(() => {
    Rn.MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);
  });

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
