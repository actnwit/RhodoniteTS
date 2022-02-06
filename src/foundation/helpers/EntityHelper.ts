import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/Transform/TransformComponent';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import CameraComponent from '../components/CameraComponent';
import CameraControllerComponent from '../components/CameraControllerComponent';
import Component from '../core/Component';
import Entity from '../core/Entity';
import {
  addTransform,
  ITranformEntity,
} from '../components/Transform/ITransfomEntity';
import {
  addSceneGraph,
  ISceneGraphEntity,
} from '../components/SceneGraph/ISceneGraphEntity';
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
export interface IGroupEntity extends ITranformEntity, ISceneGraphEntity {}

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
  createGroupEntity,
  createMeshEntity,
  createCameraEntity,
  createCameraWithControllerEntity,
});
