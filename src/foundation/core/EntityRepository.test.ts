import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Is } from '../misc/Is';
import { createEntity, EntityRepository } from './EntityRepository';
import { MemoryManager } from './MemoryManager';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { Vector3 } from '../math';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import '../components/registerComponents';

test('getEntitiesNumber', () => {
  const entity1 = EntityRepository.createEntity();
  expect(EntityRepository.getEntitiesNumber()).toBe(1);
  const entity2 = EntityRepository.createEntity();
  expect(EntityRepository.getEntitiesNumber()).toBe(2);
});

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = createGroupEntity();
  const sceneGraphComponent = EntityRepository.getComponentOfEntity(firstEntity.entityUID, SceneGraphComponent);

  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});

test('shallow copy of entity', () => {
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const firstEntity = createEntity();
  EntityRepository.addComponentToEntity(TransformComponent, firstEntity);
  EntityRepository.addComponentToEntity(SceneGraphComponent, firstEntity);
  EntityRepository.addComponentToEntity(AnimationComponent, firstEntity);

  firstEntity.tryToGetTransform()!.localPosition = Vector3.fromCopy3(1, 2, 3);

  const secondEntity = EntityRepository.shallowCopyEntity(firstEntity);
  expect(Is.exist(secondEntity.tryToGetTransform())).toBe(true);
  expect(Is.exist(secondEntity.tryToGetSceneGraph())).toBe(true);
  expect(Is.exist(secondEntity.tryToGetAnimation())).toBe(true);
  expect(Is.exist(secondEntity.tryToGetCamera())).toBe(false);

  expect(secondEntity.tryToGetTransform()!.localPosition.isEqual(Vector3.fromCopy3(1, 2, 3))).toBe(true);
});
