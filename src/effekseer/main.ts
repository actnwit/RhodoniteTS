import type { ISceneGraphEntityMethods } from '../foundation/components/SceneGraph/ISceneGraphEntity';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import type { ITransformEntityMethods } from '../foundation/components/Transform/ITransformEntity';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import type { IEntity } from '../foundation/core/Entity';
import type { EntityRepository } from '../foundation/core/EntityRepository';
import { EffekseerComponent, type IEffekseerEntityMethods } from './EffekseerComponent';

const createEffekseerEntity = (
  entityRepository: EntityRepository
): IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods => {
  const entity = entityRepository.createEntity();
  const entity1 = entityRepository.addComponentToEntity(TransformComponent, entity);
  const entity2 = entityRepository.addComponentToEntity(SceneGraphComponent, entity1);
  const entity3 = entityRepository.addComponentToEntity(EffekseerComponent, entity2);

  return entity3;
};

export const Effekseer = Object.freeze({
  EffekseerComponent,
  createEffekseerEntity,
});
