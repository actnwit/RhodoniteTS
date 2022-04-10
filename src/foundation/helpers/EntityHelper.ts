import { EntityRepository } from '../core/EntityRepository';
import {IEntity} from '../core/Entity';
import {ITransformEntityMethods} from '../components/Transform/ITransfomEntity';
import {ISceneGraphEntityMethods} from '../components/SceneGraph/ISceneGraphEntity';
import {IMeshEntityMethods} from '../components/Mesh/IMeshEntity';
import {ICameraEntityMethods} from '../components/Camera/ICameraEntity';
import {ICameraControllerEntityMethods} from '../components/CameraController/ICameraControllerEntity';
import {IAnimationEntityMethods} from '../components/Animation/IAnimationEntity';
import {ILightEntityMethods} from '../components/Light/ILightEntity';
import {IMeshRendererEntityMethods} from '../components/MeshRenderer/IMeshRendererEntity';
import {ISkeletalEntityMethods} from '../components/Skeletal/ISkeletalEntity';
import {IPhysicsEntityMethods} from '../components/Physics/IPhysicsEntity';
import {IBlendShapeEntityMethods} from '../components/BlendShape/IBlendShapeEntity';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import { PhysicsComponent } from '../components/Physics/PhysicsComponent';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { LightComponent } from '../components/Light/LightComponent';

export type ITransformEntity = IEntity & ITransformEntityMethods;
export type ISceneGraphEntity = ITransformEntity & ISceneGraphEntityMethods;
export type IMeshEntity = ISceneGraphEntity &
  IMeshEntityMethods &
  IMeshRendererEntityMethods;
export type ICameraEntity = ISceneGraphEntity & ICameraEntityMethods;
export type ICameraControllerEntity = ICameraEntity &
  ICameraControllerEntityMethods;
export type ISkeletalEntity = ISceneGraphEntity & ISkeletalEntityMethods;
export type ILightEntity = ISceneGraphEntity & ILightEntityMethods;
export type IPhysicsEntity = ISceneGraphEntity & IPhysicsEntityMethods;
export type IBlendShapeEntity = IMeshEntity & IBlendShapeEntityMethods;
export interface IAnimationEntity
  extends ISceneGraphEntity,
    IAnimationEntityMethods {}

function createTransformEntity(): ITransformEntity {
  const entity = EntityRepository.createEntity();
  const entity1 = EntityRepository.addComponentToEntity(
    TransformComponent,
    entity
  );
  return entity1;
}

function createGroupEntity(): ISceneGraphEntity {
  const entity = createTransformEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    SceneGraphComponent,
    entity
  );
  return entityAddedComponent;
}

function createMeshEntity(): IMeshEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    MeshComponent,
    entity
  );
  const entityAddedComponent2 = EntityRepository.addComponentToEntity(
    MeshRendererComponent,
    entityAddedComponent
  );
  return entityAddedComponent2;
}

function createCameraEntity(): ICameraEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    CameraComponent,
    entity
  );
  return entityAddedComponent;
}

function createCameraControllerEntity(): ICameraControllerEntity {
  const entity = createCameraEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    CameraControllerComponent,
    entity
  );
  return entityAddedComponent;
}

function createSkeletalEntity(): ISkeletalEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    SkeletalComponent,
    entity
  );
  return entityAddedComponent;
}

function createPhysicsEntity(): IPhysicsEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    PhysicsComponent,
    entity
  );
  return entityAddedComponent;
}

function createLightEntity(): ILightEntity {
  const entity = createGroupEntity();
  const entityAddedComponent = EntityRepository.addComponentToEntity(
    LightComponent,
    entity
  );
  return entityAddedComponent;
}

export default Object.freeze({
  createTransformEntity,
  createGroupEntity,
  createMeshEntity,
  createCameraEntity,
  createCameraControllerEntity,
  createSkeletalEntity,
  createLightEntity,
  createPhysicsEntity,
});
