import CameraComponent from '../components/Camera/CameraComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import TransformComponent from '../components/Transform/TransformComponent';
import EntityRepository from '../core/EntityRepository';
import MemoryManager from '../core/MemoryManager';

describe('EntityHelper', () => {
  beforeAll(() => {
    MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: 1,
      gpuInstanceData: 1,
      gpuVertexData: 1,
    });
  });

  test('EntityHelper', () => {
    const entityRepository = EntityRepository.getInstance();
    const entity = entityRepository.createEntity();
    const transformEntity = entityRepository.addComponentToEntity(
      TransformComponent,
      entity
    );
    const sceneGraphEntity = entityRepository.addComponentToEntity(
      SceneGraphComponent,
      transformEntity
    );
    const cameraEntity = entityRepository.addComponentToEntity(
      CameraComponent,
      sceneGraphEntity
    );
    const transformComponent = transformEntity.getTransform();
    const sceneGraphComponent = sceneGraphEntity.getSceneGraph();

    const cameraComponent = cameraEntity.getCamera(); // a component got with get*** is garanteed as NotNulluable
    // const cameraComponent0 = transformEntity.getCamera(); // transformEntity don't have getCamera method

    // You can use these instead, but you should do null check before use.
    const cameraComponent1 = transformEntity.tryToGetCamera();
    const cameraComponent2 = transformEntity.getComponent(CameraComponent);

    expect(cameraComponent1).toBe(cameraComponent); // got same camera component
  });
});
