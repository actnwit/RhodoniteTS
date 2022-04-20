import {MemoryManager} from '../../core/MemoryManager';
import {EntityHelper} from '../../helpers/EntityHelper';
import {Matrix44} from '../../math/Matrix44';
import {Vector3} from '../../math/Vector3';
import {SceneGraphComponent} from './SceneGraphComponent';

describe('SceneGraphComponent', () => {
  function generateEntity() {
    return EntityHelper.createGroupEntity();
  }

  beforeAll(() => {
    MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: 1,
      gpuInstanceData: 1,
      gpuVertexData: 1,
    });
  });

  test('create Parents and children.', () => {
    // generate entities
    const sceneEntity = generateEntity();
    const parentEntity = generateEntity();
    const childEntity = generateEntity();
    //  const child2Entity = generateEntity();

    // set transform info
    sceneEntity.translate = Vector3.fromCopyArray([1, 0, 0]);
    parentEntity.translate = Vector3.fromCopyArray([1, 0, 0]);
    childEntity.translate = Vector3.fromCopyArray([1, 0, 0]);
    //  child2Entity.getTransform().translate = Vector3.fromCopyArray([0, 1, 0]);

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

    console.log(childEntity.getSceneGraph().worldMatrix);
    expect(
      childEntity
        .getSceneGraph()
        .worldMatrix.isEqual(
          Matrix44.fromCopy16RowMajor(
            1, 0, 0, 3,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1),
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
    parentEntity.addChild(child2Entity.getSceneGraph());
    sceneEntity.addChild(parentEntity.getSceneGraph());

    const result = SceneGraphComponent.flattenHierarchy(
      sceneEntity.getSceneGraph(),
      false
    );

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
