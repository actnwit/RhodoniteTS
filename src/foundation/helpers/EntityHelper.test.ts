import Rn from '../../../dist/esm';

describe('EntityHelper', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });
  beforeAll(async () => {
    Rn.MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);
  });

  test('EntityHelper', () => {
    const entity = engine.entityRepository.createEntity();
    const transformEntity = engine.entityRepository.addComponentToEntity(Rn.TransformComponent, entity);
    const sceneGraphEntity = engine.entityRepository.addComponentToEntity(Rn.SceneGraphComponent, transformEntity);
    const cameraEntity = engine.entityRepository.addComponentToEntity(Rn.CameraComponent, sceneGraphEntity);
    const _transformComponent = transformEntity.getTransform();
    const _sceneGraphComponent = sceneGraphEntity.getSceneGraph();

    const cameraComponent = cameraEntity.getCamera(); // a component got with get*** is garanteed as NotNulluable
    // const cameraComponent0 = transformEntity.getCamera(); // transformEntity don't have getCamera method

    // You can use these instead, but you should do null check before use.
    const cameraComponent1 = transformEntity.tryToGetCamera();
    const _cameraComponent2 = transformEntity.getComponent(Rn.CameraComponent);

    expect(cameraComponent1).toBe(cameraComponent); // got same camera component
  });
});
