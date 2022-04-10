import EffekseerComponent from './EffekseerComponent';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';

const createEffekseerEntity = function () {
  const entity = EntityRepository.createEntity();
  const entity1 = EntityRepository.addComponentToEntity(
    TransformComponent,
    entity
  );
  const entity2 = EntityRepository.addComponentToEntity(
    SceneGraphComponent,
    entity1
  );
  const entity3 = EntityRepository.addComponentToEntity(
    EffekseerComponent,
    entity2
  );

  return entity3;
};

const Effekseer = Object.freeze({
  EffekseerComponent,
  createEffekseerEntity,
});
export default Effekseer;
