import Rn from '../../../dist/esm';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

test('getEntitiesNumber', () => {
  const currentEntitiesNumber = engine.entityRepository.getEntitiesNumber();
  engine.entityRepository.createEntity();
  expect(engine.entityRepository.getEntitiesNumber()).toBe(currentEntitiesNumber + 1);
  engine.entityRepository.createEntity();
  expect(engine.entityRepository.getEntitiesNumber()).toBe(currentEntitiesNumber + 2);
});

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  const firstEntity = Rn.createGroupEntity(engine);
  const sceneGraphComponent = engine.entityRepository.getComponentOfEntity(
    firstEntity.entityUID,
    Rn.SceneGraphComponent
  );

  expect(sceneGraphComponent instanceof Rn.SceneGraphComponent).toBe(true);
});

test('shallow copy of entity', () => {
  const firstEntity = engine.entityRepository.createEntity();
  engine.entityRepository.addComponentToEntity(Rn.TransformComponent, firstEntity);
  engine.entityRepository.addComponentToEntity(Rn.SceneGraphComponent, firstEntity);
  engine.entityRepository.addComponentToEntity(Rn.AnimationComponent, firstEntity);

  firstEntity.tryToGetTransform()!.localPosition = Rn.Vector3.fromCopy3(1, 2, 3);

  const secondEntity = engine.entityRepository.shallowCopyEntity(firstEntity);
  expect(Rn.Is.exist(secondEntity.tryToGetTransform())).toBe(true);
  expect(Rn.Is.exist(secondEntity.tryToGetSceneGraph())).toBe(true);
  expect(Rn.Is.exist(secondEntity.tryToGetAnimation())).toBe(true);
  expect(Rn.Is.exist(secondEntity.tryToGetCamera())).toBe(false);

  expect(secondEntity.tryToGetTransform()!.localPosition.isEqual(Rn.Vector3.fromCopy3(1, 2, 3))).toBe(true);
});
