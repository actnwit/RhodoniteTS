import EffekseerComponent from './EffekseerComponent';
import EntityRepository from '../foundation/core/EntityRepository';
import TransformComponent from '../foundation/components/Transform/TransformComponent';
import SceneGraphComponent from '../foundation/components/SceneGraph/SceneGraphComponent';

const createEffekseerEntity = function () {
  const entityRepository = EntityRepository.getInstance();
  const entity = entityRepository.createEntity([
    TransformComponent,
    SceneGraphComponent,
    EffekseerComponent,
  ]);

  return entity;
};

const Effekseer = Object.freeze({
  EffekseerComponent,
  createEffekseerEntity,
});
export default Effekseer;
