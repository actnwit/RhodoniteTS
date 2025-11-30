import Rn from '../../../dist/esm';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends Rn.ArrayAsRn<T> {}
}

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

function generateEntity() {
  const entity = Rn.createMeshEntity(engine);
  return entity;
}

test('array[GetComponentFromEntities]', () => {
  Rn.enhanceArray();
  Rn.MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);

  const entities: Rn.IEntity[] = [];
  entities.push(generateEntity());
  entities.push(generateEntity());

  // console.log('getComponentFromEntities: ' +  entities.getComponentFromEntities)

  const components = entities.Rn.getComponentFromEntities(Rn.MeshComponent);
  expect(components[0]).toBeInstanceOf(Rn.MeshComponent);
});
