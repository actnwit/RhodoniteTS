import { CameraComponent } from '../components/Camera/CameraComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { EntityRepository } from '../core/EntityRepository';
import { MemoryManager } from '../core/MemoryManager';
import '../components/registerComponents';

describe('EntityHelper', () => {
  beforeAll(() => {
    MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: 1,
      gpuInstanceData: 1,
      gpuVertexData: 1,
    });
  });

  test('EntityHelper', () => {
    const entity = EntityRepository.createEntity();
    const transformEntity = EntityRepository.addComponentToEntity(TransformComponent, entity);
    const sceneGraphEntity = EntityRepository.addComponentToEntity(SceneGraphComponent, transformEntity);
    const cameraEntity = EntityRepository.addComponentToEntity(CameraComponent, sceneGraphEntity);
    const _transformComponent = transformEntity.getTransform();
    const _sceneGraphComponent = sceneGraphEntity.getSceneGraph();

    const cameraComponent = cameraEntity.getCamera(); // a component got with get*** is garanteed as NotNulluable
    // const cameraComponent0 = transformEntity.getCamera(); // transformEntity don't have getCamera method

    // You can use these instead, but you should do null check before use.
    const cameraComponent1 = transformEntity.tryToGetCamera();
    const _cameraComponent2 = transformEntity.getComponent(CameraComponent);

    expect(cameraComponent1).toBe(cameraComponent); // got same camera component
  });
});
