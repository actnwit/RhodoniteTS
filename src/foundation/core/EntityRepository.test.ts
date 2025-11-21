import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { Vector3 } from '../math';
import { Is } from '../misc/Is';
import { EntityRepository, createEntity } from './EntityRepository';
import { MemoryManager } from './MemoryManager';
import '../components/registerComponents';

test('getEntitiesNumber', () => {
  EntityRepository.createEntity();
  expect(EntityRepository.getEntitiesNumber()).toBe(1);
  EntityRepository.createEntity();
  expect(EntityRepository.getEntitiesNumber()).toBe(2);
});

test('The entity repository can provide the component corresponding to the specified entityUID and componentTID', () => {
  MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);

  const firstEntity = createGroupEntity();
  const sceneGraphComponent = EntityRepository.getComponentOfEntity(firstEntity.entityUID, SceneGraphComponent);

  expect(sceneGraphComponent instanceof SceneGraphComponent).toBe(true);
});

test('shallow copy of entity', () => {
  MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);

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
