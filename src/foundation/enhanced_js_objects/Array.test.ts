import Rn from '../../../dist/esm';
import type {ArrayAsRn} from '../../../dist/esm';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends ArrayAsRn<T> {}
}

function generateEntity() {
  const entity = Rn.EntityHelper.createMeshEntity();
  return entity;
}

test('array[GetComponentFromEntities]', () => {
  Rn.enhanceArray();
  Rn.MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const entities = [];
  entities.push(generateEntity());
  entities.push(generateEntity());

  // console.log('getComponentFromEntities: ' +  entities.Rn.getComponentFromEntities)

  const components = entities.Rn.getComponentFromEntities(Rn.MeshComponent);
  expect(components[0]).toBeInstanceOf(Rn.MeshComponent);
});
