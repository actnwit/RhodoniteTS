import { MeshComponent } from '../components/Mesh/MeshComponent';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import type { IEntity } from '../core/Entity';
import { MemoryManager } from '../core/MemoryManager';
import { type ArrayAsRn, enhanceArray } from './Array';
import '../components/registerComponents';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends ArrayAsRn<T> {}
}

function generateEntity() {
  const entity = createMeshEntity();
  return entity;
}

test('array[GetComponentFromEntities]', () => {
  enhanceArray();
  MemoryManager.createInstanceIfNotCreated(1024 * 1024 * 4 /* rgba */ * 4 /* byte */);

  const entities: IEntity[] = [];
  entities.push(generateEntity());
  entities.push(generateEntity());

  // console.log('getComponentFromEntities: ' +  entities.getComponentFromEntities)

  const components = entities.Rn.getComponentFromEntities(MeshComponent);
  expect(components[0]).toBeInstanceOf(MeshComponent);
});
