import Rn from '../../../dist/esm';

async function createEngine() {
  return Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });
}

describe('Gizmo entity cleanup', () => {
  test('deleting an entity removes its scene graph gizmo entities from the repository', async () => {
    const engine = await createEngine();
    const entity = Rn.createGroupEntity(engine);
    const sceneGraph = entity.getSceneGraph();

    sceneGraph.isAABBGizmoVisible = true;
    sceneGraph.isLocatorGizmoVisible = true;
    sceneGraph.isTranslationGizmoVisible = true;

    const gizmoEntities = () => engine.entityRepository.searchByTags({ Being: 'gizmo' });
    expect(gizmoEntities().length).toBeGreaterThanOrEqual(3);

    engine.entityRepository.deleteEntity(entity.entityUID);

    // Destroying a gizmo has to remove its entity from the repository, not only destroy its
    // components. The editor finds gizmo entities with searchByTags({ Being: 'gizmo' }) when it
    // rebuilds the gizmo render pass, so a registered but destroyed gizmo would come back.
    expect(gizmoEntities()).toEqual([]);
  });
});
