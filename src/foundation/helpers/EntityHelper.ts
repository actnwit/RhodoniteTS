import EntityRepository from '../core/EntityRepository';
import Component from '../core/Component';
import Entity, {IEntity} from '../core/Entity';
import {
  addTransform,
  ITransformEntityMethods,
} from '../components/Transform/ITransfomEntity';
import {
  addSceneGraph,
  ISceneGraphEntityMethods,
} from '../components/SceneGraph/ISceneGraphEntity';
import {addMesh, IMeshEntityMethods} from '../components/Mesh/IMeshEntity';
import {
  addCamera,
  ICameraEntityMethods,
} from '../components/Camera/ICameraEntity';
import {
  addCameraController,
  ICameraControllerEntityMethods,
} from '../components/CameraController/ICameraControllerEntity';
import {IAnimationEntityMethods} from '../components/Animation/IAnimationEntity';
import {ILightEntityMethods} from '../components/Light/ILightEntity';
import {
  addMeshRenderer,
  IMeshRendererEntityMethods,
} from '../components/MeshRenderer/IMeshRendererEntity';
import {
  addSkeletal,
  ISkeletalEntityMethods,
} from '../components/Skeletal/ISkeletalEntity';
import {
  addPhysics,
  IPhysicsEntityMethods,
} from '../components/Physics/IPhysicsEntity';
import {ComponentMixinFunction} from '../../foundation/components/ComponentTypes';

function processMixin(mixins: ComponentMixinFunction[]) {
  let resultComponents: typeof Component[] = [];
  let resultEntity: any = Entity;
  for (const mixin of mixins) {
    const {entityClass, components} = mixin(resultEntity, resultComponents);
    resultEntity = entityClass;
    resultComponents = components;
  }
  const customEntity = EntityRepository.getInstance().createCustomEntity(
    resultComponents,
    resultEntity
  );
  return customEntity as IEntity;
}
export interface ITransformEntity extends IEntity, ITransformEntityMethods {}
export interface IGroupEntity
  extends ITransformEntity,
    ISceneGraphEntityMethods {}
export interface IMeshEntity
  extends IGroupEntity,
    IMeshEntityMethods,
    IMeshRendererEntityMethods {}
export interface ICameraEntity extends IGroupEntity, ICameraEntityMethods {}
export interface ICameraWithControllerEntity
  extends ICameraEntityMethods,
    ICameraControllerEntityMethods {}
export interface ISkeletalEntity extends IGroupEntity, ISkeletalEntityMethods {}
export interface ILightEntity extends IGroupEntity, ILightEntityMethods {}
export interface IPhysicsEntity extends IGroupEntity, IPhysicsEntityMethods {}
export interface IAnimationEntity
  extends IGroupEntity,
    IAnimationEntityMethods {}

function createTransformEntity(): ITransformEntity {
  const mixins = [addTransform];
  const customEntity = processMixin(mixins);
  return customEntity as ITransformEntity;
}

function createGroupEntity(): IGroupEntity {
  const mixins = [addTransform, addSceneGraph];
  const customEntity = processMixin(mixins);
  return customEntity as IGroupEntity;
}

function createMeshEntity() {
  const mixins = [addTransform, addSceneGraph, addMesh, addMeshRenderer];
  const customEntity = processMixin(mixins);
  return customEntity as IMeshEntity;
}

function createCameraEntity() {
  const mixins = [addTransform, addSceneGraph, addCamera];
  const customEntity = processMixin(mixins);
  return customEntity as ICameraEntity;
}

function createCameraWithControllerEntity() {
  const mixins = [addTransform, addSceneGraph, addCamera, addCameraController];
  const customEntity = processMixin(mixins);
  return customEntity as ICameraEntity;
}

function createSkeletalEntity() {
  const mixins = [addTransform, addSceneGraph, addSkeletal];
  const customEntity = processMixin(mixins);
  return customEntity as ISkeletalEntity;
}

function createPhysicsEntity(): IPhysicsEntity {
  const mixins = [addTransform, addSceneGraph, addPhysics];
  const customEntity = processMixin(mixins);
  return customEntity as IPhysicsEntity;
}

export default Object.freeze({
  createTransformEntity,
  createGroupEntity,
  createMeshEntity,
  createCameraEntity,
  createCameraWithControllerEntity,
  createSkeletalEntity,
  createPhysicsEntity,
});
