import Rn from '../../../dist/esm';

function generateEntity(engine: Rn.Engine) {
  return Rn.createMeshEntity(engine);
}

test('addEntities and get entities', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const entity1st = generateEntity(engine); // Uid is 0
  const entity2nd = generateEntity(engine); // Uid is 1
  const entityChildOf1st = generateEntity(engine); // Uid is 2
  entity1st.getSceneGraph().addChild(entityChildOf1st.getSceneGraph());
  const entityGrandChildOf1st = generateEntity(engine); // Uid is 3
  entityChildOf1st.getSceneGraph().addChild(entityGrandChildOf1st.getSceneGraph());

  const renderPass = new Rn.RenderPass(engine);
  renderPass.addEntities([entity1st, entity2nd]);

  const entities = renderPass.entities;
  const entitieUids = entities.map(entity => {
    return entity.entityUID;
  });

  expect(
    JSON.stringify(entitieUids) ===
      JSON.stringify([
        entity1st.entityUID,
        entityChildOf1st.entityUID,
        entityGrandChildOf1st.entityUID,
        entity2nd.entityUID,
      ])
  ).toBe(true);
});

test('clearEntities and get entities', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const entity1st = generateEntity(engine); // Uid is 0
  const entity2nd = generateEntity(engine); // Uid is 1

  const renderPass = new Rn.RenderPass(engine);
  renderPass.addEntities([entity1st, entity2nd]);

  expect(renderPass.entities.length).toBe(2);

  renderPass.clearEntities();

  expect(renderPass.entities.length).toBe(0);
});
