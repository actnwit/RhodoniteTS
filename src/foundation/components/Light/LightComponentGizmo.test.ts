import Rn from '../../../../dist/esm';

async function createEngine() {
  return Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });
}

describe('Light gizmo lifecycle', () => {
  test('deleting a light entity removes its gizmo entity from the repository', async () => {
    const engine = await createEngine();
    const entity = Rn.createLightEntity(engine);
    const light = entity.getLight();

    light.isLightGizmoVisible = true;
    expect(engine.entityRepository.searchByTags({ Being: 'gizmo' }).length).toBe(1);

    engine.entityRepository.deleteEntity(entity.entityUID);

    // The gizmo entity has to leave the repository as well. Otherwise the editor's
    // searchByTags({ Being: 'gizmo' }) picks it up again on the next gizmo render pass rebuild
    // and the light direction line stays on screen after the light is deleted.
    expect(engine.entityRepository.searchByTags({ Being: 'gizmo' }).length).toBe(0);
    expect(light.isLightGizmoVisible).toBe(false);
  });

  test('removing only the LightComponent removes its gizmo entity', async () => {
    const engine = await createEngine();
    const entity = Rn.createLightEntity(engine);
    const light = entity.getLight();

    light.isLightGizmoVisible = true;
    expect(engine.entityRepository.searchByTags({ Being: 'gizmo' }).length).toBe(1);

    engine.entityRepository.removeComponentFromEntity(Rn.LightComponent, entity);

    expect(engine.entityRepository.searchByTags({ Being: 'gizmo' }).length).toBe(0);
  });
});
