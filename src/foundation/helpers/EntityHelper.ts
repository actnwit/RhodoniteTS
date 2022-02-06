import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/Transform/TransformComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import MeshComponent from '../components/Mesh/MeshComponent';
import MeshRendererComponent from '../components/MeshRenderer/MeshRendererComponent';
import CameraComponent from '../components/Camera/CameraComponent';
import CameraControllerComponent from '../components/CameraController/CameraControllerComponent';
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
import {IMeshEntityMethods} from '../components/Mesh/IMeshEntity';
import {
  addCamera,
  ICameraEntityMethods,
} from '../components/Camera/ICameraEntity';
import {
  addAnimation,
  IAnimationEntityMethods,
} from '../components/Animation/IAnimationEntity';
import {ILightEntityMethods} from '../components/Light/ILightEntity';
import {IMeshRendererEntityMethods} from '../components/MeshRenderer/IMeshRendererEntity';
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
  return customEntity;
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
export interface ILightEntity extends IGroupEntity, ILightEntityMethods {}
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
  return EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    MeshComponent,
    MeshRendererComponent,
  ]);
}

function createCameraEntity() {
  return EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    CameraComponent,
  ]);
}

function createCameraWithControllerEntity() {
  return EntityRepository.getInstance().createEntity([
    TransformComponent,
    SceneGraphComponent,
    CameraComponent,
    CameraControllerComponent,
  ]);
}

export default Object.freeze({
  createTransformEntity,
  createGroupEntity,
  createMeshEntity,
  createCameraEntity,
  createCameraWithControllerEntity,
});
