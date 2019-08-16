import EntityRepository from "../core/EntityRepository";
import SceneGraphComponent from "../components/SceneGraphComponent";
import TransformComponent from "../components/TransformComponent";
import RenderPass from "./RenderPass";
import MemoryManager from "../core/MemoryManager";

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent, SceneGraphComponent]);
  return entity;
}

test('addEntities and get entities', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);

  const entity1st = generateEntity(); // Uid is 0
  const entity2nd = generateEntity(); // Uid is 1
  const entityChildOf1st = generateEntity(); // Uid is 2
  entity1st.getSceneGraph().addChild(entityChildOf1st.getSceneGraph());
  const entityGrandChildOf1st = generateEntity(); // Uid is 3
  entityChildOf1st.getSceneGraph().addChild(entityGrandChildOf1st.getSceneGraph());

  const renderPass = new RenderPass();
  renderPass.addEntities([entity1st, entity2nd]);

  const entities = renderPass.entities;
  const entitieUids = entities.map(entity=>{return entity.entityUID});

  console.log(JSON.stringify(entitieUids));

  expect(JSON.stringify(entitieUids) == JSON.stringify([0,2,3,1])).toBe(true);
});


test('clearEntities and get entities', () => {
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);

  const entity1st = generateEntity(); // Uid is 0
  const entity2nd = generateEntity(); // Uid is 1

  const renderPass = new RenderPass();
  renderPass.addEntities([entity1st, entity2nd]);

  expect(renderPass.entities.length).toBe(2);

  renderPass.clearEntities();

  expect(renderPass.entities.length).toBe(0);

});
