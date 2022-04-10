import {MeshComponent} from '../components/Mesh/MeshComponent';
import {MemoryManager} from '../core/MemoryManager';
import {EntityHelper} from '../helpers/EntityHelper';
import {ArrayAsRn, enhanceArray} from './Array';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends ArrayAsRn<T> {}
}

function generateEntity() {
  const entity = EntityHelper.createMeshEntity();
  return entity;
}

test('array[GetComponentFromEntities]', () => {
  enhanceArray();
  MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  const entities = [];
  entities.push(generateEntity());
  entities.push(generateEntity());

  // console.log('getComponentFromEntities: ' +  entities.getComponentFromEntities)

  const components = entities.Rn.getComponentFromEntities(MeshComponent);
  expect(components[0]).toBeInstanceOf(MeshComponent);
});
