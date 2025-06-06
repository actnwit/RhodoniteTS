import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { EffekseerComponent } from './EffekseerComponent';

const createEffekseerEntity = () => {
  const entity = EntityRepository.createEntity();
  const entity1 = EntityRepository.addComponentToEntity(TransformComponent, entity);
  const entity2 = EntityRepository.addComponentToEntity(SceneGraphComponent, entity1);
  const entity3 = EntityRepository.addComponentToEntity(EffekseerComponent, entity2);

  return entity3;
};

export const Effekseer = Object.freeze({
  EffekseerComponent,
  createEffekseerEntity,
});
