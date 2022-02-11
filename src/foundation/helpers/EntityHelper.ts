import EntityRepository from '../core/EntityRepository';
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
import TransformComponent from '../components/Transform/TransformComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import MeshComponent from '../components/Mesh/MeshComponent';
import MeshRendererComponent from '../components/MeshRenderer/MeshRendererComponent';
import CameraControllerComponent from '../components/CameraController/CameraControllerComponent';
import SkeletalComponent from '../components/Skeletal/SkeletalComponent';
import PhysicsComponent from '../components/Physics/PhysicsComponent';
import CameraComponent from '../components/Camera/CameraComponent';
import LightComponent from '../components/Light/LightComponent';

export type ITransformEntity = IEntity & ITransformEntityMethods;
export type IGroupEntity = ITransformEntity & ISceneGraphEntityMethods;
export type IMeshEntity = IGroupEntity &
  IMeshEntityMethods &
  IMeshRendererEntityMethods;
export type ICameraEntity = IGroupEntity & ICameraEntityMethods;
export type ICameraControllerEntity = ICameraEntity &
  ICameraControllerEntityMethods;
export type ISkeletalEntity = IGroupEntity & ISkeletalEntityMethods;
export type ILightEntity = IGroupEntity & ILightEntityMethods;
export type IPhysicsEntity = IGroupEntity & IPhysicsEntityMethods;
export interface IAnimationEntity
  extends IGroupEntity,
    IAnimationEntityMethods {}

function createTransformEntity(): ITransformEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = entityRepository.createEntity();
  const entity1 = entityRepository.addComponentToEntity(
    TransformComponent,
    entity
  );
  return entity1;
}

function createGroupEntity(): IGroupEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createTransformEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    SceneGraphComponent,
    entity
  );
  return entityAddedComponent;
}

function createMeshEntity(): IMeshEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createGroupEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    MeshComponent,
    entity
  );
  const entityAddedComponent2 = entityRepository.addComponentToEntity(
    MeshRendererComponent,
    entityAddedComponent
  );
  return entityAddedComponent2;
}

function createCameraEntity(): ICameraEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createGroupEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    CameraComponent,
    entity
  );
  return entityAddedComponent;
}

function createCameraControllerEntity(): ICameraControllerEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createCameraEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    CameraControllerComponent,
    entity
  );
  return entityAddedComponent;
}

function createSkeletalEntity(): ISkeletalEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createGroupEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    SkeletalComponent,
    entity
  );
  return entityAddedComponent;
}

function createPhysicsEntity(): IPhysicsEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createGroupEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
    PhysicsComponent,
    entity
  );
  return entityAddedComponent;
}

function createLightEntity(): ILightEntity {
  const entityRepository = EntityRepository.getInstance();
  const entity = createGroupEntity();
  const entityAddedComponent = entityRepository.addComponentToEntity(
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
