import SparkGearComponent from './SparkGearComponent';
import EntityRepository from '../foundation/core/EntityRepository';
import TransformComponent from '../foundation/components/Transform/TransformComponent';
import SceneGraphComponent from '../foundation/components/SceneGraph/SceneGraphComponent';

const createSparkGearEntity = function () {
  const entityRepository = EntityRepository.getInstance();
  const entity = entityRepository.createEntity();
  const entity1 = entityRepository.addComponentToEntity(
    TransformComponent,
    entity
  );
  const entity2 = entityRepository.addComponentToEntity(
    SceneGraphComponent,
    entity1
  );
  const entity3 = entityRepository.addComponentToEntity(
    SparkGearComponent,
    entity2
  );

  return entity3;
};

const SparkGear = Object.freeze({
  SparkGearComponent,
  createSparkGearEntity,
});
export default SparkGear;
