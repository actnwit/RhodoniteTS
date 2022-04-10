import SparkGearComponent from './SparkGearComponent';
import { EntityRepository } from '../foundation/core/EntityRepository';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';

const createSparkGearEntity = function () {
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
