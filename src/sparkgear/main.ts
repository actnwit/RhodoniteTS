
import SparkGearComponent from "./SparkGearComponent";
import EntityRepository from "../foundation/core/EntityRepository";
import TransformComponent from "../foundation/components/TransformComponent";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";

const createSparkGearEntity = function() {
  const entityRepository = EntityRepository.getInstance();
  const entity = entityRepository.createEntity([TransformComponent, SceneGraphComponent, SparkGearComponent])

  return entity;
}

const SparkGear = Object.freeze({
  SparkGearComponent,
  createSparkGearEntity
});
export default SparkGear;
