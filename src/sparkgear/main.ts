import SparkGearComponent from './SparkGearComponent';
import EntityRepository from '../foundation/core/EntityRepository';
import TransformComponent from '../foundation/components/Transform/TransformComponent';
import SceneGraphComponent from '../foundation/components/SceneGraph/SceneGraphComponent';

const createSparkGearEntity = function () {
  const entityRepository = EntityRepository.getInstance();
  const entity = entityRepository.createEntity([
    TransformComponent,
    SceneGraphComponent,
    SparkGearComponent,
  ]);

  return entity;
};

const SparkGear = Object.freeze({
  SparkGearComponent,
  createSparkGearEntity,
});
export default SparkGear;
