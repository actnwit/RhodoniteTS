import type { ISceneGraphEntityMethods } from '../foundation/components/SceneGraph/ISceneGraphEntity';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import type { ITransformEntityMethods } from '../foundation/components/Transform/ITransformEntity';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import type { IEntity } from '../foundation/core/Entity';
import type { Engine } from '../foundation/system/Engine';
import { EffekseerComponent, type IEffekseerEntityMethods } from './EffekseerComponent';

const createEffekseerEntity = (
  engine: Engine
): IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods => {
  const entity = engine.entityRepository.createEntity();
  const entity1 = engine.entityRepository.addComponentToEntity(TransformComponent, entity);
  const entity2 = engine.entityRepository.addComponentToEntity(SceneGraphComponent, entity1);
  const entity3 = engine.entityRepository.addComponentToEntity(EffekseerComponent, entity2);

  return entity3;
};

export const Effekseer = Object.freeze({
  EffekseerComponent,
  createEffekseerEntity,
});
